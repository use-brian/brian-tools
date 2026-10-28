#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, posix, relative } from 'node:path'

const repoRoot = new URL('.', import.meta.url).pathname
const skillsRoot = join(repoRoot, 'skills')
const resourceRoots = new Set(['references', 'assets', 'scripts', 'templates'])
const markdownLink = /(?<!!)\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g
const failures = []

function filesUnder(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(full) : [full]
  })
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return null
  const value = (key) => {
    const field = match[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim()
    return field?.replace(/^(['"])(.*)\1$/, '$2')
  }
  return { name: value('name'), description: value('description') }
}

function safeRelativePath(raw) {
  const clean = raw.replace(/\\/g, '/').replace(/^\.\//, '').split('#')[0]
  if (!clean || clean.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(clean)) return null
  const normalized = posix.normalize(clean)
  if (normalized === '..' || normalized.startsWith('../')) return normalized
  if (normalized.split('/').some((part) => !part || part === '.' || part === '..')) return null
  return normalized
}

for (const entry of readdirSync(skillsRoot, { withFileTypes: true }).filter((item) => item.isDirectory())) {
  const skillDirectory = join(skillsRoot, entry.name)
  const rootPath = join(skillDirectory, 'SKILL.md')
  if (!existsSync(rootPath)) {
    failures.push(`${entry.name}: missing SKILL.md`)
    continue
  }
  const root = readFileSync(rootPath, 'utf8')
  const meta = frontmatter(root)
  if (!meta?.name || !meta.description) failures.push(`${entry.name}: name and description are required`)
  if (meta?.name !== entry.name) failures.push(`${entry.name}: frontmatter name must match its directory`)
  if ((meta?.description?.length ?? 0) > 1024) failures.push(`${entry.name}: description exceeds 1024 characters`)
  if (root.split(/\r?\n/).length > 500) failures.push(`${entry.name}: SKILL.md exceeds 500 lines`)

  const resources = filesUnder(skillDirectory)
    .map((file) => relative(skillDirectory, file).replace(/\\/g, '/'))
    .filter((file) => resourceRoots.has(file.split('/')[0]))
    .sort()
  const linked = new Set()
  markdownLink.lastIndex = 0
  let match
  while ((match = markdownLink.exec(root)) !== null) {
    const target = safeRelativePath(match[1] ?? match[2] ?? '')
    if (!target) continue
    const crossSkill = target.match(/^\.\.\/([^/]+)\/SKILL\.md$/i)
    if (crossSkill) {
      const dependency = join(skillsRoot, crossSkill[1], 'SKILL.md')
      if (!existsSync(dependency)) failures.push(`${entry.name}: missing linked skill ${target}`)
      continue
    }
    if (!resourceRoots.has(target.split('/')[0])) continue
    if (!existsSync(join(skillDirectory, target))) failures.push(`${entry.name}: missing linked resource ${target}`)
    else linked.add(target)
  }
  for (const resource of resources) {
    if (!linked.has(resource)) failures.push(`${entry.name}: orphaned resource ${resource}`)
  }

  const digest = createHash('sha256')
    .update(root)
    .update(resources.map((file) => `${file}\0${readFileSync(join(skillDirectory, file), 'utf8')}`).join('\n'))
    .digest('hex')
  process.stdout.write(`✓ ${entry.name} (${resources.length} resources, ${digest.slice(0, 12)})\n`)
}

if (failures.length > 0) {
  process.stderr.write(`\n${failures.map((failure) => `✗ ${failure}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write('\nAll skill bundles are portable and linked.\n')
}
