# Interface: ChordAnalysisResult

`analysis/chord`: what chord detection found in the source (fact 207).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="key"></a> `key` | `string` \| `undefined` | The key the detector settled on, when it reports one. |
| <a id="raw"></a> `raw` | `Record`\<`string`, `unknown`\> | - |
| <a id="segments"></a> `segments` | [`ChordSegment`](ChordSegment.md)[] | - |
