/**
 * kb-storage-catalog - reference cataloger (local-disk backend)
 * =============================================================
 * Walks a corpus of raw files on disk, extracts text, optionally has a local
 * LLM read each file (text + vision), and emits one lightweight markdown KB
 * entry per file into a catalog directory, plus a per-directory index.md tree
 * (wikilinked, so the catalog passes kb lint: no missing-index or orphan
 * findings). The catalog is then wired as a `source_type='local'` KB source so
 * an assistant can search it.
 *
 * Design contract: see ../SKILL.md. This implements the LOCAL-DISK backend;
 * an S3/MinIO or GCS backend swaps `walk`/`readHead` for list+fetch calls
 * (~30 lines) and everything downstream is unchanged.
 *
 * Run (one session, resumable):
 *   npx tsx cataloger.ts <rootDir> <catalogDir> [--concurrency 8] [--body-cap 40000]
 *                        [--binding onprem-disk] [--scheme disk]
 *                        [--sensitivity internal] [--force]
 *
 * Phase 2 LLM enrichment (optional - any OpenAI-compatible endpoint, e.g. a
 * local Qwen behind Ollama/vLLM/LM Studio):
 *   ... --llm-base-url http://localhost:11434/v1 --llm-model qwen3:32b
 *       [--llm-vision-model qwen2.5-vl:7b] [--llm-concurrency 3] [--llm-input-cap 24000]
 *   (env fallbacks: LLM_BASE_URL / LLM_MODEL / LLM_VISION_MODEL / LLM_API_KEY)
 *   With enrichment on, each file's extracted text is read by the model, which
 *   returns { description, tags, sensitivity, body } as strict JSON (validated;
 *   one retry; on failure the mechanical entry is written and the file is
 *   re-enriched next run). Images and scanned PDFs go to the VISION model -
 *   point --llm-vision-model at a vision-capable model or they stay
 *   metadata-only.
 *
 * Rich-file extractors - wired through OPTIONAL deps, each degrading to a
 * metadata-only entry (with a one-line install hint) when absent:
 *   .pdf        -> pdf-parse (text layer); no text layer -> pdftoppm (poppler)
 *                  page images -> vision model
 *   .docx       -> mammoth          .doc -> word-extractor
 *   .xlsx/.xls  -> xlsx (SheetJS; sheets rendered to CSV)
 *   images      -> vision model (png/jpg/jpeg/webp/gif/bmp)
 *   npm i pdf-parse mammoth word-extractor xlsx   # only what the corpus needs
 *
 * Behavior:
 *   - Resumable: unchanged files (same size+mtime+EXTRACTOR_VERSION+enricher
 *     config) are skipped. Bump EXTRACTOR_VERSION after changing extractors,
 *     ENRICHER_VERSION after changing the enrichment contract (or pass --force).
 *   - Per-file failures never kill the run: they're logged, written to
 *     .catalog-failures.json, and the file is retried on the next run.
 *   - Files deleted from the corpus have their catalog entries removed.
 *   - Generate the WHOLE catalog first, THEN wire/sync the local KB source ONCE
 *     (the local sync is full-rescan - do not sync mid-generation).
 */

import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promises as fs } from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)

// Bump when you wire or change extractors, so prior runs' entries regenerate.
const EXTRACTOR_VERSION = 2
// Bump when the enrichment prompt/contract changes, so entries re-enrich.
const ENRICHER_VERSION = 1

// Vision limits: pages of a scanned PDF sent to the model; max image file size.
const VISION_PDF_PAGES = 4
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

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
  // Phase 2 enrichment (enabled when baseUrl + model are both set)
  llmBaseUrl: string | null
  llmModel: string | null
  llmVisionModel: string | null
  llmApiKey: string | null
  llmConcurrency: number
  llmInputCap: number
  enrich: boolean
}

// Extensions read directly as text (no library needed).
const TEXT_EXT = new Set([
  '.txt', '.md', '.markdown', '.csv', '.tsv', '.log', '.json', '.yaml', '.yml',
  '.html', '.htm', '.xml', '.rtf', '.tex',
  '.js', '.ts', '.py', '.go', '.rs', '.java', '.rb', '.php', '.c', '.h', '.cpp', '.sh', '.sql',
])

// Extensions that need a parser; wired below through optional deps.
const RICH_EXT = new Set(['.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt'])

// Extensions the vision model reads directly.
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])

// ── Optional dependencies (graceful degradation) ─────────────────

const depCache = new Map<string, unknown>()
async function optionalDep(name: string): Promise<any | null> {
  if (depCache.has(name)) return depCache.get(name)
  try {
    const mod: any = await import(name)
    depCache.set(name, mod)
    return mod
  } catch {
    depCache.set(name, null)
    console.warn(
      `[cataloger] optional dependency "${name}" not installed - ` +
      `affected files fall back to metadata-only entries (fix: npm i ${name})`,
    )
    return null
  }
}

let pdftoppmAvailable: boolean | null = null
async function havePdftoppm(): Promise<boolean> {
  if (pdftoppmAvailable !== null) return pdftoppmAvailable
  try {
    await execFileP('pdftoppm', ['-v'])
    pdftoppmAvailable = true
  } catch (e) {
    // A nonzero exit still means the binary exists; only ENOENT means missing.
    pdftoppmAvailable = (e as NodeJS.ErrnoException)?.code !== 'ENOENT'
    if (!pdftoppmAvailable) {
      console.warn(
        '[cataloger] pdftoppm not found - scanned PDFs stay metadata-only ' +
        '(fix: install poppler, e.g. apt install poppler-utils / brew install poppler)',
      )
    }
  }
  return pdftoppmAvailable
}

// ── Extraction (bytes -> text, keyed by file type) ───────────────

async function extractRich(absPath: string, ext: string): Promise<string | null> {
  if (ext === '.pdf') {
    const mod = await optionalDep('pdf-parse')
    if (!mod) return null
    const pdf = mod.default ?? mod
    const data = await pdf(await fs.readFile(absPath))
    const text = String(data?.text ?? '').trim()
    // A near-empty text layer means a scanned PDF - the vision path (below)
    // takes over when enrichment is on.
    return text.length >= 32 ? text : null
  }
  if (ext === '.docx') {
    const mod = await optionalDep('mammoth')
    if (!mod) return null
    const mammoth = mod.default ?? mod
    const r = await mammoth.extractRawText({ path: absPath })
    const text = String(r?.value ?? '').trim()
    return text || null
  }
  if (ext === '.doc') {
    const mod = await optionalDep('word-extractor')
    if (!mod) return null
    const WordExtractor = mod.default ?? mod
    const doc = await new WordExtractor().extract(absPath)
    const text = String(doc?.getBody() ?? '').trim()
    return text || null
  }
  if (ext === '.xlsx' || ext === '.xls') {
    const mod = await optionalDep('xlsx')
    if (!mod) return null
    const XLSX = mod.default ?? mod
    const wb = XLSX.read(await fs.readFile(absPath), { type: 'buffer' })
    const parts: string[] = []
    for (const name of wb.SheetNames) {
      const csv = String(XLSX.utils.sheet_to_csv(wb.Sheets[name])).trim()
      if (csv) parts.push(`## Sheet: ${name}\n${csv}`)
    }
    return parts.length ? parts.join('\n\n') : null
  }
  // .pptx / .ppt: wire a slide-text extractor here if the corpus needs it.
  return null
}

async function extractText(absPath: string, ext: string, cap: number): Promise<string | null> {
  if (TEXT_EXT.has(ext)) return (await readHead(absPath, cap * 4)).slice(0, cap)
  if (RICH_EXT.has(ext)) {
    const t = await extractRich(absPath, ext)
    return t ? t.slice(0, cap) : null
  }
  return null // media / archive / opaque binary -> metadata-only (or vision)
}

// ── Phase 2 enrichment (local LLM reads each file) ───────────────

type Enriched = {
  description: string
  tags: string[]
  sensitivity: string
  body: string | null
}

const ENRICH_SYSTEM = [
  'You catalog corporate files into a knowledge-base search index.',
  'Reply with ONLY one JSON object, no markdown fences, shaped exactly:',
  '{"description": string, "tags": string[], "sensitivity": "public"|"internal"|"confidential", "body": string|null}',
  '- description: one factual sentence (max 200 chars) saying what the file contains; prefer names, dates, and amounts over vague words.',
  '- tags: 3-8 lowercase topic tags (concepts, entities, document type).',
  '- sensitivity: "confidential" for contracts, HR, finance, legal, or personal data; when unsure pick "confidential".',
  '- body: null, unless the file carries durable facts worth answering from directly - then a concise distillation (max 2000 chars): parties, dates, amounts, decisions, obligations. Never mirror the full text.',
  '- For images: description says what the image shows; body transcribes any text, tables, or figures in it.',
  '- Never include passwords, API keys, or credentials in any field.',
].join('\n')

type ChatContent =
  | string
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>

async function llmChat(cfg: Config, model: string, content: ChatContent): Promise<string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (cfg.llmApiKey) headers.authorization = `Bearer ${cfg.llmApiKey}`
  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: ENRICH_SYSTEM },
      { role: 'user', content },
    ],
    temperature: 0.2,
    max_tokens: 1600,
    response_format: { type: 'json_object' },
  }
  let res = await fetch(`${cfg.llmBaseUrl}/chat/completions`, {
    method: 'POST', headers, body: JSON.stringify(payload),
  })
  if (res.status === 400) {
    // Some local servers reject response_format; retry without it.
    delete payload.response_format
    res = await fetch(`${cfg.llmBaseUrl}/chat/completions`, {
      method: 'POST', headers, body: JSON.stringify(payload),
    })
  }
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> }
  const out = json?.choices?.[0]?.message?.content
  if (typeof out !== 'string' || !out.trim()) throw new Error('LLM returned empty content')
  return out
}

function parseEnriched(raw: string, cfg: Config): Enriched {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('no JSON object in LLM output')
  const obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
  const description = String(obj.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)
  if (!description) throw new Error('enrichment missing description')
  const tags = (Array.isArray(obj.tags) ? obj.tags : [])
    .map((t) => String(t).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .slice(0, 8)
  const tier = String(obj.sensitivity ?? '')
  const sensitivity = ['public', 'internal', 'confidential'].includes(tier)
    ? tier
    : cfg.defaultSensitivity
  const rawBody = typeof obj.body === 'string' ? obj.body.trim() : ''
  const body = rawBody ? rawBody.slice(0, cfg.bodyCapBytes) : null
  return { description, tags, sensitivity, body }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch {
    return await fn()
  }
}

async function enrichFromText(cfg: Config, rel: string, text: string, size: number): Promise<Enriched> {
  const content =
    `File: ${rel}\nSize: ${humanSize(size)}\n\n` +
    `Extracted text (may be truncated):\n"""\n${text.slice(0, cfg.llmInputCap)}\n"""`
  return withRetry(async () => parseEnriched(await llmChat(cfg, cfg.llmModel!, content), cfg))
}

async function enrichFromImages(cfg: Config, rel: string, dataUrls: string[]): Promise<Enriched> {
  const content: ChatContent = [
    { type: 'text', text: `File: ${rel} (${dataUrls.length} image${dataUrls.length > 1 ? 's' : ''} attached - read them)` },
    ...dataUrls.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
  ]
  return withRetry(async () => parseEnriched(await llmChat(cfg, cfg.llmVisionModel!, content), cfg))
}

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp',
}

async function imageDataUrl(absPath: string, ext: string): Promise<string | null> {
  const st = await fs.stat(absPath)
  if (st.size > MAX_IMAGE_BYTES) return null
  const mime = IMAGE_MIME[ext] ?? 'application/octet-stream'
  return `data:${mime};base64,${(await fs.readFile(absPath)).toString('base64')}`
}

/** Render the first pages of a (scanned) PDF to PNG data URLs via poppler. */
async function pdfPageImages(absPath: string): Promise<string[]> {
  if (!(await havePdftoppm())) return []
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'kbcat-'))
  try {
    await execFileP('pdftoppm', [
      '-png', '-r', '120', '-f', '1', '-l', String(VISION_PDF_PAGES),
      absPath, path.join(tmp, 'p'),
    ])
    const files = (await fs.readdir(tmp)).filter((f) => f.endsWith('.png')).sort()
    const urls: string[] = []
    for (const f of files) {
      urls.push(`data:image/png;base64,${(await fs.readFile(path.join(tmp, f))).toString('base64')}`)
    }
    return urls
  } finally {
    await fs.rm(tmp, { recursive: true, force: true })
  }
}

// A small counting semaphore - LLM concurrency is bounded separately from file
// concurrency (local inference is the bottleneck, disk is not).
function semaphore(n: number) {
  let active = 0
  const queue: Array<() => void> = []
  return async function gate<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= n) await new Promise<void>((resolve) => queue.push(resolve))
    active++
    try {
      return await fn()
    } finally {
      active--
      queue.shift()?.()
    }
  }
}

// ── CLI / config ─────────────────────────────────────────────────

function parseArgs(argv: string[]): Config {
  const pos = argv.filter((a) => !a.startsWith('--'))
  const flag = (name: string, def: string | null) => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def
  }
  const rootDir = path.resolve(pos[0] ?? '.')
  const catalogDir = path.resolve(pos[1] ?? './catalog')
  const llmBaseUrl = (flag('llm-base-url', process.env.LLM_BASE_URL ?? null) ?? null)?.replace(/\/$/, '') ?? null
  const llmModel = flag('llm-model', process.env.LLM_MODEL ?? null)
  return {
    rootDir,
    catalogDir,
    manifestPath: path.join(catalogDir, '.catalog-manifest.json'),
    failuresPath: path.join(catalogDir, '.catalog-failures.json'),
    concurrency: Number(flag('concurrency', '8')),
    bodyCapBytes: Number(flag('body-cap', '40000')),
    scheme: flag('scheme', 'disk')!,
    binding: flag('binding', 'onprem-disk')!,
    defaultSensitivity: flag('sensitivity', 'internal')!,
    force: argv.includes('--force'),
    llmBaseUrl,
    llmModel,
    llmVisionModel: flag('llm-vision-model', process.env.LLM_VISION_MODEL ?? null) ?? llmModel,
    llmApiKey: process.env.LLM_API_KEY ?? null,
    llmConcurrency: Number(flag('llm-concurrency', '3')),
    llmInputCap: Number(flag('llm-input-cap', '24000')),
    enrich: Boolean(llmBaseUrl && llmModel),
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

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel', '.txt': 'text/plain',
  '.md': 'text/markdown', '.csv': 'text/csv', '.html': 'text/html', '.json': 'application/json',
  ...IMAGE_MIME,
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

function buildEntry(
  rel: string,
  text: string | null,
  size: number,
  sha: string,
  cfg: Config,
  enriched: Enriched | null,
): string {
  const ext = path.extname(rel).toLowerCase()
  const ref = `${cfg.scheme}:${rel.split(path.sep).join('/')}`
  const desc = enriched?.description ?? description(text, ext, size)
  const tags = [...new Set([...(enriched?.tags ?? []), ...tagsFromPath(rel, ext)])].slice(0, 8)
  const body = enriched?.body ?? text
    ?? `_No text extracted (${ext || 'binary'}). Retrieve the original via its storage_ref._`
  return [
    '---',
    `title: ${yamlStr(titleFromPath(rel))}`,
    `description: ${yamlStr(desc)}`,
    `tags: [${tags.map(yamlStr).join(', ')}]`,
    `sensitivity: ${enriched?.sensitivity ?? cfg.defaultSensitivity}`,
    `storage_ref: ${yamlStr(ref)}`,
    `storage_binding: ${yamlStr(cfg.binding)}`,
    `content_type: ${yamlStr(MIME[ext] ?? 'application/octet-stream')}`,
    `size_bytes: ${size}`,
    `source_sha256: ${yamlStr(sha)}`,
    ...(enriched ? [`enriched_by: ${yamlStr(`${cfg.llmModel} (e${ENRICHER_VERSION})`)}`] : []),
    '---',
    '',
    `> **Source:** \`${ref}\``,
    '',
    body,
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
  if (cfg.enrich) {
    console.log(
      `[cataloger] enrichment ON: ${cfg.llmModel} @ ${cfg.llmBaseUrl}` +
      (cfg.llmVisionModel !== cfg.llmModel ? ` (vision: ${cfg.llmVisionModel})` : ''),
    )
  }

  let manifest: Record<string, string> = {}
  try { manifest = JSON.parse(await fs.readFile(cfg.manifestPath, 'utf-8')) } catch { /* first run */ }

  const files: string[] = []
  for await (const f of walk(cfg.rootDir)) files.push(f)

  const seen = new Set<string>()
  const failures: Record<string, string> = {}
  let done = 0, skipped = 0, extracted = 0, metaOnly = 0, enrichedCount = 0, enrichFailed = 0

  // The enricher config is part of the manifest key: toggling enrichment or
  // switching models regenerates entries, same as bumping EXTRACTOR_VERSION.
  const enrichTag = cfg.enrich ? `e${ENRICHER_VERSION}:${cfg.llmModel}` : 'e-off'
  const llmGate = semaphore(cfg.llmConcurrency)

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
      const key = `${st.size}:${Math.round(st.mtimeMs)}:v${EXTRACTOR_VERSION}:${enrichTag}`
      if (!cfg.force && manifest[rel] === key) { skipped++; return }

      const ext = path.extname(abs).toLowerCase()
      const text = await extractText(abs, ext, cfg.bodyCapBytes)
      const sha = createHash('sha256').update(`${rel}:${key}`).digest('hex').slice(0, 16)

      // Phase 2: the model reads the file. Text goes to the text model; images
      // and scanned PDFs go to the vision model. Failure falls back to the
      // mechanical entry and re-enriches next run (key mismatch via :efail).
      let enriched: Enriched | null = null
      let enrichError: string | null = null
      if (cfg.enrich) {
        try {
          if (IMAGE_EXT.has(ext)) {
            const url = await imageDataUrl(abs, ext)
            if (url) enriched = await llmGate(() => enrichFromImages(cfg, rel, [url]))
          } else if (text) {
            enriched = await llmGate(() => enrichFromText(cfg, rel, text, st.size))
          } else if (ext === '.pdf') {
            const pages = await pdfPageImages(abs)
            if (pages.length) enriched = await llmGate(() => enrichFromImages(cfg, rel, pages))
          }
        } catch (e) {
          enrichError = e instanceof Error ? e.message : String(e)
        }
      }

      const outPath = path.join(cfg.catalogDir, catalogRelName(rel))
      await fs.mkdir(path.dirname(outPath), { recursive: true })
      await fs.writeFile(outPath, buildEntry(rel, text, st.size, sha, cfg, enriched))

      if (enrichError) {
        manifest[rel] = `${key}:efail` // never matches -> retried next run
        failures[rel] = `enrich: ${enrichError}`
        enrichFailed++
      } else {
        manifest[rel] = key
        if (enriched) enrichedCount++
      }
      text || enriched ? extracted++ : metaOnly++
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
    `indices=${indices} text=${extracted} metadata-only=${metaOnly}` +
    (cfg.enrich ? ` enriched=${enrichedCount} enrich-failed=${enrichFailed}` : '') +
    ` failed=${failCount}` +
    (failCount ? ` (see ${path.basename(cfg.failuresPath)})` : ''),
  )
  console.log(
    `Next: wire a source_type='local' KB source at ${cfg.catalogDir}, then sync ONCE.`,
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
