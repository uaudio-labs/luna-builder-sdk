# Interface: MidiEvent

One MIDI event to add to a clip. `tick` is relative to the clip start.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="data1"></a> `data1` | `number` | - |
| <a id="data2"></a> `data2?` | `number` | - |
| <a id="status"></a> `status` | `number` | Status byte, e.g. 0x90 note on, 0x80 note off, 0xB0 control change. |
| <a id="tick"></a> `tick` | `number` | - |
