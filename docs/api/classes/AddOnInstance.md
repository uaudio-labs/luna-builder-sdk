# Class: AddOnInstance

One page of an installed Add On open in LUNA (fact 143): `/gui/add_ons/<id>/instances/<add_on_inst>`.
LUNA gives every Add On page an `add_on_inst` in its URL; [Gui.thisInstance](Gui.md#thisinstance) finds the
page's own. A window keeps its instance while it exists, and a `show_with_session` window
keeps it in the session, so it is the same after the session is closed and opened again: a
page can key its own `session.storage` records by it.

## Example

```ts
const me = await luna.gui.thisInstance();
if (me?.target.value === 'window') await me.resize(640, 480);
me?.width.onChange(() => layout(me.width.value ?? 0));
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="height"></a> `height` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | The page's height in points; follows the user's resize. `undefined` until loaded. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="target"></a> `target` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AddOnTarget`](../type-aliases/AddOnTarget.md)\> | The host the page is in: one of its Add On's [AddOn.targets](AddOn.md#targets). | - |
| <a id="width"></a> `width` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | The page's width in points; follows the user's resize. `undefined` until loaded. | - |

## Accessors

### addOnId

#### Get Signature

```ts
get addOnId(): string;
```

The manifest `id` of the Add On this page belongs to, in lowercase.

##### Returns

`string`

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

### instanceId

#### Get Signature

```ts
get instanceId(): string;
```

The `add_on_inst` LUNA gave the page.

##### Returns

`string`

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

### commandEnabled()

```ts
commandEnabled(command): Prop<boolean>;
```

Whether LUNA would take `command` on this node now (`<command>/enabled`, fact 234), as
LUNA greys out its own menu items: `false` for `paste` with nothing copied, for example.
Follows LUNA from the first call until this node is disposed. `undefined` until read, and
for a command that publishes no enabled state (most are always enabled).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |

#### Returns

[`Prop`](../interfaces/Prop.md)\<`boolean`\>

#### Example

```ts
const canPaste = session.context.commandEnabled('paste');
canPaste.onChange(() => (pasteButton.disabled = canPaste.value === false));
```

#### Inherited from

[`Node`](Node.md).[`commandEnabled`](Node.md#commandenabled)

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

### resize()

```ts
resize(width?, height?): Promise<void>;
```

Ask LUNA to resize a `'window'` instance's window to this page size, in points. A size left
out keeps the current one. LUNA clamps it to the manifest's `min_*`/`max_*`, leaves full
screen first, keeps the window's top-left corner, and saves it as it would a user resize
(with the session, for a `show_with_session` window). Resolves once the size LUNA applied is
in [width](#resize-1) and [height](#resize-1). Rejects with `uasrv.read_only` for another
target or a `fixed_size` window, and `uasrv.invalid_value` for a size of 0 or less.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `width?` | `number` |
| `height?` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await me.resize(800);          // width only
await me.resize(undefined, 600); // height only
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
