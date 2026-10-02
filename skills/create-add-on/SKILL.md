---
name: create-add-on
description: Scaffold a new LUNA Add On with @uaudio/ua-builder-sdk, connect it to the engine, add its first feature, and get its tests passing. Use when asked to create, start, or bootstrap a LUNA Add On or LUNA web page.
---

# Create a LUNA Add On

## Steps

1. Scaffold. From the folder that should contain the Add On:
   ```sh
   npx ua-builder new <name> --title "<Title>" [--target window|app|browser] [--no-floating] [--show-with-session] [--width 900 --height 600]   # floating, session and size flags: window only
   cd <name> && npm install && npm test
   ```
   The default is a `"window"` Add On with `"floating": true`, which floats with LUNA's plugin
   windows. Pass `--no-floating` for an ordinary window. Pass `--show-with-session` for a
   window that only shows while a session is open. Pass `--target browser` for a panel in
   LUNA's secondary browser beside the Timeline or Mixer, or `--target app` for a full page.
   See `docs/MANIFEST.md` (`target`, `floating`, `show_with_session`).
   `new` refuses an `id` or `title` that an installed Add On already uses; pass a different
   `--id` or `--title`, and do not remove the other Add On without asking.
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
   `http://localhost:8790/`. Then `npx ua-builder install` and open it from LUNA's Add Ons menu (Windows, Browsers or Apps, by target).

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
- Call `Luna.bindShortcuts(luna)` once after connecting, so LUNA's undo, redo, play and record
  keys keep working while the Add On has the focus (QUICKSTART section 2). A key the page
  wants for itself: handle it and call `preventDefault()`.
- Group related writes in `session.transaction(name, fn)` so they undo as one step.
- Keep every unsubscribe function and call it when the session changes.
- Use `luna.raw` only when no typed method exists, and then consider adding one
  (see the add-feature skill).
- The SDK does not stream audio or MIDI. For live MIDI input use Web MIDI
  (`navigator.requestMIDIAccess()`) in the page; sending MIDI is up to the Add On. Do not try
  to stream through the SDK or `luna.raw`.
- Do not use `<script type="module">` in the page; Windows loads Add Ons from `file://`.

## Verify

`npm test` passes. The page renders in `ua-builder serve` against a running LUNA and shows
the session name. Inside LUNA the Add On appears in the menu named by `manifest.json`.

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`UA BUILDER SDK FEEDBACK:` followed by a prompt that can be used to update the SDK to
support the improved workflow: what you were doing, what was awkward, and the API you
wished for.
