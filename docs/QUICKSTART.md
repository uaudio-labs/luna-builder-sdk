# Quickstart

Build a LUNA Add On with `@uaudio/luna-builder-sdk`, all under `Luna`. Read once; then use the headings.
No audio or MIDI streaming: live MIDI input is Web MIDI (`navigator.requestMIDIAccess()`); sending is the Add On's.

## 1. Create and run

```sh
npx ua-builder new my-add-on --name "My Add On"
cd my-add-on && npm install
npm test                  # mock engine, no LUNA
npx ua-builder serve      # http://localhost:8790/  (with LUNA running: live data)
npx ua-builder install    # symlink into LUNA's Add Ons folder -> Add Ons menu
```

The scaffold has `index.html`, `logic.js` (engine logic, tested), `main.js` (DOM) and
`vendor/luna.global.js` (the SDK). `manifest.json` is what LUNA reads; see `MANIFEST.md`.

## 2. Connect

```js
const luna = await Luna.connect();               // inside LUNA (?port= on the URL) or LUNA on localhost
const luna = await Luna.connect({ engine: 'wasm' }); // in-page wasm engine (or ?engine=wasm on the URL)
const luna = await Luna.connect({ engine: 'mock', setup: (e) => e.addSession('s', { tracks: ['Vox'] }) }); // no engine (or ?engine=mock)
```

Wasm needs COOP/COEP headers and same-origin engine files (`ua-builder serve --engine <dir>`), boots with no session
(`luna.sessions.create(...)`), needs a click for audio (`luna.wasm.resumeAudio()`) and has no `luna.gui`; see `skills/port-to-wasm/SKILL.md`.

Throws `Luna.NotRunning` if nothing answers; afterwards it reconnects by itself. `luna.status`
is a Prop (`connecting | connected | disconnected | closed`); `luna.engine` names the engine.

An Add On has the keyboard while in front, so bind LUNA's shortcuts (undo, redo, play, record)
after connecting; they act on any key the page does not `preventDefault()` outside a text field:

```js
Luna.bindShortcuts(luna);                                                // fact 79
Luna.bindShortcuts(luna, { bindings: { togglePlayback: [] } });          // keep Space for the page
```

## 3. Props and Collections

Every observable value is a `Prop`:

```js
track.name.value;                       // read the cached value (undefined until loaded)
const stop = track.name.onChange(() => render());   // no arguments; read .value
await track.name.set('Lead Vocal');     // optimistic write, rolls back on rejection
stop();
```

Every list is a `Collection`: `.items`, `.byId(id)`, `.onChange(fn)`, `.load()`,
`.membersReady()`. A member the engine adds is in `.items` at once but empty until the SDK has
read it; `onChange` and `membersReady()` wait for that read. Notifications coalesce per frame.
Writes resolve on acknowledgement; `.value` holds them at once, echoed or not (fact 6).

## 4. Session

```js
const session = await luna.session();   // focused session, subscribed and loaded
session.name.value; session.canUndo.value; session.changeCount.value;
await session.undo(); await session.redo(); await session.save({ label: 'v2' });
await session.transaction('Rename all', async () => { /* many writes -> one undo step */ });
```

`luna.sessions` lists open sessions (`items`, `focused`, `focusedUid`; follow `focused.onChange`)
and makes them: `await luna.sessions.create({ name })`, `await luna.sessions.open(packageUid)`.

## 5. Transport

```js
const t = session.transport;
t.location.onChange(() => el.textContent = Luna.formatBarBeat(t.location.value?.bar_beat));
await t.play(); await t.stop(); await t.toggle(); await t.record(); await t.toggleRecord();
await t.seek({ bar: 1 });               // downbeat of bar 1; also { bar, beat, tick } or a raw tick
await t.returnToZero();                 // LUNA's Return To Zero: the arrangement start
await t.setLoop(0, Luna.WHOLE_NOTE * 8); await t.looping.set(true);
t.tick; t.seconds;                      // playhead: ticks, and wall-clock seconds via the tempo map
t.tempo.value; t.timeSignature.value;   // at the playhead, from location pushes; notify only on change
Luna.formatMinSec(t.seconds, { fraction: 1 });    // "01:30.5": zero-padded, floored, negatives clamp to 0
Luna.formatTimeSignature(t.timeSignature.value);  // "4/4"; "-/-" until loaded
const release = Luna.bindClock(clockEl, t);       // smooth MM:SS.s clock while playing
```

Tick 0 is not always bar 1, so seek to `{ bar: 1 }`; `returnToZero()` goes to the arrangement
start. A seek sets the play start and both loop marks, like LUNA's locate; `setPlayStart(to)` keeps
the loop. Both resolve once LUNA shows it; playing, they jump unless `{ sync: 'next_bar' | 'loop_end' }`.

`location` arrives only several times a second (its `min_sec` is fractional on wasm, fact 96).
`Luna.bindClock(el, t, { render })` anchors on each push and interpolates per frame while playing.

Ticks: `Luna.TICKS_PER_BEAT` (96e9), `Luna.WHOLE_NOTE`, `Luna.QUARTER_NOTE`, ...
`session.musical.timeline.barBeat(tick)` and `.seconds(tick)` honour tempo and meter changes; `timeline.formatBarBeat(tick)` gives LUNA's `5|3|240` (barBeat's `tick` is engine ticks, which `Luna.formatBarBeat` converts).

## 6. Tracks, buses, controls

```js
session.visibleTracks;                  // user tracks in order (hides LUNA's click/count_in)
session.master;                         // the master bus
const track = session.tracks.byId(uid);
await track.loadStrip();                // track props + main output controls in two requests
track.trackType.value; track.color.value; track.recordEnabled.value;
await session.newTrack({ name: 'Bass', trackType: 'audio', stemFormat: 'mono' });
await track.delete();
```

Controls have three views of one value plus a display string:

```js
track.gain.display.value;               // "0.0"
track.gain.normalized.value;            // 0..1
track.gain.real.value;                  // dB
await track.gain.real.set(-6);          // one-shot: touch-bracketed for undo/automation
await track.mute.toggle(); track.mute.on;   // switches
await track.pan.resetToDefault();       // LUNA's default (centre); for double-click-to-reset
track.solo;                             // track-level control; mute/gain/pan live on the main output
track.main.pans;                        // [pan] on mono, [pan_left, pan_right] on stereo (fact 84)
const bus = session.buses.items.find((b) => b.busType.value === 'aux') ?? await session.newBus({ name: 'FX' });
await track.outputs.load(); const send = track.outputs.byId('send_0');
await send.retarget(bus.id);            // assign appends; retarget replaces (fact 43)
send.destinations.value;                // [{ uid, busUid, name, error }]; send.unassign(dest.uid)
track.meter.onChange(() => bar.width = track.meter.level.value[0]);  // subscribes only while observed
```

Anything untyped: `track.property('latency_override')`, `track.command('name', payload)`.

**Touch every control a user edits**, or the edit is not one undo step and automation pass (fact 78):

- **Discrete (click):** buttons, toggles, menus, steppers, reset. Write once with `set()`,
  `toggle()` or `resetToDefault()`; the SDK touches, writes and releases. No `begin()`/`end()`.
- **Continuous (drag):** faders, knobs, XY pads: touch on press, write per move, release on up.
  `Luna.bindRange(input, control)` does it for `<input type="range">`, `Luna.bindDrag(el,
  control)` for a div or canvas knob (keys, double-click reset, `role="slider"`). Both follow
  LUNA except mid-drag and settle on its value on release.

```js
muteButton.onclick = () => track.mute.toggle();                 // discrete
Luna.bindRange(fader, track.gain);                               // continuous: <input type="range">
Luna.bindDrag(knob, track.pan, { render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`) });
const strips = new Luna.Bindings();                              // pass { bindings: strips } to both
session.tracks.onChange(() => void strips.whenIdle(render));    // render() begins with strips.clear()
```

`control.touchable` is false only for a non-automatable continuous control. Never rebuild a
fader mid-drag or its release is lost: `Luna.Bindings` collects listeners and bindings and
`whenIdle` waits out a drag. Own pointer code: `Luna.bindGesture` or `control.begin()`/`end()`.

## 7. Playlists, clips, sources

```js
const pl = session.playlistFor(track);  // the active take lane
await pl.clips.load();
for (const c of pl.clips.items) c.start.value, c.stop.value;     // ticks
c.sourceStart.value, c.sourceStop.value;                         // nanoseconds into the file
await session.insertClip({ trackUid, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
await c.trim(a, b); await c.delete(); await c.addNote(60, 0, Luna.QUARTER_NOTE);
await c.addNotes([60, 64, 67].map((pitch) => ({ pitch, tick: 0, lengthTicks: Luna.QUARTER_NOTE })));  // one undo step
const src = session.sources.byId(c.sourceUid.value);
const ov = await src.overview({ index: 0, count: 1024 });   // min/max floats -1..1, one page
await session.newPlaylists([track.id], { duplicate: true }); await session.setPlaylist(track.id, 2);
```

A clip that does not fit its source's tempo plays a stretched render; draw what `clipAudio` picks (fact 73):

```js
const audio = Luna.clipAudio(clip, session.sources);      // undefined => draw an outline, never silence
const cache = new Luna.Waveforms();
const kind = Luna.kindForScale(nsPerPixel);               // 'coarse' past 31.25 ms per pixel
const range = await cache.range(audio.source, audio.startNs, audio.stopNs, kind);
const ns = Luna.audioNsAtTick(session.musical.timeline, clip, audio, tick);   // tick -> file offset
// One min/max per pixel per channel, linear at LUNA's waveform zoom times the clip gain; column i's left edge is file offset nsAt(i).
const gain = session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20);
const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(session.musical.timeline, clip, audio, tickAtPx(i)), { gain });
const lanes = Luna.waveformLanes(cols.channels.length, top, height, 0);   // stereo: left lane above right
ctx.beginPath(); cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0)); ctx.fill();   // LUNA's shape (fact 93)
```

`examples/arrangement.html` is the whole picture: lanes, ruler, waveforms and playhead, live.

## 8. Effects and plugins

```js
await luna.plugins.load();
const comp = luna.plugins.find('1176')[0];          // or byCategory('Compressor')
const slot = await track.insert(comp.id);           // first empty slot; resolves once loaded, rejects with plugin_error (fact 86)
slot.loaded.value; slot.params;                     // live parameters are Controls, touched on write
await slot.setIn(false);                            // bypass (not the `enabled` property)
await slot.clear();
```

## 9. Markers, chords, tempo, selection

```js
await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus'); session.markers.sorted; await marker.delete();
await marker.rename('Verse'); await marker.moveTo(Luna.WHOLE_NOTE * 12); Luna.formatBarBeat(marker.barBeat.value); marker.seconds.value; // both follow the tempo map
await session.musical.setChords([{ tick: 0, name: 'C' }, { tick: Luna.WHOLE_NOTE, name: 'Am7/G' }]); // Chord ruler, one undo entry; session.musical.chords.sorted[1].parsed → { root: 'A', type: 'm7', bass: 'G' }
await session.musical.setTempo(96); await session.musical.setTimeSignature(3, 4, 5);
session.focusedTrack.value;  // last selected track, else first selected, else first visible
await session.context.select({ startTick, stopTick, trackUids: [track.id] });
await session.context.duplicate(); await session.context.nudge(Luna.SIXTEENTH_NOTE);
await session.moveClips(toTick, { copy: true });    // uses the selection when no range given
await track.gain.automation.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
await track.setAutomationMode('touch');
```

Editing verbs answer `null` whether or not anything happened (fact 71). Wait for the model
with `Luna.settle`, which also waits for any other state, such as another client's clip:

```js
await clip.delete();
await Luna.settle(() => !pl.clips.byId(uid), 'delete clip', { refresh: () => pl.clips.reload() });
```

## 10. MIDI edits and recording

Velocity, mute and note deletion go through LUNA's edit *selection* (fact 74): the SDK swaps
in its own and restores yours, so they cannot run inside a `transaction()`. Clip edits, not a live MIDI stream.

```js
await clip.midi.ready();
clip.midi.notes.items;                                   // live, follows edits made in LUNA
await clip.midi.setVelocities(clip.midi.notes.items.map((n) => ({ note: n, velocity: Math.round(n.velocity * 0.8) })));
await clip.midi.setMuted(quietNotes, true);              // one "Mute Notes" entry
await clip.midi.deleteNotes([note]);                     // one entry, selection restored
```

One call records a pass (arm, count in, punch, stop, disarm) and resolves to a drawable take (fact 75):

```js
const inputs = await luna.audioInputs();                 // /devices/<d>/inputs
const take = await session.record({ track, inputUid: inputs[0].uid, startTick: 8 * Luna.TICKS_PER_BEAT, seconds: 8 });
Luna.clipAudio(take, session.sources);                     // drawable straight away
```

## 11. Workspace and LUNA's UI

```js
const recent = await luna.workspace.recent(10);    // [{ uid, name, path, online, lastOpened, ... }]
await luna.sessions.open(recent[0].uid);
const paths = (await luna.gui.available()) ? await luna.gui.chooseFiles() : []; // paths, not Files
await luna.gui.setPage('mixer'); await luna.gui.openUrl(url); await luna.gui.revealPath(path);
const task = await luna.gui.startTask('Rendering'); await task.progress(50); await task.done();
```

`/gui` is absent on headless and wasm engines. Getting a user's file in: [FILES.md](FILES.md).

## 12. Escape hatch

```js
await luna.raw.get('/sessions/abc?properties=0&commands=0');
await luna.raw.set('/sessions/abc/looping', true);
await luna.raw.post('/sessions/abc/new_track', { uid: 'abc', name: 'X' });
luna.raw.subscribe('/sessions/abc', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
```

Every command self-describes: `get <node>?properties=0&children=0` returns its JSON schemas.

## 13. Errors

All errors are `Luna.Error` with `.code`: the engine's string (`uasrv.invalid_property`,
`uasrv.read_only`, `uasrv.invalid_object`), or `not_running`, `timeout`, `disconnected`,
`no_session`, `unsupported`, `no_effect` (the edit never showed, fact 71) or `disposed` (the
node is gone; `node.onDispose(fn)`). A `get` on a missing path answers `{}`, not an error.

## 14. Testing

```js
const engine = new Luna.MockEngine();
engine.addSession('abc', { name: 'Demo', tracks: ['Vocal', 'Bass'] });
engine.addPlugin('com.uaudio.uadx.1176', { name: 'UA 1176', categories: ['Compressor'] });
const luna = await Luna.connect({ port_: engine.port() });
const session = await luna.session();
engine.setValue('/sessions/abc', 'playing', true);  // engine-side change
await engine.settled();                              // pushes delivered
await luna.settled();                                // listeners notified
engine.requests; engine.touches; engine.transactions; engine.fail(path, code);
```

Wait in that order, always. After `engine.settled()` pushed values are current, but listeners
are coalesced to the next frame and a just-added member is still being read; `luna.settled()`
waits for both. An unchanged value fires no `onChange`; a prop's first value does.

The mock mirrors LUNA (`docs/EVIDENCE.md`). Live tests use `UA_LIVE=1` and restore what they touch.

`ua-builder probe <url> [--expr <js>]` checks what a served page renders: headless Chrome waits
for a connected `Luna` client with its session ready (`--wait <js>` overrides), for the DOM to
go quiet (`--settle <ms>`, default 250), then prints the expression as JSON. `--mock` runs the
page on `?engine=mock` with no LUNA: a demo session, or `--mock fixture.js` setting
`globalThis.LunaMockSetup = (engine) => { ... }`. `--screenshot page.png` saves it once painted.

## 15. Inside LUNA vs a browser vs wasm

LUNA adds `?port=` (`Luna.isEmbeddedInLuna()`); a browser reaches LUNA on localhost, or
`?engine=wasm`/`?engine=mock`. Windows loads Add Ons from `file://`: use the script-tag bundle.
The WebSocket has no auth. Files differ most: [FILES.md](FILES.md), "Inside LUNA today".

## 16. Units, in one line

Timeline positions are ticks (96e9 per beat). Source-file offsets are nanoseconds. Lyrics
are seconds. Meters are 0..1. Colors are packed ARGB integers. The SDK converts nothing.
