# Interface: NewNote

One note for [Playlist.createNotes](../classes/Playlist.md#createnotes). Ticks are absolute (session ticks), as LUNA's
verb takes them, unlike the clip-relative ticks of the [Note](Note.md)s it returns. There is no
channel: LUNA's `create_note` writes every note on channel 0 (fact 111). For another
channel, add the notes to a clip with [Clip.addNotes](../classes/Clip.md#addnotes), which takes one.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="pitch"></a> `pitch` | `number` | - |
| <a id="starttick"></a> `startTick` | `number` | - |
| <a id="stoptick"></a> `stopTick` | `number` | - |
| <a id="velocity"></a> `velocity?` | `number` | Note-on and note-off velocity, 1-127. Default 100. |
| <a id="velocityoff"></a> `velocityOff?` | `number` | Note-off velocity, when it differs from the note-on. |
