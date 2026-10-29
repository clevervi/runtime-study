/**
 * Standalone Test Harness for Context Compaction Parser
 * This script verifies the logic in src/services/compact/prompt.ts
 */

// Logic from formatCompactSummary (HARDENED VERSION)
function formatCompactSummary(summary) {
  let formattedSummary = summary;

  // Strip analysis section
  formattedSummary = formattedSummary.replace(
    /<analysis\s*>[\s\S]*?(?:<\/analysis\s*>|$)/gi,
    '',
  );

  // Extract and format summary section
  const summaryMatch = formattedSummary.match(
    /<summary\s*>\s*([\s\S]*?)(?:<\/summary\s*>|$)/i,
  );
  
  if (summaryMatch) {
    const content = summaryMatch[1] || '';
    formattedSummary = formattedSummary.replace(
      /<summary\s*>[\s\S]*?(?:<\/summary\s*>|$)/i,
      `Summary:\n${content.trim()}`,
    );
  }

  return formattedSummary.replace(/\n\n+/g, '\n\n').trim();
}

const testCases = [
  {
    name: 'Standard Compliant',
    input: '<analysis>\nThinking...\n</analysis>\n<summary>\n1. Request: Fix bug\n2. Done: Yes\n</summary>',
    expected: 'Summary:\n1. Request: Fix bug\n2. Done: Yes'
  },
  {
    name: 'Truncated Summary (No closing tag)',
    input: '<analysis>\nThinking...\n</analysis>\n<summary>\n1. Request: Fix bug\n2. Done: Yes',
    expected: 'Summary:\n1. Request: Fix bug\n2. Done: Yes'
  },
  {
    name: 'Whitespace Inside Tag',
    input: '<summary  >\nspaced out\n</summary   >',
    expected: 'Summary:\nspaced out'
  },
  {
    name: 'Mixed Case',
    input: '<ANALYSIS>Draft</ANALYSIS><Summary>Final</Summary>',
    expected: 'Summary:\nFinal'
  }
];

console.log('--- Context Compaction Parser Test ---');
let passed = 0;
testCases.forEach(tc => {
  const result = formatCompactSummary(tc.input);
  if (result === tc.expected) {
    console.log(`[PASS] ${tc.name}`);
    passed++;
  } else {
    console.log(`[FAIL] ${tc.name}`);
    console.log(`   Expected: ${JSON.stringify(tc.expected)}`);
    console.log(`   Actual:   ${JSON.stringify(result)}`);
  }
});

if (passed !== testCases.length) process.exit(1);
