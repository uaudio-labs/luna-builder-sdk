# Function: bootWasmEngine()

```ts
function bootWasmEngine(options): Promise<WasmEngine>;
```

Load and boot the engine once per page. Resolves when the services report `running`.
Rejects with `Luna.Error` code `engine_boot` on failure or timeout.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BootOptions`](../interfaces/BootOptions.md) |

## Returns

`Promise`\<[`WasmEngine`](../classes/WasmEngine.md)\>
