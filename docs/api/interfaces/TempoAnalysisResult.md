# Interface: TempoAnalysisResult

`analysis/tempo` (fact 207).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="candidates"></a> `candidates` | [`TempoCandidate`](TempoCandidate.md)[] | - |
| <a id="raw"></a> `raw` | `Record`\<`string`, `unknown`\> | - |
| <a id="samplerate"></a> `sampleRate` | `number` \| `undefined` | - |
| <a id="tempoisconstant"></a> `tempoIsConstant` | `boolean` \| `undefined` | - |
| <a id="timeunits"></a> `timeUnitS` | `number` \| `undefined` | Seconds per unit of the integer timestamps in the guesses; absent before minor version 2. |
