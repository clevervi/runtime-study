# Reproduce

All commands use Node 22+ and no external dependencies.

## Tests

```bash
npm test
```

Expected: `yolo` and `compact` parser tests pass, followed by 7 `node:test` cases.

## Parser evaluation

```bash
npm run eval:parser
```

Expected summary:

```text
24 cases, 4 differences, 1 fail-closed -> allow
```

The JSON report is written to `analysis/parser-eval.json`.

## Fetch a release

```bash
node tools/fetch-version.mjs 2.1.87
```

Expected prompt hashes:

```text
base      8e5ddd3085a2cd49566c7eea32afe0df3a373a203ed7c2dd562de02338d3801c
external  18551a278f4d19a65a26c5589ce17c950acf5af3e155e8ac8d6b73685d7f1e4d
resolved  0f4c550d593bae498eb323f7ea6d010e2cb2c08b4cffe871163c3673a6601f72
```

## Verify the analysis

```bash
npm test
npm run eval:parser
```

Both exit 0. The source snapshot is not part of this repository, so there is no snapshot tag to check out here.

## CI

`.github/workflows/ci.yml` runs the same commands on push. If the account's Actions billing is inactive, GitHub rejects the job before the first step; run the commands locally instead.
