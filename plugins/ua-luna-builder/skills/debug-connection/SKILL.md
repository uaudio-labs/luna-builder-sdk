---
name: debug-connection
description: Diagnose a LUNA Add On that cannot connect, sees no updates, gets timeouts, or behaves differently inside LUNA than in a browser. Use when Luna.connect fails, props stay undefined, pushes never arrive, or a file picker or drop does nothing inside LUNA.
---

> **Running the CLI from this plugin.** In a project that already depends on
> `@uaudio/luna-builder-sdk`, run `npx ua-builder <command>`. Installed as a plugin there is
> no npm project yet: resolve the plugin root as two directories above this skill's
> directory and run `node <plugin-root>/sdk/cli.js <command>` instead — the arguments are
> identical. The plugin also carries the script-tag bundle (`sdk/luna.global.js`, copied into
> an Add On folder by `node <plugin-root>/scripts/vendor-sdk.mjs <directory>`), the
> `add-on-basic` template, the examples and the docs this skill names.

# Debug a connection

## 1. Is anything listening?

```sh
npx ua-builder doctor
```

It reports LUNA on 4718, Node version and the
Add Ons folder. No engine: start LUNA and open a session. `Luna.NotRunning` means the socket
never opened.

## 2. Which engine did the page reach?

Inside LUNA the URL has `?port=<n>`; `Luna.locationOptions()` shows it and `luna.engine`
reports `luna | mock`. In a browser with no `?port=`, the SDK uses
`localhost:4718`. From another machine, run `ua-builder serve --luna` and open the printed
`?host=...&port=...` URL.

## 3. Props are `undefined`

- The node was never loaded. `await luna.session()` loads the session; `await track.loadStrip()`
  loads main-output controls; `await collection.load()` loads members. Structural pushes
  (`added`) carry no data, so a newly added node needs `await node.load()`.
- The node is outside a watched session (`luna.gui.main`, `luna.preferences`): call
  `node.watch()` (or `node.load()` for a one-off read).
- The engine omits empty sections and answers `{}` for missing paths (fact 10/18). A `{}`
  is not an error; check the path with a `luna.raw.get` of its parent.

## 4. Pushes never arrive

- Subscriptions are made by `session.ready()` (recursive on the session) and by
  `Meter.onChange`. Anything else needs `node.watch()`.
- The writer never receives its own `set` back (fact 6). Read the optimistic value or
  observe from a second connection.
- After a drop, the SDK reconnects, re-subscribes and reloads. `luna.status` shows the state.

## 5. Writes fail

| code | meaning |
|---|---|
| `uasrv.invalid_property` | you `set` a node, not a property; add the property name |
| `uasrv.read_only` | engine-owned value; find the command that changes it (`get <node>?properties=0&children=0`) |
| `uasrv.invalid_object` | no such property or command at that path |
| `timeout` | the engine did not answer in `requestTimeoutMs`; the command may still be running |
| `disconnected` | the socket dropped mid-request; retry after `connected` |

## 6. Look at the wire

```js
new Luna.WebSocketPort({ onUnhandled: (m) => console.log('push', m) });
luna.raw.subscribe('/sessions/<uid>', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
```

`luna.raw` sends any verb and `luna.raw.subscribe` shows every push, so a few lines in
the page's console answer most questions about what the engine is actually sending.
`docs/PROTOCOL.md` has the message shapes; `docs/EVIDENCE.md` has the measured quirks.

## 7. Files do not arrive inside LUNA

Works in a browser, nothing inside LUNA? See docs/FILES.md, "Inside LUNA today".

- File picker opens nothing, and its `cancel` fires at once: LUNA 3.1.0.4589 and earlier
  (fact 104). Offer an HTML drop zone, or `luna.gui.chooseFiles()` + `session.importPath()`.
- HTML `drop` carries no files: a `Luna.onPathDrop` handler is registered, so LUNA delivers
  paths instead (fact 102). Unsubscribe it, or handle the paths.
- `onPathDrop` worked, then stopped after the window was reopened: fact 105. Drops arrive
  as HTML drops then; handle both.
- `fetch` of a `chooseFiles` path fails: by design. Pass it to `session.importPath()`.
- `uploadFile` resolved to an older source: the bytes were already in the session (fact 42).
- `chooseFiles` or `importFile` rejects `unsupported`: no `/gui` (a headless engine).
  `chooseFolders` and `listFiles` also reject it on a LUNA older than those commands (fact 106).
- `listFiles` rejects `uasrv.not_permitted`: the folder is not a blessed folder. Ask with
  `chooseFolders` or `addBlessedFolder` (or take a dropped folder); the user may have removed
  it in Settings > Add Ons > FOLDERS since the path was saved (facts 106, 133).

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`LUNA BUILDER SDK FEEDBACK: <version>`, where `<version>` is the `ua-builder` row of
`ua-builder doctor` (for example `LUNA BUILDER SDK FEEDBACK: 0.1.0.1234`), followed by a
prompt that can be used to update the SDK to support the improved workflow: what you were
doing, what was awkward, and the API you wished for.
