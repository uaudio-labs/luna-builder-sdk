# Function: decodeMidiEvents()

```ts
function decodeMidiEvents(events, port): MidiInputMessage[];
```

Turn one batch into messages, skipping anything that is not a channel message. Exported for tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `events` | readonly `unknown`[] |
| `port` | [`MidiPort`](../classes/MidiPort.md) |

## Returns

[`MidiInputMessage`](../interfaces/MidiInputMessage.md)[]
