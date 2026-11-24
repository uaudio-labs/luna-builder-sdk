# Function: dbToGain()

```ts
function dbToGain(db): number;
```

Decibels as a linear gain: `10 ** (db / 20)`, with LUNA's hard zero at or below
[NEG\_INFINITY\_DB](../variables/NEG_INFINITY_DB.md) (fact 228). `-Infinity` is 0.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | `number` |

## Returns

`number`

## Example

```ts
Luna.dbToGain(0);           // 1
Luna.dbToGain(-6);          // 0.501
Luna.dbToGain(-144);        // 0
```
