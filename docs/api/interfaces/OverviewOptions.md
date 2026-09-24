# Interface: OverviewOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="count"></a> `count?` | `number` | Maximum pairs per channel, 1-4096. Default 1024; no unbounded reads. |
| <a id="index"></a> `index?` | `number` | Zero-based overview-pair index, not a sample or channel index. Default 0. |
| <a id="kind"></a> `kind?` | [`OverviewKind`](../type-aliases/OverviewKind.md) | Which analysis to page. Default `fine`. |
