# Function: toEvent()

```ts
function toEvent(message): Event;
```

Turn a decoded wire message into the normalised event the Store consumes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | [`WireMessage`](../interfaces/WireMessage.md) |

## Returns

[`Event`](../interfaces/Event.md)
