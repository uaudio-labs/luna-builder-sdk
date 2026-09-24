# Interface: AudioInput

A device input a track can record from, as [Client.audioInputs](../classes/Client.md#audioinputs) lists it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="deviceid"></a> `deviceId` | `readonly` | `string` | The device this input belongs to, e.g. `BuiltInMicrophoneDevice`. |
| <a id="inuse"></a> `inUse` | `readonly` | `boolean` | True when another track already records from it. |
| <a id="name"></a> `name` | `readonly` | `string` | - |
| <a id="stemformat"></a> `stemFormat` | `readonly` | `string` | `mono` or `stereo`. |
| <a id="uid"></a> `uid` | `readonly` | `string` | What a track's `inputNodeUid` is set to. |
