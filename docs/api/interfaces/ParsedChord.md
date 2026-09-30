# Interface: ParsedChord

A chord name split the way LUNA spells chords: root, type suffix, slash bass.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bass"></a> `bass` | `string` \| `null` | The slash-chord bass, `E` for `C/E`, else `null`. |
| <a id="root"></a> `root` | `string` | `C`, `F#`, `Bb`. |
| <a id="type"></a> `type` | `string` | What follows the root, verbatim: `''` (major), `m`, `7`, `maj7`, `m7b5`, `sus4`. |
