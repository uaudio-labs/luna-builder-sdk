# Interface: SettleOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="disposed"></a> `disposed?` | () => `boolean` | Abort early with `disposed` when the object goes away under us. |
| <a id="flush"></a> `flush?` | () => `void` | Flush the Store scheduler after a refresh so derived props are current. |
| <a id="path"></a> `path?` | `string` | Path to name in the error. |
| <a id="refresh"></a> `refresh?` | () => `Promise`\<`unknown`\> | Re-read the node while waiting. LUNA holds pushes back inside a batch transaction but answers reads at once (fact 60). |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | Default [EDIT\_TIMEOUT\_MS](../variables/EDIT_TIMEOUT_MS.md). |
