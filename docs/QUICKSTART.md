# Quickstart

Build a LUNA Add On with `@uaudio/ua-builder-sdk`. Everything is under the `Luna` namespace.
Read this top to bottom once; afterwards the section headings are the index.

## 1. Create and run

```sh
npx ua-builder new my-add-on --title "My Add On"
cd my-add-on && npm install
npm test                  # mock engine, no LUNA
npx ua-builder serve      # http://localhost:8790/  (with LUNA running: live data)
npx ua-builder install    # symlink into LUNA's Add Ons folder -> Window menu
```

The scaffold has `index.html`, `logic.js` (engine logic, tested), `main.js` (DOM) and
`vendor/luna.global.js` (the SDK). `manifest.json` is what LUNA reads; see `MANIFEST.md`.

## 2. Connect

```js
const luna = await Luna.connect();               // inside LUNA (?port= on the URL) or LUNA on localhost
const luna = await Luna.connect({ engine: 'wasm' }); // in-page wasm engine (or ?engine=wasm on the URL)
```

The wasm engine needs the page served with COOP/COEP headers and the engine files on the same
origin; `ua-builder serve --engine <dir>` does both and mounts them at `/__engine/`. It boots
with no session (`luna.sessions.create(...)`), audio needs a click (`luna.wasm.resumeAudio()`),
and it has no `luna.gui`. See `skills/port-to-wasm/SKILL.md`.

Throws `Luna.NotRunning` if nothing answers. After the first success the connection reconnects
by itself and re-subscribes; `luna.status` is a Prop with `connecting | connected |
disconnected | closed`. `luna.engine` says which engine you got.

An Add On has the keyboard focus while it is in front, so bind LUNA's standard shortcuts
right after connecting. Undo (Cmd/Ctrl+Z), redo (Cmd/Ctrl+Shift+Z), play (Space, Numpad 0)
and record (Cmd/Ctrl+Space, Numpad 3) then run on the focused session for any key the page
does not claim with `preventDefault()` and that is not typed into a text field:

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

Every list is a `Collection`: `.items`, `.byId(id)`, `.onChange(fn)`, `.load()`.
Change notifications are coalesced to one per frame. Writes resolve when the engine
acknowledges. Native LUNA does not echo your own write back (the wasm engine does); either way
`.value` already holds it, and derived properties arrive by push.

## 4. Session

```js
const session = await luna.session();   // focused session, subscribed and loaded
session.name.value; session.canUndo.value; session.changeCount.value;
await session.undo(); await session.redo(); await session.save({ label: 'v2' });
await session.transaction('Rename all', async () => { /* many writes -> one undo step */ });
```

`luna.sessions` lists open sessions (`items`, `focused`, `focusedUid`) and creates or
opens them: `await luna.sessions.create({ name })`, `await luna.sessions.open(packageUid)`.
Follow session changes with `luna.sessions.focused.onChange(...)`.

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

Tick 0 is not always bar 1: a session with bars before bar 1 starts earlier, so seek to
`{ bar: 1 }` rather than `0`. `returnToZero()` goes where LUNA's button does, the arrangement
start, which is tick 0 until one is set. A seek sets the play start and both loop marks, as
LUNA's own locate does, and resolves once the playhead is there; while playing it jumps at
once, or pass `{ sync: 'next_bar' }` or `{ sync: 'loop_end' }`.

`location` is pushed only several times a second and carries `min_sec` (minutes, plus seconds
in the minute — fractional on the wasm engine, fact 96). For a sub-second display use
`Luna.bindClock(el, t, { render })`: it anchors on each push (the engine stays authoritative),
interpolates with requestAnimationFrame while playing, and returns a release function.

Ticks: `Luna.TICKS_PER_BEAT` (96e9), `Luna.WHOLE_NOTE`, `Luna.QUARTER_NOTE`, ...
`session.musical.timeline.barBeat(tick)` and `.seconds(tick)` honour tempo and meter changes.

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
const bus = session.buses.items.find((b) => b.busType.value === 'aux') ?? session.master;
await track.outputs.load(); const send = track.outputs.byId('send_0');
await send.retarget(bus.id);            // assign appends; retarget replaces (fact 43)
send.destinations.value;                // [{ uid, busUid, name, error }]; send.unassign(dest.uid)
track.meter.onChange(() => bar.width = track.meter.level.value[0]);  // subscribes only while observed
```

Anything untyped: `track.property('latency_override')`, `track.command('name', payload)`.

**Touch: every control a user edits must be touched.** LUNA makes a user edit one undo step
and one automation pass only if the control is touched when the edit starts and released
when it ends (fact 78). Every Add On control follows one of two patterns:

- **Discrete (click):** buttons, toggles, menus, steppers, double-click-to-reset. Write once
  with `set()`, `toggle()` or `resetToDefault()`; the SDK sends touch, write, release, in
  order, and resolves after the release. Do not wrap a click in `begin()`/`end()`.
- **Continuous (drag):** faders, knobs, XY pads. Touch on pointer down, write on every move,
  release on pointer up. `Luna.bindRange(input, control)` does it all for `<input type="range">`,
  `Luna.bindDrag(element, control)` for a div or canvas knob (pointer travel, keys, double-click
  reset, `role="slider"`). Both follow LUNA except mid-drag, and settle on its value on release.

```js
muteButton.onclick = () => track.mute.toggle();                 // discrete
Luna.bindRange(fader, track.gain);                               // continuous: <input type="range">
Luna.bindDrag(knob, track.pan, { render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`) });
const strips = new Luna.Bindings();                              // pass { bindings: strips } to both
session.tracks.onChange(() => void strips.whenIdle(render));    // render() begins with strips.clear()
```

Writes inside a gesture are not bracketed individually. `control.touchable` says whether a
control is bracketed at all: automatable controls and switches are (solo is, so exclusive solo
works), a non-automatable continuous control is not. Never rebuild a fader mid-drag, or the
release never arrives: `Luna.Bindings` collects listeners (`strips.on(prop, fn)`) and bindings,
and `whenIdle` waits for its last drag. For your own pointer code, `Luna.bindGesture` does only
the touch and release; by hand, `control.begin()` on press and `control.end()` on release.

## 7. Playlists, clips, sources

```js
const pl = session.playlistFor(track);  // the active take lane
await pl.clips.load();
for (const c of pl.clips.items) c.start.value, c.stop.value;     // ticks
c.sourceStart.value, c.sourceStop.value;                         // nanoseconds into the file
await session.insertClip({ trackUid, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
await c.trim(a, b); await c.delete(); await c.addNote(60, 0, Luna.QUARTER_NOTE);
const src = session.sources.byId(c.sourceUid.value);
const ov = await src.overview({ index: 0, count: 1024 });   // min/max floats -1..1, one page
await session.newPlaylists([track.id], { duplicate: true }); await session.setPlaylist(track.id, 2);
```

Drawing a clip's waveform means asking which source it really plays. A clip whose tick span
does not match its source span at the session tempo is time-stretched by LUNA into a render,
and it is the render's pairs that line up with the clip (fact 73):

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
const slot = await track.insert(comp.id);           // first empty slot; resolves once loaded,
                                                    // rejects with plugin_error (fact 86)
slot.loaded.value; slot.params;                     // live parameters are Controls, touched on write
await slot.setIn(false);                            // bypass (not the `enabled` property)
await slot.clear();
```

## 9. Markers, tempo, selection

```js
await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus'); session.markers.sorted; await marker.delete();
await marker.rename('Verse'); await marker.moveTo(Luna.WHOLE_NOTE * 12);
await session.musical.setTempo(96); await session.musical.setTimeSignature(3, 4, 5);
await session.context.select({ startTick, stopTick, trackUids: [track.id] });
await session.context.duplicate(); await session.context.nudge(Luna.SIXTEENTH_NOTE);
await session.moveClips(toTick, { copy: true });    // uses the selection when no range given
await track.gain.automation.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
await track.setAutomationMode('touch');
```

An editing verb answers `null` whether or not anything happened (fact 71), so wait for the
model rather than trust the reply:

```js
await clip.delete();
await Luna.settle(() => !pl.clips.byId(uid), 'delete clip', { refresh: () => pl.clips.reload() });
```

## 10. MIDI edits and recording

Velocity, mute and note deletion go through LUNA's edit *selection* (fact 74). The SDK saves
your selection, writes its own, posts once, and puts yours back — so it cannot run inside a
`transaction()` batch, which LUNA holds until commit.

```js
await clip.midi.ready();
clip.midi.notes.items;                                   // live, follows edits made in LUNA
await clip.midi.setVelocities(clip.midi.notes.items.map((n) => ({ note: n, velocity: Math.round(n.velocity * 0.8) })));
await clip.midi.setMuted(quietNotes, true);              // one "Mute Notes" entry
await clip.midi.deleteNotes([note]);                     // one entry, selection restored
```

A record pass is one call. It arms, rolls, waits through the count-in for the real punch,
holds, stops, disarms, and resolves once the take **and its source** are listed (fact 75):

```js
const inputs = await luna.audioInputs();                 // /devices/<d>/inputs
const take = await session.record({ track, inputUid: inputs[0].uid, startTick: 8 * Luna.TICKS_PER_BEAT, seconds: 8 });
Luna.clipAudio(take, session.sources);                     // drawable straight away
```

## 11. Workspace and LUNA's UI

```js
const recent = await luna.workspace.recent(10);    // [{ uid, name, path, online, lastOpened, ... }]
await luna.sessions.open(recent[0].uid);
const files = await luna.gui.chooseFiles({ filters: ['*.wav'], allowMultiple: true });
await luna.gui.setPage('mixer'); await luna.gui.openUrl(url); await luna.gui.revealPath(path);
const task = await luna.gui.startTask('Rendering'); await task.progress(50); await task.done();
```

`luna.gui` exists only inside LUNA. `luna.drivers`, `luna.preferences`, `luna.jobs`,
`luna.renders` cover the rest of the engine.

## 12. Escape hatch

```js
await luna.raw.get('/sessions/abc?properties=0&commands=0');
await luna.raw.set('/sessions/abc/looping', true);
await luna.raw.post('/sessions/abc/new_track', { uid: 'abc', name: 'X' });
luna.raw.subscribe('/sessions/abc', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
```

Every command self-describes: `get <node>?properties=0&children=0` returns each command's
JSON schema. `luna.raw` is the interactive way in: `await luna.raw.get('/sessions')`.

## 13. Errors

All errors are `Luna.Error` with `.code`: the engine's own string (`uasrv.invalid_property`,
`uasrv.read_only`, `uasrv.invalid_object`) or `not_running`, `timeout`, `disconnected`,
`no_session`, `unsupported`, `no_effect` (LUNA answered but the edit never showed, fact 71) and
`disposed` (`Luna.Disposed`: the object's node is gone; `node.onDispose(fn)` tells you when).
A `get` on a missing path is not an error; it answers `{}`.

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

Wait in that order, always. After `await engine.settled()` every prop `value` reads current,
but `onChange` listeners are coalesced (one call per batch of changes, delivered on the next
animation frame in a browser); `await luna.settled()` flushes and delivers them immediately.
Asserting on a listener without it races the frame. Two more timing rules: a push carrying an
unchanged value fires no `onChange` (`Luna.Cell` drops equals), so re-sending the same
location is silent; and the first value a prop ever receives *does* fire — there is no
swallowed "initial snapshot".

The mock reproduces the engine's real behaviours (`docs/EVIDENCE.md`). Live tests against
LUNA run with `UA_LIVE=1` and must leave the session as they found it.

To check what a served page actually renders — for example that it follows an edit made by a
second client — `ua-builder probe <url> [--expr <js>]` opens it in headless Chrome, waits
until a `Luna` client on the page is connected and its focused session is ready
(`Luna.clients()`; override with `--wait <js>`), lets the DOM go quiet (`--settle <ms>`,
default 250, `0` to skip), evaluates the expression and prints JSON. A freshly served scaffold
probes to its bound DOM with no hand-written wait.

## 15. Inside LUNA vs a browser vs wasm

LUNA opens your page with `?port=<engine port>`; `Luna.isEmbeddedInLuna()` tells you. In a plain
browser the same page reaches LUNA on localhost, or the in-page wasm engine with `?engine=wasm`.
`luna.engine` reports which one you got. Nothing else differs. Windows loads Add Ons from `file://`, so keep the script-tag bundle and avoid
`<script type="module">`. The LUNA WebSocket has no authentication; any page in the
webview can control LUNA.

## 16. Units, in one line

Timeline positions are ticks (96e9 per beat). Source-file offsets are nanoseconds. Lyrics
are seconds. Meters are 0..1. Colors are packed ARGB integers. The SDK converts nothing.
