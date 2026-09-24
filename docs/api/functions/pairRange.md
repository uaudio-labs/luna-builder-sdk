# Function: pairRange()

```ts
function pairRange(
   startNs, 
   stopNs, 
   kind): PairRange;
```

The overview pairs covering `[startNs, stopNs)` of a source. Both are file offsets, never timeline ticks.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `startNs` | `number` | `undefined` |
| `stopNs` | `number` | `undefined` |
| `kind` | [`OverviewKind`](../type-aliases/OverviewKind.md) | `'fine'` |

## Returns

[`PairRange`](../interfaces/PairRange.md)
