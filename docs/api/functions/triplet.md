# Function: triplet()

```ts
function triplet(note): number;
```

The triplet length of a note: two thirds of it, so three fill the time of two. Takes and
gives engine ticks (whole numbers for every note constant here, 128th included).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `note` | `number` |

## Returns

`number`

## Example

```ts
Luna.triplet(Luna.EIGHTH_NOTE);    // 32e9, three of them per beat
const grid = Luna.triplet(Luna.SIXTEENTH_NOTE);
```
