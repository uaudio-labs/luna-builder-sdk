# Function: isHiddenSessionType()

```ts
function isHiddenSessionType(value): boolean;
```

Whether a `session_type` (string or index) is one of [HIDDEN\_SESSION\_TYPES](../variables/HIDDEN_SESSION_TYPES.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`boolean`

## Example

```ts
Luna.isHiddenSessionType(2);           // true, 'history'
Luna.isHiddenSessionType('default');   // false
```
