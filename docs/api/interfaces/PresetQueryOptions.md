# Interface: PresetQueryOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="devicetypeid"></a> `deviceTypeId?` | `string` | A device type (for example `track`) instead of a plugin. |
| <a id="favorite"></a> `favorite?` | `boolean` | Only favorites. |
| <a id="limit"></a> `limit?` | `number` | Maximum number of rows. |
| <a id="pluginid"></a> `pluginId?` | `string` | The plugin whose presets to list. One of `pluginId` or `deviceTypeId` is required. |
| <a id="search"></a> `search?` | `string` | Substring to match against preset names. |
