# Function: parseChord()

```ts
function parseChord(name): ParsedChord | undefined;
```

Split a chord name into root, type and bass. `undefined` when it does not start with a
note letter, since the ruler accepts any text (`N.C.`, `riff`). A lowercase root or bass
is read as the note (`am7` is A minor 7, `bb` is B flat) and returned upper-cased, but only
when what follows the root is empty or starts like a chord quality, so `bridge` and
`chorus` stay text. Spaces around the slash are ignored.

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
Luna.parseChord('am7 / g'); // { root: 'A', type: 'm7', bass: 'G' }
```
