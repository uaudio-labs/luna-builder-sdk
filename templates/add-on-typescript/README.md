# __TITLE__

A LUNA Add On built with `@uaudio/luna-builder-sdk`, in TypeScript.

| File | Purpose |
|---|---|
| `manifest.json` | What LUNA reads: id, name, window size, entry page. See the SDK's `docs/MANIFEST.md`. |
| `index.html` | The page. Loads the vendored SDK bundle, then the built `dist/main.js`. |
| `src/logic.ts` | Engine logic with no DOM. Tests run this against `Luna.MockEngine`. |
| `src/main.ts` | DOM wiring: connect, follow the focused session, render. |
| `dist/main.js` | What `npm run build` makes from `src/`: one classic script. Not hand-edited. |
| `vendor/luna.global.js` | The SDK as a script-tag bundle (`globalThis.Luna`). Refreshed by `ua-builder pack`. |
| `tests/` | Vitest, no LUNA required. `tests/setup.ts` defines the `Luna` global. |
| `tsconfig.json`, `vite.config.ts` | Type checking, and the build into `dist/`. |

```sh
npm install
npm test                  # against the mock engine
npm run build             # type-check, then src/ -> dist/main.js
npm run dev               # rebuild dist/ on every save
npx ua-builder serve      # http://localhost:8790/ ; LUNA must be running to see live data
npx ua-builder install    # link into LUNA's Add Ons folder; appears in the Add Ons menu
npm run pack              # build, then a .lunaaddon file (a zip) for distribution
```

`install` links this folder, so LUNA loads whatever `dist/` holds: build (or keep
`npm run dev` running) before opening the Add On, and reopen it after a rebuild.

## How it is put together

- **The `Luna` global.** The page loads `vendor/luna.global.js`, which defines `Luna`, so
  `src/` uses it without importing the SDK. `tsconfig.json` types it through
  `"types": ["@uaudio/luna-builder-sdk/global"]`: `Luna.connect()` and `Luna.Session` both
  resolve. Importing `{ Luna }` from `@uaudio/luna-builder-sdk` in `src/` would bundle a
  second copy of the SDK into `dist/main.js`.
- **One classic script.** On Windows LUNA loads Add Ons from `file://`, where module scripts
  are blocked. So `vite.config.ts` builds `src/main.ts` and all it imports into a single IIFE,
  and `index.html` loads it with a plain `<script src>`. Never add `type="module"`. CSS that
  `src/` imports is written to `dist/main.css`; add a `<link>` for it.
- **React or another library.** Install it as a dependency, rename `src/main.ts` to
  `main.tsx` (update `lib.entry` in `vite.config.ts`), and add `"jsx": "react-jsx"` to
  `tsconfig.json`. The build bundles the library into `dist/main.js` and sets
  `process.env.NODE_ENV`, which React reads.
- **What ships.** `ua-builder pack` leaves out `src/`, TypeScript and JSX sources, source maps
  (`--source-maps` keeps them), `tsconfig.json`, `vite.config.ts`, `tests/`, `node_modules/`
  and every dotfile, `.env` included. It refuses to pack when `index.html` loads a script or
  stylesheet that is missing, so a forgotten build fails at pack time, not in LUNA. Keep
  images and other files the page loads at run time out of `src/`.

If `npx ua-builder` fails with "Permission denied", the SDK's `cli.js` lost its executable
bit in transit (zip extractions drop it). Run any command once through node —
`node node_modules/.bin/ua-builder doctor` on macOS/Linux — and the CLI restores its own bit;
`npx ua-builder` works from then on.

Inside LUNA, every key the page does not claim with `preventDefault()` goes on to LUNA, so its
shortcuts keep working while the Add On has the focus. `src/main.ts` also calls
`Luna.bindShortcuts(luna)`, which gives the page undo, redo, play and record (Cmd/Ctrl+Z,
Cmd/Ctrl+Shift+Z, Space, Cmd/Ctrl+Space) when it runs outside LUNA, and does nothing inside it.

Loading the user's files: read the SDK's `docs/FILES.md` first. A file the page decodes
comes from `<input type="file">` or an HTML drop and goes up with `session.uploadFile()`; a
path from `luna.gui.chooseFiles()` or `Luna.onPathDrop()` is only for `session.importPath()`.
In LUNA 3.1.0.4589 a file picker opens nothing, so always offer a drop zone too.

Inside LUNA the page URL carries `?port=`, and `Luna.connect()` uses it. In a plain browser
it falls back to LUNA on `localhost:4718`.

For coding agents: if the SDK made a workflow here harder than it should be, end your
reply with the line `LUNA BUILDER SDK FEEDBACK: <version>` (the `ua-builder` row of
`npx ua-builder doctor`) followed by a prompt that can be used to update the SDK to support
the improved workflow.
