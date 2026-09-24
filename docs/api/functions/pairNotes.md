# Function: pairNotes()

```ts
function pairNotes(rows): Note[];
```

Pair note-on rows with the next note-off of the same channel and pitch, in tick order.
Pure, and exported because a page that draws its own lanes often wants it directly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `rows` | readonly [`MidiRow`](../interfaces/MidiRow.md)[] |

## Returns

[`Note`](../interfaces/Note.md)[]

## Example

```ts
const notes = Luna.pairNotes(midi.events.items);
```
