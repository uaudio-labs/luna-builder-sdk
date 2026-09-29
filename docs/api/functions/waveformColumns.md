# Function: waveformColumns()

```ts
function waveformColumns(
   range, 
   width, 
   nsAt, 
   options): WaveformColumns;
```

Reduce a [WaveformRange](../interfaces/WaveformRange.md) to one min/max per drawn column, per channel, the way LUNA's
own timeline does:

- a column holds the loudest of the pairs that end inside it, so peaks survive zooming out;
- its minimum is never above zero and its maximum never below, so the shape always touches
  the zero line;
- zoomed in past one pair per column, the columns between two pairs are interpolated
  linearly between them rather than repeating a pair as a step;
- values are linear, times `gain` ([WaveformScale](../interfaces/WaveformScale.md)), clipped to -1..1. LUNA draws no
  decibel curve; its gain is the window's waveform zoom times the clip gain.

`nsAt(i)` is the file offset (ns) at the left edge of column `i`, for `i` in `0..width`,
and must not decrease; column `i` covers `[nsAt(i), nsAt(i + 1))`. For a timeline that is
[audioNsAtTick](audioNsAtTick.md) of the tick at that edge, so a tempo change bends the mapping as the
engine does. Columns outside the range are `NaN`. For a sharp shape on a high-density
display, use one column per device pixel.

Draw each channel in its own lane ([waveformLanes](waveformLanes.md)) with [traceWaveform](traceWaveform.md);
folding a stereo range into one shape makes it look mono.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `range` | [`WaveformRange`](../interfaces/WaveformRange.md) |
| `width` | `number` |
| `nsAt` | (`column`) => `number` |
| `options` | [`WaveformScale`](../interfaces/WaveformScale.md) |

## Returns

[`WaveformColumns`](../interfaces/WaveformColumns.md)

## Example

```ts
const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, clip, audio, tickAtPx(x0 + i)),
  { gain: session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20) });
const lanes = Luna.waveformLanes(cols.channels.length, top, height);
ctx.beginPath();
cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0));
ctx.fill();
```
