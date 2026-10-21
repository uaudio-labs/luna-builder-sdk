# Interface: PresetRecommendation

One preset UA Assistant recommends for a search, best first (fact 121).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="keywordscore"></a> `keywordScore?` | `number` | The keyword half of the hybrid search, when the assistant reports it. |
| <a id="name"></a> `name` | `string` | - |
| <a id="score"></a> `score` | `number` | The assistant's reciprocal-rank-fusion score, which orders the answer; higher is better. Compare within one answer only. |
| <a id="semanticscore"></a> `semanticScore?` | `number` | The semantic half of the hybrid search, when the assistant reports it; -1 when the preset was found by keyword alone. |
| <a id="uid"></a> `uid` | `string` | - |
