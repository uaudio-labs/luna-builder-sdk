# Interface: OutputAssignment

One row of an output's `assignments` property, as LUNA publishes it.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="connection_error"></a> `connection_error?` | `string` \| `null` | `device.missing_bus` once the destination bus was deleted. |
| <a id="name"></a> `name` | `string` | - |
| <a id="sidechain_in_use"></a> `sidechain_in_use?` | `string` | - |
| <a id="stem_format"></a> `stem_format` | `string` | - |
| <a id="type"></a> `type?` | `string` \| `null` | The destination's `bus_type` (`aux`, `master`, `cue_0`, ...). |
| <a id="value"></a> `value` | `string` \| `null` | The destination bus uid (or hardware output id); `null` once that bus was deleted. |
