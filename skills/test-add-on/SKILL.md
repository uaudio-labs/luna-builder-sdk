---
name: test-add-on
description: Write and run tests for a LUNA Add On or for @uaudio/ua-builder-sdk itself, using Luna.MockEngine for fast tests and the UA_LIVE lane against a running LUNA. Use when asked to test, add coverage, or reproduce an engine interaction.
---

# Test an Add On

## Fast lane: Luna.MockEngine (default)

```js
import { Luna } from '@uaudio/ua-builder-sdk';
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

Wait correctly:
- `await engine.settled()` after anything that pushes (engine-side changes, commands that
  mutate the tree).
- `await luna.settled()` before asserting that an `onChange` listener fired.
- `await node.load()` on a node that was just added by a push; adds carry no data.

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

Gotchas the mock reproduces on purpose: the writer does not get its own `set` pushed back;
pushes are asynchronous; a missing path answers `{}`; `set` on a node is
`uasrv.invalid_property`; read-only is `uasrv.read_only`; a `set_touch` release with no
touch open is `uasrv.invalid_value`.

## Live lane: a running LUNA

Gate with `describe.skipIf(process.env.UA_LIVE !== '1')`, run with `UA_LIVE=1 npx vitest run`
(or `ua-builder test --live`). Rules: read mostly; every write restores what it changed;
never create or delete tracks in a user's session; use `session.visibleTracks[0]`; allow
300 ms for pushes. Check facts you rely on against `docs/EVIDENCE.md` and add new ones.

## Structure

Put engine logic in a DOM-free file (`logic.js`) and test that. Test DOM code only through
`ua-builder serve` and a browser. A test that needs `document` is a sign logic leaked into
`main.js`.

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`UA BUILDER SDK FEEDBACK:` followed by a prompt that can be used to update the SDK to
support the improved workflow: what you were doing, what was awkward, and the API you
wished for.
