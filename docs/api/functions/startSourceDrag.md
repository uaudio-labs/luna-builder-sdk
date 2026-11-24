# Function: startSourceDrag()

```ts
function startSourceDrag(event, items): string[];
```

Fill a `dragstart` event with session files so LUNA's timeline can take the drop (fact 241).
Synchronous, as `dragstart` must be: a source's path comes from the session's package path,
so call `session.ready()` first. Answers the paths dragged.

A rendering (`source.isRender`) is not one of the session's sources: LUNA would import a
copy. Drag the clip's `sourceUid` instead.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`DragStartLike`](../interfaces/DragStartLike.md) |
| `items` | [`SourceDragItems`](../type-aliases/SourceDragItems.md) |

## Returns

`string`[]

## Example

```ts
el.addEventListener('dragstart', (e) => Luna.startSourceDrag(e, { session, source: src }));
el.addEventListener('dragstart', (e) => Luna.startSourceDrag(e, { path: '/Users/me/Loops/beat.wav' }));
```
