# Interface: SetWarpOptions

Options for [Warps.set](../classes/Warps.md#set).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contexttype"></a> `contextType?` | `string` | Edit context whose edit groups follow the new marker. Default `main`. |
| <a id="move"></a> `move?` | `number` | Ticks added to `start` before LUNA stores it. |
| <a id="rowid"></a> `rowid?` | `number` | Move the marker with this row id instead of adding one. |
| <a id="sourcestart"></a> `sourceStart` | `number` | Offset into the source file, nanoseconds. |
| <a id="start"></a> `start` | `number` | Clip-relative position, ticks. |
