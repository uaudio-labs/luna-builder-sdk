# Type Alias: MidiOperation

```ts
type MidiOperation = 
  | {
  type: "velocity";
  value: number;
}
  | {
  percent: number;
  type: "velocityPercent";
}
  | {
  bars?: number;
  beats?: number;
  ticks?: number;
  type: "duration";
}
  | {
  percent: number;
  type: "durationPercent";
}
  | {
  denominator: number;
  numerator: number;
  type: "durationScale";
}
  | {
  type: "legato";
}
  | {
  type: "staccato";
}
  | {
  type: "reverse";
}
  | {
  semitones: number;
  type: "transpose";
}
  | {
  around?: "range" | "first" | "root";
  scale?: {
     mask: number;
     root: number;
  };
  type: "invert";
};
```

One MIDI operation. Ranges are LUNA's; anything outside them is refused before it is sent.

## Type Declaration

```ts
{
  type: "velocity";
  value: number;
}
```

| Name | Type |
| ------ | ------ |
| `type` | `"velocity"` |
| `value` | `number` |

Set every note's velocity, 1-127.

```ts
{
  percent: number;
  type: "velocityPercent";
}
```

| Name | Type |
| ------ | ------ |
| `percent` | `number` |
| `type` | `"velocityPercent"` |

Scale every velocity by `percent`, 1-200, clamped to 1-127.

```ts
{
  bars?: number;
  beats?: number;
  ticks?: number;
  type: "duration";
}
```

| Name | Type |
| ------ | ------ |
| `bars?` | `number` |
| `beats?` | `number` |
| `ticks?` | `number` |
| `type` | `"duration"` |

Make every note this long, counted from its start through the time signatures: whole
bars, beats and engine ticks (fewer than a beat, in whole display ticks). Omitted parts
are 0.

```ts
{
  percent: number;
  type: "durationPercent";
}
```

| Name | Type |
| ------ | ------ |
| `percent` | `number` |
| `type` | `"durationPercent"` |

Scale every length by `percent` (1 or more; 50 halves, 200 doubles).

```ts
{
  denominator: number;
  numerator: number;
  type: "durationScale";
}
```

| Name | Type |
| ------ | ------ |
| `denominator` | `number` |
| `numerator` | `number` |
| `type` | `"durationScale"` |

Scale every length by exactly `numerator / denominator`, rounded to the nearest tick (`1/3` and back round-trips).

```ts
{
  type: "legato";
}
```

| Name | Type |
| ------ | ------ |
| `type` | `"legato"` |

Stretch each note to the next note start in its clip, or to the next beat.

```ts
{
  type: "staccato";
}
```

| Name | Type |
| ------ | ------ |
| `type` | `"staccato"` |

Make every note 100 display ticks long.

```ts
{
  type: "reverse";
}
```

| Name | Type |
| ------ | ------ |
| `type` | `"reverse"` |

Mirror the notes' timing inside the selected range.

```ts
{
  semitones: number;
  type: "transpose";
}
```

| Name | Type |
| ------ | ------ |
| `semitones` | `number` |
| `type` | `"transpose"` |

Move every pitch by `semitones`, -24 to 24, clamped to 0-127.

```ts
{
  around?: "range" | "first" | "root";
  scale?: {
     mask: number;
     root: number;
  };
  type: "invert";
}
```

| Name | Type |
| ------ | ------ |
| `around?` | `"range"` \| `"first"` \| `"root"` |
| `scale?` | `object` |
| `scale.mask` | `number` |
| `scale.root` | `number` |
| `type` | `"invert"` |

Mirror the pitches: `'range'` (default) around the middle of the lowest and highest,
`'first'` around the first note, `'root'` around the scale root nearest the middle. With
`scale`, in scale degrees rather than semitones: `root` 0-11 (C = 0) and `mask`, a 12-bit
pitch-class set (bit N = pitch class N) that includes the root; `'root'` needs one.
