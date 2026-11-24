# Interface: ImportPathOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="name"></a> `name?` | `string` | Name to store the source under. Default: the file name from `path`. |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | How long to wait for the workspace to list the new source. Default 30 000 ms. |
| <a id="type"></a> `type?` | `"midi"` \| `"video"` \| `"audio"` | What the file is. Default `'audio'`, which resolves to an [AudioSource](../classes/AudioSource.md); `'midi'` and `'video'` resolve to an [ImportedFile](ImportedFile.md) (fact 163). LUNA checks the content is what the type says and refuses it with `uasrv.invalid_value` otherwise. |
