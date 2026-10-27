# Interface: PresetRow

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="factory"></a> `factory` | `boolean` | - |
| <a id="favorite"></a> `favorite` | `boolean` | - |
| <a id="isinstrumentpreset"></a> `isInstrumentPreset?` | `boolean` | True for an instrument plugin's preset listed among track presets, false for a track preset. Present only when the query asked for them (`includeInstrumentPresets`, fact 132). |
| <a id="name"></a> `name` | `string` | - |
| <a id="path"></a> `path` | `string` | - |
| <a id="pluginid"></a> `pluginId?` | `string` | For an instrument preset, the plugin it belongs to: the instrument whose factory or user preset folder holds it (fact 132). Absent when no installed instrument's folder does. |
| <a id="pluginname"></a> `pluginName?` | `string` | That plugin's name, for example `Moog Minimoog Synth`. |
| <a id="tags"></a> `tags?` | `string`[] | The preset's tags. Present only when the query asked for them (`withTags`). |
| <a id="uid"></a> `uid` | `string` | - |
| <a id="version"></a> `version` | `number` | - |
