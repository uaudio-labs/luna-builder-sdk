# Interface: MoveToFolderOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="after"></a> `after?` | `string` \| [`Channel`](../classes/Channel.md) \| `null` | Place the moved items just after this track or bus, as [Session.reorder](../classes/Session.md#reorder) does: LUNA then keeps each folder's contents together, so it decides their place among the items already in the destination. Usually a track or bus in the destination, or the folder itself for first in it. Default (or `null`): first in the destination. |
