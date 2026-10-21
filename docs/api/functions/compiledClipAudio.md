# Function: compiledClipAudio()

```ts
function compiledClipAudio(
   timeline, 
   segment, 
   clip, 
   sources): ClipAudio | undefined;
```

Which audio one compiled segment plays, over the segment only, or `undefined` when there is
nothing safe to draw (see [clipAudio](clipAudio.md)). `clip` is the raw clip the segment is cut from
(`playlist.clips.byId(segment.clipUid.value)`): it names the source. Map ticks with
[audioNsAtTick](audioNsAtTick.md) anchored at the segment, which also reaches into a crossfade's
`fullStart`..`fullStop`.

A time-stretched clip plays LUNA's renders, one per compiled piece (fact 116), so a segment
draws its own `renderSourceUid` over `renderSourceStart`..`renderSourceStop`. On a LUNA that
does not report those, only the clip's first piece can be placed, by cutting the clip's own
render by time; a later piece is `undefined`, an outline rather than the wrong audio. While
LUNA makes a segment's rendering (after an edit that changes it, such as a crossfade) the
answer is `undefined` too, not the original file at the wrong scale.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `timeline` | [`Timeline`](../classes/Timeline.md) |
| `segment` | [`CompiledClipLike`](../interfaces/CompiledClipLike.md) |
| `clip` | \| [`Clip`](../classes/Clip.md) \| [`ClipLike`](../interfaces/ClipLike.md) & `object` |
| `sources` | [`SourceLookup`](../type-aliases/SourceLookup.md) |

## Returns

[`ClipAudio`](../interfaces/ClipAudio.md) \| `undefined`

## Example

```ts
for (const seg of lane.compiledClips.inOrder()) {
  const clip = lane.clips.byId(seg.clipUid.value);
  const audio = clip && Luna.compiledClipAudio(timeline, seg, clip, session.sources);
  if (!audio) continue;
  const range = await cache.range(audio.source, audio.startNs, audio.stopNs, kind);
  const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, seg, audio, tickAtPx(i)));
}
```
