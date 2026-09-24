# Interface: Overview

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="binspersecond"></a> `binsPerSecond` | `number` | Bins per second of audio: 384 fine, 32 coarse. |
| <a id="channels"></a> `channels` | `object`[] | - |
| <a id="count"></a> `count` | `number` | Pairs actually returned per channel. Short of what was asked means the analysis ended there, or is still growing. |
| <a id="index"></a> `index` | `number` | The first pair returned: `channels[c].min[i]` covers pair `index + i`. |
| <a id="kind"></a> `kind` | [`OverviewKind`](../type-aliases/OverviewKind.md) | Which analysis this came from. |
