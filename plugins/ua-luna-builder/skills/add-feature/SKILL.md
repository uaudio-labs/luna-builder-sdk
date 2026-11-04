---
name: add-feature
description: Wrap an engine path, property or command that @uaudio/luna-builder-sdk does not type yet, either in an Add On or in the SDK's model layer. Use when a needed value or action is missing from the Luna namespace.
---

> **Running the CLI from this plugin.** In a project that already depends on
> `@uaudio/luna-builder-sdk`, run `npx ua-builder <command>`. Installed as a plugin there is
> no npm project yet: resolve the plugin root as two directories above this skill's
> directory and run `node <plugin-root>/sdk/cli.js <command>` instead — the arguments are
> identical. The plugin also carries the script-tag bundle (`sdk/luna.global.js`, copied into
> an Add On folder by `node <plugin-root>/scripts/vendor-sdk.mjs <directory>`), the
> `add-on-basic` template, the examples and the docs this skill names.

# Add a feature the SDK does not cover

## Find the path first

1. Start LUNA with a session open. `npx ua-builder tree <path>` prints a node's shape:
   each property with its type and `read_only`, its children and its commands.
   `docs/tree/luna-<version>.json` is a snapshot of the nodes the SDK builds on, and
   `npx ua-builder tree --out now.json` makes one for the running build to diff against it.
   For values, open `luna.raw` in a script or from the page's console;
   `examples/tracks.html` is the smallest worked example.
2. Locate the node. `get /sessions/<uid>?properties=0&commands=0` lists children;
   `get <node>?flatvalue=1&commands=0` shows properties; `get <node>?properties=0&children=0`
   lists commands with a JSON Schema for each payload. That schema is authoritative.
3. Note the exact property name, its type, and whether writes are accepted
   (`set` on a read-only property answers `uasrv.read_only`).

## Use it without changing the SDK

Every node has generic accessors:

```js
track.property('latency_override').value;             // any property as a WritableProp
await track.property('comments').set('take 3');
await session.command('freeze_tracks', { session_uid: session.uid, track_uid: [id], insert_type: [7] });
await luna.raw.get('/some/path', { flatvalue: true });
luna.raw.subscribe('/some/node', (e) => ..., { recursive: true });
```

Nodes outside a `ready()` session need `node.watch()` to receive pushes.

## Add it to the SDK model

When the feature is general, add it to `<builder>/src/model/`:

1. Pick the class that owns the path (`Track`, `Session`, `Effect`, ...). Add a
   `readonly x: Prop<T>` (or `WritableProp<T>` via `this.writableProp('engine_name')`) in
   the constructor, or a method that posts the command with the payload from the schema.
   Session commands take `session_uid`; `new_track` and `set_automode_on_tracks` take `uid`.
2. Write a JSDoc `@example` on the new member.
3. Teach `Luna.MockEngine` the behaviour in `src/wire/mock-port.ts` (`addSession` for session
   nodes; add a command handler that mutates the tree and returns what the engine returns).
4. Add a unit test in `tests/unit/model-extended.test.ts` and, if the behaviour was
   measured live, a fact in `docs/EVIDENCE.md` with its source and status.
5. `npm run check` in the builder package.

## Prove it did something

LUNA's editing verbs answer the same whether or not anything changed (fact 71), so a
reply is not proof. After posting, wait for the model to show the change, and let a
silent no-op fail:

```js
await session.command('some_edit', payload);
await Luna.settle(() => thing.value.value === expected, 'some edit', { refresh: () => thing.reload() });
```

- Write a control through its `Control` (`gain.real.set(v)`), never with a raw `set`: the
  SDK brackets the write in a touch, and only a touched write is undoable (fact 85).
- A whole number for a float field goes as `Luna.float(n)`: LUNA stores a bare `-6` in a
  breakpoint `value` as 0 (fact 82).
- Delete by the handle the create verb returned, not by the object it points at (a send is
  unrouted by its assignment uid, not the bus uid: fact 83).

## Units and gotchas

- Timeline values are ticks (`Luna.TICKS_PER_BEAT` per beat); `source_start`/`source_stop`
  are nanoseconds; lyrics are seconds. Pass values through unchanged.
- Array fields (`track_uid`, `inserts`, `tracks`) stay arrays even for one item.
- Optional fields are omitted, never sent as `null`.
- A `get` on a missing path answers `{}` with no error; do not treat `{}` as data.
- Streaming audio is out of scope: do not wrap a path to fake one. Live MIDI out is
  `Luna.SendMidi` (one message per call); live MIDI input from hardware is `Luna.MidiInput`,
  never Web MIDI (`navigator.requestMIDIAccess()`).
  Do not read `<input port>/midi_events` through `luna.raw` yourself.

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`LUNA BUILDER SDK FEEDBACK: <version>`, where `<version>` is the `ua-builder` row of
`ua-builder doctor` (for example `LUNA BUILDER SDK FEEDBACK: 0.1.0.1234`), followed by a
prompt that can be used to update the SDK to support the improved workflow: what you were
doing, what was awkward, and the API you wished for.
