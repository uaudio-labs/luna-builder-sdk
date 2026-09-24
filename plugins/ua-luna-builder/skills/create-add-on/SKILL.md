---
name: create-add-on
description: Scaffold a new LUNA Add On with @uaudio/ua-builder-sdk, connect it to the engine, add its first feature, and get its tests passing. Use when asked to create, start, or bootstrap a LUNA Add On or LUNA web page.
---

> **Running the CLI from this plugin.** In a project that already depends on
> `@uaudio/ua-builder-sdk`, run `npx ua-builder <command>`. Installed as a plugin there is
> no npm project yet: resolve the plugin root as two directories above this skill's
> directory and run `node <plugin-root>/sdk/cli.js <command>` instead — the arguments are
> identical. The plugin also carries the script-tag bundle (`sdk/luna.global.js`, copied into
> an Add On folder by `node <plugin-root>/scripts/vendor-sdk.mjs <directory>`), the
> `add-on-basic` template, the examples and the docs this skill names.

# Create a LUNA Add On

## Steps

1. Scaffold. From the folder that should contain the Add On:
   ```sh
   npx ua-builder new <name> --title "<Title>" [--target window|app] [--width 900 --height 600]
   cd <name> && npm install && npm test
   ```
   Tests run against `Luna.MockEngine`; LUNA is not needed. If `ua-builder` is not on the path,
   run `node <builder>/dist/cli.js new ...` after `npm run build` in the builder package.

2. Read `logic.js` and `main.js` in the scaffold. `logic.js` holds engine logic with no DOM
   and is what the tests exercise. `main.js` connects and renders. Keep that split.

3. Implement the feature in `logic.js` first, as functions that take SDK objects
   (`Luna.Session`, `Luna.Track`) and return plain data or perform engine actions. Then wire it
   in `main.js`. Read only the QUICKSTART section you need:
   `<builder>/docs/QUICKSTART.md` sections 3 to 11.

4. Add a test in `tests/` for each logic function, using the pattern already there:
   `engine.addSession(...)`, `Luna.connect({ port_: engine.port() })`, `await luna.session()`,
   act, `await engine.settled()`, assert on `engine.requests`, `engine.value(...)`, or the
   model. For a control edit, assert `engine.touches` is one `:on` then one `:off` per edit.

5. Try it in a browser with LUNA running: `npx ua-builder serve`, open
   `http://localhost:8790/`. Then `npx ua-builder install` and open it from LUNA's Window menu.

## Rules

- Everything is a Prop or Collection. Read `.value`, subscribe with `.onChange(fn)`, write
  with `.set(v)`. Never poll.
- `await luna.session()` first; `await track.loadStrip()` before reading gain/pan/mute.
- Touch every control the user edits, so undo and automation work (QUICKSTART section 6,
  "Touch"). Clicks (buttons, toggles, menus): a single `set()` or `toggle()`, which the SDK
  brackets. Drags (faders, knobs): `Luna.bindGesture(element, control)` for the touch and
  release, and write from `input` or `pointermove`. Keep the gesture and `dispose()` it with
  the element, and never rebuild a control's DOM mid-drag.
- Call `Luna.bindShortcuts(luna)` once after connecting, so LUNA's undo, redo, play and record
  keys keep working while the Add On has the focus (QUICKSTART section 2). A key the page
  wants for itself: handle it and call `preventDefault()`.
- Group related writes in `session.transaction(name, fn)` so they undo as one step.
- Keep every unsubscribe function and call it when the session changes.
- Use `luna.raw` only when no typed method exists, and then consider adding one
  (see the add-feature skill).
- Do not use `<script type="module">` in the page; Windows loads Add Ons from `file://`.

## Verify

`npm test` passes. The page renders in `ua-builder serve` against a running LUNA and shows
the session name. Inside LUNA the Add On appears in the menu named by `manifest.json`.
