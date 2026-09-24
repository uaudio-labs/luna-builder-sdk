# Interface: OverviewInfo

What LUNA reports about one analysis: total pairs, and a digest that changes when the pairs do.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="count"></a> `count` | `readonly` | `number` | - |
| <a id="md5"></a> `md5` | `readonly` | `string` \| `undefined` | Stable while the analysis is; a page cache keys on it. |
