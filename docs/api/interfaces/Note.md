# Interface: Note

A note-on row paired with the note-off that ends it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `readonly` | `number` | - |
| <a id="muted"></a> `muted` | `readonly` | `boolean` | - |
| <a id="offrowid"></a> `offRowid` | `readonly` | `number` \| `undefined` | The note-off row id, `undefined` for an unterminated note-on. |
| <a id="offvelocity"></a> `offVelocity` | `readonly` | `number` \| `undefined` | - |
| <a id="pitch"></a> `pitch` | `readonly` | `number` | MIDI note number, 0-127. |
| <a id="rowid"></a> `rowid` | `readonly` | `number` | The note-on row id: the note's identity, and its `List.byId` key. |
| <a id="starttick"></a> `startTick` | `readonly` | `number` | Clip-relative ticks. |
| <a id="stoptick"></a> `stopTick` | `readonly` | `number` \| `undefined` | Clip-relative ticks, `undefined` when no note-off follows. |
| <a id="velocity"></a> `velocity` | `readonly` | `number` | - |
