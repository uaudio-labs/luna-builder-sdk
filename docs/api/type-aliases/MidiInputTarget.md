# Type Alias: MidiInputTarget

```ts
type MidiInputTarget = 
  | MidiDevice
  | MidiPort
  | "all";
```

Where [MidiInput.listen](../classes/MidiInput.md#listen) listens: a device (its input port), an input port, or every device.
