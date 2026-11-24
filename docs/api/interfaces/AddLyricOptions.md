# Interface: AddLyricOptions

Options for [Lyrics.add](../classes/Lyrics.md#add).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="length"></a> `length?` | `number` | How long the line lasts, in the line's units. Default 0, as LUNA's ruler makes them. |
| <a id="sourceuid"></a> `sourceUid?` | `string` | Add the line to a recording's lyrics instead of the ruler: `location` and `length` are then nanoseconds from that audio source's start (fact 152). |
