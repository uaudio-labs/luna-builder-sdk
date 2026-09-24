# Interface: Port

A connection to one engine.

## Example

```ts
const port = new Luna.WebSocketPort({ port: 4718 });
await port.open();
const sessions = await port.get('/sessions', { properties: false, commands: false });
port.subscribe('/sessions', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
await port.close();
```

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="connected"></a> `connected` | `readonly` | `boolean` | True between `connected` and the next `disconnected`/`closed`. |

## Methods

### close()

```ts
close(): Promise<void>;
```

Disconnect and fail any in-flight requests with [ConnectionLost](../classes/ConnectionLost.md). Idempotent.

#### Returns

`Promise`\<`void`\>

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
| `options?` | [`GetOptions`](GetOptions.md) |

#### Returns

`Promise`\<`unknown`\>

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
| `options?` | [`SubscribeOptions`](SubscribeOptions.md) |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
