# Interface: MidiInputMessage

One message a MIDI device sent LUNA.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `readonly` | `number` | 0-based channel, `status & 0x0f`; `-1` for a SysEx, which has none. |
| <a id="data1"></a> `data1` | `readonly` | `number` | `0` for a SysEx. |
| <a id="data2"></a> `data2` | `readonly` | `number` | `0` for a program change or channel pressure, which have one data byte, and for a SysEx. |
| <a id="port"></a> `port` | `readonly` | [`MidiPort`](../classes/MidiPort.md) | The input port it arrived on: the listened device's, or `All`'s for `'all'`. |
| <a id="status"></a> `status` | `readonly` | `number` | Status byte with the channel in it, e.g. `0x90`-`0x9f` note on; `0xf0` for a SysEx. |
| <a id="sysex"></a> `sysex?` | `readonly` | readonly `number`[] | A SysEx's whole message, `0xf0` through `0xf7`, for `type: 'sysex'`; `undefined` for a channel message. |
| <a id="time"></a> `time` | `readonly` | `number` | When LUNA received it, in milliseconds on LUNA's MIDI input clock. Compare it with other messages' times (two notes 250 ms apart read 250 apart); it is not `performance.now()` or `Date.now()`. |
| <a id="type"></a> `type` | `readonly` | [`MidiInputType`](../type-aliases/MidiInputType.md) | - |
