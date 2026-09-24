# Class: WasmPort

A connection to one engine.

## Example

```ts
const port = new Luna.WebSocketPort({ port: 4718 });
await port.open();
const sessions = await port.get('/sessions', { properties: false, commands: false });
port.subscribe('/sessions', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
await port.close();
```

## Implements

- [`Port`](../interfaces/Port.md)

## Constructors

### Constructor

```ts
new WasmPort(engine, options): WasmPort;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `engine` | [`WasmEngine`](WasmEngine.md) |
| `options` | [`WasmPortOptions`](../interfaces/WasmPortOptions.md) |

#### Returns

`WasmPort`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="engine"></a> `engine` | `readonly` | [`WasmEngine`](WasmEngine.md) |

## Accessors

### connected

#### Get Signature

```ts
get connected(): boolean;
```

True between `connected` and the next `disconnected`/`closed`.

##### Returns

`boolean`

True between `connected` and the next `disconnected`/`closed`.

#### Implementation of

[`Port`](../interfaces/Port.md).[`connected`](../interfaces/Port.md#connected)

***

### url

#### Get Signature

```ts
get url(): string;
```

Engine descriptor for logs.

##### Returns

`string`

## Methods

### close()

```ts
close(): Promise<void>;
```

Detach from the engine. The engine keeps running; use `engine.shutdown()` to stop it.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Port`](../interfaces/Port.md).[`close`](../interfaces/Port.md#close)

***

### get()

```ts
get(path, options?): Promise<unknown>;
```

Read a node or property. Resolves to the reply `data`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options?` | [`GetOptions`](../interfaces/GetOptions.md) |

#### Returns

`Promise`\<`unknown`\>

#### Implementation of

[`Port`](../interfaces/Port.md).[`get`](../interfaces/Port.md#get)

***

### onStatus()

```ts
onStatus(listener): Unsubscribe;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`StatusListener`](../type-aliases/StatusListener.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`Port`](../interfaces/Port.md).[`onStatus`](../interfaces/Port.md#onstatus)

***

### post()

```ts
post(path, data?): Promise<unknown>;
```

Invoke a command. Resolves to the reply `data` (often `null`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data?` | `unknown` |

#### Returns

`Promise`\<`unknown`\>

#### Implementation of

[`Port`](../interfaces/Port.md).[`post`](../interfaces/Port.md#post)

***

### set()

```ts
set(path, data): Promise<void>;
```

Write a property. Resolves when the engine acknowledges.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `unknown` |

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`Port`](../interfaces/Port.md).[`set`](../interfaces/Port.md#set)

***

### subscribe()

```ts
subscribe(
   path, 
   handler, 
   options?): Unsubscribe;
```

Receive pushes at or below `path`. Several handlers on one path share one wire subscription;
the wire `unsubscribe` is sent when the last handler is removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md) |
| `options?` | [`SubscribeOptions`](../interfaces/SubscribeOptions.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`Port`](../interfaces/Port.md).[`subscribe`](../interfaces/Port.md#subscribe)
