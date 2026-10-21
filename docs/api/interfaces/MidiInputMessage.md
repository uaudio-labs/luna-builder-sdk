# Interface: MidiInputMessage

One message a MIDI device sent LUNA.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `readonly` | `number` | 0-based channel, `status & 0x0f`. |
| <a id="data1"></a> `data1` | `readonly` | `number` | - |
| <a id="data2"></a> `data2` | `readonly` | `number` | `0` for a program change or channel pressure, which have one data byte. |
| <a id="port"></a> `port` | `readonly` | [`MidiPort`](../classes/MidiPort.md) | The input port it arrived on: the listened device's, or `All`'s for `'all'`. |
| <a id="status"></a> `status` | `readonly` | `number` | Status byte with the channel in it, e.g. `0x90`-`0x9f` note on. |
| <a id="time"></a> `time` | `readonly` | `number` | When LUNA received it, in milliseconds on LUNA's MIDI input clock. Compare it with other messages' times (two notes 250 ms apart read 250 apart); it is not `performance.now()` or `Date.now()`. |
| <a id="type"></a> `type` | `readonly` | [`MidiInputType`](../type-aliases/MidiInputType.md) | - |
