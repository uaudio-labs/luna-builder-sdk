# Class: PreferenceContext

`/sessions/<uid>/preferences/<context>`: one context's preferences. Get one with
`session.preferences.context(name)`.

## Example

```ts
const prefs = session.preferences.context('com.example.my-add-on');
await prefs.load();
prefs.preferences.value; // ['layout']
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="preferences"></a> `preferences` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | Names of this context's preferences. | - |

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

### name

#### Get Signature

```ts
get name(): string;
```

The context's reverse-DNS name.

##### Returns

`string`

## Methods

### add()

```ts
add(
   preference, 
   property, 
   value, 
options): Promise<void>;
```

Add a property with an initial value (default `null`) and resolve once it is visible.
A property that already exists keeps its value.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `preference` | `string` | `undefined` |
| `property` | `string` | `undefined` |
| `value` | `unknown` | `null` |
| `options` | [`PreferenceEditOptions`](../interfaces/PreferenceEditOptions.md) | `{}` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await prefs.add('layout', 'timeline', { height: 200 });
```

***

### clear()

```ts
clear(options): Promise<void>;
```

Remove every preference in this context.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PreferenceEditOptions`](../interfaces/PreferenceEditOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await prefs.clear();
```

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

### load()

```ts
load(): Promise<void>;
```

Fetch this context's preferences and their values. Call once before reading
[value](#value); pushes keep them current while the session is watched.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await prefs.load();
```

#### Overrides

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

### remove()

```ts
remove(
   preference, 
   property?, 
options?): Promise<void>;
```

Remove one property, or a whole preference when `property` is left out.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preference` | `string` |
| `property?` | `string` |
| `options?` | [`PreferenceEditOptions`](../interfaces/PreferenceEditOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await prefs.remove('layout', 'timeline');
await prefs.remove('layout');
```

***

### set()

```ts
set(
   preference, 
   property, 
   value, 
options): Promise<void>;
```

Set an existing property and resolve once the new value is visible. Rejects with
`uasrv.invalid_property` if the property was never added.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preference` | `string` |
| `property` | `string` |
| `value` | `unknown` |
| `options` | [`PreferenceEditOptions`](../interfaces/PreferenceEditOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await prefs.set('layout', 'timeline', { height: 320 }, { undoable: true });
```

***

### value()

```ts
value<T>(preference, property): WritableProp<T>;
```

The value of one property as a live prop, `undefined` while it does not exist.
`set` on it is a non-undoable write of an existing property.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preference` | `string` |
| `property` | `string` |

#### Returns

[`WritableProp`](../interfaces/WritableProp.md)\<`T`\>

#### Example

```ts
const timeline = prefs.value<{ height: number }>('layout', 'timeline');
timeline.onChange(() => console.log(timeline.value?.height));
await timeline.set({ height: 240 });
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
