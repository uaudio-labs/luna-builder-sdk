# Function: traceWaveform()

```ts
function traceWaveform(
   target, 
   channel, 
   lane, 
   x0, 
   options): void;
```

Add one channel's waveform to a path as LUNA fills it: for every run of drawable columns,
one closed shape through the column centres, the top outline (`mid - axis - max * half`)
left to right and the bottom outline (`mid + axis - min * half`) back, squared off at the
run's outer edges. `NaN` columns break the shape. It only adds subpaths; call
`beginPath()` before and `fill()` after, so several channels or clips fill in one go.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`WaveformPathTarget`](../interfaces/WaveformPathTarget.md) |
| `channel` | [`WaveformChannel`](../interfaces/WaveformChannel.md) |
| `lane` | [`WaveformLane`](../interfaces/WaveformLane.md) |
| `x0` | `number` |
| `options` | [`TraceWaveformOptions`](../interfaces/TraceWaveformOptions.md) |

## Returns

`void`

## Example

```ts
ctx.beginPath();
cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0, { columnWidth: 1 / devicePixelRatio }));
ctx.fillStyle = '#000000a0';
ctx.fill();
```
