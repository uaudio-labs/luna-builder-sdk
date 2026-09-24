# Interface: BootOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="engineurl"></a> `engineUrl?` | `string` | Directory URL holding `devicedwasm.js` and `devicedwasm.wasm`. Default `/__engine/`. |
| <a id="factory_"></a> `factory_?` | [`ModuleFactory`](../type-aliases/ModuleFactory.md) | Already-loaded module factory (tests, or a page that loaded the script itself). |
| <a id="hookstarget_"></a> `hooksTarget_?` | `object` | Install hooks on this object instead of `globalThis.WasmDeviced` (tests). |
| `hooksTarget_.WasmDeviced?` | [`WasmHooks`](WasmHooks.md) | - |
| <a id="log"></a> `log?` | (`line`, `level`) => `void` | Engine stdout/stderr. Default: `console.debug` / `console.warn`. |
| <a id="persist"></a> `persist?` | `boolean` | Persist the workspace to OPFS between page loads. Default true. |
| <a id="strip"></a> `strip?` | `boolean` | Ask the server for a DWARF-stripped `.wasm` (`?strip=1`, honoured by the engine's own serve scripts). |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | Boot timeout. Default 120 000 ms (the unstripped module is large). |
