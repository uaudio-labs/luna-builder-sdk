# Interface: MockMidiSent

One live MIDI message the mock delivered, in [MockEngine.midiSent](../classes/MockEngine.md#midisent).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allnotesoff"></a> `allNotesOff?` | `true` | `send_midi_all_notes_off`, recorded as CC 123. |
| <a id="bytes"></a> `bytes` | \[`number`, `number`, `number`\] | - |
| <a id="midiinputsource"></a> `midiInputSource?` | `string` | - |
| <a id="outputportuid"></a> `outputPortUid?` | `string` | Sent out of this MIDI output port (a `midi_input_source` naming an output port's uid, fact 124). |
| <a id="recordenabled"></a> `recordEnabled` | `boolean` | Also handed to LUNA's record input. |
| <a id="sessionuid"></a> `sessionUid?` | `string` | - |
| <a id="trackuid"></a> `trackUid?` | `string` | - |
