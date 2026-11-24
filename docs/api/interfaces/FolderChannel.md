# Interface: FolderChannel

What a tree is built from: a [Track](../classes/Track.md) or [Bus](../classes/Bus.md), or anything shaped like one.
Only a channel with a `folderMode` that is `summing` or `container` is a folder.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="foldermode"></a> `folderMode?` | `readonly` | `object` |
| `folderMode.value` | `readonly` | [`FolderMode`](../type-aliases/FolderMode.md) \| `undefined` |
| <a id="folderuid"></a> `folderUid` | `readonly` | `object` |
| `folderUid.value` | `readonly` | `string` \| `null` \| `undefined` |
| <a id="id"></a> `id` | `readonly` | `string` |
| <a id="order"></a> `order` | `readonly` | `object` |
| `order.value` | `readonly` | `number` \| `undefined` |
