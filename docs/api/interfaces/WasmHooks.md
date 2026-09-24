# Interface: WasmHooks

The page-side hooks the engine calls (`globalThis.WasmDeviced`).

## Methods

### onReply()

```ts
onReply(
   id, 
   error, 
   json): void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `number` |
| `error` | `string` |
| `json` | `string` |

#### Returns

`void`

***

### onState()

```ts
onState(state, detail): void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `string` |
| `detail` | `string` |

#### Returns

`void`

***

### onUpdate()

```ts
onUpdate(path, json): void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `json` | `string` |

#### Returns

`void`
