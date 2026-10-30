# luna-builder-sdk — guidance for coding agents

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

- What ships (package.json `files`, and so the installer zip) is public: `README.md`,
  `CHANGELOG.md`, `RELEASE_NOTES.md`, `FEATURES_LIST.md`, `NOTICE`, `docs/`, `skills/`,
  `templates/`, `examples/`, `plugins/`. Keep
  tree paths, pac, Jira and planning out of them. Internal material goes in `design/`
  (DESIGN.md, PLAN.md, PLATFORM.md), `DEVELOPING.md` or here.
- Wasm engine support (`WasmPort`, `src/engine/`, `engine: 'wasm'`, the `serve` engine mount)
  stays in the code but is not released yet: keep it out of everything that ships, and tag
  its public declarations `@hidden` so `docs/api/` leaves them out.
- `docs/QUICKSTART.md` is the user-facing entry point; keep it under 300 lines and keep every
  snippet runnable. `docs/api/` is generated (`npm run docs:api`); never edit it by hand.
- `docs/llms.txt` indexes everything for agents; update it when a doc or skill is added.
- `FEATURES_LIST.md` is the current feature set by area, as short bullets: no versions, and
  no fixes, docs or other changes that add no feature. Update it whenever `RELEASE_NOTES.md`
  gets a bullet for a feature: add a bullet for a new one, reword one that changed (a rename,
  a breaking change), and delete one that was removed. Add a section when no area fits.
- `skills/*/SKILL.md` are shared Claude Code and Codex skills. Keep them procedural and short, pointing at doc
  sections rather than repeating them.
- `templates/add-on-basic/` is what `ua-builder new` copies, and `templates/add-on-typescript/`
  with `--template add-on-typescript` (Vite builds `src/` into the IIFE `dist/main.js`; `Luna`
  is the global typed by `types/global.d.ts`). Placeholders in both are `__NAME__`,
  `__SLUG__`, `__ID__`, `__TITLE__`, `__TARGET__`, `__FLOATING__`, `__SHOW_WITH_SESSION__`, `__WIDTH__`, `__HEIGHT__`, `__SDK_VERSION__`,
  `__BUILDER_PATH__`. Run the scaffold's own tests after changing either (`npm install`, `npm
  test`; for TypeScript also `npm run typecheck` and `npm run pack`).
- Template dotfiles are stored without the dot (`npmrc`, `gitignore`) and renamed by
  `DOTFILES` in `cli/new.ts`: `npm pack` drops `.npmrc` and `.gitignore`, so they would never
  reach the installed SDK. The `npmrc` (`legacy-peer-deps=true`) is what lets npm 10 install a
  scaffold; keep it.
- The installed SDK's `package.json` ships without `scripts` and `devDependencies`
  (`DEV_ONLY_FIELDS` in the installer's `build-and-test.py`). A scaffold `file:`-depends on
  it, and npm would otherwise run `prepare` there and resolve its dev dependencies.

## Clips, fades and renderings: how to work on them

`docs/CLIPS.md` is the consumer guide (what an Add On must do); this is how to change the SDK
side. Facts 72-73 and 116-119 hold the measured behaviour.

- **Where LUNA keeps it** (in the `hbsystem` repo): the compiled-clip node is
  `deviced/services/session/Sesn_CompiledClip.cpp` (published only once a client sets
  `enable_compiled_clips`), with property names in
  `networking/source/modules/uaserver/UASrv_Properties.h` and its unit test
  `CompiledClipsPublishFadesAndFullRange` in `deviced/services/test/TEST_Playlists.cpp`.
  Edit commands are `deviced/services/editing/Edit_*.cpp`; how LUNA's own GUI uses them is
  `clients/source/deckclient/DkClnt_Editor.cpp` and `houston/rack/source/pages/timeline/`
  (`Rack_MoveClip`, `Rack_CrossFade`); compiling and fade placement are
  `shared/source/deck/UAClipCompiler.cpp`; renderings are
  `deviced/services/playback/Plybk_ClipCompiler.cpp`.
- **A new compiled-clip property** is one change across both repos: LUNA (node, property
  name, the deviced test), then the SDK (`CompiledClip` prop and snapshot, `CompiledClipLike`
  if placement reads it, the mock's `compilePlaylist`/`segmentFades`, fact 116, CHANGELOG).
  Older LUNA builds will not have it: give the SDK a defined answer for `undefined`.
- **Read LUNA's code before modelling a command, then probe it live, then write the mock**
  from what LUNA did. Mirror what LUNA's GUI sends (e.g. a drag moves the clicked compiled
  piece, not the clip). Every behaviour the code depends on gets a fact.
- **Things measured that surprised**: renderings are per compiled piece, and made for
  sample-rate conversion too (a 44.1 kHz engine renders every 48 kHz file); after an edit a
  rendered piece's rendering is null for 30-60 ms (`needs_render` stays true); crossfade
  offsets are relative to the edit LUNA hears; `set_fade`'s shape applies only on creation;
  `delete_fades` looks only at segments overlapping its range; `heal_separation`'s stop is
  inclusive; `batch_fades` ignores `playlist_uid`; a raw `set` is not echoed to its writer
  and a multi-property `set` is refused; `w-resize`/`e-resize` are not drawn in LUNA's web view.
- **Probing a running LUNA**: check which build is on port 4718 (`ps`; it may be another
  tree's, without your LUNA change; a LUNA change needs the user to restart LUNA, never kill
  theirs). Ask before editing the user's session; use a scratch session (guard the script on
  its name) or a temporary track past the end of the session. Record track and source ids
  first; clean up in `finally`; wait for `session.sources` to stop growing (renderings arrive
  seconds later) before deleting only the ids that are new. Never delete what you cannot
  prove the probe made. Report what was left (undo entries always are).
- **Page tests** (`tests/unit/example-pages.test.ts`, harness `tests/helpers/page.ts`) run
  the example in jsdom on the mock. `page.draws.ops` records every canvas call with its args,
  `fillStyle` and `strokeStyle`, so a test can check direction, colour and paint order (e.g.
  everything after the last `clearRect` is the latest frame). Drive the canvas with
  `MouseEvent('pointerdown'|'pointermove'|'pointerup', { clientX, clientY })`; the canvas is
  unscaled in jsdom. Wait on the page's state (`canvas.dataset.edit`, a button enabled again,
  a table row's text), never a fixed delay: delays pass alone and fail in a full run. Turn
  snapping off for sub-grid drags. Make each new test fail once on the previous page
  (`git show HEAD:./examples/<page> > examples/<page>`, run it, put the fix back).
- **Recording what a page paints against a running LUNA**: load the page in jsdom with the
  real SDK (`dist/`, so `npm run build` first), and append the hook to the page's own script
  before evaluating it; separate `window.eval` calls do not share the script's top-level
  `let` bindings. Wrap `paint` to log the scene per frame (view start, each segment's bounds
  and audio). Build the hook with plain string concatenation, not a template literal inside a
  template literal. That is how the flicker causes (a dropped preview, a sliding view, a
  rendering gap) were found; guess less, measure first.

## Updating the minimum LUNA version

For a request like "update the luna builder sdk min luna version to 3.2". The value is the
`min_luna_version` new Add Ons declare. LUNA 3.1.1 and later refuse to open an Add On whose
value is newer than they are, and list it disabled in the Add Ons menu as "Requires LUNA x.y.z".
LUNA's side reads the value from each manifest, so a bump is a change to this repo only.

1. Write the version as `major.minor.patch` ("3.2" becomes `3.2.0`).
2. Find every declaration, from this directory:
   `git grep -n '"min_luna_version"' -- .`. That lists the templates
   (`templates/add-on-basic/manifest.json`, `templates/add-on-typescript/manifest.json`),
   `examples/manifest.json`,
   `examples/addon/manifest.json` and the manifest example in `docs/MANIFEST.md`. Set each to
   the new value. Also update `packages/add-ons/studiolo/src/manifest.json` (`add-ons` repo).
3. Leave these alone:
   - "LUNA releases before 3.1.1 do not check it" in the `docs/MANIFEST.md` field table, which
     names the first LUNA that checks the field, not the minimum.
   - "LUNA 1.9.0" in `docs/EVIDENCE.md` and `tests/unit/multi.test.ts`, which records where a
     capture came from.
   - `plugins/`, which is generated.
4. Add a `Changed` line to the top section of `CHANGELOG.md`: the new value, and that Add Ons
   scaffolded from now on will not open on an older LUNA. Add Ons already scaffolded keep the
   value in their own manifest.
5. `npm test`, then `npm run build && npm run check:plugin` so the plugin's copies of the
   templates and examples carry the new value.
6. Commit in the `sdk-luna` repo with the Jira prefix (ask for the ID), on the current branch
   (`packages/sdk/luna/CLAUDE.md`: no new branch unless asked).

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
- A new skill, example or template file is picked up automatically by the sync; a new
  consumer doc needs adding to `DOCS`, and a new *build artefact* to `BUILDS`, in
  `scripts/sync-plugin.mjs`.

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

## Repo and consumers

The SDK source lives at `packages/sdk/luna/builder/sdk` in the `sdk-luna` repo (it moved
there from the `uaudio-labs/luna-builder-sdk` GitHub repo); it is not a pac target. `npm ci`
builds `dist/` and `plugins/` through `prepare`. Two sibling tree targets consume it:
`sdk/luna/builder/installer` (`npm pack` of it) and `add-ons/studiolo`
(npm-installs it), so package.json `files` is the one list of what ships.
`design/PLATFORM.md` maps every piece of the platform.

The engine never goes into git: it is built and versioned separately (a release asset, later
a hosted URL). No manifest pins a compatible engine version yet.
