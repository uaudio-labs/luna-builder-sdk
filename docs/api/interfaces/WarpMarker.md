# Interface: WarpMarker

One warp marker as plain data, for [Warps.markers](../classes/Warps.md#markers).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="rowid"></a> `rowid` | `readonly` | `number` | The marker's row id, which [Warps.set](../classes/Warps.md#set) takes to move it. |
| <a id="sourcestart"></a> `sourceStart` | `readonly` | `number` | Offset into the source file, nanoseconds. |
| <a id="start"></a> `start` | `readonly` | `number` | Clip-relative position, ticks. |
| <a id="type"></a> `type` | `readonly` | [`WarpType`](../type-aliases/WarpType.md) \| `undefined` | - |
