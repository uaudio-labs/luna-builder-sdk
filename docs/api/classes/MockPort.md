# Class: MockPort

One client connection to a [MockEngine](MockEngine.md).

## Implements

- [`Port`](../interfaces/Port.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="engine"></a> `engine` | `readonly` | [`MockEngine`](MockEngine.md) | The engine this port talks to, for driving it from a page that connected with `engine: 'mock'`. |

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

### reconnect()

```ts
reconnect(during?): Promise<void>;
```

Simulate a drop and recovery; subscriptions survive as they do on the real port.
Anything `during` does happens while the port is down, so its pushes are missed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `during?` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`Promise`\<`void`\>

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
   _options?): Unsubscribe;
```

Receive pushes at or below `path`. Several handlers on one path share one wire subscription;
the wire `unsubscribe` is sent when the last handler is removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `handler` | [`EventHandler`](../type-aliases/EventHandler.md) |
| `_options?` | [`SubscribeOptions`](../interfaces/SubscribeOptions.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`Port`](../interfaces/Port.md).[`subscribe`](../interfaces/Port.md#subscribe)
