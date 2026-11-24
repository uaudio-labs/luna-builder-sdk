# Interface: ActiveAudioEngineInfo

The value of the root's `active_audio_engine` property (fact 190).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="audio_engine_type"></a> `audio_engine_type` | `string` | `apollo`, `volt`, `system`, `other`, or `''` when undefined. |
| <a id="devices"></a> `devices` | [`AudioDeviceInfo`](AudioDeviceInfo.md)[] | The drivers in use, in the shape `luna.drivers.connected` lists them. |
| <a id="enabled"></a> `enabled` | `boolean` | False while LUNA runs with no audio driver. |
| <a id="outputs"></a> `outputs?` | `unknown`[] | Per-driver output settings; LUNA's own. |
