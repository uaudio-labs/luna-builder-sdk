# Interface: BounceOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="channeluids"></a> `channelUids` | `string`[] | Channels to bounce, by uid. Tracks and buses both work. |
| <a id="name"></a> `name?` | `string` | - |
| <a id="outputpaths"></a> `outputPaths?` | `string`[] | One absolute output path per channel, in `channelUids` order. Given these, the render writes files instead of adding sources to the session. |
| <a id="range"></a> `range?` | `object` | Absolute ticks to render; applied as the timeline selection and restored afterwards. |
| `range.startTick` | `number` | - |
| `range.stopTick` | `number` | - |
| <a id="realtime"></a> `realTime?` | `boolean` | Render in real time instead of offline (offline reports no time remaining). |
| <a id="recordpoint"></a> `recordPoint?` | `"pre_effects"` \| `"post_effects"` \| `"post_pan"` | - |
