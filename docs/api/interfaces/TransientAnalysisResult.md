# Interface: TransientAnalysisResult

One page of `analysis/transients` (fact 207).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="count"></a> `count` | `number` | Transients in this page. |
| <a id="index"></a> `index` | `number` | The first transient in this page. |
| <a id="levels"></a> `levels` | `number`[] | Level of each transient. |
| <a id="locations"></a> `locations` | `number`[] | Positions from the source's start, in [timeUnitS](#timeunits) units (nanoseconds when that is absent). |
| <a id="raw"></a> `raw` | `Record`\<`string`, `unknown`\> | - |
| <a id="samplerate"></a> `sampleRate` | `number` \| `undefined` | - |
| <a id="timeunits"></a> `timeUnitS` | `number` \| `undefined` | - |
