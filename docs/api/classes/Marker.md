# Class: Marker

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="barbeat"></a> `barBeat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`BarBeat`](../interfaces/BarBeat.md)\> | [location](#location) as bar|beat, following the marker and the session's time signatures, so a marker list needs no listeners of its own. Format it with `Luna.formatBarBeat`. Assumes 4/4 until `session.musical` has loaded. **Example** `marker.barBeat.onChange(() => cell.textContent = Luna.formatBarBeat(marker.barBeat.value));` | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="color"></a> `color` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | ARGB packed integer. | - |
| <a id="comments"></a> `comments` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="location"></a> `location` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Position in ticks. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="rowid"></a> `rowid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="seconds"></a> `seconds` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | [location](#location) in seconds from the session start, following the marker and the tempo map. `undefined` until `session.musical` has loaded the tempo map; it never assumes a tempo. **Example** `marker.seconds.onChange(() => cell.textContent = Luna.formatMinSec(marker.seconds.value));` | - |

## Accessors

### disposed

#### Get Signature

```ts
get disposed(): boolean;
```

True once the engine removed this node or its owner was disposed. A disposed object's
props stop updating and its commands reject with [Disposed](Disposed.md).

##### Returns

`boolean`

#### Inherited from

[`Node`](Node.md).[`disposed`](Node.md#disposed)

***

### id

#### Get Signature

```ts
get id(): string;
```

Last path segment: the uid or name the engine addresses this node by.

##### Returns

`string`

#### Inherited from

[`Node`](Node.md).[`id`](Node.md#id)

## Methods

### command()

```ts
command<R>(name, payload?): Promise<R>;
```

Invoke any command on this node by name. Prefer a typed method when one exists.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `R` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `payload?` | `unknown` |

#### Returns

`Promise`\<`R`\>

#### Inherited from

[`Node`](Node.md).[`command`](Node.md#command)

***

### delete()

```ts
delete(): Promise<unknown>;
```

Delete this marker and resolve once it has left the list.

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await marker.delete();
```

***

### load()

```ts
load(options?): Promise<void>;
```

Fetch this node's properties (and child names) once. Later calls return the same promise.
Pushes keep the cells current afterwards as long as an ancestor is watched.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`GetOptions`](../interfaces/GetOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`Node`](Node.md).[`load`](Node.md#load)

***

### moveTo()

```ts
moveTo(tick): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await marker.moveTo(Luna.WHOLE_NOTE * 16);
```

***

### onDispose()

```ts
onDispose(listener): Unsubscribe;
```

Called once when this object is disposed. Returns an unsubscribe.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
track.onDispose(() => row.remove());
```

#### Inherited from

[`Node`](Node.md).[`onDispose`](Node.md#ondispose)

***

### property()

```ts
property<T>(name): WritableProp<T>;
```

Any property of this node by its engine name, for properties the typed surface does not
cover yet. Prefer a typed member when one exists.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`WritableProp`](../interfaces/WritableProp.md)\<`T`\>

#### Example

```ts
track.property<number>('latency_override').value
await track.property<string>('comments').set('take 3')
```

#### Inherited from

[`Node`](Node.md).[`property`](Node.md#property)

***

### reload()

```ts
reload(options?): Promise<void>;
```

Fetch again, ignoring the once-only cache of [load](Node.md#load).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`GetOptions`](../interfaces/GetOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`Node`](Node.md).[`reload`](Node.md#reload)

***

### rename()

```ts
rename(name): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await marker.rename('Bridge');
```

***

### setColor()

```ts
setColor(argb): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `argb` | `number` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await marker.setColor(0xffff0000);
```

***

### setComments()

```ts
setComments(comments): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `comments` | `string` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await marker.setComments('double chorus');
```

***

### watch()

```ts
watch(options): object;
```

Subscribe to this node so its props follow engine pushes, and load it. Nodes under a
session that called `ready()` are already covered; use this for nodes outside a session
(for example `luna.gui.main`, `luna.preferences`). Call `release` when done.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `recursive?`: `boolean`; \} |
| `options.recursive?` | `boolean` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `ready` | `Promise`\<`void`\> |
| `release` | [`Unsubscribe`](../type-aliases/Unsubscribe.md) |

#### Inherited from

[`Node`](Node.md).[`watch`](Node.md#watch)
