# Release Notes

What changed in each release of `@uaudio/luna-builder-sdk` and the `ua-luna-builder` plugin
it carries, in brief. `CHANGELOG.md` has the detail.

## 0.1.0-alpha.6 — 2026-10-06

- `ua-builder pack` makes a `.lunaaddon` zip file again. Double-click it to install the Add On
  in LUNA, where it lands as a plain folder. Sharing by hand is just zipping the Add On folder
  and renaming the `.zip` to `.lunaaddon`.

## 0.1.0-alpha.5 — 2026-10-02

- Added the `"editor"` Add On target, docked under LUNA's Timeline in place of the Clip Editor, with `ua-builder new --target editor`.
- Added `session.newBus()` to create an aux bus in one undo step.
- Added `clip.addNotes()` to add several MIDI notes in one undo step.
- Added `timeline.formatBarBeat()`, `timeline.onChange()`, and `marker.barBeat` and `marker.seconds` props that follow the tempo map.
- Browser and app Add Ons no longer need `width` and `height` in their manifest.
- `ua-builder new` and `install` refuse an Add On whose `id` or `title` is already installed.
- `ua-builder pack` leaves dotfiles and OS metadata files out of the bundle.
- Fixed `Luna.connect()` hanging under Node 22 when LUNA is not running.
- Documented that the SDK does not stream audio or MIDI, and that Add Ons use Web MIDI for live MIDI.

## 0.1.0-alpha.4 — 2026-10-01

- Added `Transport.setPlayStart()` to move the play start without collapsing the loop range.
- Added `session.musical.chords` for LUNA's Chord ruler, with `addChord`, `setChords`,
  `clearChords` and `Luna.parseChord()`.
- Added `session.focusedTrack` for the track the user is working on.
- Added manifest `floating` and `show_with_session` options for window Add Ons, and support
  for `target: "browser"` Add Ons, with matching `ua-builder new` flags.
- Added `Luna.connect({ engine: 'mock' })` and `?engine=mock` for running a page on an
  in-memory engine, and `ua-builder probe --mock` and `--screenshot`.
- Members added to a loaded collection now notify only once their properties are read, and
  `luna.settled()` also waits for reads in flight.
- Documented LUNA's per-target Add Ons submenus.

## 0.1.0-alpha.3 — 2026-09-30

- `ua-builder pack` now produces a `.lunaaddon` bundle instead of a zip, matching LUNA's
  installer.
- Added `luna.presets` to query a plugin's presets and `setPlugin({ presetUid })` to add a
  plugin already on a preset.
- Added typed `transport.tempo` and `transport.timeSignature` Props, `Luna.formatTimeSignature()`
  and a `{ distinct: true }` option for `Luna.derived`.
- Added `ua-builder probe` for scripted checks of a served Add On in headless Chrome, and
  `ua-builder serve` moves to the next free port when its port is busy.
- `luna.settled()` flushes change notifications immediately, making test waits deterministic.
- `Luna.MockEngine` re-derives a control's other views when one is written, as LUNA does.
- Fixed `npx ua-builder` failing with "Permission denied" in a fresh scaffold; the CLI and
  `ua-builder doctor` now restore the bin's executable bit.

## 0.1.0-alpha.2 — 2026-09-29

- Added `Transport.seconds`, `Luna.formatMinSec()` and `Luna.bindClock()` for building
  smooth playback time displays.
- `Luna.MockEngine` re-reports `location` on engine-side play-start writes and carries
  fractional `min_sec` seconds, matching the wasm engine.
- The agent skills, the scaffold README and `docs/llms.txt` now ask agents to end with a
  `UA BUILDER SDK FEEDBACK:` prompt when the SDK could support their workflow better.
- Fixed the scaffolded Add On's install (vite declared for vitest 5, SDK path relative so
  moved folders keep working); `ua-builder doctor` now flags npm older than 11 and creates
  LUNA's Add Ons folder when missing.
