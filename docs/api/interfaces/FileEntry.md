# Interface: FileEntry

One entry of [Gui.listFiles](../classes/Gui.md#listfiles): a file or folder directly inside the listed folder.

## Extended by

- [`NestedFileEntry`](NestedFileEntry.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="isdirectory"></a> `isDirectory` | `boolean` | True for a folder, or a link to one. |
| <a id="name"></a> `name` | `string` | The entry's name, without its folder. |
| <a id="path"></a> `path` | `string` | Absolute path, for the engine (`session.importPath()`) or [Gui.serveMediaFile](../classes/Gui.md#servemediafile), which gives the page a URL for any file in a blessed folder. |
