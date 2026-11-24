# Interface: ExtractionOptions

What a chord detection or lyric transcription works on.

## Extends

- [`JobRunOptions`](JobRunOptions.md)

## Extended by

- [`TranscribeOptions`](TranscribeOptions.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="clip"></a> `clip?` | \| `string` \| \{ `id`: `string`; `path`: `string`; `uid?`: [`Prop`](Prop.md)\<`string`\>; \} | The clip to analyse, as a `Clip` or its uid. Without one LUNA uses the edit context's selection (one track for chords). | - |
| <a id="context"></a> `context?` | `string` | The edit context whose selection is used without a clip. Default `main`. | - |
| <a id="starttimeoutms"></a> `startTimeoutMs?` | `number` | How long to wait for LUNA to start the job. Default 30 s. | [`JobRunOptions`](JobRunOptions.md).[`startTimeoutMs`](JobRunOptions.md#starttimeoutms) |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | How long to wait for it to finish. Default 30 min. | [`JobRunOptions`](JobRunOptions.md).[`timeoutMs`](JobRunOptions.md#timeoutms) |
| <a id="trackuid"></a> `trackUid?` | `string` | The clip's track, which the job is matched on (fact 201). Found from a `Clip` itself; give it with a bare clip uid so a concurrent job on another track cannot be taken for this one. | - |
