# Interface: TempoCandidate

A tempo guess, best first.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bpm"></a> `bpm` | `number` | - |
| <a id="clamped"></a> `clamped` | `boolean` \| `undefined` | The detector's `clamped` flag: the tempo was held inside its range. |
| <a id="raw"></a> `raw` | `Record`\<`string`, `unknown`\> | The guess as stored, including its per-beat arrays. |
| <a id="ticksperbeat"></a> `ticksPerBeat` | `number` \| `undefined` | The detector's `tickPerBeat`, verbatim. |
