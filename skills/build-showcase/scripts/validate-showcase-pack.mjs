#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, isAbsolute, join, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

const allowedStages = new Set(['prepare', 'candidate', 'release'])
const failures = []

function usage() {
  process.stdout.write(
    'Usage: node scripts/validate-showcase-pack.mjs <scenario-dir> --stage=prepare|candidate|release\n',
  )
}

function fail(message) {
  failures.push(message)
}

function readText(path, label) {
  if (!existsSync(path)) {
    fail(`missing ${label}: ${path}`)
    return ''
  }
  return readFileSync(path, 'utf8')
}

function parseFrontmatter(markdown, label) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) {
    fail(`${label}: missing YAML frontmatter`)
    return {}
  }
  const result = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/)
    if (!field) continue
    result[field[1]] = field[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return result
}

function requireFields(object, fields, label) {
  for (const field of fields) {
    if (object[field] === undefined || object[field] === '') fail(`${label}: missing ${field}`)
  }
}

function requireHeadings(markdown, headings, label) {
  for (const heading of headings) {
    if (!new RegExp(`^## ${heading}\\s*$`, 'm').test(markdown)) {
      fail(`${label}: missing "## ${heading}"`)
    }
  }
}

function within(root, rawPath, label) {
  if (typeof rawPath !== 'string' || !rawPath || isAbsolute(rawPath)) {
    fail(`${label}: path must be relative to the scenario directory`)
    return null
  }
  const full = resolve(root, rawPath)
  if (full !== root && !full.startsWith(`${root}${sep}`)) {
    fail(`${label}: path escapes the scenario directory`)
    return null
  }
  return full
}

async function sha256(path) {
  const digest = createHash('sha256')
  await new Promise((resolvePromise, reject) => {
    const stream = createReadStream(path)
    stream.on('data', (chunk) => digest.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolvePromise)
  })
  return digest.digest('hex')
}

function probe(path, label) {
  const result = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path],
    { encoding: 'utf8' },
  )
  if (result.error?.code === 'ENOENT') {
    fail('ffprobe is required for candidate and release validation')
    return null
  }
  if (result.status !== 0) {
    fail(`${label}: ffprobe failed: ${result.stderr.trim() || 'unknown error'}`)
    return null
  }
  try {
    return JSON.parse(result.stdout)
  } catch {
    fail(`${label}: ffprobe returned invalid JSON`)
    return null
  }
}

function frameRate(value) {
  if (!value) return 0
  const [numerator, denominator = '1'] = value.split('/').map(Number)
  return denominator ? numerator / denominator : 0
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isPlaceholder(value) {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    /^(pending|replace-with|yyyy-mm-dd)/i.test(String(value))
  )
}

function validUrl(value) {
  if (typeof value !== 'string' || isPlaceholder(value)) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

async function validateReleasePack(scenarioDir, scenario, record, stage) {
  const version = Number(scenario.version)
  const releaseDir = join(scenarioDir, 'release', `v${version}`)
  const manifestPath = join(releaseDir, 'release.json')
  const manifestText = readText(manifestPath, 'release manifest')
  if (!manifestText) return

  let manifest
  try {
    manifest = JSON.parse(manifestText)
  } catch (error) {
    fail(`release manifest: invalid JSON: ${error.message}`)
    return
  }

  requireFields(
    manifest,
    [
      'schema_version',
      'scenario_id',
      'version',
      'profile',
      'status',
      'data_kind',
      'product_revision',
      'verified_at',
      'files',
      'video',
      'labels',
      'reviews',
      'catalog',
    ],
    'release manifest',
  )

  if (manifest.schema_version !== '1.0') fail('release manifest: schema_version must be 1.0')
  if (manifest.scenario_id !== scenario.id) fail('release manifest: scenario_id does not match scenario.md')
  if (Number(manifest.version) !== version) fail('release manifest: version does not match scenario.md')
  if (manifest.profile !== 'gallery-landscape-v1') fail('release manifest: unsupported profile')
  if (manifest.data_kind !== scenario.data_kind) fail('release manifest: data_kind does not match scenario.md')
  if (!['candidate', 'released'].includes(manifest.status)) fail('release manifest: invalid status')
  if (stage === 'release' && manifest.status !== 'released') fail('release manifest: release stage requires status=released')
  if (isPlaceholder(manifest.product_revision)) fail('release manifest: product_revision is not resolved')
  if (!isDate(manifest.verified_at)) fail('release manifest: verified_at must be YYYY-MM-DD')

  const requiredFiles = ['master', 'video', 'poster', 'captions']
  const resolvedFiles = {}
  for (const key of requiredFiles) {
    const item = manifest.files?.[key]
    if (!item || typeof item !== 'object') {
      fail(`release manifest: missing files.${key}`)
      continue
    }
    const full = within(scenarioDir, item.path, `files.${key}`)
    if (!full) continue
    if (full !== releaseDir && !full.startsWith(`${releaseDir}${sep}`)) {
      fail(`files.${key}: path must stay under release/v${version}/`)
      continue
    }
    resolvedFiles[key] = full
    if (!existsSync(full) || !statSync(full).isFile()) {
      fail(`files.${key}: file not found at ${item.path}`)
      continue
    }
    if (!/^[a-f0-9]{64}$/.test(item.sha256 ?? '')) {
      fail(`files.${key}: sha256 must contain 64 lowercase hex characters`)
      continue
    }
    const actual = await sha256(full)
    if (actual !== item.sha256) fail(`files.${key}: sha256 does not match`)
  }

  for (const reviewName of ['product', 'privacy', 'claims']) {
    const review = manifest.reviews?.[reviewName]
    if (review?.decision !== 'approved') fail(`reviews.${reviewName}: decision must be approved`)
    if (isPlaceholder(review?.reviewer)) fail(`reviews.${reviewName}: reviewer is required`)
    if (!isDate(review?.reviewed_at)) fail(`reviews.${reviewName}: reviewed_at must be YYYY-MM-DD`)
  }

  const labels = manifest.labels ?? {}
  for (const field of ['captions_complete', 'causal_order_preserved', 'mobile_card_legible']) {
    if (labels[field] !== true) fail(`labels.${field} must be true`)
  }
  const legacySyntheticLabel = scenario.data_kind === 'synthetic' && labels.synthetic_demo_visible === true
  if (labels.evidence_label_visible !== true && !legacySyntheticLabel) {
    fail('labels.evidence_label_visible must be true')
  }
  const expectedEvidenceLabel = {
    synthetic: 'SYNTHETIC DEMO',
    'internal-approved': 'INTERNAL DEMO',
  }[scenario.data_kind]
  if (expectedEvidenceLabel && labels.evidence_label && labels.evidence_label !== expectedEvidenceLabel) {
    fail(`labels.evidence_label must be ${expectedEvidenceLabel} for ${scenario.data_kind}`)
  }
  if (!legacySyntheticLabel && isPlaceholder(labels.evidence_label)) {
    fail('labels.evidence_label is required')
  }
  if (Number(labels.hero_hold_seconds) < 2.5) fail('labels.hero_hold_seconds must be at least 2.5')

  if (resolvedFiles.video) {
    const media = probe(resolvedFiles.video, 'public video')
    const stream = media?.streams?.find((item) => item.codec_type === 'video')
    const duration = Number(media?.format?.duration ?? stream?.duration)
    const fps = frameRate(stream?.avg_frame_rate)
    if (!stream) fail('public video: missing video stream')
    if (!(duration >= 9.95 && duration <= 15.05)) fail('public video: duration must be 10-15 seconds')
    if (stream && (stream.width !== 1920 || stream.height !== 1080)) {
      fail('public video: resolution must be 1920x1080')
    }
    if (!(fps >= 29.9 && fps <= 30.1)) fail('public video: frame rate must be constant 30 fps')
    if (stream?.codec_name !== 'h264') fail('public video: codec must be H.264')
    if (stream?.pix_fmt !== 'yuv420p') fail('public video: pixel format must be yuv420p')

    const declared = manifest.video ?? {}
    if (Math.abs(Number(declared.duration_seconds) - duration) > 0.15) {
      fail('release manifest: declared duration_seconds differs from the file')
    }
    if (declared.width !== 1920 || declared.height !== 1080) {
      fail('release manifest: video dimensions must be 1920x1080')
    }
    if (Number(declared.fps) !== 30) fail('release manifest: fps must be 30')
    if (declared.codec !== 'h264') fail('release manifest: codec must be h264')
    if (declared.pixel_format !== 'yuv420p') fail('release manifest: pixel_format must be yuv420p')
    if (!['silent', 'aac'].includes(declared.audio_policy)) {
      fail('release manifest: audio_policy must be silent or aac')
    }
    const audioStreams = media?.streams?.filter((item) => item.codec_type === 'audio') ?? []
    if (declared.audio_policy === 'silent' && audioStreams.length > 0) {
      fail('public video: audio_policy=silent but an audio stream is present')
    }
    if (declared.audio_policy === 'aac') {
      if (audioStreams.length !== 1 || audioStreams[0].codec_name !== 'aac') {
        fail('public video: audio_policy=aac requires one AAC audio stream')
      }
    }
  }

  if (resolvedFiles.poster) {
    const media = probe(resolvedFiles.poster, 'poster')
    const stream = media?.streams?.find((item) => item.codec_type === 'video')
    if (!stream || stream.width !== 1920 || stream.height !== 1080) {
      fail('poster: dimensions must be 1920x1080')
    }
  }

  if (resolvedFiles.captions) {
    const captions = readFileSync(resolvedFiles.captions, 'utf8')
    if (!captions.trim()) fail('captions: file is empty')
    else if (!captions.startsWith('WEBVTT')) fail('captions: expected WebVTT')
  }

  const allowedEvidenceLevels = scenario.data_kind === 'synthetic'
    ? ['verified-demonstration']
    : ['verified-demonstration', 'observed-output']
  if (!allowedEvidenceLevels.includes(record.evidence_level)) {
    fail(`showcase-record.md: evidence_level must be one of ${allowedEvidenceLevels.join(', ')}`)
  }
  if (!['candidate', 'released'].includes(record.status)) {
    fail('showcase-record.md: candidate/release requires status=candidate or released')
  }

  if (stage === 'release') {
    const releaseReview = manifest.reviews?.release
    if (releaseReview?.decision !== 'approved') fail('reviews.release: decision must be approved')
    if (isPlaceholder(releaseReview?.reviewer)) fail('reviews.release: reviewer is required')
    if (!isDate(releaseReview?.reviewed_at)) fail('reviews.release: reviewed_at must be YYYY-MM-DD')
    if (!validUrl(manifest.catalog?.video_url)) fail('catalog.video_url must be an immutable HTTPS URL')
    if (!validUrl(manifest.catalog?.poster_url)) fail('catalog.poster_url must be an immutable HTTPS URL')
    if (record.status !== 'released') fail('showcase-record.md: release stage requires status=released')
    if (record.video_url !== manifest.catalog?.video_url) {
      fail('showcase-record.md: video_url must match release.json')
    }
    if (record.poster_url !== manifest.catalog?.poster_url) {
      fail('showcase-record.md: poster_url must match release.json')
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.length === 0) {
    usage()
    process.exit(args.length === 0 ? 1 : 0)
  }

  const stageArg = args.find((arg) => arg.startsWith('--stage='))
  const stage = stageArg?.slice('--stage='.length)
  const scenarioArg = args.find((arg) => !arg.startsWith('--'))
  if (!scenarioArg || !allowedStages.has(stage)) {
    usage()
    process.exit(1)
  }

  const scenarioDir = resolve(scenarioArg)
  const scenarioPath = join(scenarioDir, 'scenario.md')
  const recordPath = join(scenarioDir, 'showcase-record.md')
  const scenarioText = readText(scenarioPath, 'scenario.md')
  const recordText = readText(recordPath, 'showcase-record.md')
  const scenario = parseFrontmatter(scenarioText, 'scenario.md')
  const record = parseFrontmatter(recordText, 'showcase-record.md')

  requireFields(
    scenario,
    ['id', 'version', 'title', 'category', 'mode', 'environment', 'data_kind', 'status', 'owner'],
    'scenario.md',
  )
  requireFields(record, ['id', 'title', 'description', 'category', 'status', 'data_kind'], 'showcase-record.md')
  requireHeadings(
    scenarioText,
    ['Permission preflight', 'Story', 'Capabilities', 'Starting state', 'Reset', 'Verification', 'Capture plan', 'Outputs', 'Release'],
    'scenario.md',
  )
  requireHeadings(
    recordText,
    ['Situation', 'What the operator asks', 'What Brian does', 'Result', 'Requirements', 'For agents', 'Evidence boundary', 'Video', 'Try it'],
    'showcase-record.md',
  )

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scenario.id ?? '')) fail('scenario.md: id must be lowercase kebab-case')
  if (scenario.id !== basename(scenarioDir)) fail('scenario.md: id must match the scenario directory name')
  if (!Number.isInteger(Number(scenario.version)) || Number(scenario.version) < 1) {
    fail('scenario.md: version must be a positive integer')
  }
  if (!['prepare', 'record', 'publish'].includes(scenario.mode)) fail('scenario.md: invalid mode')
  if (!['local', 'staging', 'production'].includes(scenario.environment)) fail('scenario.md: invalid environment')
  if (!['synthetic', 'internal-approved', 'customer-approved'].includes(scenario.data_kind)) {
    fail('scenario.md: invalid data_kind')
  }
  if (record.id !== scenario.id) fail('showcase-record.md: id does not match scenario.md')
  if (record.data_kind !== scenario.data_kind) fail('showcase-record.md: data_kind does not match scenario.md')
  if (scenario.evidence_level && record.evidence_level !== scenario.evidence_level) {
    fail('showcase-record.md: evidence_level does not match scenario.md')
  }

  for (const name of ['exact-prompt.md', 'expected-result.md']) {
    const path = join(scenarioDir, name)
    if (!existsSync(path) || !statSync(path).isFile()) fail(`missing ${name}`)
  }
  const inputsDir = join(scenarioDir, 'inputs')
  if (!existsSync(inputsDir) || !readdirSync(inputsDir).some((name) => !name.startsWith('.'))) {
    fail('inputs/: include at least one retained scenario input')
  }

  if (stage !== 'prepare') await validateReleasePack(scenarioDir, scenario, record, stage)

  if (failures.length) {
    process.stderr.write(`${failures.map((message) => `✗ ${message}`).join('\n')}\n`)
    process.exit(1)
  }

  const suffix = stage === 'prepare' ? 'scenario contract is complete' : `${stage} media and reviews pass`
  process.stdout.write(`✓ ${scenario.id} (${stage}): ${suffix}\n`)
}

main().catch((error) => {
  process.stderr.write(`✗ validator error: ${error.message}\n`)
  process.exit(1)
})
