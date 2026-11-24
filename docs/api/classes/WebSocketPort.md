# Class: WebSocketPort

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
new WebSocketPort(options): WebSocketPort;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`WebSocketPortOptions`](../interfaces/WebSocketPortOptions.md) |

#### Returns

`WebSocketPort`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="url"></a> `url` | `readonly` | `string` |

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

## Methods

### close()

```ts
close(): Promise<void>;
```

Disconnect and fail any in-flight requests with [ConnectionLost](ConnectionLost.md). Idempotent.

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

### open()

```ts
open(): Promise<void>;
```

Connect. Resolves once the socket is open. Rejects with [NotRunning](NotRunning.md) if the first
attempt fails, or has not opened within `requestTimeoutMs`; later drops are handled by
reconnect instead.

#### Returns

`Promise`\<`void`\>

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
set(
   path, 
   data, 
params?): Promise<void>;
```

Write a property. Resolves when the engine acknowledges. `params` are request parameters
sent beside the write as query parameters, for a write the engine qualifies by them
(`name_modified=true` on a track rename, fact 165); most writes have none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `data` | `unknown` |
| `params?` | `Record`\<`string`, `string`\> |

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
