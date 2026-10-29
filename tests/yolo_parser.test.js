
/**
 * Standalone test for YOLO Classifier XML Parsing (Plain JS).
 */

function stripThinking(text) {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
    .replace(/<thinking>[\s\S]*$/, '')
}

function parseXmlBlock(text) {
  // Current strict regex: /<block>(yes|no)\b(<\/block>)?/gi
  const matches = [
    ...stripThinking(text).matchAll(/<block>(yes|no)\b(<\/block>)?/gi),
  ]
  if (matches.length === 0) return null
  return matches[0][1].toLowerCase() === 'yes'
}

function parseXmlBlockRobust(text) {
  // Robust regex: allows whitespace after <block> and before </block> or end of string
  const matches = [
    ...stripThinking(text).matchAll(/<block>\s*(yes|no)\b[\s\S]*?(?:<\/block>|$)/gi),
  ]
  if (matches.length === 0) return null
  return matches[0][1].toLowerCase() === 'yes'
}

const testCases = [
  { name: 'Strict Valid Yes', input: '<block>yes</block>', expected: true },
  { name: 'Strict Valid No', input: '<block>no</block>', expected: false },
  { name: 'Preamble + Valid', input: 'I have decided.\n<block>no</block>', expected: false },
  { name: 'Thinking + Valid', input: '<thinking>Security check...</thinking>\n<block>yes</block>', expected: true },
  { name: 'Missing Close Tag', input: '<block>yes', expected: true },
  { name: 'Whitespace Inside Tag (Fail Case for current)', input: '<block> yes </block>', expected: true },
  { name: 'Newline Inside Tag (Fail Case for current)', input: '<block>\nno\n</block>', expected: false },
  { name: 'Mixed Case', input: '<BLOCK>YES</BLOCK>', expected: true },
  { name: 'Truncated (Fail Case)', input: 'I will block this because it looks <blo', expected: null },
  { name: 'Chatty Preamble Truncated', input: 'Certainly! I will analyze the command. <block>y', expected: null },
]

console.log('--- Testing Current Parser ---');
testCases.forEach(tc => {
  const result = parseXmlBlock(tc.input);
  const status = (result === tc.expected) ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${tc.name}: Got ${result}, Expected ${tc.expected}`);
});

console.log('\n--- Testing Robust Parser ---');
testCases.forEach(tc => {
  const result = parseXmlBlockRobust(tc.input);
  const status = (result === tc.expected) ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${tc.name}: Got ${result}, Expected ${tc.expected}`);
});
