# Function: kindForScale()

```ts
function kindForScale(nsPerPixel): OverviewKind;
```

The analysis to draw at a zoom level: `coarse` once a pixel spans at least one coarse pair
(31.25 ms), `fine` when zoomed closer. Below one fine pair per pixel the same pair repeats;
neither analysis is PCM.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `nsPerPixel` | `number` |

## Returns

[`OverviewKind`](../type-aliases/OverviewKind.md)
