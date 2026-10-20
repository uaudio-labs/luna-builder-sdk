# Interface: Note

A note-on row paired with the note-off that ends it.

`startTick` and `stopTick` are clip-relative: they count from the clip's start, not from
the start of the session (fact 41). A note at the clip's downbeat has `startTick` 0
wherever the clip sits, and moving the clip does not change it. For a position on the
session timeline add the clip's start.

## Example

```ts
const sessionTick = (clip.start.value ?? 0) + note.startTick;
```

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `readonly` | `number` | - |
| <a id="muted"></a> `muted` | `readonly` | `boolean` | - |
| <a id="offrowid"></a> `offRowid` | `readonly` | `number` \| `undefined` | The note-off row id, `undefined` for an unterminated note-on. |
| <a id="offvelocity"></a> `offVelocity` | `readonly` | `number` \| `undefined` | - |
| <a id="pitch"></a> `pitch` | `readonly` | `number` | MIDI note number, 0-127. |
| <a id="rowid"></a> `rowid` | `readonly` | `number` | The note-on row id: the note's identity, and its `List.byId` key. |
| <a id="starttick"></a> `startTick` | `readonly` | `number` | Ticks from the clip's start, not the session's; add `clip.start.value` for a session tick. |
| <a id="stoptick"></a> `stopTick` | `readonly` | `number` \| `undefined` | Ticks from the clip's start, like `startTick`; `undefined` when no note-off follows. |
| <a id="velocity"></a> `velocity` | `readonly` | `number` | - |
