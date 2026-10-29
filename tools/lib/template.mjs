import fs from 'fs'
import path from 'path'

export function decodeJsString(raw) {
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]
    if (char !== '\\') {
      out += char
      continue
    }
    const next = raw[++i]
    if (next === 'u') {
      if (raw[i + 1] === '{') {
        const end = raw.indexOf('}', i + 2)
        out += String.fromCodePoint(parseInt(raw.slice(i + 2, end), 16))
        i = end
      } else {
        const hex = raw.slice(i + 1, i + 5)
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16))
          i += 4
        } else {
          out += 'u'
        }
      }
    } else if (next === 'x') {
      const hex = raw.slice(i + 1, i + 3)
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        out += String.fromCharCode(parseInt(hex, 16))
        i += 2
      } else {
        out += 'x'
      }
    } else if (next === '\n') {
      // line continuation
    } else {
      const map = {
        n: '\n',
        t: '\t',
        r: '\r',
        b: '\b',
        f: '\f',
        v: '\v',
        0: '\0',
        "'": "'",
        '"': '"',
        '\\': '\\',
        '`': '`',
        $: '$',
      }
      out += map[next] !== undefined ? map[next] : next
    }
  }
  return out
}

export function grabTemplate(source, marker) {
  const start = source.indexOf(marker)
  if (start < 0) throw new Error(`marker not found: ${marker.slice(0, 40)}`)
  const open = source.lastIndexOf('`', start)
  let i = start
  let raw = ''
  while (i < source.length) {
    const char = source[i]
    if (char === '\\') {
      raw += char + source[i + 1]
      i += 2
      continue
    }
    if (char === '`') break
    raw += char
    i++
  }
  return { text: decodeJsString(raw), range: [open, i] }
}

function resolvePrompt(base, external) {
  let out = base.replace('<permissions_template>', () => external)
  for (const tag of [
    'user_allow_rules_to_replace',
    'user_deny_rules_to_replace',
    'user_environment_to_replace',
  ]) {
    out = out.replace(
      new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'),
      (_match, inner) => inner,
    )
  }
  return out
}

export function extractJsPrompts(cliJsPath, outDir) {
  const source = fs.readFileSync(cliJsPath, 'utf8')
  const base = grabTemplate(
    source,
    'You are a security monitor for autonomous AI coding agents',
  )
  const external = grabTemplate(
    source,
    '## Environment\n\n<user_environment_to_replace>',
  )
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'auto_mode_system_prompt.txt'), base.text)
  fs.writeFileSync(path.join(outDir, 'permissions_external.txt'), external.text)
  const resolved = resolvePrompt(base.text, external.text)
  fs.writeFileSync(path.join(outDir, 'resolved_default_prompt.txt'), resolved)
  return {
    baseChars: base.text.length,
    externalChars: external.text.length,
    resolvedChars: resolved.length,
  }
}

export function extractBinaryPrompts(binaryPath, outDir) {
  const source = fs.readFileSync(binaryPath).toString('utf8')
  const base = grabTemplate(
    source,
    'You are a security monitor for autonomous AI coding agents',
  )
  let external
  try {
    external = grabTemplate(
      source,
      '## Environment\n\n<user_environment_to_replace>',
    )
  } catch {
    external = { text: '' }
  }
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'auto_mode_system_prompt.txt'), base.text)
  if (external.text) {
    fs.writeFileSync(path.join(outDir, 'permissions_external.txt'), external.text)
  }
  const resolved = external.text ? resolvePrompt(base.text, external.text) : base.text
  fs.writeFileSync(path.join(outDir, 'resolved_default_prompt.txt'), resolved)
  return {
    baseChars: base.text.length,
    externalChars: external.text.length,
    resolvedChars: resolved.length,
  }
}

export function extractSources(mapPath, outDir) {
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
  let files = 0
  let bytes = 0
  for (let i = 0; i < map.sources.length; i++) {
    const source = map.sources[i]
    if (!source.startsWith('../src/')) continue
    const content = map.sourcesContent?.[i]
    if (typeof content !== 'string') continue
    const rel = source.slice('../src/'.length)
    const dest = path.join(outDir, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content)
    files++
    bytes += Buffer.byteLength(content)
  }
  return { files, bytes }
}
