# Variable: STEM\_FORMATS

```ts
const STEM_FORMATS: readonly ["mono", "stereo", "2_1", "lcr", "lcrs", "quad", "5_1", "6_1", "7_1", "5_1_4", "7_1_4", "9_1_6"];
```

The stem formats LUNA's enum publishes, in its spelling. A channel in a LUNA session is
`mono` or `stereo`; the rest are its multichannel formats (`2_1`, `lcr`, ..., `9_1_6`).

## Example

```ts
Luna.STEM_FORMATS.slice(0, 2);   // ['mono', 'stereo']
```
