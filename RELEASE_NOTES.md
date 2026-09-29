# Release Notes

What changed in each release of `@uaudio/ua-builder-sdk` and the `ua-luna-builder` plugin
it carries, in brief. `CHANGELOG.md` has the detail.

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
