# The UANet protocol, as an Add On author needs it

The full reference is `packages/hbsystem/networking/docs/` (overview, wire-format,
operations, async-model, advanced). This page is the subset the SDK relies on, plus the
behaviours measured on LUNA that the reference does not state (`EVIDENCE.md`).

## Shape

The engine is a tree of nodes addressed by paths: `/sessions/<uid>/tracks/<id>/name`.
Every node has properties (values), children (nodes) and commands (verbs you `post`).

Five verbs: `get`, `set`, `post`, `subscribe`, `unsubscribe`. Over WebSocket a request is a
text line, `verb path?params payload`, and every reply is a JSON object
`{ path, data?, operation?, parameters?, error? }`.

```
get /sessions?properties=0&commands=0&ua_id=r1
set /sessions/abc/looping?ua_id=r2 true
post /sessions/abc/new_track?ua_id=r3 {"uid":"abc","name":"Vocal"}
subscribe /sessions/abc?recursive=1&ignore_response=1
```

## Correlation and pushes

Query parameters are echoed back in `parameters`. The SDK adds `ua_id=r<n>` to every request
and matches replies on it. A message without your id is a push. Ids must be non-numeric;
the engine retypes numeric strings.

Pushes for a property arrive at `<node>/<prop>/value` with the bare value as `data`. A child
added or removed arrives as `{ path: <child>, operation: 'added' | 'removed' }`. The engine
batches pushes into `path: "multi"` messages, either an array or a packed string table; the
SDK expands both. The writer of a `set` is not sent its own value back.

## Reading

`get` on a node answers `{ properties, children: [{ path: <name> }], commands }`. Useful
parameters: `flatvalue=1` (values instead of `{value}` wrappers), `properties=0`,
`children=0`, `commands=0`, `levels=N`, `recursive=1`, `propfilter=<name>`. Empty sections
are omitted, so an empty or missing node answers `{}` with no error.

`get <node>?properties=0&children=0` lists commands with a JSON schema of each payload.
That schema is authoritative; the SDK's typed methods were written from it.

## Writing

`set <node>/<prop> <json>` writes a property. Errors come back as `error: "<code>"`:
`uasrv.invalid_property` (that path is a node), `uasrv.read_only`, `uasrv.invalid_object`
(no such property or command).

`post <node>/<command> <json>` runs a command. Session commands take `session_uid` in the
payload (except `new_track` and `set_automode_on_tracks`, which use `uid`). Context
commands live at `/sessions/<uid>/contexts/<ct>/commands/<name>`.

## Keeping the connection

The engine drops clients idle for `/status/timeout_ms` (30 s default). The SDK pings
`/ping` at half that interval. On reconnect it re-subscribes and reloads what it mirrors.

## Where things are

| What | Path |
|---|---|
| Open sessions, focused session | `/sessions`, `/sessions/focused_session` |
| Session, transport props | `/sessions/<uid>` (`playing`, `location`, `loop_start`, ...) |
| Tracks, buses | `/sessions/<uid>/tracks/<id>`, `/sessions/<uid>/buses/<id>` |
| Gain, pan, mute; meter | `<channel>/outputs/main/controls/<name>`, `<channel>/outputs/main/meters/level` |
| Solo, trims | `<channel>/controls/<name>` |
| Effects | `<channel>/effects/<slot>` with `controls/` |
| Playlists, clips | `/sessions/<uid>/playlists/<pl>/clips/<clip>` |
| Audio sources | `/workspace/sessions/<package uid>/audio/<uid>` |
| Tempo, meter, key, markers, chords | `/sessions/<uid>/{tempo_map,time_signatures,key_signatures,markers,chords}/<rowid>` |
| Edit context | `/sessions/<uid>/contexts/main` |
| Plugin catalog | `/plugins/<plugin id>` |
| Session packages | `/workspace/sessions/<uid>`, `post /workspace/query` |
| LUNA UI | `/gui/...` (LUNA only) |
| Engine status | `/status` |

## Ports

LUNA's engine listens on 4718 and appends `?port=` to Add On pages.
