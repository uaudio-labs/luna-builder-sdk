# Class: AudioSource

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Sessions`](Sessions.md).[`client`](Sessions.md#client) |
| <a id="created"></a> `created` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`unknown`\> | - | - |
| <a id="displayname"></a> `displayName` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `undefined`\> | The name to show: `name`, or `undefined` when the file has none. LUNA names some sources with their own uid (fact 238); a blank name, or one that is the uid (with or without dashes or an extension), counts as none. Show your own label then, such as the clip's name. **Example** `row.textContent = source.displayName.value ?? `Untitled (${source.seconds?.toFixed(1)} s)`;` | - |
| <a id="format"></a> `format` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `undefined`\> | LUNA's audio file format name, e.g. `wav` (fact 239). | - |
| <a id="length"></a> `length` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Duration in nanoseconds. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="origin"></a> `origin` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `undefined`\> | Where the file came from, LUNA's number for it (fact 239): see [SourceOrigin](../variables/SourceOrigin.md). `undefined` on a LUNA that does not publish it. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="samplerate"></a> `sampleRate` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="stemformat"></a> `stemFormat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | `mono` or `stereo`. | - |

## Accessors

### analysis

#### Get Signature

```ts
get analysis(): SourceAnalysis;
```

Every analysis LUNA keeps for this file (key, tempo, instrument, transients, chord and the
overviews), with live `count` and `md5` props (fact 205). Created on first use.

##### Example

```ts
const w = source.analysis.watch();
await w.ready;
source.analysis.overview.count.onChange(() => redraw(source.analysis.overview.count.value));
```

##### Returns

[`SourceAnalysis`](SourceAnalysis.md)

***

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

### hasName

#### Get Signature

```ts
get hasName(): boolean;
```

True when LUNA named the file (see [displayName](#displayname)).

##### Returns

`boolean`

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

### isRender

#### Get Signature

```ts
get isRender(): boolean;
```

True for a clip rendering (LUNA's own pass of a clip through its clip effects, time
stretch or sample-rate conversion), which LUNA keeps under `renders/clips/` and remakes as
needed, rather than a recording, import or bounce (fact 239).

##### Example

```ts
const files = sources.items.filter((s) => !s.isRender);
```

##### Returns

`boolean`

***

### packageUid

#### Get Signature

```ts
get packageUid(): string;
```

The session package uid this file belongs to, from its path.

##### Returns

`string`

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

### filePath()

```ts
filePath(): Promise<string | undefined>;
```

The file's absolute path on disk (fact 239): `<package>/audio/<uid>.wav`, or
`<package>/renders/clips/<uid>.wav` for a rendering. Reads the package's folder from the
workspace once and keeps it. `undefined` when the package is unknown.

Inside a session, `session.sourcePath(source)` answers the same without a read, which a
drag needs (see `Luna.startSourceDrag`).

#### Returns

`Promise`\<`string` \| `undefined`\>

#### Example

```ts
const path = await source.filePath();
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

### reveal()

```ts
reveal(): Promise<void>;
```

Show the file in Finder or Explorer (`luna.gui.revealPath`). Rejects with `unavailable`
when the path is unknown.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
revealButton.onclick = () => void source.reveal();
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
