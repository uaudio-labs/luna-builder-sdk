# Abstract Class: Channel

## Extends

- [`Node`](Node.md)

## Extended by

- [`Track`](Track.md)
- [`Bus`](Bus.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="automationmode"></a> `automationMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AutomationMode`](../type-aliases/AutomationMode.md)\> | - | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="color"></a> `color` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | ARGB packed integer as the engine stores it. | - |
| <a id="comments"></a> `comments` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | - | - |
| <a id="controls"></a> `controls` | `readonly` | [`Controls`](Controls.md) | Strip-level controls (`solo`, trims, preamp). | - |
| <a id="effects"></a> `effects` | `readonly` | [`Collection`](Collection.md)\<[`Effect`](Effect.md)\> | All insert slots, including `console` and `sidechain_filter`. See [effectSlots](#effectslots). | - |
| <a id="enabled"></a> `enabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="folderuid"></a> `folderUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="frozen"></a> `frozen` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="main"></a> `main` | `readonly` | [`Output`](Output.md) | The `main` output, always present. | - |
| <a id="name"></a> `name` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | - | - |
| <a id="order"></a> `order` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="outputs"></a> `outputs` | `readonly` | [`Collection`](Collection.md)\<[`Output`](Output.md)\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | Uid of the owning session, for session-level commands that name this channel. | - |
| <a id="stemformat"></a> `stemFormat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |

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

### effectSlots

#### Get Signature

```ts
get effectSlots(): Effect[];
```

The user-facing `effect_0`..`effect_N` slots in order.

##### Returns

[`Effect`](Effect.md)[]

***

### gain

#### Get Signature

```ts
get gain(): Control;
```

Main output gain.

##### Returns

[`Control`](Control.md)

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

### loadedEffects

#### Get Signature

```ts
get loadedEffects(): Effect[];
```

Effect slots that hold a plugin.

##### Returns

[`Effect`](Effect.md)[]

***

### meter

#### Get Signature

```ts
get meter(): Meter;
```

Main output level meter.

##### Returns

[`Meter`](Meter.md)

***

### mute

#### Get Signature

```ts
get mute(): Control;
```

Main output mute.

##### Returns

[`Control`](Control.md)

***

### pan

#### Get Signature

```ts
get pan(): Control;
```

Main output pan.

##### Returns

[`Control`](Control.md)

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

### insert()

```ts
insert(pluginId, slot?): Promise<Effect | undefined>;
```

Load a plugin into the first empty effect slot (or a named slot).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `slot?` | `string` |

#### Returns

`Promise`\<[`Effect`](Effect.md) \| `undefined`\>

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

### loadStrip()

```ts
loadStrip(): Promise<void>;
```

Load this strip's properties plus the main output's controls in two round trips.

#### Returns

`Promise`\<`void`\>

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
