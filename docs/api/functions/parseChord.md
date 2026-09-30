# Function: parseChord()

```ts
function parseChord(name): ParsedChord | undefined;
```

Split a chord name into root, type and bass. `undefined` when it does not start with a
note letter, since the ruler accepts any text (`N.C.`, `riff`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

## Returns

[`ParsedChord`](../interfaces/ParsedChord.md) \| `undefined`

## Example

```ts
Luna.parseChord('C');       // { root: 'C', type: '', bass: null }
Luna.parseChord('F#m7b5');  // { root: 'F#', type: 'm7b5', bass: null }
Luna.parseChord('C/E');     // { root: 'C', type: '', bass: 'E' }
```
