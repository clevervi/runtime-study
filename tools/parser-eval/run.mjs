import fs from 'fs'
import { corpus } from './corpus.mjs'
import { parseAuthentic, parseHardened, label } from './parsers.mjs'

const rows = corpus.map(test => {
  const authentic = parseAuthentic(test.input)
  const hardened = parseHardened(test.input)
  return {
    case: test.name,
    authentic,
    hardened,
    authenticLabel: label(authentic),
    hardenedLabel: label(hardened),
    changed: authentic !== hardened,
  }
})

const differences = rows.filter(r => r.changed)
const failClosedToAllow = rows.filter(r => r.authentic === null && r.hardened === false)
const allowToBlock = rows.filter(r => r.authentic === false && r.hardened === true)

const pad = (value, width) => String(value).padEnd(width)
console.log(pad('CASE', 30), pad('AUTHENTIC', 14), pad('HARDENED', 14), 'DELTA')
for (const row of rows) {
  const delta = row.changed ? `${row.authenticLabel} -> ${row.hardenedLabel}` : ''
  console.log(
    pad(row.case, 30),
    pad(row.authenticLabel, 14),
    pad(row.hardenedLabel, 14),
    delta,
  )
}

const report = {
  generatedAt: new Date().toISOString(),
  authentic: '2.1.88 cli.js parser',
  hardened: 'third-party yoloClassifier.ts parser',
  total: rows.length,
  agreements: rows.length - differences.length,
  differences: differences.length,
  failClosedToAllow: failClosedToAllow.map(r => r.case),
  allowToBlock: allowToBlock.map(r => r.case),
  rows,
}
fs.mkdirSync('analysis', { recursive: true })
fs.writeFileSync('analysis/parser-eval.json', JSON.stringify(report, null, 2))
console.log(
  `\n${report.total} cases, ${report.differences} differences, ` +
    `${report.failClosedToAllow.length} fail-closed -> allow`,
)
