# Function: parseBusType()

```ts
function parseBusType(value): string | undefined;
```

A `bus_type` value as a [BusType](../type-aliases/BusType.md): one of [BUS\_TYPES](../variables/BUS_TYPES.md), or a cue bus `cue_N` with
N below [MAX\_CUE\_BUSES](../variables/MAX_CUE_BUSES.md). Anything else is `undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`string` \| `undefined`

## Example

```ts
Luna.parseBusType('cue_2');    // 'cue_2'
Luna.parseBusType('cue_64');   // undefined
```
