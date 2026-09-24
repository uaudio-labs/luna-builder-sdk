# Function: decodeMessage()

```ts
function decodeMessage(text): WireMessage | undefined;
```

Decode one frame. Tolerates an 8-byte `JSON` header (magic + length) and a trailing NUL, and
returns `undefined` for anything unparseable so the receive loop survives a bad frame.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

[`WireMessage`](../interfaces/WireMessage.md) \| `undefined`
