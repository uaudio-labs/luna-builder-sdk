# Interface: LyricProviders

The lyric transcription services LUNA offers (`/lyric_transcription`, fact 204).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="available"></a> `available` | `boolean` | Whether any provider can run now. |
| <a id="defaultprovider"></a> `defaultProvider` | `string` | The one LUNA uses when none is named. |
| <a id="providers"></a> `providers` | `string`[] | Provider names to pass as `provider`. |
