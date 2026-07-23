/**
 * kb-storage-catalog - reference cataloger (local-disk backend)
 * =============================================================
 * Walks a corpus of raw files on disk, extracts text, and emits one lightweight
 * markdown KB entry per file into a catalog directory, plus a per-directory
 * index.md tree (wikilinked, so the catalog passes kb lint: no missing-index or
 * orphan findings). The catalog is then wired as a `source_type='local'` KB
 * source so an assistant can search it.
 *
 * Design contract: see ../SKILL.md. This implements the LOCAL-DISK backend;
 * an S3/MinIO or GCS backend swaps `walk`/`readHead` for list+fetch calls
 * (~30 lines) and everything downstream is unchanged. The only site fill-in is
 * `extractRich` (PDF / office / OCR), which depends on the box's libraries.
 * Out of the box it runs end to end and produces a metadata + plain-text
 * catalog; wiring the extractors upgrades bodies to full document text.
 *
 * Run (one session, no model, resumable):
 *   npx tsx cataloger.ts <rootDir> <catalogDir> [--concurrency 8] [--body-cap 40000]
 *                        [--binding onprem-disk] [--scheme disk]
 *                        [--sensitivity internal] [--force]
 *
 * Behavior:
 *   - Resumable: unchanged files (same size+mtime+EXTRACTOR_VERSION) are skipped.
 *   - IMPORTANT: after wiring or changing `extractRich`, bump EXTRACTOR_VERSION
 *     (or pass --force) so already-cataloged rich files regenerate.
 *   - Per-file failures never kill the run: they're logged, written to
 *     .catalog-failures.json, and the file is retried on the next run.
 *   - Files deleted from the corpus have their catalog entries removed.
 *   - Generate the WHOLE catalog first, THEN wire/sync the local KB source ONCE
 *     (the local sync is full-rescan - do not sync mid-generation).
 */

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'

// Bump when you wire or change extractRich, so prior runs' entries regenerate.
const EXTRACTOR_VERSION = 1

interface Config {
  rootDir: string
  catalogDir: string
  manifestPath: string
  failuresPath: string
  concurrency: number
  bodyCapBytes: number
  scheme: string // storage scheme recorded in storage_ref (retrieval build resolves it)
  binding: string // storage-binding id operators configure for later retrieval wiring
  defaultSensitivity: string
  force: boolean
}

// Extensions read directly as text (no library needed).
const TEXT_EXT = new Set([
  '.txt', '.md', '.markdown', '.csv', '.tsv', '.log', '.json', '.yaml', '.yml',
  '.html', '.htm', '.xml', '.rtf', '.tex',
  '.js', '.ts', '.py', '.go', '.rs', '.java', '.rb', '.php', '.c', '.h', '.cpp', '.sh', '.sql',
])

// Extensions that need a parser/OCR. Wire these to the box's libraries.
// Return extracted text, or null to fall back to a metadata-only body.
const RICH_EXT = new Set(['.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt'])

async function extractRich(_absPath: string, ext: string): Promise<string | null> {
  // TODO(local agent): dispatch by ext to the extractor available on this box, e.g.
  //   .pdf  -> pdf text layer (pdfjs / pdftotext); OCR (tesseract) only if scanned
  //   .docx -> mammoth / docx text
  //   .xlsx -> sheet-to-csv
  //   .pptx -> slide text
  // Until wired, rich files get a metadata-only catalog entry (still findable by
  // name / path / tags). That is the intended fallback, not a failure.
  // After wiring: bump EXTRACTOR_VERSION above so existing entries regenerate.
  void ext
  return null
}

function parseArgs(argv: string[]): Config {
  const pos = argv.filter((a) => !a.startsWith('--'))
  const flag = (name: string, def: string) => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def
  }
  const rootDir = path.resolve(pos[0] ?? '.')
  const catalogDir = path.resolve(pos[1] ?? './catalog')
  return {
    rootDir,
    catalogDir,
    manifestPath: path.join(catalogDir, '.catalog-manifest.json'),
    failuresPath: path.join(catalogDir, '.catalog-failures.json'),
    concurrency: Number(flag('concurrency', '8')),
    bodyCapBytes: Number(flag('body-cap', '40000')),
    scheme: flag('scheme', 'disk'),
    binding: flag('binding', 'onprem-disk'),
    defaultSensitivity: flag('sensitivity', 'internal'),
    force: argv.includes('--force'),
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(full)
    else if (e.isFile()) yield full
  }
}

// Read at most maxBytes from the head of a file (avoids loading huge files).
async function readHead(absPath: string, maxBytes: number): Promise<string> {
  const fh = await fs.open(absPath, 'r')
  try {
    const buf = Buffer.alloc(maxBytes)
    const { bytesRead } = await fh.read(buf, 0, maxBytes, 0)
    return buf.subarray(0, bytesRead).toString('utf-8')
  } finally {
    await fh.close()
  }
}

async function extractText(absPath: string, ext: string, cap: number): Promise<string | null> {
  if (TEXT_EXT.has(ext)) return (await readHead(absPath, cap * 4)).slice(0, cap)
  if (RICH_EXT.has(ext)) {
    const t = await extractRich(absPath, ext)
    return t ? t.slice(0, cap) : null
  }
  return null // media / archive / opaque binary -> metadata-only body
}

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.txt': 'text/plain',
  '.md': 'text/markdown', '.csv': 'text/csv', '.html': 'text/html', '.json': 'application/json',
}

function humanSize(n: number): string {
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`
}

function titleFromPath(rel: string): string {
  const base = path.basename(rel, path.extname(rel))
  return base.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function tagsFromPath(rel: string, ext: string): string[] {
  const segs = path.dirname(rel).split(path.sep).filter((s) => s && s !== '.')
  const kind = ext.replace('.', '')
  return [...new Set([...segs.map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')), kind].filter(Boolean))].slice(0, 6)
}

function description(text: string | null, ext: string, size: number): string {
  if (text) {
    // Skip a leading frontmatter block in the source itself (markdown corpora).
    let lines = text.split('\n')
    if (lines[0]?.trim() === '---') {
      const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
      if (close > 0) lines = lines.slice(close + 1)
    }
    const line = lines
      .map((l) => l.trim())
      .find((l) => l.length > 0 && l !== '---' && !/^[#>\-*|`]+$/.test(l))
    if (line) return line.replace(/^#+\s*/, '').replace(/\s+/g, ' ').slice(0, 180)
  }
  return `${ext.replace('.', '').toUpperCase() || 'File'} (${humanSize(size)})`
}

const yamlStr = (s: string) => `'${s.replace(/'/g, "''")}'`

/**
 * Catalog filename for a corpus file. `.md` sources keep their name (a double
 * `.md.md` extension breaks wikilink resolution: the resolver strips one `.md`
 * from link targets, the path normaliser strips only one from filenames).
 * `index.md` is reserved for generated directory indices, so a corpus file
 * named index(.md) is catalogued as index_file.md.
 */
function catalogRelName(rel: string): string {
  const base = path.basename(rel)
  if (/^index(\.md)?$/i.test(base)) {
    return path.join(path.dirname(rel), 'index_file.md')
  }
  return /\.md$/i.test(rel) ? rel : `${rel}.md`
}

function buildEntry(rel: string, text: string | null, size: number, sha: string, cfg: Config): string {
  const ext = path.extname(rel).toLowerCase()
  const ref = `${cfg.scheme}:${rel.split(path.sep).join('/')}`
  return [
    '---',
    `title: ${yamlStr(titleFromPath(rel))}`,
    `description: ${yamlStr(description(text, ext, size))}`,
    `tags: [${tagsFromPath(rel, ext).map(yamlStr).join(', ')}]`,
    `sensitivity: ${cfg.defaultSensitivity}`,
    `storage_ref: ${yamlStr(ref)}`,
    `storage_binding: ${yamlStr(cfg.binding)}`,
    `content_type: ${yamlStr(MIME[ext] ?? 'application/octet-stream')}`,
    `size_bytes: ${size}`,
    `source_sha256: ${yamlStr(sha)}`,
    '---',
    '',
    `> **Source:** \`${ref}\``,
    '',
    text ?? `_No text extracted (${ext || 'binary'}). Retrieve the original via its storage_ref._`,
    '',
  ].join('\n')
}

// Small async concurrency pool (swap for worker_threads if extraction is CPU-bound).
async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>): Promise<void> {
  let i = 0
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) await fn(items[i++])
  })
  await Promise.all(workers)
}

/**
 * Regenerate the per-directory index.md tree. Every directory with entries gets
 * an index wikilinking its child entries and child directories - this is what
 * keeps kb lint clean (no missing-directory-index, no orphans) and gives
 * browseKnowledge orientation at each level.
 */
async function writeIndices(cfg: Config, totalFiles: number): Promise<number> {
  let written = 0
  async function recurse(dir: string): Promise<boolean> {
    const rel = path.relative(cfg.catalogDir, dir)
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const childLinks: string[] = []
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name.startsWith('.')) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (await recurse(full)) {
          const kbPath = path.join(rel, e.name).split(path.sep).join('/')
          childLinks.push(`- [[${kbPath}]]`)
        }
      } else if (e.name.endsWith('.md') && e.name !== 'index.md') {
        const kbPath = path.join(rel, e.name.slice(0, -3)).split(path.sep).join('/')
        childLinks.push(`- [[${kbPath}]]`)
      }
    }
    if (childLinks.length === 0) return false
    const dirName = rel === '' ? 'Storage Catalog' : titleFromPath(rel)
    const desc = rel === ''
      ? `Index of ${totalFiles} catalogued files.`
      : `Files under ${rel.split(path.sep).join('/')}.`
    await fs.writeFile(path.join(dir, 'index.md'), [
      '---',
      `title: ${yamlStr(dirName)}`,
      `description: ${yamlStr(desc)}`,
      'tags: [index]',
      `sensitivity: ${cfg.defaultSensitivity}`,
      '---',
      '',
      ...childLinks,
      '',
    ].join('\n'))
    written++
    return true
  }
  await recurse(cfg.catalogDir)
  return written
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2))
  await fs.mkdir(cfg.catalogDir, { recursive: true })

  let manifest: Record<string, string> = {}
  try { manifest = JSON.parse(await fs.readFile(cfg.manifestPath, 'utf-8')) } catch { /* first run */ }

  const files: string[] = []
  for await (const f of walk(cfg.rootDir)) files.push(f)

  const seen = new Set<string>()
  const failures: Record<string, string> = {}
  let done = 0, skipped = 0, extracted = 0, metaOnly = 0

  // Two corpus files may not map to the same catalog name (e.g. `foo` + `foo.md`).
  const byCatalogName = new Map<string, string>()
  const work: string[] = []
  for (const abs of files) {
    const rel = path.relative(cfg.rootDir, abs)
    const name = catalogRelName(rel)
    const prior = byCatalogName.get(name)
    if (prior) { failures[rel] = `catalog name collision with ${prior}`; seen.add(rel); continue }
    byCatalogName.set(name, rel)
    work.push(abs)
  }

  await pool(work, cfg.concurrency, async (abs) => {
    const rel = path.relative(cfg.rootDir, abs)
    seen.add(rel)
    try {
      const st = await fs.stat(abs)
      const key = `${st.size}:${Math.round(st.mtimeMs)}:v${EXTRACTOR_VERSION}`
      if (!cfg.force && manifest[rel] === key) { skipped++; return }

      const ext = path.extname(abs).toLowerCase()
      const text = await extractText(abs, ext, cfg.bodyCapBytes)
      const sha = createHash('sha256').update(`${rel}:${key}`).digest('hex').slice(0, 16)

      const outPath = path.join(cfg.catalogDir, catalogRelName(rel))
      await fs.mkdir(path.dirname(outPath), { recursive: true })
      await fs.writeFile(outPath, buildEntry(rel, text, st.size, sha, cfg))

      manifest[rel] = key
      text ? extracted++ : metaOnly++
      if (++done % 500 === 0) {
        await fs.writeFile(cfg.manifestPath, JSON.stringify(manifest))
        console.log(`[cataloger] ${done} written / ${skipped} skipped of ${files.length}`)
      }
    } catch (e) {
      // A bad file never kills the run; it's logged and retried next run.
      failures[rel] = e instanceof Error ? e.message : String(e)
    }
  })

  // Remove catalog entries for files deleted from the corpus.
  let removed = 0
  for (const rel of Object.keys(manifest)) {
    if (seen.has(rel)) continue
    await fs.rm(path.join(cfg.catalogDir, catalogRelName(rel)), { force: true })
    delete manifest[rel]
    removed++
  }

  const indices = await writeIndices(cfg, seen.size)
  await fs.writeFile(cfg.manifestPath, JSON.stringify(manifest))
  await fs.writeFile(cfg.failuresPath, JSON.stringify(failures, null, 2))

  const failCount = Object.keys(failures).length
  console.log(
    `[cataloger] done. files=${files.length} written=${done} skipped=${skipped} removed=${removed} ` +
    `indices=${indices} text=${extracted} metadata-only=${metaOnly} failed=${failCount}` +
    (failCount ? ` (see ${path.basename(cfg.failuresPath)})` : ''),
  )
  console.log(
    `Next: wire a source_type='local' KB source at ${cfg.catalogDir}, then sync ONCE.`,
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
