# Type Alias: MidiOutputDestination

```ts
type MidiOutputDestination = 
  | {
  kind: "track";
  uid: string;
}
  | {
  kind: "bus";
  uid: string;
}
  | {
  kind: "effect";
  uid: string;
}
  | {
  kind: "device";
  name: string;
};
```

One assignment's destination. `uid` is a track's, a bus's or an effect's; `name` a MIDI device's.
