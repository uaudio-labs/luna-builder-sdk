# Function: decodeMidiEvents()

```ts
function decodeMidiEvents(
   events, 
   port, 
   sysex): MidiInputMessage[];
```

Turn one batch into messages, skipping anything that is not a channel message, or a SysEx
when `sysex` is true. A SysEx is `[time_ms, 0xf0, [0xf0, ..., 0xf7]]` (fact 138). Exported for
tests.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `events` | readonly `unknown`[] | `undefined` |
| `port` | [`MidiPort`](../classes/MidiPort.md) | `undefined` |
| `sysex` | `boolean` | `false` |

## Returns

[`MidiInputMessage`](../interfaces/MidiInputMessage.md)[]
