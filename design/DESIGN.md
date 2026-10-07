# LUNA Builder SDK — Design

Status: draft, 2026-09-16. Decisions recorded here were made with the SDK owner;
open items are listed at the end.

## Purpose

`@uaudio/luna-builder-sdk` is a TypeScript SDK for building LUNA Add Ons that run in
two places with no code change:

1. Inside LUNA, as a web page in LUNA's webview, talking to the native engine
   over a WebSocket (UANet protocol, port passed on the page URL).
2. In an ordinary browser page, driving the WebAssembly build of the LUNA engine
   (`hbsystem/wasm_engine`) in-process.

It is used internally and by third parties, and it is designed so that a coding
agent can build an Add On with a small amount of context.

Goals, in priority order:

- Easily create new Add Ons.
- Switch an Add On between native LUNA and the wasm engine.
- Support AI-assisted development and keep the tokens needed to develop low.
- Ship testing methods with the SDK.

## Relationship to existing code

| Existing code | Role in builder |
|---|---|
| `sdk/luna/LUNA SDK` (plain JS, `UANet` global) | Ideas: reconnect loop, static Broadcaster, manifest spec, examples. Examples are re-implemented on builder. |
| `hbgui/next_gen/shared/uanet-clients` | Source of the domain feature objects (`uaservices/` only). Copied and rewritten onto builder's store and property idiom. The `@uaudio/uanet-core` binding layer is **not** used. uanet-clients itself is kept and continues to serve the LUNA GUI; there is no forced migration. |
| `/Users/dtissier/code/ua-client-sdk` (external, Apache-2.0) | **Reference only.** No code is copied. Ideas borrowed: `WirePort` seam, mock that reproduces daemon traps, version-stamped cells, optimistic writes with rollback, an evidence file of measured daemon facts, JSDoc examples everywhere. |
| `hbsystem/wasm_engine` | The wasm engine builder drives. Its page-facing C API is the second transport. |
| `hbsystem/networking/docs/*.md` | The UANet protocol builder implements (JSON dialect only). |

## Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Reactive idiom | Property objects: `track.name.value`, `track.name.onChange(cb)`, `await track.name.set(v)`. No `getX()` / `onXChange()` pairs. |
| 2 | Port scope | LUNA's engine (`deviced`) only. `uaconnect` and `uaassistant` are out of scope for v1. |
| 3 | ua-client-sdk | Reference only; wire layer written fresh. |
| 4 | uanet-clients | Kept indefinitely. builder is a separate SDK. |
| 5 | Naming | Wire layer is `Luna.Port` (`Luna.WebSocketPort`, `Luna.WasmPort`, `Luna.MockPort`). `Luna.Transport` is the DAW transport. Package `@uaudio/luna-builder-sdk`, script-tag global `Luna`. |
| 6 | Tests | Standalone npm package using vitest. Not a pac/Amber target. vitest (and Playwright for the engine lane) are new packages and must be raised in `hb-platform` before they land. |
| 7 | Wasm delivery | The engine is not part of the SDK package: it is built and versioned separately. `Luna.connect({ engine: 'wasm' })` loads it from `engineUrl`, default `/__engine/` (the `ua-builder serve --engine` mount), and accepts an override. A UA-hosted copy with COOP/COEP is still planned, but it has to be served same-origin with the page (fact 38), so it cannot be the default. (Revised from "defaults to a hosted URL".) |
| 8 | Jira | No issue yet; commits are unprefixed until one exists. |
| 9 | Manifest | Add `version`, `sdk_version`, `min_luna_version`, `engines` to `manifest.json` (v1). |
| 10 | Dev tooling | `docs/EVIDENCE.md` records measured daemon behaviours. A `serve` command hosts pages with COOP/COEP, with an optional proxy to native LUNA. |
| 11 | Not in v1 | Capability detection object. The `WasmD_Bridge` change (see Risks) is tracked as a separate hbsystem request, not a builder task. |
| 12 | Streaming | No audio or MIDI streaming. The SDK edits the session; it carries no live audio or MIDI. An Add On receives live MIDI with Web MIDI, and sending MIDI is the Add On's own business. |

## The Luna namespace

The package root re-exports one namespace:

```ts
// src/index.ts
export * as Luna from './luna';
```

`import { Luna } from '@uaudio/luna-builder-sdk'` gives both values and types, so
`Luna.Session` is usable as a type without a TypeScript `namespace` block. A tsup
IIFE build exposes `globalThis.Luna` for script-tag Add Ons; this is required
because Windows loads Add Ons from `file://`, where module scripts are blocked.

Naming rule: the `UAS` prefix from uanet-clients is dropped and the class lives in
the namespace. `UASSessions` becomes `Luna.Sessions`, `UASTrack` becomes
`Luna.Track`, `UASControl` becomes `Luna.Control`.

## Architecture

Three layers. Each is usable on its own and each has its own tests.

```
Luna.connect()  ──►  Luna.Client  ──►  Luna.Store  ──►  Luna.Port
                     │                              ├── Luna.WebSocketPort  (native LUNA)
                     │                              ├── Luna.WasmPort       (Emscripten module in-process)
                     └── domain objects             └── Luna.MockPort       (tests, no engine)
                         Luna.Sessions, Luna.Session, Luna.Track, Luna.Bus,
                         Luna.Control, Luna.Playlist, Luna.Clip, Luna.Transport, ...
```

### Layer 1: `Luna.Port`

The transport seam. It speaks paths and verbs and holds no model state.

```ts
interface Port {
  readonly connected: boolean;
  get(path: string, opts?: GetOptions): Promise<Node>;
  set(path: string, data: unknown): Promise<void>;
  post(path: string, data?: unknown): Promise<unknown>;
  subscribe(path: string, handler: (e: Event) => void, opts?: { recursive?: boolean }): Unsubscribe;
  onStatus(listener: (s: PortStatus) => void): Unsubscribe;  // connecting | connected | disconnected | error
  close(): Promise<void>;
}

type Event = { path: string; data: unknown; operation?: 'added' | 'removed' };
```

Every port normalises what the engine gives it into the same `Event` stream:
a `/value` suffix is stripped, multi-updates are expanded, and `added`/`removed`
are surfaced as `operation`. The Store and everything above it never see
transport differences.

**`Luna.WebSocketPort`** implements the UANet JSON dialect over text frames as
documented in `hbsystem/networking/docs/`:

- Requests are `{ cmd, url, data }`. Correlation uses a non-numeric id in the
  query string (LUNA retypes numeric strings) and matches it in the echoed
  `parameters`. Messages without our id are pushes.
- On open: `set /status/timeout_ms?ignore_response=1 0` is **not** used;
  instead the port reads `/status/timeout_ms` and pings `/ping` at half that
  interval, so a page that goes idle is still disconnected by the server if it
  truly dies.
- Decodes plain and packed (`string`/`name`/`parent`/`path`) multi-updates.
- Per-request timeout, exponential reconnect backoff, resubscribe on reconnect,
  and a `disconnected` status so the Store can reload what it mirrors.
- Default `ws://localhost:4718`; `?host=` and `?port=` on the page URL win
  because that is how LUNA tells an Add On where the engine is.
- JSON only. UBJSON is not supported in v1 because the wasm side is text only.

**`Luna.WasmPort`** wraps an instantiated `devicedwasm` module:

- Out: `Module.ccall('wasmd_send_export', 'number', ['number','string','string'], [method, pathWithQuery, bodyJSON])`
  returns a request id. Method enum: 0 GET, 1 SET, 2 POST, 3 SUBSCRIBE, 4 UNSUBSCRIBE.
- In: installs `globalThis.WasmDeviced = { onReply(id, error, json), onUpdate(path, json), onState(state, detail) }`.
  `onReply` resolves the pending request by id. `onUpdate` becomes an `Event`.
  `onState` drives port status (`running` is `connected`).
- The engine runs in a worker (`PROXY_TO_PTHREAD`); all `ccall`s run on the
  main thread. There is no reconnect: the engine boots once per page.
- Same paths, payloads and reply shapes as native LUNA, because the wasm server
  is a real `UASrv_Server`.

**`Luna.MockPort`** is an in-memory tree with the same interface. It reproduces the
daemon behaviours recorded in `EVIDENCE.md` (missing path returns `{}` with no
error, `set` on a node fails with `uasrv.invalid_property`, writer does not see
its own `value` echo, pushes land on a later macrotask, etc.) and offers
fixture builders (`MockEngine.session({ tracks, buses, ... })`), fault
injection, and a `settled()` await.

### Layer 2: `Luna.Store` and `Luna.Client`

`Luna.Store` is a path-keyed mirror of the engine tree:

- One cell per `<node>/<property>`, each with a version stamp so a single reply
  can mark many cells equally fresh and stale data can be arbitrated.
- Refcounted subscriptions keyed by `(path, recursive)`; two views cost one
  wire subscription.
- `load(path, opts)` fills cells from a `get`; `watch(path)` subscribes.
- Optimistic `set` with rollback if the engine rejects it, unless a newer write
  or observation owns the cell.
- On `connected` after a drop, reloads every watched node, since pushes during
  the outage are gone.

`Luna.Client` is what `Luna.connect()` returns:

```ts
const luna = await Luna.connect();                       // inside LUNA: ?port= present → WebSocketPort
const luna = await Luna.connect({ engine: 'wasm' });     // browser: boots the wasm engine from engineUrl
const luna = await Luna.connect({ host, port });         // explicit WebSocket target
const luna = await Luna.connect({ port_: mockPort });    // tests

luna.raw          // the Port. The only escape hatch; JSDoc says "prefer a typed method".
luna.engine       // wasm only: resumeAudio(), requestInput(), persistence, health
luna.status       // connection status + onChange
luna.sessions     // Luna.Sessions ... the domain objects
await luna.close();
```

Auto-detection order: explicit options, then `?port=`/`?host=` on the page URL
(inside LUNA), then `engine: 'wasm'` if requested. A browser page with neither
throws `Luna.NotRunning` with an actionable message.

### Layer 3: domain objects

Ported from `uanet-clients/src/uaservices`, rewritten to the property idiom.
What survives and how:

| Shape in uanet-clients | Port strategy |
|---|---|
| Stateful mirrors (`UASSession`, `UASTrack`, `UASBus`, `UASControl`, `UASPlaylist`, `UASClip`, `UASTransport`) | Keep class structure, path parsers and `handleChange` routers. Replace each `registerProperty` with a Store-backed `Luna.Prop<T>` exposed as a public field. Remove `getX`/`onXChange`/`updateXFromData`. |
| Thin command wrappers (`editing/*`, `commands/*`, `automation/editor`, `midi/editor`, `gui/*`) | Keep the typed payload builders; route through `client.raw.post`. `post-command.ts` becomes one helper. |
| Pure logic (`utils/order`, `utils/math`, `folders/folder-tree`, `defs/*`, `meters/meter`, `console-tracking-rule`, `midi/defs`, `automation/defs`) | Copy unchanged. |
| Binding plumbing (`configs.ts`, `uanet-client-base.ts`, `client-property-internal.ts`, `*HACK`, `bindingAccess`) | Not ported. |

Conventions applied during the port (from `uanet-clients/docs/api-codeability-review.md`):

- Collections are arrays or `Luna.List<T>` (`items`, `byId`, `onChange`), never `Map`.
- Booleans are `isX` props, everything else nouns. Managers are nouns.
- Touch (fact 78): a discrete edit is a one-shot `set`, which brackets itself with
  `set_touch`; a continuous edit is `control.begin()` / `control.end()` around many `set`s,
  and `Luna.bindGesture(element, controls)` pairs them with pointer down and every way a drag
  ends. Automatable controls and switches are bracketed; a non-automatable continuous
  control is not. Transactions: `session.transaction(name, fn)`.
- Keyboard (facts 79-81): `Luna.bindShortcuts(luna)` is the fallback behind an Add On's own
  keys. It runs LUNA's default undo, redo, toggle-playback and toggle-record bindings through
  the model (`session.undo()`, `transport.toggle()`, `transport.toggleRecord()`), not
  through LUNA's rack command ids, so it works the same on the wasm engine. A key the page
  claims with `preventDefault()` or types into a text field is left alone.
- Every public class and method has a JSDoc `@example` that is copied into
  `tests/doc-examples.ts` so `tsc` fails when a documented signature drifts.
- Internals are `@internal` and stripped from `.d.ts`.
- Units are passed through verbatim: musical positions are ticks
  (`Luna.TICKS_PER_BEAT` = 96e9), source-file offsets are nanoseconds, lyrics are
  seconds. The SDK does no unit conversion.

## Add On packaging and host integration

`manifest.json` keeps the existing spec (`docs/MANIFEST.md`: `id`, `title`,
`width`, `height`, exactly one of `html`/`url`, optional `target`, `icon`,
`local_content_offset`) and adds:

| Field | Meaning |
|---|---|
| `version` | The Add On's own semver. |
| `sdk_version` | The `@uaudio/luna-builder-sdk` version it was built against. |
| `min_luna_version` | Lowest LUNA that hosts it. |
| `engines` | `["luna"]`, `["wasm"]`, or both. Declares what the page supports. |

Host detection stays as today: `?port=` on the URL means inside LUNA;
`window.lunaAPI` / `window.lunaHost` are the only native bridge (native file drops, fact 102),
wrapped by `Luna.onPathDrop` / `Luna.canDropPaths`.

Files reach an Add On by two routes that are never mixed (docs/FILES.md, decided for
NEXT-2346). The **File route** is the web's: `<input type="file">` and HTML drops give `File`s,
and `session.uploadFile` copies the bytes into the session; it works on every engine. The
**path route** is a LUNA optimization: `luna.gui.chooseFiles` and `Luna.onPathDrop` give
engine-readable paths that the page cannot read, and only feed `session.importPath`
(`local_copy`) or `session.importFile` (LUNA's import). There is deliberately no way to read a
picked path from the page (no `chooseFiles({ read })`, no picked-file URL scheme). `/gui` is
absent off LUNA (fact 103): `luna.gui.available()` says so, and `luna.gui` commands and
`importFile` reject with `Unsupported` instead of timing out.

Security note for third-party docs: the LUNA WebSocket has no authentication and
a manifest `url` entry receives the port. Any page loaded in the Add On webview
can control LUNA.

## Running on the wasm engine

`Luna.connect({ engine: 'wasm' })` (or `?engine=wasm` on the page URL):

1. Injects `<script src="<engineUrl>devicedwasm.js">`. `engineUrl` defaults to `/__engine/`,
   the mount `ua-builder serve --engine <dir>` provides. The engine must be same-origin with
   the page because its pthread workers load from its own URL, so a hosted engine has to be
   reverse-proxied onto the page's host (fact 38).
2. `await createDevicedModule({ print, printErr, onAbort, locateFile })`.
   Instantiating is the boot; the page never pumps.
3. Installs `WasmDeviced` hooks and waits for `onState('running')`.
4. Returns a `Luna.Client` over a `Luna.WasmPort`, with `luna.engine` for audio
   resume (autoplay policy needs a click), microphone input, OPFS persistence,
   and health counters.

Requirements the SDK documents and the `serve` command satisfies: the page must
be served with `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp` (SharedArrayBuffer for pthreads),
over HTTPS when not on localhost. The stripped Release engine is about 32 MB.

Engine limitations that Add Ons must tolerate on wasm: no auth or licensing,
no ARA, analysis, providers, assistant or video, no `/gui`; synthetic 2-in/2-out audio
device; boot once per page; MEMFS mirrored to OPFS; no session until `new_session`.

Measured differences the wire layer normalises (facts 6, 10, 13, 35): the bridge echoes the
writer's own `set`; a missing path is `uasrv.invalid_object` rather than `{}`; an added node
arrives with its properties and a removed node as `null`. The `WasmD_Bridge` operation-flag
change is therefore not required for correctness; a batched update form would still reduce
boot chatter (about 6 000 single updates per new session).

## Developer tooling

`npx ua-builder <cmd>`:

| Command | Does |
|---|---|
| `new <name>` | Scaffolds an Add On from `templates/`: `manifest.json`, `index.html`, `main.ts`, a vitest test against `Luna.MockPort`, and a `CLAUDE.md` pointing at the skills. |
| `serve` | Static server with COOP/COEP, serves the Add On and the SDK package, optional `--luna` proxy to `ws://localhost:4718`, optional `--engine-url`. |
| `test` | Runs vitest. `--live` adds the LUNA lane, `--engine` adds the wasm lane. |
| `pack` | Builds the IIFE and module bundles and zips the Add On folder into a `.lunaaddon` file (a zip with the folder at its top) for distribution. |

## Testing

Three lanes, all vitest:

| Lane | Runs against | When |
|---|---|---|
| unit | `Luna.MockPort` | Always. Ports, Store, every domain object, doc examples. |
| engine | Real `devicedwasm` in headless Chromium (Playwright) | CI and on demand. Same protocol suite as unit; proves the mock matches a real engine without LUNA installed. |
| live | Native LUNA on 4718 | `UA_LIVE=1`, serialised, each test restores what it touches. |

`docs/EVIDENCE.md` holds numbered facts about daemon behaviour (what a missing
path returns, what a writer sees back, which verbs answer `null` regardless).
Code comments cite fact numbers; the mock implements them; the live lane
re-verifies them.

## AI-assisted development

What lowers tokens, in order of impact:

1. One-line connect and one reactive idiom; nothing to choose between.
2. Scaffold templates: the agent edits a working Add On rather than authoring one.
3. `docs/QUICKSTART.md` under 300 lines, section-anchored so skills load only
   the part they need.
4. Generated, terse API markdown in `docs/api/` from the `.d.ts` (TypeDoc
   markdown), one file per domain, plus `docs/llms.txt` as an index.
5. `docs/EVIDENCE.md` so agents stop rediscovering daemon traps.
6. Subpath exports (`@uaudio/luna-builder-sdk/sessions`, `/editing`, ...) to keep
   autocomplete and import surfaces small.

`skills/` (Claude Code skill folders, each with `SKILL.md`):

| Skill | Purpose |
|---|---|
| `create-add-on` | Scaffold, wire up connect, first subscription, run tests. |
| `add-feature` | Wrap a UANet path not yet covered: find it with Probe, add a Prop or command, add a mock fact and a test. |
| `test-add-on` | Choose lane, write a MockPort fixture, run vitest. |
| `port-to-wasm` | Make an existing Add On run in a browser on the wasm engine. |
| `debug-connection` | Diagnose connect failures on either engine. |
| `verify-add-on` | Prove an Add On against a running LUNA from a second client and check the undo queue. |

## Repository layout

The SDK is its own repo, `uaudio/luna-builder-sdk` on GitHub (in an HB tree,
`<tree>/github-repos/luna-builder-sdk`). It is not a pac target. `design/PLATFORM.md` maps it
against the rest of the platform.

```
luna-builder-sdk/
  package.json            @uaudio/luna-builder-sdk, type: module; prepare builds, so npm ci yields dist/ and plugins/
  src/
    index.ts              export * as Luna from './luna'
    luna.ts               namespace barrel
    global.ts             IIFE entry (dist/luna.global.js, globalThis.Luna)
    wire/                 port.ts, websocket-port.ts, wasm-port.ts, mock-port.ts, codec.ts, multi.ts, errors.ts
    store/                store.ts, prop.ts (Prop, Cell, List, Scheduler)
    client/               connect.ts, client.ts, detect.ts (host detection lives here)
    engine/               loader.ts (bootWasmEngine, WasmEngine)
    model/                one file per domain object: session, sessions, track, bus, channel, output, control,
                          effect, playlist, clip, midi, automation, musical, chords, markers, context, waveform,
                          workspace, plugins, presets, system, gui, plus bind, gesture, shortcuts, bindings, settle
  cli/                    new, serve, test, probe, install, pack, doctor, tree
  templates/              add-on-basic/
  examples/               addon/, mixer, inserts, ruler, sends, tracks, arrangement, automation, editor,
                          import, jobs, pianoroll pages, plus check-*.mjs probes
  tests/                  unit/, live/, engine/, helpers/
  docs/                   QUICKSTART, RECIPES, MANIFEST, PROTOCOL, EVIDENCE, llms.txt, tree/, api/ (shipped)
  design/                 DESIGN.md (this), PLAN.md, PLATFORM.md (not shipped)
  skills/                 create-add-on, add-feature, test-add-on, debug-connection, port-to-wasm, verify-add-on
  plugin/                 hand-written shell of the agent plugin
  plugins/                generated ua-luna-builder plugin (git-ignored)
  scripts/                sync-plugin.mjs, check-plugin.mjs
```

The `sdk-luna` Stash repo keeps `LUNA SDK` and the two tree targets that consume this
checkout: `sdk/luna/builder-installer` and `sdk/luna/builder-examples/studiolo`.

## Risks and dependencies

- **Wasm bridge update chatter.** `onUpdate` has no operation flag, but adds
  (`{properties}`) and removes (`null`) are distinguishable, so `Luna.WasmPort`
  reports `operation` correctly (measured, fact 13). Updates still cross the
  worker boundary one at a time; a batched form in `WasmD_Bridge.cpp` would
  speed up session loads. Tracked as a separate hbsystem request.
- **New packages.** vitest, tsup and Playwright are not in the tree's Node
  toolchain. Raise in `hb-platform` before adding.
- **Hosted engine.** A hosting location with COOP/COEP headers and an update
  process for `devicedwasm.{js,wasm}` does not exist yet.
- **Two libraries with one domain model.** Since uanet-clients stays, fixes to
  domain logic may need to land in both until the LUNA GUI moves.
- **No auth on the WebSocket.** Documented, not solved, in v1.

## Open items

- Hosted engine URL and who owns updates.
- Whether `Luna.List` should be the only collection type or arrays are allowed
  for snapshots.
- Where `pack` output installs on Windows (the current `install.py` is macOS only).
- A Jira issue for the work.
