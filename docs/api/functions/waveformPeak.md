# Function: waveformPeak()

```ts
function waveformPeak(range): number;
```

The loudest absolute value in a range, across every channel, in 0..1; 0 when the range is
empty. To normalize a clip, pass `gain: 1 / peak` to [waveformColumns](waveformColumns.md), taking the
peak from the clip's whole range, not the visible columns, so the scale holds while
scrolling.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `range` | [`WaveformRange`](../interfaces/WaveformRange.md) |

## Returns

`number`

## Example

```ts
const peak = Luna.waveformPeak(range);   // 0.25 for a clip peaking at -12 dBFS
```
