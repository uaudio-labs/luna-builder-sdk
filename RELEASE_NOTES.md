# Release Notes

What changed in each release of `@uaudio/ua-builder-sdk` and the `ua-luna-builder` plugin
it carries, in brief. `CHANGELOG.md` has the detail.

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
