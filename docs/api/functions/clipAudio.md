# Function: clipAudio()

```ts
function clipAudio(clip, sources): ClipAudio | undefined;
```

Which audio a clip plays, or `undefined` when there is nothing safe to draw: no source, or
a render LUNA has named but not yet announced. In that second case draw the clip's outline
rather than the unstretched original at the wrong scale.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `clip` | [`Clip`](../classes/Clip.md) \| [`ClipLike`](../interfaces/ClipLike.md) |
| `sources` | [`SourceLookup`](../type-aliases/SourceLookup.md) |

## Returns

[`ClipAudio`](../interfaces/ClipAudio.md) \| `undefined`

## Example

```ts
const audio = Luna.clipAudio(clip, session.sources!);
```
