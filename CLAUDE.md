# ua-builder-sdk — guidance for coding agents

Read `design/DESIGN.md` first for the architecture and the recorded decisions. Do
not re-open decided questions (reactive idiom, naming, test runner, scope).

## Conventions

- Everything public is exported from `src/luna.ts` and reached as `Luna.<Name>`.
  Add new exports there; never export from `src/index.ts` directly.
- One reactive idiom: `Prop<T>` with `.value`, `.onChange(listener)`,
  and `.set(value)` when writable. No `getX()`/`onXChange()` pairs. Listeners
  take no arguments; they read `.value`.
- Collections are arrays or `Luna.List<T>`, never `Map`.
- The only escape hatch to raw paths is `client.raw`. Domain code goes through
  `Store` and `Port`, never a socket.
- Ports normalise everything to `Event { path, data, operation? }` with the
  `/value` suffix stripped. Anything transport-specific stays inside the port.
- Every public class and method gets a JSDoc `@example` that a reader can paste.
- Cite engine behaviour as "fact N" from `docs/EVIDENCE.md`. When you learn a
  new fact, add it there with its status and source before relying on it.
- Errors are `Luna.Error` subclasses with a `code`. Engine error strings become
  the code unchanged.
- Units pass through verbatim: ticks for musical time, nanoseconds for
  source-file offsets, seconds for lyrics. No conversion in the SDK.

## Testing

- `npm test` runs the unit lane against `Luna.MockEngine` and `FakeSocket`. It
  must pass before any commit.
- Write engine-behaviour tests against the mock, and when the mock's behaviour
  is a guess, mark the fact `unverified` in EVIDENCE.md and add a live check to
  `tests/live/`.
- Use `await engine.settled()` for mock pushes and `await luna.settled()` for change
  notifications and member reads still in flight; never rely on synchronous delivery.
- Three lanes: `npm test` (mock), `UA_LIVE=1 npm run test:live` (native LUNA on 4718, restore
  what you touch), `npm run test:engine` (real wasm build in headless Chrome over CDP; needs
  Chrome and `UA_WASM_ENGINE` or a sibling `hbsystem/wasm_engine/dist/Release`). The mock
  models native LUNA; wasm differences are normalised in `WasmPort` (facts 6, 10, 13, 35).

## Docs and skills

- What ships (package.json `files`, and so the SDK's GitHub repo) is public: `README.md`,
  `CHANGELOG.md`, `NOTICE`, `docs/`, `skills/`, `templates/`, `examples/`, `plugins/`. Keep
  tree paths, pac, Jira and planning out of them. Internal material goes in `design/`
  (DESIGN.md, PLAN.md), `DEVELOPING.md` or here.
- `docs/QUICKSTART.md` is the user-facing entry point; keep it under 300 lines and keep every
  snippet runnable. `docs/api/` is generated (`npm run docs:api`); never edit it by hand.
- `docs/llms.txt` indexes everything for agents; update it when a doc or skill is added.
- `skills/*/SKILL.md` are shared Claude Code and Codex skills. Keep them procedural and short, pointing at doc
  sections rather than repeating them.
- `templates/add-on-basic/` is what `ua-builder new` copies; placeholders are `__NAME__`,
  `__SLUG__`, `__ID__`, `__TITLE__`, `__TARGET__`, `__FLOATING__`, `__SHOW_WITH_SESSION__`, `__WIDTH__`, `__HEIGHT__`, `__SDK_VERSION__`,
  `__BUILDER_PATH__`. Run the scaffold's own tests after changing it.

## The agent plugin

- `plugins/ua-luna-builder/` is the same material packaged for Claude Code and Codex, with
  the catalogs in `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`.
- It is **generated and git-ignored**, like `dist/`: `npm run build` runs tsup, then
  `scripts/sync-plugin.mjs`, which copies the hand-written shell from `plugin/` (`README.md`,
  `NOTICE`, `package.json`, the two `plugin.json` files, `scripts/`) and then the builds,
  skills, template, examples and docs. It ships through package.json `files`, so the plugin
  works with no checkout, npm install or network.
- Never edit anything under `plugins/`; it is wiped on every build. Edit `plugin/` or the
  original, then `npm run build`.
- `npm run check:plugin` is the gate. It fails on a stale copy, a version that disagrees
  across the manifests and catalogs, a skill without front matter or with a
  provider-specific path (`CLAUDE_PLUGIN_ROOT`, a cache directory), an example that reaches
  outside the plugin, or a relocated plugin that cannot scaffold an Add On.
- Skills must resolve the plugin root relatively (two directories above the `SKILL.md`) and
  work both ways: `npx ua-builder` in a project, `node <plugin-root>/sdk/cli.js` in the
  plugin. `sync-plugin.mjs` inserts that note; do not write it into the originals.
- A new skill, example, template file or consumer doc is picked up automatically by the
  sync; a new *build artefact* needs adding to `BUILDS` in `scripts/sync-plugin.mjs`.

## Commands

```sh
npm run typecheck   # tsc --noEmit (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
npm test            # vitest, unit lane
npm run build       # tsup: ESM + CJS + IIFE (globalThis.Luna) + dist/cli.js, then generate plugins/
npm run docs:api    # TypeDoc markdown into docs/api
npm run sync-plugin # regenerate plugins/ua-luna-builder only (build already does it)
npm run check:plugin # prove the plugin is current, consistent and self-contained
npm run check       # all of the above
```

## pac target

A pac target wraps the npm scripts above (NEXT-2176); vitest stays the test runner.

`pac build sdk/luna/ua-builder-sdk` — npm only, any platform: `npm ci`, `npm run build`,
`npm pack` (to a temp dir; the tarball is discarded), unpacked to
`output/<host>/<Config>/<platform>/ua-builder-sdk/`. That folder is
exactly package.json `files`, so `files` is the one list of what ships. Smoke: typecheck,
unit tests, `check:plugin`. `pac test --type=regression` runs `test:engine`.
`docs:api` is not run (its output is committed). The staged folder is the layout of the
SDK's GitHub repo.

The engine never goes into git: it is versioned separately and delivered as a release asset
(later a hosted URL) that `engine.json` names and hashes.
