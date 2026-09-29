# Function: waveformLanes()

```ts
function waveformLanes(
   channels, 
   top, 
   height, 
   gap): readonly WaveformLane[];
```

Split `height` pixels from `top` into one equal lane per channel, stacked in file order
(left above right for stereo), each with a zero line and a full-scale half-height.
`gap` pixels are kept clear at the top and bottom of every lane; LUNA keeps none.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `channels` | `number` | `undefined` |
| `top` | `number` | `undefined` |
| `height` | `number` | `undefined` |
| `gap` | `number` | `1` |

## Returns

readonly [`WaveformLane`](../interfaces/WaveformLane.md)[]

## Example

```ts
const [left, right] = Luna.waveformLanes(2, 20, 80, 0);   // left.mid 40, right.mid 80, half 20
```
