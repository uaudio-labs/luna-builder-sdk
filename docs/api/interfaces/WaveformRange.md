# Interface: WaveformRange

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channels"></a> `channels` | `readonly` | readonly [`WaveformChannel`](WaveformChannel.md)[] | - |
| <a id="complete"></a> `complete` | `readonly` | `boolean` | False when the analysis ended (or is still growing) before the requested range. |
| <a id="count"></a> `count` | `readonly` | `number` | Pairs actually returned per channel. |
| <a id="index"></a> `index` | `readonly` | `number` | The first pair returned; `channels[c].min[i]` covers `[(index + i) * pairNs, (index + i + 1) * pairNs)`. |
| <a id="kind"></a> `kind` | `readonly` | [`OverviewKind`](../type-aliases/OverviewKind.md) | - |
| <a id="pairns"></a> `pairNs` | `readonly` | `number` | - |
