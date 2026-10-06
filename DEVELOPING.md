# Developing luna-builder-sdk

For work on the SDK itself, in this repo (`uaudio/luna-builder-sdk` on GitHub). None of this
ships: package.json "files" lists what does, and `README.md` is the consumer-facing page.
Architecture and recorded decisions are in `design/DESIGN.md`, phases and status in
`design/PLAN.md`, and `design/PLATFORM.md` maps every piece of the platform.

## Develop the SDK

```sh
npm install                 # dev dependencies only; the SDK itself has none
npm test                    # unit lane, no LUNA needed
npm run build               # dist/index.{js,cjs}, dist/wire/, dist/luna.global.js, dist/cli.js, plugins/
npm run docs:api            # regenerate docs/api with TypeDoc
UA_LIVE=1 npm run test:live # against LUNA on ws://localhost:4718
npm run test:engine         # against a wasm engine build in headless Chrome (UA_WASM_ENGINE=<dir>)
```

## The agent plugin

### Work in this checkout with Codex

Open `luna-builder-sdk` as the Codex project, or launch `codex` from this directory.
`AGENTS.md` points to the shared guidance in `CLAUDE.md`; `.agents/skills/` contains
relative symlinks to the six original skill folders. No plugin installation is
needed for checkout work. Start a new task after changing project instructions.
Opening the enclosing HB tree does not automatically discover this nested folder's
skills; use the SDK folder as the task's working directory.

For example, ask: "Use the create-add-on skill to scaffold a LUNA Add On with a
bar/beat counter." Build first (`npm run build`) so the local CLI is available.
For Add On projects elsewhere, install the plugin as described in the README.
Use either the checkout skills or the installed plugin to avoid duplicate skill
entries. When adding a skill, also add its relative symlink in `.agents/skills/`.

### Generate and verify the plugin

`plugins/ua-luna-builder/` is generated and git-ignored, like `dist/`. `npm run build` writes
it: the hand-written shell from `plugin/` (the two `plugin.json` files, `package.json`,
`README.md`, `NOTICE`, `scripts/`), plus copies of the builds, skills, template, examples and
consumer docs. Edit `plugin/` and the originals — `skills/`, `examples/`, `templates/`,
`docs/`, `src/`, `cli/` — then:

```sh
npm run build          # dist/ and the generated plugin
npm run check:plugin   # fail if anything generated is stale
```

`npm run check:plugin` also checks one version across the manifests and catalogs, that the
skills carry front matter and no provider-specific paths, that no example reaches outside
the plugin, and that the plugin still scaffolds an Add On when relocated. It runs as part
of `npm run check`.

## Publish to GitHub

This repo is the SDK source; there is no pac target and no mirror step. In an HB tree the
checkout lives at `<tree>/github-repos/luna-builder-sdk`. Commit and push by hand after
`npm run check` passes:

```sh
git status && git diff
git add -A && git commit -m "<JIRA-ID>: <change>"
git push
```

`dist/` and `plugins/` are git-ignored; `npm ci` regenerates them in any checkout through
the `prepare` script. Two tree targets consume this checkout, so rebuild it (`npm ci`) after
a pull before building them: `sdk/luna/builder-installer` (`npm pack` of it, zipped with
setup scripts) and `sdk/luna/builder-examples/studiolo` (npm-installs it).

## Source layout

```
src/wire/     Luna.Port, Luna.WebSocketPort, Luna.MockEngine/MockPort, codec, multi-update decoder, errors
src/store/    Luna.Prop, Luna.Cell, Luna.Store (path-keyed mirror, optimistic writes)
src/model/    Luna.Sessions, Session, Transport, Track, Bus, Control, Meter, Effect, Plugins, Playlist, Clip, AudioSource,
              Musical, Markers, Context, Automation, Workspace, Gui, Drivers, Preferences, Renders, Jobs
src/client/   Luna.connect, Luna.Client, host detection
examples/     the ua-luna plugin's example set on Luna.*: addon (master mute), mixer, inserts,
              ruler, sends, tracks (raw wire), plus check-*.mjs probes
cli/          ua-builder: new, serve, test, probe, install, pack, doctor, tree
templates/    add-on-basic scaffold
docs/         consumer docs: QUICKSTART.md, RECIPES.md, MANIFEST.md, PROTOCOL.md, EVIDENCE.md, llms.txt, api/
design/       DESIGN.md, PLAN.md, PLATFORM.md (not shipped)
skills/       create-add-on, add-feature, test-add-on, debug-connection, port-to-wasm, verify-add-on
plugin/       the agent plugin's hand-written shell; catalogs in .claude-plugin/ and .agents/plugins/
plugins/      generated, git-ignored: ua-luna-builder, the shell plus copies of everything it carries
scripts/      sync-plugin.mjs (generate the plugin), check-plugin.mjs (prove it is current)
src/engine/   wasm engine loader and lifecycle (Luna.bootWasmEngine, Luna.WasmEngine)
tests/        unit/ (always), live/ (UA_LIVE=1), engine/ (real wasm engine in headless Chrome)
```

The protocol reference is `packages/hbsystem/networking/docs/` in the tree.
