# Interface: FolderRow\<T\>

One row of a [FolderTree](../classes/FolderTree.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`FolderChannel`](FolderChannel.md) | [`Track`](../classes/Track.md) \| [`Bus`](../classes/Bus.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `readonly` | `T` | The track or bus. |
| <a id="childids"></a> `childIds` | `readonly` | readonly `string`[] | The rows directly inside it, in order; empty for a track or an empty folder. |
| <a id="depth"></a> `depth` | `readonly` | `number` | 0 at the session root, one more per folder level. |
| <a id="id"></a> `id` | `readonly` | `string` | `channel.id`. |
| <a id="isfolder"></a> `isFolder` | `readonly` | `boolean` | Whether the channel is a folder (`summing` or `container`). |
| <a id="parentid"></a> `parentId` | `readonly` | `string` \| `null` | The folder it is drawn in, `null` at the root. For a channel re-rooted as an anomaly this differs from its `folderUid`, which the anomaly keeps. |
