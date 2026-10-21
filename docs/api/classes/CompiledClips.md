# Class: CompiledClips

A playlist's compiled clips. Loading or watching turns on `enable_compiled_clips` first,
since LUNA publishes nothing until a client asks (fact 116). The SDK never turns it off: the
switch is shared by every client of the session.

Members come in the order LUNA made them, not timeline order; use [inOrder](#inorder) to draw.

## Example

```ts
await lane.compiledClips.load();
lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder()));
```

## Extends

- [`Collection`](Collection.md)\<[`CompiledClip`](CompiledClip.md)\>

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Collection`](Collection.md).[`client`](Collection.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. | [`Collection`](Collection.md).[`path`](Collection.md#path) |

## Accessors

### items

#### Get Signature

```ts
get items(): readonly T[];
```

Members in engine order. Empty until loaded or pushed.

##### Returns

readonly `T`[]

#### Inherited from

[`Collection`](Collection.md).[`items`](Collection.md#items)

***

### value

#### Get Signature

```ts
get value(): readonly T[];
```

##### Returns

readonly `T`[]

#### Inherited from

[`Collection`](Collection.md).[`value`](Collection.md#value)

## Methods

### byId()

```ts
byId(id): CompiledClip | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`CompiledClip`](CompiledClip.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

***

### inOrder()

```ts
inOrder(): CompiledClip[];
```

Segments by timeline position, earliest first.

#### Returns

[`CompiledClip`](CompiledClip.md)[]

#### Example

```ts
const first = lane.compiledClips.inOrder()[0];
```

***

### load()

```ts
load(): Promise<void>;
```

Turn on publishing (once), then fetch the members.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`Collection`](Collection.md).[`load`](Collection.md#load)

***

### membersReady()

```ts
membersReady(): Promise<void>;
```

Resolve once every member the engine has added has its properties loaded. Resolves at
once when nothing is being fetched.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
await Luna.settle(() => lane.clips.items.length > before, 'insert clip');
await lane.clips.membersReady();
lane.clips.items.at(-1).start.value;   // loaded, not undefined
```

#### Inherited from

[`Collection`](Collection.md).[`membersReady`](Collection.md#membersready)

***

### ofClip()

```ts
ofClip(clipUid): CompiledClip[];
```

The segments cut from one clip, earliest first: none when it is fully covered, two or
more when a clip on a higher layer splits it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `clipUid` | `string` |

#### Returns

[`CompiledClip`](CompiledClip.md)[]

#### Example

```ts
const shown = lane.compiledClips.ofClip(clip.id).length > 0;
```

***

### onChange()

```ts
onChange(listener): Unsubscribe;
```

Called when members are added or removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Inherited from

[`Collection`](Collection.md).[`onChange`](Collection.md#onchange)

***

### reload()

```ts
reload(): Promise<void>;
```

Fetch the member list again, ignoring the once-only cache of [load](#load), and re-sync
the members. Use it after an edit whose push LUNA held back, or inside a transaction.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.tracks.reload();
```

#### Overrides

[`Collection`](Collection.md).[`reload`](Collection.md#reload)

***

### watch()

```ts
watch(options): object;
```

Subscribe to this folder on the wire and load it, so members and their properties
follow engine pushes. Collections under a session that called `ready()` are already
covered; use this for folders outside one, such as `/renders` or `/jobs` (fact 34).
Refcounted through the Store; call `release` when done.

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

#### Example

```ts
const w = luna.renders.watch();
await w.ready;
luna.renders.onChange(() => draw(luna.renders.items));
```

#### Overrides

[`Collection`](Collection.md).[`watch`](Collection.md#watch)
