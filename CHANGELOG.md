# Changelog

Versions of `@uaudio/luna-builder-sdk` and the `ua-luna-builder` plugin it carries. The wasm
engine is versioned separately.

## Unreleased

Added
- Optional `manufacturer` manifest field: who makes the Add On, shown by LUNA in the
  MANUFACTURER column of Settings > Add Ons. `ua-builder new --manufacturer "Name"` writes it,
  and `ua-builder install` / `pack` reject a non-string value. The examples set it. In the `add_ons` shape a top-level
  `manufacturer` is the default for every entry without its own. LUNA reports
  it as the `manufacturer` property under `/gui/add_ons/<id>`, read as `manufacturer` on
  `luna.gui.addOns` items (`''` when the manifest has none).

Changed
- The agent skills, the scaffold README and `docs/llms.txt` now ask agents to end with
  `LUNA BUILDER SDK FEEDBACK:` instead of `UA BUILDER SDK FEEDBACK:` when the SDK could
  support their workflow better.

## 0.1.0-alpha.6

Changed
- `ua-builder pack` writes a `.lunaaddon` **zip file** again, holding the Add On folder
  (`<folder>/manifest.json`), instead of a `.lunaaddon` bundle folder. Opening one in LUNA
  (double-click on macOS or Windows) installs the Add On as a plain folder in LUNA's Add Ons
  folder, with no `.lunaaddon` extension. To share an Add On by hand, zip its folder and rename
  the `.zip` to `.lunaaddon`. The zip is written in Node, so it needs neither `zip` nor
  PowerShell, and keeps dotfiles and OS metadata files out as before. A `.lunaaddon` bundle
  folder from an earlier pack must be repacked; Add Ons already installed from one keep
  working.

## 0.1.0-alpha.5

Added
- `"editor"` Add On target: the editor panel docked under LUNA's Timeline, in place of the
  Clip Editor and at its height, listed under **Add Ons > Editors**. `ua-builder new --target
  editor` scaffolds one, `install` and `pack` accept it, and `AddOnTarget` includes `'editor'`.
  Needs a LUNA with editor Add On support; earlier builds open an `"editor"` entry as a window,
  and drop it for lack of a size.
- `session.newBus({ name, stemFormat })`: creates an aux bus (stereo unless told otherwise) in
  one undo step and resolves to the `Luna.Bus` once it is listed. `session.newTrack` makes
  tracks only.
- `timeline.formatBarBeat(tick)`: a tick as LUNA's bar|beat counter shows it (`5|3|240`), in
  one call.
- `timeline.onChange(listener)`: called when a tempo event or time signature is added, removed
  or edited.
- `marker.barBeat` and `marker.seconds`: derived props for a marker's position that follow the
  marker and the tempo map, so a marker list needs no tempo or time-signature listeners.
- `clip.addNotes(notes)`: adds several notes to a MIDI clip as one undo step. Each
  `Luna.ClipNote` gives `pitch`, a clip-relative `tick`, `lengthTicks` and optional `velocity`
  (default 100) and `channel` (default 0); all are checked before anything is sent.
  `clip.addNote` now goes through it.

Changed
- `ua-builder new` and `ua-builder install` refuse an Add On whose `id` or `title` (ignoring
  case) is already used by an Add On in LUNA's Add Ons folder, since LUNA needs both unique.
  Reinstalling the same Add On is not a clash. `UA_ADDONS_FOLDER` overrides the folder.
- Docs and skills say the SDK does not stream audio or MIDI, and that an Add On receives live
  MIDI with Web MIDI (`navigator.requestMIDIAccess()`) and sends it however it likes.
- `width` and `height` are required only for a `"window"` Add On. `ua-builder install` and
  `pack` accept a browser or app entry without them, and `ua-builder new --target browser|app`
  leaves out `width`, `height`, `floating` and `show_with_session`, none of which those targets
  use. Needs a LUNA that keeps a browser or app entry with no size; earlier builds drop it.
- `ua-builder install` and `new` name the menu LUNA lists the Add On in: **Add Ons >
  Windows**, **Browsers** or **Apps**, not the Window or View menu.
- `ua-builder new` rejects an unknown `--target`.

Fixed
- `Luna.connect()` no longer hangs under Node 22 when nothing is listening. Node's built-in
  `WebSocket` reports a refused connection with an `error` and no `close`, which the SDK
  waited for; an attempt now ends on either, and the handshake is bounded by
  `requestTimeoutMs`, rejecting with `NotRunning`. Fact 101.
- `ua-builder pack` leaves dotfiles (`.DS_Store`, `._*`, `.git`, `.gitignore`, `.env`, editor
  folders) and Windows metadata files (`Thumbs.db`, `desktop.ini`) out of the `.lunaaddon`
  bundle at every depth, and says how many it left out. It copied them all before.
- Docs: `BarBeat.tick` (from `timeline.barBeat()` and `location.bar_beat`) is engine ticks,
  and `Luna.formatBarBeat` converts it to display ticks. The docs said "display tick", which
  led to converting twice.

## 0.1.0-alpha.4

Measured against a LUNA 1.0.0.0 Debug build from the 3.x branch (facts 90 and 100 in
`docs/EVIDENCE.md`). The `floating`, `show_with_session` and browser-target manifest
behaviour needs a LUNA that reads those fields.

Added
- `Transport.setPlayStart(to, { sync })`: move the play start alone, to a tick or a
  `{ bar, beat, tick }`, leaving the loop range where it is (`seek()` collapses it, as LUNA's
  locate does). Resolves once LUNA shows the move; while playing, the playhead jumps as
  `sync` says. Fact 90.
- Manifest `target: "browser"` is now shown by LUNA: a panel in the secondary browser beside
  the Timeline and Mixer, chosen from the Add Ons menu (choosing it again closes it), and by
  `Luna.AddOn.show()`. Which one is showing is saved with the session and restored when it
  reopens. `ua-builder new --target browser` scaffolds one. Needs a LUNA that
  shows browser Add Ons; earlier builds list them but open nothing.
- `session.musical.chords`: LUNA's Chord ruler as a live `Luna.Chords` collection (`sorted`,
  `at(tick)`) of `Luna.Chord` (`location`, `name`, `parsed`; `rename`, `moveTo`, `delete`).
  `musical.addChord(tick, name)`, `musical.setChords(chords, { replaceRange })` (a whole
  progression as one undo entry) and `musical.clearChords()`. `Luna.parseChord('Am7/G')`
  gives `{ root, type, bass }`. `Luna.MockEngine` models the verbs and adds
  `engine.addChord(sessionUid, tick, name)` for a chord typed in LUNA. Fact 100.
- `session.focusedTrack`: a `Prop<Track>` for the track the user is working on. It is the main
  context's `lastSelectedTrack`, else the first selected track, else the first visible track.
  It notifies only when the answer moves to another track.
- `Collection.membersReady()`: resolves once every member the engine added has its properties.
- `Luna.connect({ engine: 'mock', setup })` and `?engine=mock` on the page URL: an in-memory
  `Luna.MockEngine`, filled by `setup`, else by a page-defined `globalThis.LunaMockSetup`, else
  by `Luna.MockEngine.demo()` (one session with four tracks). `luna.mock` is the engine, and
  `MockPort.engine` is now public.
- `ua-builder probe --mock [fixture.js]`: probes a real page with no LUNA running. The fixture
  is installed before any page script runs. `--screenshot <file.png>` saves the page once it
  is ready and has painted two animation frames.
- `Store.readsSettled()`, `Store.pendingReads` and `Store.hasProperties(nodePath)`.
- Manifest `floating` (boolean, default `true`) for `"window"` Add Ons: the window floats with
  LUNA's plugin windows (above LUNA while it is active, hidden by Hide Floating Windows), or
  with `false` is an ordinary window. `ua-builder new` writes `"floating": true`;
  `--no-floating` writes `false`. `readManifest()` rejects a non-boolean. `Luna.AddOn.floating`
  reads it from `/gui/add_ons/<id>`. Needs a LUNA that reads the field; earlier builds ignore it.
- Manifest `show_with_session` (boolean, default `false`) for `"window"` Add Ons: with `true`
  the window is hidden and its menu item disabled while no session is open, and the window
  comes back when one opens if the user had it open. `ua-builder new` writes `false`;
  `--show-with-session` writes `true`. `readManifest()` rejects a non-boolean.
  `Luna.AddOn.showWithSession` reads it. Needs a LUNA that reads the field.

Changed
- LUNA's Add Ons menu now holds one submenu per target (Apps, Browsers, Windows); Windows
  lists `show_with_session` Add Ons first. Browser Add Ons are listed on every page, disabled
  off the Timeline and Mixer. See `docs/MANIFEST.md` (`target`).
- A member a loaded collection learns of from an `added` push (native LUNA sends no data with
  one, fact 7) is still in `items` at once. Its `onChange` now waits until the SDK's read of
  the member lands, so listeners never see it with empty props. Removals still notify at once.
- `luna.settled()` also waits for reads in flight, repeating flush-then-read until both are
  quiet. After `await engine.settled(); await luna.settled();` a clip or track another client
  just added has its values.
- `ua-builder probe` opens a blank tab, then navigates it, so it can install scripts first.
- The `ua-luna-builder` plugin manifests and marketplace catalog name
  `https://github.com/uaudio-labs/luna-builder-sdk` as the repository.

## 0.1.0-alpha.3

Facts 97-99 in `docs/EVIDENCE.md`: the preset query and `set_inserts` preset fields are
verified from deviced source; the MockEngine control-view tapers are documented stand-ins.

Changed
- `ua-builder pack` produces a `<name>.lunaaddon` bundle (a folder with the extension, shown
  as a package in the macOS Finder) instead of a zip, matching LUNA's bundle-only installer.
  The copy is pure Node, so the zip/PowerShell split is gone; `--out` gains the `.lunaaddon`
  extension when it is missing, and a bundle inside the Add On folder is never packed into the
  next one. Install by dropping the bundle into LUNA's Add Ons folder; a previously shipped
  `.zip` must be repacked.

Added
- `luna.presets` (`Luna.Presets`): `query({ pluginId | deviceTypeId, search?, favorite?,
  limit? })` over `post /presets/query` (fact 98), returning rows decoded from LUNA's
  columnar reply, and `find(pluginId, name)` for the exact-name match, preferring a user preset over a
  factory one of the same name.
- `Effect.setPlugin(pluginId, { presetUid })`: a `presetUid` from `luna.presets.find()` rides
  in the same `set_inserts` entry, so LUNA adds the plugin already on that preset, state and
  preset identity applied in one undo step (fact 99); `presetName` alone still only labels the
  effect. `Luna.MockEngine.addPreset()` seeds a preset library that answers
  `/presets/query` columnar with 0/1 flags, and `set_inserts` stores `preset_name`/`preset_uid`
  on the slot (a known uid takes the library's name).
- `ua-builder probe <url> [--expr <js>] [--wait <js>] [--settle <ms>]`: open a served page in
  headless Chrome, wait until a `Luna` client on it is connected and its focused session is
  ready (the new `Luna.clients()` registry of open clients, a tooling hook; `--wait`
  overrides), let the DOM hold still for one quiet period (default 250 ms, bounded so a
  playing clock cannot stall it; `--settle 0` skips), evaluate an expression against the live
  DOM and print JSON — the scriptable half of a two-client "the page must follow" check, with
  no hand-rolled CDP boilerplate, no `--dump-dom` race, and no placeholder reads from a
  scaffold still binding its session. Every wait is gated on the real page having loaded (the
  tab's initial blank document satisfies any DOM condition), a page still in its
  `Luna.connect()` retry loop counts as not ready, a wait that never passes prints
  `timed out ... waiting for: <condition>` plus what the page shows, and a page whose vendored
  SDK predates `Luna.clients()` gets a warning instead of a silent wrong read. The
  verify-add-on skill uses it.
- `ua-builder serve` on a busy port now walks to the next free port with a notice (stale
  serves from other sessions are common); an explicit `--port` fails with a clear message and
  an `lsof` hint instead of a bare EADDRINUSE stack.
- `luna.settled()` now flushes pending change notifications immediately instead of waiting
  for the next animation frame (or its 100 ms fallback), so the test idiom
  `await engine.settled(); await luna.settled();` is deterministic and prompt in any
  environment. QUICKSTART's testing section and the test-add-on skill now spell out the
  timing rules: values read current after `engine.settled()`, listeners land on
  `luna.settled()`, an unchanged value fires no `onChange`, and the first value a prop
  receives does fire.
- `transport.tempo` and `transport.timeSignature`: typed Props carved out of the `location`
  pushes (the tempo and meter in effect at the playhead), notifying only when the value moves
  rather than on every playhead push. `Luna.formatTimeSignature` formats the meter as `4/4`
  (placeholder `-/-`), pairing with `formatBarBeat`; `Luna.derived` gained a
  `{ distinct: true }` option that skips notifications when the computed value is unchanged.
- `Luna.MockEngine` fidelity: writing one view of a control (`value`, `real_value`,
  `normalized_value`, `string_value`) re-derives the other three and pushes them to every
  client, the writer included (fact 97), so a test that sets `gain.real` can assert on
  `gain.display` the way the UI renders it. The tapers and formats are documented stand-ins
  (faders −96..0..+12 dB around normalized 0.78, pans `L<n>`/`C`/`R<n>`, switches snapping to
  their steps), not LUNA's own.

Fixed
- `npx ua-builder` in a freshly scaffolded project could die with "Permission denied" —
  the plugin sync copied `sdk/cli.js` (the plugin's bin) without its executable bit, and zip
  extractions drop the bit too. The sync now chmods the copy, `check:plugin` gates on it, the
  CLI restores its own bit whenever it is run via `node .../cli.js`, `ua-builder doctor`
  reports and heals the project's installed bin, and the scaffold README documents the
  one-time `node node_modules/.bin/ua-builder doctor` recovery.

## 0.1.0-alpha.2

Measured against the wasm LUNA engine (fact 96 in `docs/EVIDENCE.md`, 2026-09-29); native
LUNA's `min_sec` precision is an open check for the live lane.

Added
- `Transport.seconds`: the playhead in wall-clock seconds, `transport.tick` converted through
  the session's tempo map. Safe on any session from `luna.session()` (the tempo map loads with
  `session.ready()`); read earlier it throws `unavailable` instead of converting at a guessed
  tempo. `TransportLocation.min_sec` is documented (fact 96): present on `location` pushes,
  its `seconds` fractional on the wasm engine (measured); floor it for display.
- `Luna.formatMinSec(seconds, { fraction })`: a zero-padded `MM:SS` clock as a companion to
  `formatBarBeat`, with optional fractional digits, flooring rather than rounding and clamping
  negatives to zero.
- `Luna.bindClock(el, transport, { render, bindings })`: a smooth playback clock. The engine
  pushes `location` only several times a second, so the binding anchors on each push (the push
  stays authoritative) and interpolates with requestAnimationFrame while `transport.playing`,
  cancels on stop, and returns a release function. Default paint is
  `formatMinSec(seconds, { fraction: 1 })` into `el.textContent`.
- `Luna.MockEngine` fidelity: an engine-side `setValue('play_start', ...)` on a stopped session
  re-reports `location` the way a client-side set does (fact 90), and `locationAt` now carries
  `min_sec` integrated from the session's tempo map (fact 96).
- Every skill, the scaffold README and `docs/llms.txt` ask an agent that hits a workflow the
  SDK could support better to end its reply with `UA BUILDER SDK FEEDBACK:` followed by a
  prompt that could be used to update the SDK for that workflow.

Fixed
- The scaffold declares `vite` (vitest 5's peer dependency) so a fresh Add On installs, and
  the SDK's `file:` spec is written relative to the Add On so a moved folder keeps installing.
  The README notes the Node 24 / npm 11 requirement.
- `ua-builder doctor` reports the npm version, with a note when it is older than 11 (npm 10
  crashes in arborist on the scaffold), and creates LUNA's Add Ons folder when it is missing.

## 0.1.0-alpha.1

Measured against LUNA 3.0.0.15776 (facts 82-92 in `docs/EVIDENCE.md`).

Changed (breaking)
- The namespace is `Luna`, not `UA`: `import { Luna } from '@uaudio/luna-builder-sdk'`, `Luna.connect()`,
  and `globalThis.Luna` from a script tag. The script-tag bundle is `luna.global.js` (was
  `ua.global.js`). To move an existing Add On: rename `UA` to `Luna` in its scripts, point its
  `<script src>` at `vendor/luna.global.js`, and rename the vendored file (`ua-builder pack`
  then keeps it current). Environment variables keep their `UA_` prefix.
- `Track.inputMonitor` is a `WritableProp<boolean>` (was a read-only `Prop<string>`): LUNA's
  `input_monitor` is the track's on/off monitor switch, not a mode. Code that compared it with
  a string such as `'auto'` no longer type-checks; compare with `true`/`false`, and turn it on
  with `inputMonitor.set(true)`. That write rejects with `uasrv.invalid_value` while the
  record mute preference is on and no Apollo is active.
- `Transport.seek()` now sets the play start and both loop marks, as LUNA's own locate and
  Return To Zero do, so a drawn loop range becomes an empty one at the target; call `setLoop()`
  after seeking to keep a range. It resolves once the playhead is there, and while playing it
  now jumps at once (`sync_playback`) instead of only moving the next play start.

Changed
- Licensed under the Apache License, Version 2.0 (was proprietary and unlicensed). The package
  and the plugin each carry `LICENSE` and a `NOTICE`; every manifest's `license` is `Apache-2.0`.
- The repo ships the SDK source instead of a packed artifact: `dist/` and the generated agent
  plugin are built by `npm ci` (a new `prepare` script) with Node.js 22 or newer. Distributed
  SDK packages still arrive built.

Fixed
- Sends: `Output.unassign()` and `retarget()` delete by the assignment uid; they sent the bus
  uid, which LUNA rejects. New `destinations` (each with its `uid`, `busUid`, `name`,
  `busType`, `error`) and `destination`; `busUid` is derived from them, since LUNA's own
  `bus_uid` is always null. Routing calls resolve once the model shows the change;
  `retarget()` joins a caller's `transaction()`; `moveTo()` checks the slot is 0-7.
- Pan: stereo channels and sends use `pan_left`/`pan_right`. `Output.pan` is the left pan on
  stereo; new `pans`, `panLeft`, `panRight`, `stereo`.
- Automation: breakpoint values go on the wire as float literals; LUNA stored a whole
  number such as -6 as 0. `insert`, `setValue`, `move` and `clear` resolve once the lane
  shows the edit and refuse fractional ticks.
- Plugins: a slot counts as loaded by its instance id (`plugin_name` can stay null).
  `setPlugin()` and `channel.insert()` resolve once loaded and reject with the slot's
  `plugin_error`. New `Effect.params` leaves out the parameters a cleared plugin leaves
  behind; new `Effect.loaded`, `Effect.instanceId`, `Control.initialized`.
- Bounce: a render posted straight after a selection write used the previous selection;
  `Context.select()` now reads the selection back before resolving.
- Clip delete and trim, marker add, rename, move, recolor, comment and delete, and
  `session.deleteTracks()` resolve once the change is visible, and reject with `no_effect`
  when LUNA answers without acting.
- Store: a read answered late no longer overwrites a newer push; a refused write rolls back
  to the last value LUNA confirmed; a read's child lists count only as deep as it asked; a
  watch whose first load failed can be retried; a closed Store subscribes to nothing.
- `session.transaction()` called inside another runs in the open batch instead of nesting.

Added
- `Luna.waveformColumns(range, width, nsAt, { gain })` reduces a `WaveformRange` to one min/max
  per drawn column per channel the way LUNA's timeline does (fact 93): the loudest pairs each
  column covers, every column touching the zero line, columns between pairs interpolated when
  zoomed in, linear values times `gain` clipped to full scale, and `NaN` where no pair lies.
  `Luna.waveformLanes(channels, top, height)` stacks one lane per channel in file order, and
  `Luna.traceWaveform(ctx, channel, lane, x0)` adds LUNA's filled outline to a canvas path,
  with a 0.5 px axis so silence draws a thin line. Together they draw a stereo clip as two
  lanes, as LUNA does, instead of one folded shape that looks mono. `Luna.waveformPeak(range)`
  gives the loudest value in a range, for normalizing.
- `Musical.setTempoInEffectAt(bpm, tick)` changes the tempo in effect at a tick the way LUNA's
  tempo field does, by writing that tempo event's `tempo` (now a `WritableProp`), verified live; new
  `Musical.tempoEventAt(tick)` finds it (fact 95).
- `Context.waveformZoom` is LUNA's waveform zoom for the window (1 by default, x2 per Zoom In
  Waveform), read from the new `Context.settings`; multiply it into the `gain` above to draw at
  LUNA's height. LUNA saves it with a delay, so it can lag the screen (fact 94).
- `Luna.bindRange(input, control)` binds an `<input type="range">` to a control in one call:
  touch on press, a write per `input` (the input's `min`..`max` mapped onto 0..1, or units with
  `view: 'real'`), release once however the drag ends, LUNA's value followed except mid-drag
  and settled on at release, double-click to `resetToDefault()`.
- `Luna.bindDrag(element, controls, { render })` does the same for a div or canvas knob or
  fader: pointer capture, travel to value (`axis`, `pixelsPerUnit`), arrow, Page and Home/End
  keys, double-click reset, and `role="slider"` with `aria-valuenow`/`aria-valuetext`.
- `Luna.Bindings` groups a page's listeners and bindings: `on(prop, fn)`, `add(off)`,
  `clear()`, `dispose()`. Bindings made with `{ bindings }` hold it while dragged, and
  `whenIdle(render)` runs a rebuild now or once when the last drag ends. `bindGesture` takes
  `bindings` too.
- `Control.resetToDefault()`: puts any control back to LUNA's own default
  (`set_control_default_value`), touch-bracketed so it is one undo step. Use it for
  double-click-to-reset instead of hard-coding a default; controls expose no default value.
- `Transport.seek({ bar, beat, tick })` seeks to a musical position through the session's
  timeline; `seek({ bar: 1 })` is the downbeat of bar 1 even when tick 0 is not. New
  `{ sync: 'now' | 'next_bar' | 'loop_end' }` option for a seek during playback.
- `Transport.returnToZero()`: LUNA's Return To Zero, to the arrangement start (tick 0 until
  set). New `Transport.arrangementStart`.
- `Track.inputMonitoring`: whether LUNA is monitoring the track's input right now
  (`input_monitor_state`, read-only). It can be true while the switch is off, for an armed
  track that is stopped or punched in.
- `Luna.float()` / `Luna.FloatLiteral` for float fields on the raw wire; `Luna.encodePayload`.
- `Luna.Disposed`, `node.disposed` and `node.onDispose()`: commands on a removed object reject
  instead of acting on whatever replaced it. Collections dispose removed members at once.
- `Clip.snapshot()`, `Clip.layer`, `Clip.muted`; `Meter.streams`, `Meter.max`.
- `Luna.connect({ log })`: status changes, reconnects, timeouts and listener errors.
- `Luna.MockEngine`: LUNA's routing model, four cue buses, the stereo pan layout, the 3.0 insert
  slots, plugin load and ghost parameters, bare-integer breakpoints stored as 0;
  `engine.addBus()` and `engine.overrideCommand()`.
- `ua-builder tree [path]`: the shape of any node, or a snapshot of the nodes the SDK builds
  on (`docs/tree/luna-3.0.0.15776.json`).
- The `verify-add-on` skill: prove an Add On against LUNA from a second client and check the
  undo queue. `add-feature` now points at `ua-builder tree` and the wire traps.
- A live lane for the mixer (`tests/live/mixer.test.ts`).

## 0.1.0-alpha.0

First alpha: the wire layer, store and `UA.connect`; the session, transport, track, control,
bus, playlist, clip, MIDI, automation, render and recording models; `UA.MockEngine`; the
in-page wasm engine transport; the `ua-builder` CLI; five skills and the `ua-luna-builder`
agent plugin.
