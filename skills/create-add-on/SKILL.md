---
name: create-add-on
description: Scaffold a new LUNA Add On with @uaudio/luna-builder-sdk, connect it to the engine, add its first feature, and get its tests passing. Use when asked to create, start, or bootstrap a LUNA Add On or LUNA web page.
---

# Create a LUNA Add On

## Steps

1. Ask the user where the Add On opens, before scaffolding. Do not pick a target for them,
   even when the request seems to imply one; the target decides the menu, the layout and
   which manifest fields apply. Offer the targets `ua-builder new` accepts today:
   - `window`: its own window.
   - `browser`: a panel in LUNA's secondary browser beside the Timeline or Mixer.
   - `editor`: the editor panel under the Timeline, in place of the Clip Editor, at its
     height; it does not follow the selection.
   - `app`: a full LUNA page alongside Timeline and Mixer.

   The set of targets can change. If `ua-builder new` with no arguments prints a different
   `--target` list, or `docs/MANIFEST.md` (`target` values) describes one not listed here,
   offer what they say instead.

   For `window`, also ask whether it shows only while a session is open
   (`--show-with-session`) or regardless of the session (the default). Do not ask about
   floating: a window floats with LUNA's plugin windows by default. Pass `--no-floating`
   only if the user asks for an ordinary window.

2. Scaffold with the answers as explicit flags. From the folder that should contain the
   Add On:
   ```sh
   npx ua-builder new <name> --name "<Name>" [--manufacturer "<Name>"] --target window|app|browser|editor [--no-floating] [--show-with-session] [--width 900 --height 600] [--template add-on-typescript]   # floating, session and size flags: window only
   cd <name> && npm install && npm test
   ```
   Pass `--template add-on-typescript` when the Add On is TypeScript, React or anything else
   that needs a bundler; do not set up your own bundler, `Luna` typings or pack exclusions.
   It builds `src/` into one classic script, `dist/main.js`; run `npm run build` before
   `serve` or `install`, and `npm run pack` (not `ua-builder pack`) to ship. Its README says
   how to add React.
   Pass `--manufacturer` with the author's company or name; LUNA shows it in Settings > Add
   Ons, and without it the field is left out of the manifest.
   See `docs/MANIFEST.md` (`target`, `floating`, `show_with_session`, `manufacturer`).
   `new` refuses an `id` or `name` that an installed Add On already uses; pass a different
   `--id` or `--name`, and do not remove the other Add On without asking.
   Tests run against `Luna.MockEngine`; LUNA is not needed. If `ua-builder` is not on the path,
   run `node <builder>/dist/cli.js new ...` after `npm run build` in the builder package.

3. Read `logic.js` and `main.js` in the scaffold (`src/logic.ts` and `src/main.ts` in the
   TypeScript one). The logic file holds engine logic with no DOM and is what the tests
   exercise. The main file connects and renders. Keep that split.

4. Implement the feature in the logic file first, as functions that take SDK objects
   (`Luna.Session`, `Luna.Track`) and return plain data or perform engine actions. Then wire it
   in the main file. Read only the QUICKSTART section you need:
   `<builder>/docs/QUICKSTART.md` sections 3 to 11.

5. Add a test in `tests/` for each logic function, using the pattern already there:
   `engine.addSession(...)`, `Luna.connect({ port_: engine.port() })`, `await luna.session()`,
   act, `await engine.settled()`, assert on `engine.requests`, `engine.value(...)`, or the
   model. For a control edit, assert `engine.touches` is one `:on` then one `:off` per edit.

6. Try it in a browser with LUNA running: `npx ua-builder serve`, open
   `http://localhost:8790/`. Then `npx ua-builder install` and open it from LUNA's Add Ons menu (Windows, Browsers, Editors or Apps, by target).

## Rules

- Everything is a Prop or Collection. Read `.value`, subscribe with `.onChange(fn)`, write
  with `.set(v)`. Never poll.
- `await luna.session()` first; `await track.loadStrip()` before reading gain/pan/mute.
- Touch every control the user edits, so undo and automation work (QUICKSTART section 6,
  "Touch"). Clicks (buttons, toggles, menus): a single `set()` or `toggle()`, which the SDK
  brackets; double-click-to-reset is `control.resetToDefault()`, never a hard-coded default.
  Drags: `Luna.bindRange(input, control)` for a range input, `Luna.bindDrag(element,
  control, { render })` for a div or canvas knob; they touch, write, release and follow LUNA.
  Put them and every `onChange` of rebuilt DOM in a `Luna.Bindings` (`{ bindings }`,
  `bindings.on(prop, fn)`), `clear()` it when rebuilding, and rebuild through
  `bindings.whenIdle(render)`, never mid-drag.
- Call `Luna.bindShortcuts(luna)` once after connecting, so undo, redo, play and record work
  outside LUNA too; inside LUNA, unclaimed keys already go to LUNA (QUICKSTART section 2). A
  key the page wants for itself: handle it and call `preventDefault()`.
- Group related writes in `session.transaction(name, fn)` so they undo as one step.
- Keep every unsubscribe function and call it when the session changes.
- Use `luna.raw` only when no typed method exists, and then consider adding one
  (see the add-feature skill).
- The SDK does not stream audio or receive MIDI. To play notes live on a track use
  `Luna.SendMidi` (or `Luna.QwertyMidi` for the computer keyboard); for live MIDI input use
  Web MIDI (`navigator.requestMIDIAccess()`) in the page. Do not try to stream audio through
  the SDK or `luna.raw`.
- Do not use `<script type="module">` in the page; Windows loads Add Ons from `file://`. In
  the TypeScript template, read `Luna` as the global (typed by the tsconfig); importing the
  SDK in `src/` bundles a second copy.
- Loading a user's file (docs/FILES.md): if the page needs the audio, use
  `<input type="file">` or an HTML `drop` and `session.uploadFile()`. Never take a path from
  `luna.gui.chooseFiles()` and try to read it; those paths are only for `session.importPath()`.
  Always include an HTML drop zone: in LUNA 3.1.0.4589 and earlier a file picker opens
  nothing (docs/FILES.md, "Inside LUNA today").
- Guard every `luna.gui` call with `await luna.gui.available()`; `/gui` is absent off LUNA.
- API keys and tokens go in `luna.secrets` (docs/MANIFEST.md, "Secrets"), never in
  `localStorage`, IndexedDB, cookies, the manifest or a file in the Add On. Name them by
  service (`openai.api_key`), and say so in the UI when `luna.secrets.storage` is `'memory'`.
  Namespace any other web storage keys by the Add On's `id`.

## Verify

`npm test` passes. The page renders in `ua-builder serve` against a running LUNA and shows
the session name. Inside LUNA the Add On appears in the menu named by `manifest.json`.

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`LUNA BUILDER SDK FEEDBACK: <version>`, where `<version>` is the `ua-builder` row of
`ua-builder doctor` (for example `LUNA BUILDER SDK FEEDBACK: 0.1.0.1234`), followed by a
prompt that can be used to update the SDK to support the improved workflow: what you were
doing, what was awkward, and the API you wished for.
