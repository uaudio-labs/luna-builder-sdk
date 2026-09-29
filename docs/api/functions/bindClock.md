# Function: bindClock()

```ts
function bindClock(
   el, 
   transport, 
   options): Unsubscribe;
```

Bind `el` to the transport's playhead clock. Reads [Transport.seconds](../classes/Transport.md#seconds), so the
session's tempo map must be loaded (`session.ready()` does that). Returns a release
function that cancels the frame loop and the listeners.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `el` | `HTMLElement` |
| `transport` | [`Transport`](../classes/Transport.md) |
| `options` | [`ClockOptions`](../interfaces/ClockOptions.md) |

## Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
