# Class: Render

`/renders/<uid>`: a bounce or an export. `state` runs `created` -> `running` ->
`completed` | `aborted`, and LUNA drops the node shortly after it settles, so latch
anything you still need rather than reading it later (fact 44).

## Example

```ts
const { render } = await session.bounce({ channelUids: [track.id] });
render.progress.onChange(() => (bar.value = render.progress.value ?? 0));
await render.done();
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="errormessage"></a> `errorMessage` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="isoffline"></a> `isOffline` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | True for an offline (faster than real time) render, which reports no time remaining. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="percentcomplete"></a> `percentComplete` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | 0..100, as the engine reports it. [progress](#progress) is the 0..1 view. | - |
| <a id="progress"></a> `progress` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | 0..1, ready for a `<progress>` element. | - |
| <a id="rendertype"></a> `renderType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="state"></a> `state` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="timeremaining"></a> `timeRemaining` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `undefined`\> | Seconds left, as the engine estimates it; absent for an offline render. | - |
| <a id="totalsamples"></a> `totalSamples` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `undefined`\> | - | - |

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

***

### isTerminal

#### Get Signature

```ts
get isTerminal(): boolean;
```

`completed`, `aborted` or `failed`: nothing more will happen.

##### Returns

`boolean`

## Methods

### abort()

```ts
abort(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

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

#### Returns

`Promise`\<`unknown`\>

***

### done()

```ts
done(timeoutMs): Promise<void>;
```

Resolve when the render completes; reject when it is aborted, fails, or the engine
removes the node before it was seen to finish. A short offline render can finish and
vanish before anything observes it (fact 44), which surfaces as a `removed` rejection
even though the output was written.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `timeoutMs` | `number` |

#### Returns

`Promise`\<`void`\>

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
