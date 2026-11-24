# Function: gainToDb()

```ts
function gainToDb(gain): number;
```

A linear gain as decibels: `20 * log10(gain)`. Silence (0, or anything not above it) is
`-Infinity`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `gain` | `number` |

## Returns

`number`

## Example

```ts
Luna.gainToDb(1);     // 0
Luna.gainToDb(0.5);   // -6.02
Luna.gainToDb(0);     // -Infinity
// not a fader position: for that use the control's taper
track.gain.taper.value?.toDb(track.gain.normalized.value ?? 0);
```
