# Interface: InstrumentAnalysisResult

`analysis/instrument` (fact 207).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classes"></a> `classes` | `string`[] \| `undefined` | Every class the detector could answer; absent before minor version 2. |
| <a id="classidindex"></a> `classIdIndex` | `number` \| `undefined` | Index of [instrument](#instrument) in [classes](#classes). |
| <a id="confidence"></a> `confidence` | `number` | - |
| <a id="instrument"></a> `instrument` | `string` | The class the detector chose, e.g. `vocals`; `''` when it had none. |
| <a id="raw"></a> `raw` | `Record`\<`string`, `unknown`\> | - |
