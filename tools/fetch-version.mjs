import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execFileSync, execSync } from 'child_process'
import {
  extractBinaryPrompts,
  extractJsPrompts,
  extractSources,
} from './lib/template.mjs'

const version = process.argv[2]
if (!version) {
  console.error('usage: node tools/fetch-version.mjs <version>')
  process.exit(1)
}

const root = path.resolve('research', version)
const pkgDir = path.join(root, 'pkg')
const tarPath = path.join(root, 'package.tgz')
const configDir = path.join(root, '.config')
fs.mkdirSync(pkgDir, { recursive: true })
fs.mkdirSync(configDir, { recursive: true })

const sha256 = file =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function pack(spec) {
  const command = `npm pack ${spec} --pack-destination "${root}"`
  const output = execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const name = output.trim().split(/\r?\n/).pop()
  return path.join(root, name)
}

async function packFromWayback() {
  const target = `https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-${version}.tgz`
  const query =
    'https://web.archive.org/cdx/search/cdx?url=' +
    encodeURIComponent(target) +
    '&output=json&filter=statuscode:200&limit=1'
  const response = await fetch(query)
  if (!response.ok) throw new Error(`CDX ${response.status}`)
  const rows = await response.json()
  if (rows.length < 2) throw new Error('no Wayback capture')
  const [, timestamp, original] = rows[1]
  const url = `https://web.archive.org/web/${timestamp}id_/${original}`
  const archive = await fetch(url)
  if (!archive.ok) throw new Error(`Wayback ${archive.status}`)
  const buffer = Buffer.from(await archive.arrayBuffer())
  fs.writeFileSync(tarPath, buffer)
  return { source: 'wayback', url, timestamp, bytes: buffer.length }
}

function extract(tgz) {
  fs.rmSync(pkgDir, { recursive: true, force: true })
  fs.mkdirSync(pkgDir, { recursive: true })
  execFileSync('tar', ['-xzf', tgz, '-C', pkgDir])
}

function nativeSpec() {
  const platform = process.platform
  const arch = process.arch
  if (platform === 'win32' && arch === 'x64') {
    return '@anthropic-ai/claude-code-win32-x64'
  }
  if (platform === 'win32' && arch === 'arm64') {
    return '@anthropic-ai/claude-code-win32-arm64'
  }
  if (platform === 'darwin') return `@anthropic-ai/claude-code-darwin-${arch}`
  return `@anthropic-ai/claude-code-linux-${arch}`
}

function runRules(command, args) {
  const env = {
    ...process.env,
    CLAUDE_CONFIG_DIR: configDir,
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    CLAUDE_CODE_DISABLE_AUTOUPDATER: '1',
  }
  const buffer = execFileSync(command, args, {
    encoding: 'buffer',
    maxBuffer: 40 * 1024 * 1024,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return buffer
}

const provenance = {
  version,
  fetchedAt: new Date().toISOString(),
  acquisition: null,
  layout: null,
  prompts: null,
  rules: null,
  sources: null,
}

let tgz
try {
  tgz = pack(`@anthropic-ai/claude-code@${version}`)
  provenance.acquisition = { source: 'npm', spec: `@anthropic-ai/claude-code@${version}` }
} catch {
  const result = await packFromWayback()
  tgz = tarPath
  provenance.acquisition = { source: 'wayback', ...result }
}
provenance.acquisition.tarballBytes = fs.statSync(tgz).size
provenance.acquisition.tarballSha256 = sha256(tgz)
extract(tgz)

let pkg = path.join(pkgDir, 'package')
let cli = path.join(pkg, 'cli.js')
let binary = null

if (!fs.existsSync(cli)) {
  const spec = `${nativeSpec()}@${version}`
  const nativeTar = pack(spec)
  provenance.acquisition.nativeSpec = spec
  provenance.acquisition.nativeTarballSha256 = sha256(nativeTar)
  extract(nativeTar)
  const files = fs.readdirSync(path.join(pkgDir, 'package'))
  binary = files.find(name => name === 'claude.exe' || name === 'claude')
  if (!binary) throw new Error(`no cli.js or native binary in ${spec}`)
  binary = path.join(pkgDir, 'package', binary)
}

const promptsDir = path.join(root, 'prompts')
fs.mkdirSync(promptsDir, { recursive: true })

if (cli && fs.existsSync(cli)) {
  provenance.layout = 'npm-js'
  provenance.prompts = extractJsPrompts(cli, promptsDir)
  const map = path.join(pkg, 'cli.js.map')
  if (fs.existsSync(map)) {
    provenance.sources = extractSources(map, path.join(root, 'src'))
  }
  const defaults = runRules(process.execPath, [cli, 'auto-mode', 'defaults'])
  fs.writeFileSync(path.join(root, 'auto_mode_defaults.json'), defaults)
  provenance.rules = JSON.parse(defaults.toString('utf8').replace(/^\uFEFF/, ''))
  try {
    const config = runRules(process.execPath, [cli, 'auto-mode', 'config'])
    fs.writeFileSync(path.join(root, 'auto_mode_config.json'), config)
  } catch {}
} else {
  provenance.layout = 'native'
  provenance.prompts = extractBinaryPrompts(binary, promptsDir)
  const defaults = runRules(binary, ['auto-mode', 'defaults'])
  fs.writeFileSync(path.join(root, 'auto_mode_defaults.json'), defaults)
  provenance.rules = JSON.parse(defaults.toString('utf8').replace(/^\uFEFF/, ''))
  try {
    const config = runRules(binary, ['auto-mode', 'config'])
    fs.writeFileSync(path.join(root, 'auto_mode_config.json'), config)
  } catch {}
}

provenance.promptHashes = {
  base: sha256(path.join(promptsDir, 'auto_mode_system_prompt.txt')),
  external: fs.existsSync(path.join(promptsDir, 'permissions_external.txt'))
    ? sha256(path.join(promptsDir, 'permissions_external.txt'))
    : null,
  resolved: sha256(path.join(promptsDir, 'resolved_default_prompt.txt')),
}
provenance.ruleCounts = {
  allow: provenance.rules.allow?.length ?? 0,
  softDeny: provenance.rules.soft_deny?.length ?? 0,
  hardDeny: provenance.rules.hard_deny?.length ?? 0,
  environment: provenance.rules.environment?.length ?? 0,
}
delete provenance.rules
fs.writeFileSync(path.join(root, 'PROVENANCE.json'), JSON.stringify(provenance, null, 2))

const previous = fs
  .readdirSync(path.resolve('research'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name !== version)
  .map(entry => entry.name)
const equalTo = []
for (const other of previous) {
  const otherProvenance = path.join('research', other, 'PROVENANCE.json')
  if (!fs.existsSync(otherProvenance)) continue
  const data = JSON.parse(fs.readFileSync(otherProvenance, 'utf8'))
  if (
    data.promptHashes?.resolved === provenance.promptHashes.resolved &&
    data.ruleCounts?.softDeny === provenance.ruleCounts.softDeny
  ) {
    equalTo.push(other)
  }
}

console.log(JSON.stringify({ version, layout: provenance.layout, ...provenance.promptHashes, ...provenance.ruleCounts, equalTo }, null, 2))
