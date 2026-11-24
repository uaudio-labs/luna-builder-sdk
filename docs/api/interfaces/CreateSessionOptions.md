# Interface: CreateSessionOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="directorypath"></a> `directoryPath?` | `string` | Folder to create the session package in; the engine default when omitted. |
| <a id="name"></a> `name` | `string` | - |
| <a id="sessionpackageuid"></a> `sessionPackageUid?` | `string` | The new package's uid, a UUID (dashes are ignored); LUNA makes one when omitted. Give a fixed one so an Add On can find its own session again in `workspace.query()` (the row whose `uid` it is) and reopen it with `sessions.open()` (fact 237). |
| <a id="sessiontype"></a> `sessionType?` | [`NewSessionType`](../type-aliases/NewSessionType.md) | The kind of package; `'default'` when omitted. An unknown value is treated as `'default'` by LUNA. |
| <a id="standaloneid"></a> `standaloneId?` | `string` | With `sessionType: 'standalone'`: the standalone sessions subfolder to create the package in, in place of `directoryPath`. |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | How long to wait for `loaded`. Default 15 000 ms. |
