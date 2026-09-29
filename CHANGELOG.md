# Changelog

Versions of `@uaudio/ua-builder-sdk` and the `ua-luna-builder` plugin it carries. The wasm
engine is versioned separately.

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
- Fixed: `npx ua-builder` in a freshly scaffolded project could die with "Permission denied" —
  the plugin sync copied `sdk/cli.js` (the plugin's bin) without its executable bit, and zip
  extractions drop the bit too. The sync now chmods the copy, `check:plugin` gates on it, the
  CLI restores its own bit whenever it is run via `node .../cli.js`, `ua-builder doctor`
  reports and heals the project's installed bin, and the scaffold README documents the
  one-time `node node_modules/.bin/ua-builder doctor` recovery.
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
- The namespace is `Luna`, not `UA`: `import { Luna } from '@uaudio/ua-builder-sdk'`, `Luna.connect()`,
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
