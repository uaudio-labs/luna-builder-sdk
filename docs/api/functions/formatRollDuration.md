# Function: formatRollDuration()

```ts
function formatRollDuration(duration): string;
```

Write a roll length in LUNA's form for `transport.preRoll.set()` or `postRoll.set()`.
Omitted parts are 0. Rejects with `out_of_range` for a negative or non-integer part.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `duration` | `Partial`\<[`RollDuration`](../interfaces/RollDuration.md)\> |

## Returns

`string`

## Example

```ts
await session.transport.postRoll.set(Luna.formatRollDuration({ bars: 1 }));   // "1,0,0"
```
