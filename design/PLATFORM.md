# LUNA Builder platform map

Status: 2026-10-09, SDK 0.1.0-alpha.9. Internal, not shipped. Every piece of the builder
platform, where it lives, and how the pieces connect. Architecture and decisions are in
`DESIGN.md`; this page is the map, not the rationale.

## The whole picture

```
 AUTHORING                         SDK  (@uaudio/luna-builder-sdk)                 ENGINES
 ─────────                         ─────────────────────────────                 ───────
 coding agent ── skills/ ──┐
 (Claude Code, Codex)      │       Add On page (index.html + main.js)
   ua-luna-builder plugin  │                 │
                           ├─► ua-builder    ▼
 developer ────────────────┘    CLI      Luna.connect() ─► Luna.Client ─► Luna.Store ─► Luna.Port
                                 │         domain model:                       │
   new / serve / test /          │         sessions, tracks, transport,        ├─ WebSocketPort ─► deviced :4718
   probe / tree / doctor         │         controls, clips, gui, ...           │   (native LUNA)    (LUNA.app)
                                 │                                             ├─ WasmPort ──────► devicedwasm
                                 │                                             │   ccall/onUpdate   (in-page, worker)
                                 │                                             └─ MockPort ──────► Luna.MockEngine
                                 │                                                 (in-memory)      (tests, ?engine=mock)
 DELIVERY                        │
 ────────                        ▼
   install ─► LUNA Add Ons folder (symlink on macOS, copy on Windows) ─► Add Ons menu
   pack ────► <name>.lunaaddon (a zip) ─► opened in LUNA ─► plain folder in the Add Ons folder
   serve ───► plain browser page with COOP/COEP + /__engine/ mount ─► wasm engine
```

## 1. Where an Add On runs

One page, three hosts. `Luna.connect()` picks the port; the page code does not change.

| Host | How it is opened | Port | Engine | Notes |
|---|---|---|---|---|
| Inside LUNA | Add Ons menu → `target` `window`, `browser` or `app` | `WebSocketPort` | `deviced` on 4718, port passed as `?port=` | macOS serves from a custom scheme; Windows loads `file://`, so the IIFE bundle is required |
| Browser, LUNA running | `ua-builder serve`, open localhost | `WebSocketPort` | `deviced` on `ws://localhost:4718` | `serve --luna` proxies to LUNA for another machine |
| Browser, no LUNA | `?engine=wasm` or `connect({ engine: 'wasm' })` | `WasmPort` | `devicedwasm` in-page | Needs COOP/COEP, same-origin engine (fact 38), a click for audio; no `/gui`, no session at boot |
| Browser, demo/test | `?engine=mock` or `connect({ engine: 'mock' })` | `MockPort` | `Luna.MockEngine` | Demo session or `globalThis.LunaMockSetup` fixture |

Resolution order in `src/client/connect.ts`: `port_` → mock → wasm → explicit
`url`/`host`/`port` → `?host=`/`?port=` → `ws://localhost:4718`.

Native bridge (LUNA webview only): `window.lunaAPI.setAcceptsFileDrops` and
`window.lunaHost` drag-and-drop callbacks (paths, fact 102), wrapped by `Luna.onPathDrop`. Everything else goes over the engine
connection, including LUNA UI actions through `luna.gui` (`/gui/...`).

## 2. Inside the SDK

| Layer | Source | Public surface | Rule |
|---|---|---|---|
| Wire | `src/wire/` | `Luna.Port`, `WebSocketPort`, `WasmPort`, `MockPort`/`MockEngine`, codec, multi-update decoder, `Luna.Error` family | Normalises everything to `Event { path, data, operation? }`; transport quirks stay here (facts 6, 10, 13, 35) |
| Wasm loader | `src/engine/loader.ts` | `Luna.bootWasmEngine`, `Luna.WasmEngine` (`luna.wasm`) | Injects `devicedwasm.js`, waits for `onState('running')` |
| Store | `src/store/` | `Luna.Prop`, `Cell`, `List`, `Store` | Versioned cells, refcounted subscriptions, optimistic writes with rollback, reload on reconnect |
| Client | `src/client/` | `Luna.connect`, `Luna.Client`, host detection | `luna.raw` is the only raw-path escape hatch |
| Model | `src/model/` | Everything else in the namespace | One idiom: `.value` / `.onChange` / `.set` |
| Barrel | `src/luna.ts` | `Luna.*` | Every export goes here, never `src/index.ts` |

`Luna.Client` roots:

```
luna
├── sessions ─► Session ─┬─ transport, musical (tempo, meters, keys, chords), markers, context
│                        ├─ tracks / buses ─► Channel ─► outputs (main, sends, cues) ─► controls, meters
│                        │                            ├─ controls ─► Control ─► automation lane
│                        │                            └─ effects ─► Effect (plugin slot, params)
│                        └─ playlists ─► Clip ─► MidiClip, AudioSource ─► Waveforms
├── plugins, presets      catalog and preset queries
├── workspace             session packages, uploads, imports
├── drivers, devices      audio devices and inputs (recording)
├── preferences
├── renders, jobs         bounce/export and background work
├── gui                   LUNA's UI: pages, windows, Add Ons (LUNA only)
├── status, store, raw    connection status, mirror, Port
└── wasm / mock           engine handle for that host
```

DOM helpers sit on top of the model: `bindRange`, `bindDrag`, `bindGesture` (touch, fact
78), `bindClock`, `bindShortcuts` (facts 79-81), `Bindings` for rebuilt DOM.

## 3. Builds and what ships

`npm run build` (tsup, then `scripts/sync-plugin.mjs`):

| Output | Consumer |
|---|---|
| `dist/index.{js,cjs,d.ts}`, `dist/wire/` | Module import: `import { Luna } from '@uaudio/luna-builder-sdk'` |
| `dist/luna.global.js` | Script tag (`globalThis.Luna`); vendored into Add Ons as `vendor/luna.global.js` |
| `dist/cli.js` | `npx ua-builder` (package `bin`) |
| `plugins/ua-luna-builder/` | Agent plugin: shell from `plugin/` plus copies of builds, skills, template, examples, docs. Generated, git-ignored; `npm run check:plugin` gates it |

package.json `files` is the one list of what ships: `dist`, `docs`, `skills`, `templates`,
`examples`, `plugins`, the two marketplace catalogs, `CHANGELOG.md`, `RELEASE_NOTES.md`,
`LICENSE`, `NOTICE`. `design/`, `DEVELOPING.md`, `CLAUDE.md`, `tests/` do not ship.

Distribution channels:

| Channel | What it carries | Who uses it |
|---|---|---|
| `packages/sdk/luna/builder/sdk` (repo `sdk-luna`) | Full SDK source; `npm ci` builds it via `prepare` | SDK developers, the tree targets below |
| Agent plugin marketplace | `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json` → `plugins/ua-luna-builder` | Claude Code and Codex users |
| LUNA Add On Builder installer zip | `npm pack` of the SDK + double-click setup scripts that install the plugin | Non-programmers |
| `.lunaaddon` file | One Add On zipped (its folder at the top), made by `ua-builder pack` or LUNA's Share... | Add On end users |

The wasm engine is **not** in any of these. It is built separately and versioned separately;
the hosted URL does not exist yet, so `engineUrl` defaults to `/__engine/`, which
`ua-builder serve --engine <dir>` mounts.

## 4. Developer toolchain

`ua-builder` (`cli/`), in the order an Add On meets it:

| Command | Does |
|---|---|
| `new <name>` | Copies `templates/add-on-basic/` (manifest, page, vendored bundle, tests, agent notes) |
| `serve [dir]` | Static server with COOP/COEP; mounts `/` (Add On), `/__builder/` (SDK), `/__engine/` (wasm build); `--luna` proxies to LUNA |
| `test [dir]` | vitest; `--live` adds the LUNA lane |
| `probe <url>` | Headless Chrome: wait for a connected, settled `Luna` client, eval an expression, optional screenshot or `--mock` |
| `tree [path]` | Shape of LUNA's tree (properties, children, commands); `--out` snapshots a build, as in `docs/tree/` |
| `doctor` | Node/npm versions, whether LUNA is reachable, creates the Add Ons folder |
| `install [dir]` | Validates the manifest, links (macOS) or copies (Windows) into the Add Ons folder; LUNA rescans |
| `pack [dir]` | Validates, refreshes the vendored bundle, zips the folder into `<name>.lunaaddon` |

Add Ons folder: macOS `/Library/Application Support/Universal Audio/LUNA/Add Ons`, Windows
`%LOCALAPPDATA%\Universal Audio\LUNA\Add Ons`. Manifest rules are in `docs/MANIFEST.md`.

## 5. Testing lanes

| Lane | Command | Runs against | Proves |
|---|---|---|---|
| Unit | `npm test` | `Luna.MockEngine`, `FakeSocket` | Ports, Store, model, CLI, doc examples, scaffold. Must pass before a commit |
| Live | `UA_LIVE=1 npm run test:live` | Native LUNA on 4718 (Release `/Applications/LUNA.app` preferred) | The mock's facts hold on the real daemon; tests restore what they touch |
| Engine | `npm run test:engine` | Real `devicedwasm` in headless Chrome over CDP (`UA_WASM_ENGINE` or sibling `hbsystem/wasm_engine/dist/Release`) | `WasmPort` normalisation matches native |

`docs/EVIDENCE.md` ties them together: each numbered fact is implemented by the mock, cited
in code, and re-checked by the live or engine lane. Add On authors get the same lanes
through the scaffold and the `test-add-on` / `verify-add-on` skills.

## 6. Docs and the agent surface

| Piece | Role |
|---|---|
| `docs/QUICKSTART.md` | Entry point, under 300 lines, section-anchored |
| `docs/RECIPES.md` | Add On ideas and the SDK each one leans on |
| `docs/MANIFEST.md` | `manifest.json`, targets, Add Ons folder, how LUNA loads a page |
| `docs/PROTOCOL.md` | UANet verbs and paths, for `luna.raw` only |
| `docs/EVIDENCE.md` | Numbered measured engine facts |
| `docs/tree/*.json` | Tree shape snapshot for one LUNA build |
| `docs/api/` | Generated by TypeDoc from JSDoc; never hand-edited |
| `docs/llms.txt` | Agent index and rules of thumb |
| `skills/` (6) | `create-add-on`, `add-feature`, `test-add-on`, `debug-connection`, `port-to-wasm`, `verify-add-on`; symlinked into `.agents/skills/` for Codex |
| SDK feedback line | Every skill, the scaffold README and `llms.txt` ask agents to end with `LUNA BUILDER SDK FEEDBACK: <version>` and an SDK-update prompt |

## 7. Repos and neighbours

| Piece | Location | Relationship |
|---|---|---|
| SDK source (source of truth) | `packages/sdk/luna/builder/sdk` (repo `sdk-luna`; moved from GitHub `uaudio-labs/luna-builder-sdk` 2026-10-09) | Edited by hand. No pac target since 2026-09-28 |
| Installer | `packages/sdk/luna/builder/installer` (repo `sdk-luna`, pac target) | `npm ci` + `npm pack` of `../sdk`, zipped with setup scripts |
| Example Add On: StudioLo | `packages/add-ons/studiolo` (pac target `add-ons/studiolo`, `add-ons` repo) | npm-installs the SDK from `../../../sdk/luna/builder/sdk`; vitest, then `ua-builder pack` |
| Legacy LUNA SDK | `packages/sdk/luna/LUNA SDK` (`UANet` global) | Ideas only (reconnect, manifest spec); not a dependency |
| LUNA GUI client lib | `packages/hbgui/next_gen/shared/uanet-clients` | Source of the ported domain objects; kept, no forced migration |
| Native engine | `deviced` in `hbsystem`, inside LUNA.app | The thing `WebSocketPort` talks to |
| Wasm engine | `packages/hbsystem/wasm_engine` | Builds `devicedwasm.{js,wasm}` (about 32 MB stripped); bridge is `WasmD_Bridge` |
| Protocol reference | `packages/hbsystem/networking/docs/` | UANet JSON dialect the wire layer implements |
| Host side of Add Ons | LUNA app | Reads the Add Ons folder, builds the Add Ons menu, appends `?port=`, installs a `.lunaaddon` (unzips it into the Add Ons folder) |
| External reference | `ua-client-sdk` (Apache-2.0) | Ideas only; no code copied |

## 8. Gaps and stale spots

- **Hosted wasm engine**: no URL or owner yet. Pages must serve or reverse-proxy the engine
  same-origin (fact 38).
- **Engine/SDK compatibility pin**: the planned manifest that pins a compatible engine
  version is not in place.
- **No WebSocket auth**: any page in the Add On webview can control LUNA. Documented, not
  solved.
- **Batched wasm updates**: about 6 000 single updates per new session; a batched
  `WasmD_Bridge` form is a separate hbsystem request.
