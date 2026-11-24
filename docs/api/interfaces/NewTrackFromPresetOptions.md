# Interface: NewTrackFromPresetOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="beforeuid"></a> `beforeUid?` | `string` | Place the new tracks before this track. Default: after the last one. |
| <a id="folderuid"></a> `folderUid?` | `string` | Place the new tracks in this folder track. |
| <a id="makenameunique"></a> `makeNameUnique?` | `boolean` | Number the name when a track or bus already has it, as LUNA's browser does. Default true. |
| <a id="name"></a> `name?` | `string` | The new track's name. Default: the preset's name. A multi-track preset's tracks keep their own. |
| <a id="stemformat"></a> `stemFormat?` | `"stereo"` \| `"mono"` \| `string` & `object` | The stem format of the audio track an effect plugin's preset makes. Default mono. |
