# Method

## Acquisition

Releases are fetched in this order:

1. `npm pack @anthropic-ai/claude-code@<version>`.
2. Wayback Machine CDX lookup for the npm tarball, then the `id_` raw capture.
3. Platform-native package (`@anthropic-ai/claude-code-<platform>@<version>`) when the main package only contains a launcher.

The 2.1.88 tarball used here was recovered from:

```text
https://web.archive.org/web/20260331061545id_/https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-2.1.88.tgz
```

- bytes: `31,196,633`
- SHA-256: `d836a86d9150ecc594a7025524c50e24080478904c979f386d447770275ef813`

## Sources

`cli.js.map` ships with the 2.1.88 npm tarball. It contains 4,756 `sources` with `sourcesContent`. Entries under `../src/` are written to `src/`, preserving paths. For 2.1.88 that is 1,902 files, 30,382,832 bytes. The resulting snapshot is kept private and is not part of this repository.

The resulting tree was compared against the third-party fork. All common `.ts` files matched except the two documented in `docs/FINDINGS.md`. `.tsx` files were replaced with the map originals, removing React Compiler output.

## Prompts

The classifier prompt is embedded as a template literal in `cli.js`:

- base: starts at `You are a security monitor for autonomous AI coding agents`;
- external rules: starts at `## Environment` and contains `<user_environment_to_replace>`;
- extract the literal between backticks, decode JS escapes, then substitute the tags.

For native-only releases the same markers are searched in the binary.

## Rules

`auto-mode defaults` returns the structured rule layer as JSON:

```bash
node cli.js auto-mode defaults
```

For 2.1.87/2.1.88 this is a small user-overridable layer (7 allow, 29 soft deny, 5 environment). The full shipped rule set is the prose template (28 block, 6 allow, 4 environment). For 2.1.301+ the defaults are the full structured set.

## Reproduction

```bash
node tools/fetch-version.mjs 2.1.88
node tools/parser-eval/run.mjs
npm test
```

`fetch:version` writes to `research/<version>/`:

```
package.tgz
pkg/
prompts/
src/                  (when a source map is present)
auto_mode_defaults.json
auto_mode_config.json
PROVENANCE.json
```
