---
name: test-add-on
description: Write and run tests for a LUNA Add On or for @uaudio/luna-builder-sdk itself, using Luna.MockEngine for fast tests and the UA_LIVE lane against a running LUNA. Use when asked to test, add coverage, or reproduce an engine interaction.
---

# Test an Add On

## Fast lane: Luna.MockEngine (default)

```js
import { Luna } from '@uaudio/luna-builder-sdk';
const engine = new Luna.MockEngine();
engine.addSession('abc', { name: 'Demo', tracks: ['Vocal', 'Bass'] });   // LUNA-shaped session
engine.addPlugin('com.uaudio.uadx.1176', { name: 'UA 1176', categories: ['Compressor'] });
engine.addPackage('pkg1', { name: 'Old Song', lastOpened: 1000 });
await engine.settled();                            // structural pushes from building the tree
const luna = await Luna.connect({ port_: engine.port() });
const session = await luna.session();
```

Drive the engine side with `engine.setValue(nodePath, prop, value)`, `engine.addNode(...)`,
`engine.removeNode(...)`, `engine.addTrack(sessionUid, id, {...})`, `engine.fail(path, code, times)`.
For live MIDI input, `engine.addMidiDevice(name, { uid })` then
`engine.receiveMidi(uid, [[0x90, 60, 100]])` once the page listens with `Luna.MidiInput`.

Wait correctly:
- `await engine.settled()` after anything that pushes (engine-side changes, commands that
  mutate the tree). After it, every prop `value` reads current.
- `await luna.settled()` before asserting that an `onChange` listener fired: listeners are
  coalesced (next-frame in a browser) and this flushes them immediately. Asserting a listener
  count after only `engine.settled()` races the frame.
- A member added by a push is in `items` at once but empty (adds carry no data); its
  collection reads it and fires `onChange` only then. `await luna.settled()` (or
  `await coll.membersReady()`) waits for that read.
- A push carrying an unchanged value fires no `onChange` (`Luna.Cell` drops equals): pushing
  the same location twice is silent the second time. The first value a prop ever receives
  does fire — nothing swallows an "initial snapshot".

Assert on:
- the model (`track.name.value`, `session.tracks.items`),
- derived control views: a write to one view re-derives the others (fact 97), so after
  `await gain.real.set(-6)` then `await engine.settled(); await luna.settled();`,
  `gain.display.value` is `"-6.0"` and `gain.normalized.value` moved. Exact numbers are the
  mock's documented stand-ins, not LUNA's tapers — assert on your own code's output, not on a
  taper value being LUNA-exact,
- what the Add On sent: `engine.requests` (`{ verb, path, data }`), `engine.touches`,
  `engine.transactions`,
- touch: every control edit is exactly one `<path>:on` then one `<path>:off` in
  `engine.touches`, a drag included (one pair however many writes). Drive a drag in jsdom by
  dispatching `pointerdown`, `input`s, then `pointerup` on the element bound with
  `Luna.bindRange` or `Luna.bindGesture` (`pointermove`s with `clientX`/`clientY` for
  `Luna.bindDrag`),
- engine state: `engine.value(path, prop)`, `engine.has(path)`, `engine.children(path)`,
- shortcuts: dispatch a `keydown` (`{ key: ' ', code: 'Space', bubbles: true, cancelable: true }`)
  in jsdom and expect `playing`, or call `new Luna.Shortcuts(luna).run('undo')` without a DOM
  and expect a `/undo` in `engine.requests`.

Make a test prove something:
- Wait on state, never on a fixed delay: `engine.settled()`, `luna.settled()`, a
  collection's `membersReady()`, or (for a page) what the page itself shows, such as a button
  enabled again after an edit. Delays pass alone and fail under a loaded test run.
- An edit resolves when LUNA shows it, so assert after `await`ing it; assert on the model or
  `engine.value`, not on the reply (fact 71).
- Run a new test once against the code before the fix and see it fail. A test that passes on
  the broken code is not testing the bug.
- Clips: the mock compiles clips (`lane.compiledClips`), renders per piece, fades,
  crossfades at edits and LUNA's split/trim on a move (docs/CLIPS.md §9). Setting a clip's
  property recompiles its lane; to imitate a state of LUNA's compiled clips, set the compiled
  clip's properties alone. `new Luna.MockEngine({ compiledClipFades: false })` has no fade data.
- Presets: `engine.addPreset(pluginId, name, { tags })`, `engine.addPresetTagGroup(pluginId,
  group, tags)`, `engine.setAssistantEnabled(true)` (off by default, as when UA Assistant is
  not connected), and `engine.setPresetRecommendations(pluginId, fn)` to script its answer.

Gotchas the mock reproduces on purpose: the writer does not get its own `set` pushed back;
pushes are asynchronous; a missing path answers `{}`; `set` on a node is
`uasrv.invalid_property`; read-only is `uasrv.read_only`; a `set_touch` release with no
touch open is `uasrv.invalid_value`.

## Live lane: a running LUNA

Gate with `describe.skipIf(process.env.UA_LIVE !== '1')`, run with `UA_LIVE=1 npx vitest run`
(or `ua-builder test --live`). Rules: read mostly; every write restores what it changed;
never create or delete tracks in a user's session; use `session.visibleTracks[0]`; allow
300 ms for pushes. When a check needs clips of its own and the user agrees, add a
temporary track, place clips past the end of the session, and remove the track, its clips
and the files it created in a `finally` (skills/verify-add-on, step 4). Check facts you rely on against `docs/EVIDENCE.md` and add new ones.

## Structure

Put engine logic in a DOM-free file (`logic.js`) and test that. Test DOM code only through
`ua-builder serve` and a browser: `ua-builder probe <url> --mock fixture.js` runs the real page
on a mock with no LUNA (the fixture sets `globalThis.LunaMockSetup = (engine) => { ... }`). A test that needs `document` is a sign logic leaked into
`main.js`.

Files: `new Luna.MockEngine({ gui: false })` is an engine without `/gui` (headless); test
that the page falls back. In a probe, `LunaProbe.dropFiles(['loop.wav'], '#zone')` and
`LunaProbe.chooseFiles('#file', ['loop.wav'])` hand the page real `File`s; `--luna-bridge`
adds `LunaProbe.dropPaths(paths)` for `Luna.onPathDrop` (docs/FILES.md, Testing).

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`LUNA BUILDER SDK IMPROVEMENT: <version>`, where `<version>` is the `ua-builder` row of
`ua-builder doctor` (for example `LUNA BUILDER SDK IMPROVEMENT: 0.1.0.1234`), followed by a
prompt that can be used to update the SDK to support the improved workflow: what you were
doing, what was awkward, and the API you wished for.

Then ask the user whether to send the improvement to Universal Audio, and say that sending
it needs a GitHub account. If they agree, run
`ua-builder feedback improvement --title "<one-line summary>" --body-file -` with the prompt on
stdin (add `--luna-version <x.y.z>` when you know it). It opens a prefilled issue in their
browser for them to check and submit. A bug or feature request the user wants to report goes
the same way, as `ua-builder feedback bug` or `ua-builder feedback feature`.
