# Interface: ImportedFile

A MIDI or video file copied into a session's package by [Session.importPath](../classes/Session.md#importpath). Only the
file is added: no track or clip is made (fact 163). A MIDI file is filed in the package's
`midi` folder, a video file, with its extension, in `video`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="name"></a> `name` | `string` | The name it was stored under. |
| <a id="type"></a> `type` | `"midi"` \| `"video"` | - |
| <a id="uid"></a> `uid` | `string` | The file's uid in the package. |
