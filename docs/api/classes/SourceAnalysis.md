# Class: SourceAnalysis

`source.analysis`: every analysis LUNA keeps for one source.

## Example

```ts
await source.analysis.load();
source.analysis.kinds.value;                 // e.g. ['overview', 'overview_coarse', 'key']
```

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="chord"></a> `chord` | `readonly` | [`ChordAnalysis`](ChordAnalysis.md) | - |
| <a id="instrument"></a> `instrument` | `readonly` | [`InstrumentAnalysis`](InstrumentAnalysis.md) | - |
| <a id="key"></a> `key` | `readonly` | [`KeyAnalysis`](KeyAnalysis.md) | - |
| <a id="kinds"></a> `kinds` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | The analyses LUNA has for this source, by node name. Includes kinds the SDK does not name. |
| <a id="overview"></a> `overview` | `readonly` | [`AnalysisNode`](AnalysisNode.md) | - |
| <a id="overviewcoarse"></a> `overviewCoarse` | `readonly` | [`AnalysisNode`](AnalysisNode.md) | - |
| <a id="path"></a> `path` | `readonly` | `string` | `<source>/analysis`. |
| <a id="tempo"></a> `tempo` | `readonly` | [`TempoAnalysis`](TempoAnalysis.md) | - |
| <a id="transients"></a> `transients` | `readonly` | [`TransientAnalysis`](TransientAnalysis.md) | - |

## Methods

### load()

```ts
load(): Promise<void>;
```

Read every analysis node's `count`, `md5` and versions once.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await source.analysis.load();
```

***

### watch()

```ts
watch(): object;
```

Subscribe so the analysis props follow LUNA: a new analysis appearing, a count growing, a
digest changing. Call `release` when done.

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `ready` | `Promise`\<`void`\> |
| `release` | [`Unsubscribe`](../type-aliases/Unsubscribe.md) |

#### Example

```ts
const w = source.analysis.watch();
await w.ready;
source.analysis.overview.count.onChange(() => redraw());
// later: w.release();
```
