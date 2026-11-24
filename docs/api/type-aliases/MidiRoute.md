# Type Alias: MidiRoute

```ts
type MidiRoute = 
  | {
  channel: number;
  track:   | {
     id: string;
   }
     | string;
}
  | {
  channel: number;
  device:   | {
     name: Prop<string>;
   }
     | string;
};
```

One route for [MidiOutputs.set](../classes/MidiOutputs.md#set): to a track or a bus (by object or uid), or to a MIDI
device by its name (`luna.midiDevices` lists them). `channel` is stored as given: LUNA's own
menu writes 0 for all channels and 1-16 for one channel (fact 220).
