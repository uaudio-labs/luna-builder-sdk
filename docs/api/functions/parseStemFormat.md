# Function: parseStemFormat()

```ts
function parseStemFormat(value): 
  | "stereo"
  | "mono"
  | "2_1"
  | "lcr"
  | "lcrs"
  | "quad"
  | "5_1"
  | "6_1"
  | "7_1"
  | "5_1_4"
  | "7_1_4"
  | "9_1_6"
  | undefined;
```

A `stem_format` value as one of [STEM\_FORMATS](../variables/STEM_FORMATS.md), or `undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

  \| `"stereo"`
  \| `"mono"`
  \| `"2_1"`
  \| `"lcr"`
  \| `"lcrs"`
  \| `"quad"`
  \| `"5_1"`
  \| `"6_1"`
  \| `"7_1"`
  \| `"5_1_4"`
  \| `"7_1_4"`
  \| `"9_1_6"`
  \| `undefined`

## Example

```ts
Luna.parseStemFormat('stereo');      // 'stereo'
Luna.parseStemFormat('mid-side');    // undefined
```
