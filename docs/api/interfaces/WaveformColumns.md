# Interface: WaveformColumns

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channels"></a> `channels` | `readonly` | readonly [`WaveformChannel`](WaveformChannel.md)[] | One entry per source channel, in file order (left then right for stereo), never folded together. A column with no pair under it is `NaN` in both arrays: draw nothing there. |
| <a id="width"></a> `width` | `readonly` | `number` | Columns returned; `channels[c].min[i]` is column `i`. |
