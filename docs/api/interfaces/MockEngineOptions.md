# Interface: MockEngineOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="gui"></a> `gui?` | `boolean` | Include LUNA's `/gui` (dialogs, pages, Add Ons). Default `true`, as inside LUNA; `false` models a headless or wasm engine, where `luna.gui.available()` is false (fact 103). |
