# Function: encodePayload()

```ts
function encodePayload(data): string;
```

Encode a payload the way the engine parses it: JSON for everything. Strings are quoted so the
engine can tell `"1234"` from `1234` (the ambiguity the deprecated String dialect suffers from).
[FloatLiteral](../classes/FloatLiteral.md)s are written as float literals.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

## Returns

`string`
