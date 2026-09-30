# Function: normalizeChordName()

```ts
function normalizeChordName(name): string;
```

LUNA stores `♭` and `♯` as ASCII `b` and `#` (fact 100); the SDK compares names the same way.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

## Returns

`string`

## Example

```ts
Luna.normalizeChordName('B♭m7');   // 'Bbm7'
```
