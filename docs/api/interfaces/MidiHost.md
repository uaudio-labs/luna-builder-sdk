# Interface: MidiHost

What a MIDI edit needs to reach LUNA's edit context: the session it lives in, the playlist
that holds the clip, and the clip's own start tick (the selection is in absolute ticks).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="clipuid"></a> `clipUid` | `readonly` | `string` | - |
| <a id="playlistuid"></a> `playlistUid` | `readonly` | `string` | - |
| <a id="sessionpath"></a> `sessionPath` | `readonly` | `string` | - |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | - |
| <a id="starttick"></a> `startTick` | `readonly` | () => `number` \| `undefined` | The clip's timeline start, ticks, or `undefined` before it loads. |
| <a id="transactionmode"></a> `transactionMode?` | `readonly` | () => [`TransactionMode`](../type-aliases/TransactionMode.md) \| `undefined` | The kind of `session.transaction()` open, if any. |
