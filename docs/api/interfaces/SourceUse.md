# Interface: SourceUse

One clip's use of one file.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="active"></a> `active` | `readonly` | `boolean` | True when the playlist is its track's active (playing) one. |
| <a id="asrender"></a> `asRender` | `readonly` | `boolean` | True when the file is the clip's rendering (`renderSourceUid`), not its source. |
| <a id="clipuid"></a> `clipUid` | `readonly` | `string` | - |
| <a id="playlistuid"></a> `playlistUid` | `readonly` | `string` | - |
| <a id="sourceuid"></a> `sourceUid` | `readonly` | `string` | - |
| <a id="trackuid"></a> `trackUid` | `readonly` | `string` \| `undefined` | The track the playlist belongs to. |
