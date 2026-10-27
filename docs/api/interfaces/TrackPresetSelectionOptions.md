# Interface: TrackPresetSelectionOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="category"></a> `category?` | `"Instrument"` \| `"Multi-Track"` \| `"Audio"` \| `"Bus"` \| `null` | The category to start on. Default `null`: all of them. |
| <a id="limit"></a> `limit?` | `number` | Most rows in `presets`. Default: all of them. |
| <a id="querydelayms"></a> `queryDelayMs?` | `number` | Quiet time after a change before the list is queried, in ms. Default 100. |
