# Type Alias: MidiInputType

```ts
type MidiInputType = 
  | "noteOff"
  | "noteOn"
  | "polyPressure"
  | "controlChange"
  | "programChange"
  | "channelPressure"
  | "pitchBend"
  | "sysex";
```

What a message is, from its status byte. A note-on with velocity 0 is a `noteOff`. `sysex` is a
whole System Exclusive message, delivered only when asked for.
