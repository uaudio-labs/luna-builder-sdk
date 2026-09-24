# Interface: WireMessage

A message as it appears on the wire (JSON dialect), before normalisation.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="cmd"></a> `cmd?` | `string` | Present on some server messages (`update`); ignored by the client. |
| <a id="data"></a> `data?` | `unknown` | - |
| <a id="error"></a> `error?` | `string` | - |
| <a id="operation"></a> `operation?` | [`Operation`](../type-aliases/Operation.md) | - |
| <a id="parameters"></a> `parameters?` | `Record`\<`string`, `unknown`\> | - |
| <a id="path"></a> `path` | `string` | - |
