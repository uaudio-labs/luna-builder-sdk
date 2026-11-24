# Class: ChordAnalysis

`analysis/chord`: written by chord detection (`session.musical.chords.detect()`), next to
the chords it puts on the ruler.

## Example

```ts
const segs = (await source.analysis.chord.read())?.segments ?? [];
```

## Extends

- [`AnalysisNode`](AnalysisNode.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Sessions`](Sessions.md).[`client`](Sessions.md#client) |
| <a id="count"></a> `count` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | How many entries the result holds (overview pairs, transients, chord segments, guesses). | [`AnalysisNode`](AnalysisNode.md).[`count`](AnalysisNode.md#count) |
| <a id="kind"></a> `kind` | `readonly` | [`AnalysisKind`](../type-aliases/AnalysisKind.md) | Which analysis this is. | [`AnalysisNode`](AnalysisNode.md).[`kind`](AnalysisNode.md#kind) |
| <a id="md5"></a> `md5` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | Digest of the stored result; `null` while a recording still writes it. Key a cache on it. | [`AnalysisNode`](AnalysisNode.md).[`md5`](AnalysisNode.md#md5) |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`AnalysisNode`](AnalysisNode.md).[`path`](AnalysisNode.md#path) |
| <a id="version"></a> `version` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | [`AnalysisNode`](AnalysisNode.md).[`version`](AnalysisNode.md#version) |
| <a id="versionminor"></a> `versionMinor` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | [`AnalysisNode`](AnalysisNode.md).[`versionMinor`](AnalysisNode.md#versionminor) |

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

[`AnalysisNode`](AnalysisNode.md).[`disposed`](AnalysisNode.md#disposed)

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

[`AnalysisNode`](AnalysisNode.md).[`id`](AnalysisNode.md#id)

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

[`AnalysisNode`](AnalysisNode.md).[`command`](AnalysisNode.md#command)

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

[`AnalysisNode`](AnalysisNode.md).[`commandEnabled`](AnalysisNode.md#commandenabled)

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

[`AnalysisNode`](AnalysisNode.md).[`load`](AnalysisNode.md#load)

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

[`AnalysisNode`](AnalysisNode.md).[`onDispose`](AnalysisNode.md#ondispose)

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

[`AnalysisNode`](AnalysisNode.md).[`property`](AnalysisNode.md#property)

***

### read()

```ts
read(): Promise<
  | ChordAnalysisResult
| undefined>;
```

#### Returns

`Promise`\<
  \| [`ChordAnalysisResult`](../interfaces/ChordAnalysisResult.md)
  \| `undefined`\>

#### Example

```ts
const r = await source.analysis.chord.read();
```

***

### readRaw()

```ts
readRaw(options): Promise<Record<string, unknown> | undefined>;
```

The stored result as LUNA sends it (`{ version, version_minor, index, count, data, ... }`),
or `undefined` when there is none. LUNA answers nothing unless a count is asked for, so
this asks for all of it unless `count` is given (fact 205).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `count?`: `number`; `index?`: `number`; \} |
| `options.count?` | `number` |
| `options.index?` | `number` |

#### Returns

`Promise`\<`Record`\<`string`, `unknown`\> \| `undefined`\>

#### Example

```ts
const raw = await source.analysis.chord.readRaw();
```

#### Inherited from

[`AnalysisNode`](AnalysisNode.md).[`readRaw`](AnalysisNode.md#readraw)

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

[`AnalysisNode`](AnalysisNode.md).[`reload`](AnalysisNode.md#reload)

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

[`AnalysisNode`](AnalysisNode.md).[`watch`](AnalysisNode.md#watch)
