---
name: debug-connection
description: Diagnose a LUNA Add On that cannot connect, sees no updates, gets timeouts, or behaves differently inside LUNA than in a browser. Use when Luna.connect fails, props stay undefined, or pushes never arrive.
---

# Debug a connection

## 1. Is anything listening?

```sh
npx ua-builder doctor
```

It reports LUNA on 4718, the wasm bridge on 4749, Node version and the
Add Ons folder. No engine: start LUNA and open a session. `Luna.NotRunning` means the socket
never opened.

## 2. Which engine did the page reach?

Inside LUNA the URL has `?port=<n>`; `Luna.locationOptions()` shows it and `luna.engine`
reports `luna | wasm | mock`. In a browser with no `?port=`, the SDK uses
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
