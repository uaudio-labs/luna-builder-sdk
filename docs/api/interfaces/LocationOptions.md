# Interface: LocationOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="engine"></a> `engine?` | `"mock"` \| `"luna"` \| `"wasm"` | `?engine=wasm` asks for the in-page engine; `?engine=mock` for an in-memory [MockEngine](../classes/MockEngine.md). |
| <a id="engineurl"></a> `engineUrl?` | `string` | `?engine_url=/path/` overrides where the wasm engine is loaded from. |
| <a id="host"></a> `host?` | `string` | - |
| <a id="port"></a> `port?` | `number` | - |
