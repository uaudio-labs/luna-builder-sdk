# Interface: ClipAudio

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="source"></a> `source` | `readonly` | [`AudioSource`](../classes/AudioSource.md) | The source whose overview matches what the engine plays. |
| <a id="startns"></a> `startNs` | `readonly` | `number` | File range in nanoseconds: the clip's source range, or the whole render. |
| <a id="stopns"></a> `stopNs` | `readonly` | `number` | - |
| <a id="stretched"></a> `stretched` | `readonly` | `boolean` | True when `source` is LUNA's time-stretched render rather than the original file. |
