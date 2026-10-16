# Class: SendMidi

## Constructors

### Constructor

```ts
new SendMidi(): SendMidi;
```

#### Returns

`SendMidi`

## Methods

### sendAllNotesOff()

```ts
sendAllNotesOff(): Promise<void>;
```

Panic: send All Notes Off to every MIDI-capable track and connected MIDI device, in every
session.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendAllNotesOff();
```

***

### sendController()

```ts
sendController(
   sessionUid, 
   trackUid, 
   controller, 
   value, 
channel): Promise<void>;
```

Send a Control Change to a track.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `sessionUid` | `string` | `undefined` | - |
| `trackUid` | `string` | `undefined` | - |
| `controller` | `number` | `undefined` | CC number, 0-127 (7 volume, 10 pan, 64 sustain). |
| `value` | `number` | `undefined` | CC value, 0-127. |
| `channel` | `number` | `0` | MIDI channel, 0-15. Default 0. |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendController(session.uid, track.id, 64, 127);  // sustain down
```

***

### sendDeviceNote()

```ts
sendDeviceNote(
   midiInputSource, 
   note, 
   velocity, 
noteOn): Promise<void>;
```

Send a note-on or note-off on channel 1 to a MIDI input source by name, as though it came
from that device, bypassing track routing. LUNA answers success for a name it does not know
(fact 108), so a typo fails silently.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `midiInputSource` | `string` |
| `note` | `number` |
| `velocity` | `number` |
| `noteOn` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendDeviceNote('IAC Driver Bus 1', 60, 100, true);
```

***

### sendMidi()

```ts
sendMidi(
   sessionUid, 
   trackUid, 
   byte0, 
   byte1, 
byte2): Promise<void>;
```

Send any 3-byte MIDI message to one track: pitch bend, channel pressure and anything else
not wrapped here. The channel is in the status byte's low nibble.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `byte0` | `number` |
| `byte1` | `number` |
| `byte2` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendMidi(session.uid, track.id, 0xe0, 0x00, 0x40);  // pitch bend centre
```

***

### sendMidiNote()

```ts
sendMidiNote(
   sessionUid, 
   trackUid, 
   note, 
   velocity, 
noteOn): Promise<void>;
```

Send a note-on or note-off on channel 1 to one track. It also hands the note to LUNA's
record input (`record_enabled`), so record-enabled tracks hear it too.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `note` | `number` |
| `velocity` | `number` |
| `noteOn` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendMidiNote(session.uid, track.id, 60, 100, true);  // note-on
await midi.sendMidiNote(session.uid, track.id, 60, 0, false);   // note-off
```

***

### sendNoteToTracks()

```ts
sendNoteToTracks(
   sessionUid, 
   tracks, 
   note, 
   velocity, 
noteOn): Promise<void>;
```

Send the same note-on or note-off to several tracks. LUNA's own multi-track form delivers
the note but answers `uasrv.invalid_property` every time (fact 109), so this sends one
message per track instead, and hands the note to the record input once when any entry
asks for it, which is what LUNA's form does.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `tracks` | readonly [`SendMidiTrackTarget`](../interfaces/SendMidiTrackTarget.md)[] |
| `note` | `number` |
| `velocity` | `number` |
| `noteOn` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendNoteToTracks(session.uid, [
  { trackUid: piano.id, recordEnable: true },
  { trackUid: pad.id },
], 60, 100, true);
```

***

### sendProgramChange()

```ts
sendProgramChange(
   sessionUid, 
   trackUid, 
   program, 
   bankMSB?, 
bankLSB?): Promise<void>;
```

Send a Program Change to a track, after Bank Select MSB and LSB (CC 0 and CC 32) when
either bank is given; the one left out is sent as 0. The messages go in order, one at a
time, so another sender on the same track could land between them.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `program` | `number` |
| `bankMSB?` | `number` |
| `bankLSB?` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await midi.sendProgramChange(session.uid, track.id, 0);         // program only
await midi.sendProgramChange(session.uid, track.id, 5, 0, 12);  // bank 0/12, program 5
```
