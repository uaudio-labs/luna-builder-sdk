# Class: Lyric

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="length"></a> `length` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | How long the line lasts, in the same units as [location](#location). | - |
| <a id="location"></a> `location` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Where the line starts: a tick for a ruler line, nanoseconds into its source for a transcribed one. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="rowid"></a> `rowid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="sourceuid"></a> `sourceUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The audio source a transcribed line came from; LUNA's nil uid for a ruler line. | - |
| <a id="text"></a> `text` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="words"></a> `words` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`LyricWord`](../interfaces/LyricWord.md)[]\> | The line's words with their timing, when LUNA has it (a transcribed line). | - |

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

### transcribed

#### Get Signature

```ts
get transcribed(): boolean;
```

Whether the line was transcribed from a recording: it names a source, and its
[location](#location) is nanoseconds into that source rather than a tick.

##### Example

```ts
const lines = session.lyrics.sorted.filter((l) => !l.transcribed);   // the ruler's, in ticks
```

##### Returns

`boolean`

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

### delete()

```ts
delete(): Promise<void>;
```

Delete this line and resolve once it has left [Lyrics](Lyrics.md). One undo entry.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await line.delete();
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
moveTo(location): Promise<void>;
```

Move the line to `location`, in its own units: a tick for a ruler line, nanoseconds into
its source for a transcribed one. Another line of the same kind already at `location` is
replaced, as in LUNA (fact 153). One undo entry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `location` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await line.moveTo(line.location.value! + Luna.WHOLE_NOTE);
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

### setText()

```ts
setText(text): Promise<void>;
```

Change the line's text and resolve once LUNA shows it. One undo entry. The words and their
timings are left as they were. Rejects with `out_of_range` for an empty string (LUNA would
ignore it); to remove a line, [delete](#delete) it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await line.setText('Here comes the sun');
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
