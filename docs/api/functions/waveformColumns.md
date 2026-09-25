# Function: waveformColumns()

```ts
function waveformColumns(
   range, 
   width, 
   nsAt): WaveformColumns;
```

Reduce a [WaveformRange](../interfaces/WaveformRange.md) to one min/max per drawn column, per channel: each column
holds the loudest of every pair it covers, so peaks survive zooming out, and at least the
pair under its left edge, so zooming in repeats pairs rather than leaving gaps.

`nsAt(i)` is the file offset (ns) at the left edge of column `i`, for `i` in `0..width`,
and must not decrease; column `i` covers `[nsAt(i), nsAt(i + 1))`. For a timeline that is
[audioNsAtTick](audioNsAtTick.md) of the tick at that edge, so a tempo change bends the mapping as the
engine does. Columns outside the range are `NaN`.

Draw each channel in its own lane ([waveformLanes](waveformLanes.md)); folding a stereo range into one
shape makes it look mono.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `range` | [`WaveformRange`](../interfaces/WaveformRange.md) |
| `width` | `number` |
| `nsAt` | (`column`) => `number` |

## Returns

[`WaveformColumns`](../interfaces/WaveformColumns.md)

## Example

```ts
const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, clip, audio, tickAtPx(x0 + i)));
const lanes = Luna.waveformLanes(cols.channels.length, top, height);
cols.channels.forEach((ch, c) => {
  for (let i = 0; i < cols.width; i++) {
    if (Number.isNaN(ch.max[i])) continue;
    const { mid, half } = lanes[c];
    ctx.fillRect(x0 + i, mid - ch.max[i] * half, 1, Math.max(1, (ch.max[i] - ch.min[i]) * half));
  }
});
```
