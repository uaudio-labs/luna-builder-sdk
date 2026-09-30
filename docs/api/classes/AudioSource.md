# Class: AudioSource

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Session`](Session.md).[`client`](Session.md#client) |
| <a id="created"></a> `created` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`unknown`\> | - | - |
| <a id="length"></a> `length` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Duration in nanoseconds. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Session`](Session.md).[`path`](Session.md#path) |
| <a id="samplerate"></a> `sampleRate` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="stemformat"></a> `stemFormat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | `mono` or `stereo`. | - |

## Accessors

### channelCount

#### Get Signature

```ts
get channelCount(): number;
```

##### Returns

`number`

***

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

***

### seconds

#### Get Signature

```ts
get seconds(): number | undefined;
```

Duration in seconds.

##### Returns

`number` \| `undefined`

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

### overview()

```ts
overview(options): Promise<Overview | undefined>;
```

Read one bounded page of the waveform overview. Bins are int16 min/max pairs per channel
on the wire; here they are floats in -1..1.

A bare number is the legacy form and means `{ index }` with the default count.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `number` \| [`OverviewOptions`](../interfaces/OverviewOptions.md) |

#### Returns

`Promise`\<[`Overview`](../interfaces/Overview.md) \| `undefined`\>

#### Example

```ts
const page = await source.overview({ index: 0, count: 512, kind: 'coarse' });
```

***

### overviewInfo()

```ts
overviewInfo(options): Promise<OverviewInfo | undefined>;
```

The analysis node's pair count and digest, or `undefined` when there is no analysis yet
(a file LUNA has not finished scanning, or a render it has named but not written).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `kind?`: [`OverviewKind`](../type-aliases/OverviewKind.md); \} |
| `options.kind?` | [`OverviewKind`](../type-aliases/OverviewKind.md) |

#### Returns

`Promise`\<[`OverviewInfo`](../interfaces/OverviewInfo.md) \| `undefined`\>

#### Example

```ts
const info = await source.overviewInfo();
if (info) for (let n = 0; n * 1024 < info.count; n++) draw(await source.overview({ index: n * 1024 }));
```

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
