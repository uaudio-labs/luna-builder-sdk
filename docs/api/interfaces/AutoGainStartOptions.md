# Interface: AutoGainStartOptions

Options for [AutoGain.start](../classes/AutoGain.md#start).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="autostart"></a> `autoStart?` | `boolean` | Start listening at once (`auto_start`), on every channel added so far. Default `true`, as LUNA's own setup does; with `false` the channel is added and waits. |
| <a id="duration"></a> `duration?` | `number` | How long to listen, in whole seconds (`duration`). Omitted or 0 uses LUNA's default. It is a service-wide setting: it applies to the whole pass, not only this channel (fact 192). |
