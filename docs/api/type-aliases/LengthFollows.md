# Type Alias: LengthFollows

```ts
type LengthFollows = "ticks" | "time";
```

What a clip's length follows when the tempo changes (LUNA's `length_follows`): `'ticks'`
keeps its musical length, `'time'` its length in seconds. Left out, the clip follows its
track.
