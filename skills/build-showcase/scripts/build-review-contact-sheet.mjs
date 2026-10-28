#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

function usage() {
  process.stdout.write(
    'Usage: node scripts/build-review-contact-sheet.mjs <video> [output.png] [--frames=8]\n',
  )
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.error?.code === 'ENOENT') throw new Error(`${command} is required`)
  if (result.status !== 0) throw new Error(result.stderr.trim() || `${command} failed`)
  return result.stdout.trim()
}

function flagValue(name) {
  const prefix = `--${name}=`
  const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
if (positional.length < 1 || process.argv.includes('--help')) {
  usage()
  process.exit(positional.length < 1 ? 1 : 0)
}

const input = resolve(positional[0])
const output = resolve(positional[1] ?? `${input.replace(/\.[^.]+$/, '')}.contact-sheet.png`)
const frames = Number(flagValue('frames') ?? 8)
if (!existsSync(input)) throw new Error(`Video not found: ${input}`)
if (!Number.isInteger(frames) || frames < 4 || frames > 16) {
  throw new Error('--frames must be an integer from 4 to 16')
}

const duration = Number(
  run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1',
    input,
  ]),
)
if (!(duration > 0)) throw new Error('Unable to determine video duration')

const columns = Math.min(4, frames)
const rows = Math.ceil(frames / columns)
const filter = `fps=${frames}/${duration},scale=960:540:flags=lanczos,tile=${columns}x${rows}`
mkdirSync(dirname(output), { recursive: true })
run('ffmpeg', ['-y', '-v', 'error', '-i', input, '-vf', filter, '-frames:v', '1', output])
process.stdout.write(`Review contact sheet: ${output}\n`)
