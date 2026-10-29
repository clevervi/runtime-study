export function stripThinking(text) {
  let out = ''
  let index = 0
  while (index < text.length) {
    const start = text.indexOf('<thinking>', index)
    if (start === -1) {
      out += text.slice(index)
      break
    }
    out += text.slice(index, start)
    const end = text.indexOf('</thinking>', start + '<thinking>'.length)
    if (end === -1) break
    index = end + '</thinking>'.length
  }
  return out
}

function isWordChar(char) {
  return char !== undefined && /[A-Za-z0-9_]/.test(char)
}

function isSpace(char) {
  return char !== undefined && /\s/.test(char)
}

function firstDecision(text, allowWhitespace) {
  const lower = text.toLowerCase()
  let index = 0
  while (index < lower.length) {
    const start = lower.indexOf('<block>', index)
    if (start === -1) return null
    let cursor = start + '<block>'.length
    if (allowWhitespace) {
      while (cursor < text.length && isSpace(text[cursor])) cursor++
    }
    const token = lower.startsWith('yes', cursor)
      ? 'yes'
      : lower.startsWith('no', cursor)
        ? 'no'
        : null
    if (token !== null && !isWordChar(lower[cursor + token.length])) {
      return token === 'yes'
    }
    index = start + '<block>'.length
  }
  return null
}

// Authentic 2.1.88 behavior: the decision must follow the tag immediately.
export function parseAuthentic(text) {
  return firstDecision(stripThinking(text), false)
}

// Third-party tolerant behavior: whitespace is allowed after the tag.
export function parseHardened(text) {
  return firstDecision(stripThinking(text), true)
}

// 2.1.301 keeps the strict matcher; anchoring is prompt text, not code.
export function parse301(text) {
  return firstDecision(stripThinking(text), false)
}

export function label(value) {
  if (value === null) return 'unparseable'
  return value ? 'block' : 'allow'
}
