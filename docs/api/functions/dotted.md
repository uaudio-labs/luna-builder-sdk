# Function: dotted()

```ts
function dotted(note): number;
```

The dotted length of a note: one and a half times it. Takes and gives engine ticks, so it
composes with the note constants for a grid or a quantize value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `note` | `number` |

## Returns

`number`

## Example

```ts
Luna.dotted(Luna.QUARTER_NOTE);              // 144e9, a dotted quarter
Luna.dotted(Luna.dotted(Luna.EIGHTH_NOTE));  // not double-dotted: 1.5 * 1.5 * an eighth
```
