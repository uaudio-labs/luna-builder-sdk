# Function: audioNsAtTick()

```ts
function audioNsAtTick(
   timeline, 
   clip, 
   audio, 
   tick): number;
```

The file offset (ns) that plays at a timeline tick inside a clip: the clip's audio start
plus the tempo-map seconds between the clip start and the tick. Linear in seconds, not in
ticks, so a tempo change inside the clip bends the mapping exactly as the engine does.

The result can lie outside `[audio.startNs, audio.stopNs)` for ticks outside the clip;
clamp before drawing there. Throws `unavailable` while the tempo map is not loaded.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `timeline` | [`Timeline`](../classes/Timeline.md) |
| `clip` | \| \{ `start`: \{ `value`: `number` \| `undefined`; \}; \} \| \{ `startTicks`: `number` \| `undefined`; \} |
| `audio` | [`ClipAudio`](../interfaces/ClipAudio.md) |
| `tick` | `number` |

## Returns

`number`

## Example

```ts
const ns = Luna.audioNsAtTick(session.musical.timeline, clip, audio, playheadTick);
```
