# Type Alias: SeekTarget

```ts
type SeekTarget = 
  | number
  | {
  bar: number;
  beat?: number;
  tick?: number;
};
```

Where to seek: a tick, or a bar|beat|tick position (`beat` defaults to 1, `tick` to 0).
