# Function: propertyValue()

```ts
function propertyValue(data): unknown;
```

Unwrap a property reply. A `get` on a property answers `{ value: X }` unless `flatvalue` was
requested, in which case it answers `X` directly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

## Returns

`unknown`
