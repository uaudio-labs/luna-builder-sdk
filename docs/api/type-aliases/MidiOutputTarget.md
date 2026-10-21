# Type Alias: MidiOutputTarget

```ts
type MidiOutputTarget = 
  | MidiDevice
  | MidiPort
  | string;
```

Where a `...ToOutput` method sends: a MIDI device (its output port), one of its output ports,
or an output port's `uid`.
