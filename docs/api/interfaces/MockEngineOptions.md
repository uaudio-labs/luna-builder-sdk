# Interface: MockEngineOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="autogain"></a> `autoGain?` | `boolean` | Publish LUNA's Auto Gain service at `/auto_gain`. Default `true`; `false` models a LUNA whose Auto Gain feature is off, where the node does not exist (fact 191). |
| <a id="compiledclipfades"></a> `compiledClipFades?` | `boolean` | Publish `full_start`/`full_stop` and the `fade_in_*`/`fade_out_*` properties on compiled clips. Default `true`; `false` models a LUNA from before they were added (fact 116). |
| <a id="gui"></a> `gui?` | `boolean` | Include LUNA's `/gui` (dialogs, pages, Add Ons). Default `true`, as inside LUNA; `false` models a headless engine, where `luna.gui.available()` is false (fact 103). |
