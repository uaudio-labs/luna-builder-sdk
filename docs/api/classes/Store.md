# Class: Store

## Constructors

### Constructor

```ts
new Store(port, scheduler): Store;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `port` | [`Port`](../interfaces/Port.md) |
| `scheduler` | [`Scheduler`](Scheduler.md) |

#### Returns

`Store`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="port"></a> `port` | `readonly` | [`Port`](../interfaces/Port.md) |
| <a id="scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](Scheduler.md) |

## Accessors

### pendingReads

#### Get Signature

```ts
get pendingReads(): number;
```

How many reads are in flight.

##### Returns

`number`

## Methods

### cell()

```ts
cell<T>(nodePath, property): Cell<T>;
```

The cell for `<node>/<property>`. Created on demand, `undefined` until loaded or pushed.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |
| `property` | `string` |

#### Returns

[`Cell`](Cell.md)\<`T`\>

***

### children()

```ts
children(nodePath): Cell<string[]>;
```

The cell holding a node's child names, in engine order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

[`Cell`](Cell.md)\<`string`[]\>

***

### close()

```ts
close(): Promise<void>;
```

#### Returns

`Promise`\<`void`\>

***

### forget()

```ts
forget(nodePath): void;
```

Drop a subtree from the mirror (after a `removed`, or when a view is disposed).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

`void`

***

### hasProperties()

```ts
hasProperties(nodePath): boolean;
```

True once any property of `nodePath` has been written by a read or a push.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

`boolean`

***

### knowsNode()

```ts
knowsNode(nodePath): boolean;
```

True once `load` or a push has given this node a child list.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

`boolean`

***

### load()

```ts
load(path, options?): Promise<unknown>;
```

`get` a path and apply the reply to cells. Resolves to the raw reply. A property path fills
its own cell; a node path fills its properties and children, recursing into nested children
when the reply carries them (`levels`/`recursive`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options?` | [`GetOptions`](../interfaces/GetOptions.md) |

#### Returns

`Promise`\<`unknown`\>

***

### onEvent()

```ts
onEvent(listener): Unsubscribe;
```

Raw event tap, called before cells are written. For delta-stream properties.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | (`event`) => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### readsSettled()

```ts
readsSettled(): Promise<void>;
```

Resolve once no read is in flight, including reads started while waiting (a member the
engine just added is fetched on its own, and that fetch can start another). Never
rejects; a failed read counts as finished.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.store.readsSettled();
```

***

### reloadAll()

```ts
reloadAll(): Promise<void>;
```

Re-`get` every loaded path. Called automatically after a reconnect.

#### Returns

`Promise`\<`void`\>

***

### set()

```ts
set(
   nodePath, 
   property, 
   value, 
wire): Promise<void>;
```

Write a property: the cell takes `value` at once, and `wire` (default `value`) is what is
sent, for a value whose wire form differs, such as a number that must go as a float literal.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `nodePath` | `string` | `undefined` |
| `property` | `string` | `undefined` |
| `value` | `unknown` | `undefined` |
| `wire` | `unknown` | `value` |

#### Returns

`Promise`\<`void`\>

***

### watch()

```ts
watch(path, options): object;
```

Subscribe to `path` and load it. Refcounted: the wire subscription is shared and released
when the last watcher calls `release`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options` | \{ `load?`: `false` \| [`GetOptions`](../interfaces/GetOptions.md); `recursive?`: `boolean`; \} |
| `options.load?` | `false` \| [`GetOptions`](../interfaces/GetOptions.md) |
| `options.recursive?` | `boolean` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `ready` | `Promise`\<`void`\> |
| `release` | [`Unsubscribe`](../type-aliases/Unsubscribe.md) |
