# Function: formatTimeSignature()

```ts
function formatTimeSignature(ts): string;
```

Format a time signature as `4/4`; `undefined` (an unloaded prop) gives a placeholder, like
[formatBarBeat](formatBarBeat.md). Pairs with `transport.timeSignature`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ts` | \| \{ `denominator`: `number`; `numerator`: `number`; \} \| `undefined` |

## Returns

`string`

## Example

```ts
Luna.formatTimeSignature(t.timeSignature.value);   // "4/4"
Luna.formatTimeSignature(undefined);               // "-/-"
```
