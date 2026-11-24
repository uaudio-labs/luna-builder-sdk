# Interface: InsertClipOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="algtype"></a> `algType?` | [`AlgType`](../type-aliases/AlgType.md) | Time-stretch algorithm for an audio clip. Default: its track's. |
| <a id="cliptype"></a> `clipType?` | `"midi"` \| `"video"` \| `"audio"` | Default `'audio'`. |
| <a id="copyof"></a> `copyOf?` | [`Clip`](../classes/Clip.md) | Copy this clip (LUNA's `clip_uid`): the new clip takes its gain, fades, warps, MIDI and settings, placed at `startTick`-`stopTick`. |
| <a id="layer"></a> `layer?` | `number` | Layer for overlapping clips; higher plays on top. Default: above every clip it overlaps. |
| <a id="lengthfollows"></a> `lengthFollows?` | [`LengthFollows`](../type-aliases/LengthFollows.md) | What the clip's length follows on a tempo change. Default: its track's setting. |
| <a id="name"></a> `name?` | `string` | With `copyOf`, defaults to that clip's name. |
| <a id="playlistuid"></a> `playlistUid?` | `string` | The playlist (lane) that gets the clip. |
| <a id="sourcestartns"></a> `sourceStartNs?` | `number` | Offset into the source, in nanoseconds. With `copyOf`, defaults to that clip's. |
| <a id="sourcestopns"></a> `sourceStopNs?` | `number` | End in the source, in nanoseconds. With `copyOf`, defaults to that clip's. |
| <a id="sourceuid"></a> `sourceUid?` | `string` | The source file. Required, except with `copyOf`, which defaults it to that clip's. |
| <a id="starttick"></a> `startTick` | `number` | Timeline start, in ticks. |
| <a id="stoptick"></a> `stopTick` | `number` | Timeline stop, in ticks; after `startTick`. |
| <a id="trackuid"></a> `trackUid?` | `string` | The track whose active playlist gets the clip. Give this or `playlistUid`. |
