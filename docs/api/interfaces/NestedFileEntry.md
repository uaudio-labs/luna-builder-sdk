# Interface: NestedFileEntry

One entry of [Gui.listAllFiles](../classes/Gui.md#listallfiles): a [FileEntry](FileEntry.md) anywhere below the listed folder.

## Extends

- [`FileEntry`](FileEntry.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="isdirectory"></a> `isDirectory` | `boolean` | True for a folder, or a link to one. | [`FileEntry`](FileEntry.md).[`isDirectory`](FileEntry.md#isdirectory) |
| <a id="name"></a> `name` | `string` | The entry's name, without its folder. | [`FileEntry`](FileEntry.md).[`name`](FileEntry.md#name) |
| <a id="path"></a> `path` | `string` | Absolute path, for the engine (`session.importPath()`) or [Gui.serveMediaFile](../classes/Gui.md#servemediafile), which gives the page a URL for any file in a blessed folder. | [`FileEntry`](FileEntry.md).[`path`](FileEntry.md#path) |
| <a id="relativepath"></a> `relativePath` | `string` | Where it is, from the listed folder, `/`-separated: `'Loops/kick.wav'`. | - |
