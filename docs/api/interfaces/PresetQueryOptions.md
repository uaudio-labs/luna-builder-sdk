# Interface: PresetQueryOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="devicetypeid"></a> `deviceTypeId?` | `string` | A device type (for example `track`) instead of a plugin. |
| <a id="favorite"></a> `favorite?` | `boolean` | Only favorites. |
| <a id="includeinstrumentpresets"></a> `includeInstrumentPresets?` | `boolean` | With `deviceTypeId: 'track'`, also list the presets of every installed instrument plugin, marked `isInstrumentPreset`. An `Instrument` tag then selects instrument track presets and every instrument preset; the other tags must match either kind (fact 132). |
| <a id="limit"></a> `limit?` | `number` | Maximum number of rows. |
| <a id="matchanytag"></a> `matchAnyTag?` | `boolean` | With several `tags`, match presets carrying any of them rather than all. |
| <a id="pluginid"></a> `pluginId?` | `string` | The plugin whose presets to list. One of `pluginId` or `deviceTypeId` is required. |
| <a id="search"></a> `search?` | `string` | Case-insensitive substring to match against preset names. |
| <a id="tags"></a> `tags?` | `string` \| readonly `string`[] | Only presets carrying these tags: all of them, or any with `matchAnyTag` (fact 120). |
| <a id="withtags"></a> `withTags?` | `boolean` | Include each preset's tags in the rows. |
