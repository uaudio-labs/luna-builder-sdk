# Interface: Destination

Where an output goes. `uid` is the assignment's, the handle [Output.unassign](../classes/Output.md#unassign) takes.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="bustype"></a> `busType` | `readonly` | `string` \| `undefined` | The bus's `bus_type` (`aux`, `master`, `cue_0`...), when LUNA reports it. |
| <a id="busuid"></a> `busUid` | `readonly` | `string` \| `undefined` | The destination bus, or `undefined` once that bus has been deleted (`error` is then set). |
| <a id="error"></a> `error` | `readonly` | `string` \| `undefined` | `device.missing_bus` when the bus is gone; `undefined` while connected. |
| <a id="name"></a> `name` | `readonly` | `string` | - |
| <a id="stereo"></a> `stereo` | `readonly` | `boolean` | - |
| <a id="uid"></a> `uid` | `readonly` | `string` | - |
