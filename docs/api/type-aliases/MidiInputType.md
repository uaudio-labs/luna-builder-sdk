# Type Alias: MidiInputType

```ts
type MidiInputType = 
  | "noteOff"
  | "noteOn"
  | "polyPressure"
  | "controlChange"
  | "programChange"
  | "channelPressure"
  | "pitchBend";
```

What a channel message is, from its status byte. A note-on with velocity 0 is a `noteOff`.
