# Developing luna-builder-sdk

For work on the SDK itself, at `packages/sdk/luna/builder/sdk` in the `sdk-luna` repo. None of this
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

## Wasm engines by LUNA version (unreleased)

`serve` and `eject-wasm` can use the wasm engine a LUNA release ships instead of a local
build. Like the rest of the wasm support, this is hidden: it is not in `usage()` or the
shipped docs. Which engine a command uses is decided in `cli/engine.ts`; the remote and cache
are `cli/engine-remote.ts`.

**The remote** is any static host, named by `--engine-base <url>` or `UA_WASM_ENGINE_BASE`. Its
layout, file formats and rules are at the top of `cli/engine-remote.ts`, with `EngineIndex` and
`EngineFiles`.

**Using it:**

```sh
ua-builder serve --luna-version 3.2.0 --engine-base <url>
ua-builder eject-wasm --luna-version 3.2 --engine-base <url> --out <folder>
```

- The version is written `major.minor.patch`; `3.2` means `3.2.0`.
- `--luna-version` and `--engine` (a local build) can't be combined.
- The first use downloads the engine into a per-user cache, keyed by `engine_id`: on macOS that's
  `~/Library/Caches/ua-builder/engines`, and `UA_WASM_ENGINE_CACHE` overrides it. Every file's
  size and SHA-256 are checked, and the build's `build.json` `engine_id` too, before the folder
  is renamed into place. A failed download leaves nothing in the cache.
- Later uses need no network: the cache also remembers, per remote, which engine each version
  mapped to (`<cache>/luna-versions.json`). To force a fresh lookup and download, delete
  `<cache>/<engine_id>`.
- `serve` mounts the cached engine at `/__engine/`, so a page runs the engine an ejected build
  would carry.

**Publishing** is the hidden `publish-engine` command, which stands in for the release step
until there is a real remote and a decision on who publishes to it:

```sh
ua-builder publish-engine <engine stage> --luna-version 3.2.0 --to <remote folder>
```

It copies the same files `eject-wasm` would (the stage's test page and servers stay behind),
writes `files.json`, and adds the version to `index.json`.

**A fake remote to try it with:** publish the engine stage that
`pac build -nt -r -t wasm hbsystem/wasm_engine` writes
(`hbsystem/wasm_engine/output/<platform>/Release/wasm/UAWasmEngine`) into a scratch folder,
then serve that folder:

```sh
node dist/cli.js publish-engine <stage> --luna-version 3.2.0 --to /tmp/engine-remote
python3 -m http.server 8799 --bind 127.0.0.1 --directory /tmp/engine-remote
cd <add-on> && UA_WASM_ENGINE_CACHE=/tmp/engine-cache \
  node <sdk>/dist/cli.js serve --luna-version 3.2.0 --engine-base http://127.0.0.1:8799
```

Open `http://localhost:8790/?engine=wasm`. An Add On that vendors the SDK must carry a bundle
with the engine loader: if its `vendor/luna.global.js` predates it, the page asks for
`devicedwasm.js` and fails to load. Refresh the copy first (`ua-builder pack` does, or copy
`dist/luna.global.js` in).

Still to decide:
- where the remote lives and who writes it;
- which LUNA version `eject-wasm` targets when none is given (`min_luna_version` is a minimum);
- whether an ejected Add On should carry a reference to the engine instead of a 25 MB copy.

## Self-test against a LUNA build (QA)

`ua-builder selftest` checks that the SDK does what it claims against a running LUNA: each new
API from HBH-36711 (and the ones before it) is exercised and the result compared with the fact
in `docs/EVIDENCE.md` it rests on. It is hidden (not in `usage()` or the shipped docs) and
ships with the SDK, so it needs no checkout: the installed SDK has it.

**Prerequisites**
- The LUNA build to verify, running, with **no session open**. The self-test refuses to start
  otherwise: it makes its own session ("SDK self-test <date>"), works only in it, and closes it.
  Its package stays in LUNA's session folder; delete it afterwards.
- The LUNA Builder SDK, installed with the installer (it puts the SDK in
  `~/Library/Application Support/LUNA Builder SDK` on macOS, with Node.js 22 or later).
- For the full set: an audio interface with inputs (inputs, input analysis, tracks from
  inputs), a track preset installed (presets), and an AU effect (inserts). Missing ones skip
  with the reason, they don't fail.

**Run**

```sh
node "$HOME/Library/Application Support/LUNA Builder SDK/dist/cli.js" selftest \
  --junit ~/Desktop/sdk-selftest.xml
```

- `--list` shows the checks without running them; `--only tracks,session.lyrics` runs some
  (an area or a check id).
- `--host` / `--port` reach a LUNA elsewhere (default `localhost:4718`).
- `UA_SELFTEST_UI=1` also runs the check that opens a plug-in window in LUNA.

It prints `PASS`, `FAIL` or `SKIP` per check with the facts it verifies, then a total. Exit code
0 when nothing failed, 1 when a check failed, 2 when it could not start. The JUnit file has one
suite per area, with LUNA's name and version as properties.

**Reporting:** attach the JUnit file, the console output and LUNA's version to the ticket. A
`FAIL` names the check and what differed. A `SKIP` is not a problem unless the machine had what
it says is missing.

**For SDK developers:** the checks are plain functions in `cli/selftest/checks/`, run by
`cli/selftest/runner.ts`. `UA_LIVE=1 npm run test:live -- selftest` runs the same checks
through vitest (`tests/live/selftest.test.ts`; `UA_SELFTEST_ONLY` narrows them), and
`tests/unit/selftest.test.ts` runs every one against `Luna.MockEngine`, so a check that breaks
shows up in `npm test`. When a check passes on a LUNA build, the facts it lists can be marked
`verified` with that build and date. Add a check with every new engine-facing API.

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

## Commit

This folder is the SDK source, inside the `sdk-luna` repo next to its consumers; it is not a
pac target. Commit with the rest of `sdk-luna` after `npm run check` passes.

`dist/` and `plugins/` are git-ignored; `npm ci` regenerates them through the `prepare`
script. Two tree targets consume this folder: `sdk/luna/builder/installer` (`npm ci` +
`npm pack` of it, zipped with setup scripts) and `add-ons/studiolo`
(npm-installs it, so run `npm ci` here first after a pull).

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
skills/       create-add-on, add-feature, test-add-on, debug-connection, verify-add-on
plugin/       the agent plugin's hand-written shell; catalogs in .claude-plugin/ and .agents/plugins/
plugins/      generated, git-ignored: ua-luna-builder, the shell plus copies of everything it carries
scripts/      sync-plugin.mjs (generate the plugin), check-plugin.mjs (prove it is current)
src/engine/   wasm engine loader and lifecycle (Luna.bootWasmEngine, Luna.WasmEngine)
tests/        unit/ (always), live/ (UA_LIVE=1), engine/ (real wasm engine in headless Chrome)
```

The protocol reference is `packages/hbsystem/networking/docs/` in the tree.
