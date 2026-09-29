# LUNA Builder SDK — Phased Plan

Companion to `DESIGN.md`. Each phase ends with tests passing and docs updated
for what landed. Phases 1 and 2 are the critical path; 3 and 4 can overlap.

## Phase 0: groundwork

- [ ] Raise new Node packages (vitest, tsup, Playwright) in `hb-platform`.
- [ ] Request the `WasmD_Bridge` change in hbsystem: `onUpdate(path, json, operation)` and a batched update form.
- [ ] Pick or create a Jira issue.
- [ ] Decide the hosted engine URL.

## Phase 1: wire and store

Deliverable: `Luna.connect({ port_: mock })` works; `Luna.WebSocketPort` connects to native LUNA.

Status 2026-09-16: implemented; 62 unit tests and 7 live tests pass against a LUNA dev build with a session open. All EVIDENCE facts except the wasm-bridge re-check and structural depth are verified.

- [x] `package.json`, `tsconfig` (strict, `noUncheckedIndexedAccess`, `stripInternal`), tsup config (ESM, CJS, IIFE global `Luna`).
- [x] `src/wire/port.ts`: `Port`, `Event`, `GetOptions`, `Unsubscribe`, `PortStatus`.
- [x] `src/wire/codec.ts`: JSON dialect encode/decode, `/value` normalisation, tolerant decode.
- [x] `src/wire/multi.ts`: plain and packed multi-update expansion.
- [x] `src/wire/errors.ts`: `Luna.Error` with `code`, `NotRunning`, `Timeout`, `ConnectionLost`.
- [x] `src/wire/websocket-port.ts`: correlation, timeouts, reconnect + resubscribe, heartbeat, `?host=`/`?port=` defaults, injectable `WebSocket` for tests.
- [x] `src/wire/mock-port.ts`: in-memory tree, fixture builders, fault injection, `settled()`.
- [x] `src/store/prop.ts`: `Prop<T>`, `WritableProp<T>`, `List<T>`, coalescing `Scheduler`.
- [x] `src/store/store.ts`: versioned cells, refcounted watches, `load`, optimistic `set` with rollback, reload on reconnect.
- [x] `src/client/connect.ts`, `client.ts`, `detect.ts`.
- [x] `docs/EVIDENCE.md` started: record facts as they are measured against LUNA.
- [x] Tests: codec, multi, websocket-port (fake socket), mock-port, store, connect.

## Phase 2: domain model and examples

Deliverable: the three LUNA SDK examples run on `Luna.*` inside LUNA.

Status 2026-09-16: first slice done. `Luna.Sessions`, `Luna.Session`, `Luna.Transport`, `Luna.Track`, `Luna.Bus`, `Luna.Output`, `Luna.Control`, `Luna.Meter`, `Luna.Playlist`, `Luna.Clip`, `Luna.AudioSource` written against the live tree schema; 17 model unit tests and a 4-test live lane pass; `examples/` holds the three Add Ons on `Luna.*`. Second slice (same day): `Luna.Effect` with bypass semantics, `Luna.Plugins` catalog, `Luna.Musical` (tempo/time/key + `Timeline`), `Luna.Markers`, `Luna.Context`, `Luna.Automation`, MIDI insertion on clips, `Luna.Workspace` query, `Luna.Gui` host surface (dialogs, pages, Add Ons, tasks), `Luna.Drivers`/`Devices`/`Preferences`/`Renders`/`Jobs`, generic `node.property()`/`command()`/`watch()`/`reload()`. 90 unit tests. Remaining: presets browsing, device inputs, record clips, bounce/render orchestration, import upload phases.

- [x] Base: `Node`, `Collection`, ticks; sessions, transport, tracks, controls, buses, outputs, meters, playlists, clips, audio sources.
- [x] Second slice: effects, plugins, musical, markers, contexts, automation, MIDI, workspace, gui, system nodes.
- [ ] Port order (remaining): `defs/`, `utils/` (pure logic, copied), then `sessions`, `transport`, `tracks`, `controls`, `buses`, `playlists`, `clips`, then `editing`, `automation`, `midi`, then `drivers`, `preferences`, `presets`, `jobs`, `workspace`, `gui`.
- [ ] Each object: property fields as `Prop`, path parser kept, `handleChange` kept, `getX`/`onXChange`/`updateXFromData` removed, JSDoc `@example` on every public member.
- [x] Gesture and transaction idiom: `control.begin()/end()`, `session.transaction()`.
- [ ] `tests/doc-examples.ts` mirrors every `@example`.
- [x] `examples/big-counters`, `examples/living-room`, `examples/luna-probe` rewritten on `Luna.*`, with updated `manifest.json` (new fields). Not yet exercised inside LUNA's webview.
      Superseded: `big-counters` and `living-room` were replaced by the `ua-luna` plugin's
      example set ported to `Luna.*` (`addon/`, `mixer`, `inserts`, `ruler`, `sends`, `tracks`,
      plus `check-*.mjs`). `luna-probe` was removed too, along with `serve`'s `/probe` route:
      `luna.raw` is the way to explore the tree now.
- [x] Unit tests per domain against `Luna.MockPort`; live lane for connect, sessions, transport, controls.

## Phase 3: tooling, docs, skills

Deliverable: `npx ua-builder new` to a passing test in under five minutes; skills usable from Claude Code.

Status 2026-09-16: done. `ua-builder new|serve|test|install|pack|doctor` built to `dist/cli.js`; scaffold verified (new, npm install, 3 tests pass, pack) and the server verified (COOP/COEP, `/__builder/` mount, traversal blocked). `install` not exercised (writes to the system Add Ons folder). TypeDoc (`typedoc`, `typedoc-plugin-markdown`) added as dev dependencies; note for `hb-platform`.

- [x] `cli/new.ts` and `templates/add-on-basic/` (logic.js / main.js split, vendored bundle, vitest test).
- [x] `cli/serve.ts`: COOP/COEP static server, `--luna` TCP forwarder for other devices.
- [x] `cli/test.ts`, `cli/install.ts` (symlink on macOS, copy on Windows), `cli/pack.ts`, `cli/doctor.ts`.
- [x] `docs/QUICKSTART.md` (15 sections, under 300 lines), `docs/PROTOCOL.md`, `docs/MANIFEST.md`.
- [x] TypeDoc markdown into `docs/api/` (one file per member), `docs/llms.txt`.
- [x] Skills: `create-add-on`, `add-feature`, `test-add-on`, `debug-connection`.
- [x] Root `README.md` and `CLAUDE.md` for the `ua-builder-sdk` folder (done in Phase 1; expand in Phase 3).

## Phase 4: wasm engine

Deliverable: `Luna.connect({ engine: 'wasm' })` runs an Add On in a plain browser page.

Status 2026-09-16: done against a real engine build (`code/wasm` tree, 292 MB Release). The bridge's update shapes were measured first (facts 13, 35-38), which removed the need for the `WasmD_Bridge` change. Engine lane: 13 steps pass in headless Chrome in about 5 s (`npm run test:engine`, Chrome over CDP, no Playwright). Hosted engine URL still undecided; the engine must be same-origin, so the default is the `ua-builder serve` mount `/__engine/`.

- [x] `src/wire/wasm-port.ts`: `ccall` out, `WasmDeviced` hooks in, status from `onState`, update-shape normalisation.
- [x] `src/engine/loader.ts`: script injection, boot once per page, timeout, audio resume/input/health, persistence status, shutdown.
- [x] `Luna.connect` picks wasm from `engine: 'wasm'` or `?engine=wasm`; `luna.wasm` exposes the engine. The basic template works unchanged with `?engine=wasm`.
- [x] `skills/port-to-wasm`.
- [x] Engine test lane: `tests/engine/` driven over CDP; `ua-builder serve --engine <dir>` mounts a build; `doctor` reports it.
- [x] Engine limitations documented (QUICKSTART §2, DESIGN, the skill).
- [ ] Hosted engine build and URL (blocked on hosting decision); stripped Release build for size.

## Hardening from ua-client-sdk (NEXT-2187)

Status 2026-09-23: the engine traps ua-client-sdk had measured were re-measured on LUNA
3.0.0.15776 (and the 1.0.0.0 dev build) and fixed here: send routing by assignment uid,
the stereo pan layout, float literals for breakpoint values, plugin load by instance id and
ghost parameters, the selection-before-bounce race, settle-after-edit for clips, markers and
tracks, and five Store ordering and lifecycle cases (facts 82-87). Added `Luna.Disposed`,
`Clip.snapshot`, `Meter.max`, `connect({ log })`, `ua-builder tree`, a tree snapshot, the
`verify-add-on` skill and `tests/live/mixer.test.ts`. Every `examples/check-*.mjs` and the
live lane pass on 3.0.0.15776. ua-client-sdk's own note that `set_touch` is not routable
does not hold on 3.0: touch is what makes a write undoable (fact 85), which is B's design.
Not taken: tapers (LUNA's conversion commands answer nothing usable; the SDK shows LUNA's
own display strings) and a learned plugin-parameter scale (units vary per plugin, and the
touched `normalized_value` write is undoable anyway).

## Phase 5: adoption (future, no timeline)

- [ ] Publish `@uaudio/ua-builder-sdk` to the internal registry and as a tarball for third parties.
- [ ] Third-party onboarding doc replacing `uanet-clients-example/onboard.sh` for the Add On audience.
- [ ] Evaluate moving `hbgui/next_gen/luna/gui` and `shared/src` (LUNA Play) onto builder so LUNA Play can run on the wasm engine. Not committed; uanet-clients remains in place.
