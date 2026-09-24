# Interface: WasmModule

The subset of the Emscripten module the SDK uses.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="uapersist"></a> `UAPersist?` | `object` |
| `UAPersist.erase?` | `Promise`\<`void`\> |
| `UAPersist.list?` | `Promise`\<`unknown`\> |
| `UAPersist.status` | `object` |

## Methods

### ccall()

```ts
ccall(
   name, 
   returnType, 
   argTypes, 
   args): unknown;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `returnType` | `string` \| `null` |
| `argTypes` | `string`[] |
| `args` | `unknown`[] |

#### Returns

`unknown`
