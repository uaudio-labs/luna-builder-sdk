# __TITLE__

A LUNA Add On built with `@uaudio/ua-builder-sdk`.

| File | Purpose |
|---|---|
| `manifest.json` | What LUNA reads: id, title, window size, entry page. See the SDK's `docs/MANIFEST.md`. |
| `index.html` | The page. Loads the vendored SDK bundle, then `logic.js`, then `main.js`. |
| `logic.js` | Engine logic with no DOM. Tests run this against `Luna.MockEngine`. |
| `main.js` | DOM wiring: connect, follow the focused session, render. |
| `vendor/luna.global.js` | The SDK as a script-tag bundle (`globalThis.Luna`). Refreshed by `ua-builder pack`. |
| `tests/` | Vitest, no LUNA required. |

```sh
npm install
npm test                  # against the mock engine
npx ua-builder serve      # http://localhost:8790/ ; LUNA must be running to see live data
npx ua-builder install    # link into LUNA's Add Ons folder; appears in the Window menu
npx ua-builder pack       # zip for distribution
```

`main.js` calls `Luna.bindShortcuts(luna)`, so LUNA's own undo, redo, play and record keys
(Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Space, Cmd/Ctrl+Space) keep working while the Add On has the
focus. A key the page handles itself and claims with `preventDefault()` is left to the page.

Inside LUNA the page URL carries `?port=`, and `Luna.connect()` uses it. In a plain browser
it falls back to LUNA on `localhost:4718`. To run on the in-page wasm engine instead, call
`Luna.connect({ engine: 'wasm' })`.
