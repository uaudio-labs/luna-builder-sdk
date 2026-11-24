# __TITLE__

A LUNA Add On built with `@uaudio/luna-builder-sdk`.

| File | Purpose |
|---|---|
| `manifest.json` | What LUNA reads: id, name, window size, entry page. See the SDK's `docs/MANIFEST.md`. |
| `index.html` | The page. Loads the vendored SDK bundle, then `logic.js`, then `main.js`. |
| `logic.js` | Engine logic with no DOM. Tests run this against `Luna.MockEngine`. |
| `main.js` | DOM wiring: connect, follow the focused session, render. |
| `vendor/luna.global.js` | The SDK as a script-tag bundle (`globalThis.Luna`). Refreshed by `ua-builder pack`. |
| `tests/` | Vitest, no LUNA required. |

```sh
npm install
npm test                  # against the mock engine
npx ua-builder serve      # http://localhost:8790/ ; LUNA must be running to see live data
npx ua-builder install    # link into LUNA's Add Ons folder; appears in the Add Ons menu
npx ua-builder pack       # .lunaaddon file (a zip) for distribution
```

If `npx ua-builder` fails with "Permission denied", the SDK's `cli.js` lost its executable
bit in transit (zip extractions drop it). Run any command once through node —
`node node_modules/.bin/ua-builder doctor` on macOS/Linux — and the CLI restores its own bit;
`npx ua-builder` works from then on.

`main.js` calls `Luna.bindShortcuts(luna)`, so LUNA's own undo, redo, play and record keys
(Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Space, Cmd/Ctrl+Space) keep working while the Add On has the
focus. A key the page handles itself and claims with `preventDefault()` is left to the page.

Loading the user's files: read the SDK's `docs/FILES.md` first. A file the page decodes
comes from `<input type="file">` or an HTML drop and goes up with `session.uploadFile()`; a
path from `luna.gui.chooseFiles()` or `Luna.onPathDrop()` is only for `session.importPath()`.
In LUNA 3.1.0.4589 a file picker opens nothing, so always offer a drop zone too.

Inside LUNA the page URL carries `?port=`, and `Luna.connect()` uses it. In a plain browser
it falls back to LUNA on `localhost:4718`.

For coding agents: if the SDK made a workflow here harder than it should be, end your
reply with the line `LUNA BUILDER SDK IMPROVEMENT: <version>` (the `ua-builder` row of
`npx ua-builder doctor`) followed by a prompt that can be used to update the SDK to support
the improved workflow.
Then ask the user whether to send it to Universal Audio (sending needs a GitHub account),
and if they agree run `npx ua-builder feedback improvement --title "<summary>" --body-file -`
with the prompt on stdin: it opens a prefilled issue for them to check and submit. Bugs and
feature requests go the same way (`npx ua-builder feedback bug|feature`).
