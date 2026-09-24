# Interface: SeekOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="sync"></a> `sync?` | `"now"` \| `"next_bar"` \| `"loop_end"` | When playing, when the playhead jumps: `'now'` (default), at the `'next_bar'`, or at the `'loop_end'`. A play start moved during playback does nothing until then (fact 90). |
