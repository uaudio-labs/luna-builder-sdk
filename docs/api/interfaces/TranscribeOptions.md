# Interface: TranscribeOptions

Options for [Lyrics.transcribe](../classes/Lyrics.md#transcribe).

## Extends

- [`ExtractionOptions`](ExtractionOptions.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="addtoruler"></a> `addToRuler?` | `boolean` | Also put the lines on the lyric ruler, in ticks, over the clip or selected range (`add_to_session`, fact 204). Default false: only the transcribed lines, in nanoseconds into the source. | - |
| <a id="clip"></a> `clip?` | \| `string` \| \{ `id`: `string`; `path`: `string`; `uid?`: [`Prop`](Prop.md)\<`string`\>; \} | The clip to analyse, as a `Clip` or its uid. Without one LUNA uses the edit context's selection (one track for chords). | [`ExtractionOptions`](ExtractionOptions.md).[`clip`](ExtractionOptions.md#clip) |
| <a id="context"></a> `context?` | `string` | The edit context whose selection is used without a clip. Default `main`. | [`ExtractionOptions`](ExtractionOptions.md).[`context`](ExtractionOptions.md#context) |
| <a id="provider"></a> `provider?` | `string` | A name from [Lyrics.providers](../classes/Lyrics.md#providers); LUNA's default when left out. | - |
| <a id="starttimeoutms"></a> `startTimeoutMs?` | `number` | How long to wait for LUNA to start the job. Default 30 s. | [`ExtractionOptions`](ExtractionOptions.md).[`startTimeoutMs`](ExtractionOptions.md#starttimeoutms) |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | How long to wait for it to finish. Default 30 min. | [`ExtractionOptions`](ExtractionOptions.md).[`timeoutMs`](ExtractionOptions.md#timeoutms) |
| <a id="trackuid"></a> `trackUid?` | `string` | The clip's track, which the job is matched on (fact 201). Found from a `Clip` itself; give it with a bare clip uid so a concurrent job on another track cannot be taken for this one. | [`ExtractionOptions`](ExtractionOptions.md).[`trackUid`](ExtractionOptions.md#trackuid) |
