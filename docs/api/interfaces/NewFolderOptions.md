# Interface: NewFolderOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="folderuid"></a> `folderUid?` | `string` | Place the new folder inside this folder. Default: the session root. |
| <a id="mode"></a> `mode?` | `"summing"` \| `"container"` | Default `'summing'`: the tracks inside play through the folder, as a bus. `'container'` only groups them; they keep routing to the nearest summing folder above, else the master. |
| <a id="name"></a> `name?` | `string` | Default `'Folder'`. |
| <a id="stemformat"></a> `stemFormat?` | `string` | Default `'stereo'`. |
