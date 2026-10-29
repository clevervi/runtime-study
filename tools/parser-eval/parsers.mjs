export function stripThinking(text) {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
    .replace(/<thinking>[\s\S]*$/, '')
}

// Authentic 2.1.88 parser, from cli.js.
export function parseAuthentic(text) {
  const matches = [
    ...stripThinking(text).matchAll(/<block>(yes|no)\b(<\/block>)?/gi),
  ]
  if (matches.length === 0) return null
  return matches[0][1].toLowerCase() === 'yes'
}

// Parser shipped by the third-party "hardened" tree.
export function parseHardened(text) {
  const matches = [
    ...stripThinking(text).matchAll(/<block>\s*(yes|no)\b[\s\S]*?(?:<\/block>|$)/gi),
  ]
  if (matches.length === 0) return null
  return matches[0][1].toLowerCase() === 'yes'
}

// 2.1.301 keeps the strict matcher. The "response must begin with <block>"
// requirement is prompt text, not parser enforcement.
export function parse301(text) {
  const matches = [
    ...stripThinking(text).matchAll(/<block>(yes|no)\b(<\/block>)?/gi),
  ]
  if (matches.length === 0) return null
  return matches[0][1].toLowerCase() === 'yes'
}

export function label(value) {
  if (value === null) return 'unparseable'
  return value ? 'block' : 'allow'
}
