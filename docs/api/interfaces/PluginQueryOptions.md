# Interface: PluginQueryOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="categories"></a> `categories?` | readonly `string`[] | Only plugins in any of these categories, named as LUNA's plugins browser names them (`EQ`, `Reverb`, ...). |
| <a id="channeluid"></a> `channelUid?` | `string` | With `insertType`, the track or bus whose format (mono, stereo) the plugins must run in. Needs `sessionUid`. |
| <a id="favoritesonly"></a> `favoritesOnly?` | `boolean` | Only favorites. |
| <a id="inserttype"></a> `insertType?` | `string` | Only plugins LUNA would put in this slot (`effect_0`, `instrument`, `midi_0`, `record_fx_0`, ...). |
| <a id="limit"></a> `limit?` | `number` | Maximum number of rows. |
| <a id="search"></a> `search?` | `string` | Case-insensitive text matched against plugin names and manufacturers. |
| <a id="sessionuid"></a> `sessionUid?` | `string` | - |
