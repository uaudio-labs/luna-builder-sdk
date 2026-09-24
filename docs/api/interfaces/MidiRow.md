# Interface: MidiRow

One row of a clip's MIDI table: a single MIDI message at a clip-relative tick.

This is the shape read back from the engine. [MidiEvent](MidiEvent.md) is the (smaller) shape
accepted when writing.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `readonly` | `number` | 0-based channel, `status & 0x0f`. |
| <a id="data1"></a> `data1` | `readonly` | `number` | - |
| <a id="data2"></a> `data2` | `readonly` | `number` | - |
| <a id="enabled"></a> `enabled` | `readonly` | `boolean` | `false` is LUNA's per-note mute on a note-on row. |
| <a id="rowid"></a> `rowid` | `readonly` | `number` | The engine's row id: this row's identity, stable across moves and trims. |
| <a id="status"></a> `status` | `readonly` | `number` | Status byte with the channel in it: `0x90`-`0x9f` note on, `0xb0`-`0xbf` CC, and so on. |
| <a id="tick"></a> `tick` | `readonly` | `number` | Ticks from the clip's start (fact 41), `TICKS_PER_BEAT` per quarter note. |
