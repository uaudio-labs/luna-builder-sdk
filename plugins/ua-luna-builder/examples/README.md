# Builder SDK examples

The `ua-luna` plugin's example set, ported to `Luna.*`. Pages load the script-tag bundle
from `../sdk/luna.global.js`, so run `npm run build` in the builder folder first; the
`check-*.mjs` scripts import the module build from `../sdk/index.js` and run under Node.

## Pages

| File | Shows |
|---|---|
| `arrangement.html` | The session as a timeline: a lane per track, a bar\|beat ruler through the tempo map, every clip drawn from LUNA's overview data at the current zoom, and the playhead. Live: trims, moves, renames, deletes and imports appear without a refresh. |
| `editor.html` | Every clip, marker and note edit the SDK offers, one undo entry each, with LUNA's own selection read back after every action to prove it was put back. |
| `addon/` | The smallest useful Add On: one file, one button on the master bus mute, and the whole connection lifecycle. The copy-out starting point. |
| `mixer.html` | A strip per channel: fader, pan, mute, solo, meter with held peak and clip. A drag is one undo entry. `?all=1` includes the system tracks. |
| `inserts.html` | Insert slots, the plugin catalog, parameters with the plugin's own readouts, IN/OUT and remove. |
| `ruler.html` | Live bar\|beat ruler over the tempo map with tempo, signature and key rows, clickable markers, and LUNA's own playhead annotation beside the SDK's. |
| `sends.html` | Every send and cue output: level, pan, mute, pre-fader, enable, meter, destination, and a picker that reroutes it (assign appends, so it uses `retarget`). |
| `automation.html` | The first track's volume lane drawn live: insert a ramp, move, revalue and delete breakpoints, and drive the track's automation mode. |
| `jobs.html` | Bounce channels or run LUNA's own main-bus export, with live state, progress and time remaining, and abort or delete any render. |
| `import.html` | Pick a file, watch it upload to LUNA in chunks, see it in the live source list, place it as a clip through the tempo map. |
| `pianoroll.html` | A live read-only piano roll over one MIDI clip: notes edited in LUNA appear without a refresh. |
| `tracks.html` | The raw wire: list the focused session's tracks through `luna.raw`, with no model layer. |

Every page that connects calls `Luna.bindShortcuts(luna)`, so LUNA's undo, redo, play and
record keys work while it has the focus; `tests/unit/examples-api.test.ts` enforces it.

## Checks

Node scripts that verify the SDK against a live LUNA, each printing a JSON report and
exiting non-zero on failure. They are the harnesses named by the open checks in
`docs/EVIDENCE.md`, so they are how facts 39-44 get re-measured.

```sh
node examples/check-sync.mjs                  # does the model follow another client's write?
node examples/check-musical-time.mjs          # the tempo map against get_tempo and LUNA's own annotations
node examples/check-arrangement.mjs           # every clip and waveform against an independent read
node examples/check-clips.mjs --slow          # a second client edits clips and markers; the lists must follow
node examples/check-editing.mjs --slow        # the SDK's own edits, seen from a second client; one Undo reverses each
node examples/check-waveform.mjs --slow       # overview pairs against a known ramp; direct vs time-stretched clips
node examples/check-record.mjs                # a real record pass on the first device input (rolls the transport)
node examples/check-automation.mjs            # breakpoints: insert, move, revalue, delete, clear, mode
node examples/check-sends.mjs                 # assign, append, retarget, move, unassign (fact 43)
node examples/check-midi.mjs                  # LUNA's own note edits, followed through clip.midi (facts 39-41)
node examples/check-import.mjs                # chunked upload, path import, MIDI as a clip, arm (fact 42)
node examples/check-jobs.mjs                  # offline bounce, export, a real-time bounce aborted (fact 44)
node examples/create-session.mjs --replace    # a scratch session with tracks
node examples/create-tempo-session.mjs --replace   # a fixture with tempo and signature changes
```

Most take `--slow` to pause between steps so the matching page can be watched. They change
the open session and clean up after themselves; the undo entries remain.

`addon/` is deliberately **not** in `manifest.json`: it is the copy-out template, and it
carries its own single-Add-On `manifest.json` in the self-contained shape LUNA wants for an
installed folder. Copy it out, put the bundle beside its `index.html`, repoint the script
tag at `./luna.global.js`, then `npx ua-builder install`. For a fuller starting point — logic
split out from the DOM, tests against `Luna.MockEngine` — use `npx ua-builder new` instead.

## Run inside LUNA

Symlink this folder into LUNA's Add Ons directory and the entries in `manifest.json` appear
under the Window menu. LUNA rescans the folder, so no restart is needed.

```sh
ln -s "$(pwd)" "/Library/Application Support/Universal Audio/LUNA/Add Ons/Builder SDK Examples"
```

`manifest.json` uses `local_content_offset: ".."` so the pages can reach `../dist/`.

## Run in a browser against LUNA

Open a page from any static server (or `file://` on macOS) while LUNA is running. With no
`?port=` on the URL, `Luna.connect()` falls back to `ws://localhost:4718`.

```sh
npx ua-builder serve          # http://localhost:8790/
```

## Run on the wasm engine

```sh
npx ua-builder serve --engine <path to hbsystem/wasm_engine/dist/Release>
open "http://localhost:8790/mixer.html?engine=wasm"
```

`Luna.connect()` sees `?engine=wasm` and boots the engine from `/__engine/`. The engine starts
with no session (fact 36), so most pages show "no session open" until one is created. From
the page's console:

```js
await Luna.connect({ engine: 'wasm' }).then((luna) => luna.sessions.create({ name: 'scratch' }));
```

Pages whose `engines` list omits `wasm` need a native LUNA.
