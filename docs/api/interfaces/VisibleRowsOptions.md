# Interface: VisibleRowsOptions\<T\>

Options for [FolderTree.visibleRows](../classes/FolderTree.md#visiblerows).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`FolderChannel`](FolderChannel.md) | [`Track`](../classes/Track.md) \| [`Bus`](../classes/Bus.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="collapsed"></a> `collapsed?` | `Iterable`\<`string`, `any`, `any`\> \| `null` | Ids of collapsed folders: pass the edit context's `collapsedFolders.value` as it is. Everything inside a collapsed folder is hidden; ids of anything else are ignored, since LUNA does not prune that list when a folder is deleted. |
| <a id="filter"></a> `filter?` | (`row`) => `boolean` | Which rows to draw. It hides only the rows it rejects: a folder left out by it still hides its contents when collapsed, and its contents are judged on their own. |
