# Class: Chords

An observable ordered collection with id lookup.

## Extends

- [`Collection`](Collection.md)\<[`Chord`](Chord.md)\>

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

### sorted

#### Get Signature

```ts
get sorted(): Chord[];
```

Chords in timeline order.

##### Returns

[`Chord`](Chord.md)[]

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

### at()

```ts
at(tick): Chord | undefined;
```

The chord sounding at `tick`: the last one at or before it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |

#### Returns

[`Chord`](Chord.md) \| `undefined`

***

### byId()

```ts
byId(id): Chord | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`Chord`](Chord.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

***

### detect()

```ts
detect(options): JobRun;
```

Detect the chords in a clip, or in the edit context's selection (one track), and write
them onto this ruler, as LUNA's Detect Chords does: `extract_chords`, which runs as a
`chord_extraction` job (facts 200, 203). The chords land here as they are written; the
returned [JobRun](JobRun.md) reports progress and resolves when the job completes, with
`empty: true` when nothing was found. LUNA also keeps what it found per source in
`source.analysis.chord`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ExtractionOptions`](../interfaces/ExtractionOptions.md) |

#### Returns

[`JobRun`](JobRun.md)

#### Example

```ts
const run = session.musical.chords.detect({ clip });
run.progress.onChange(() => (bar.value = run.progress.value ?? 0));
await run;
session.musical.chords.sorted.map((c) => c.name.value);
```

***

### load()

```ts
load(): Promise<void>;
```

Fetch the member list (and, with the default `levels: 2`, each member's properties).

#### Returns

`Promise`\<`void`\>

#### Inherited from

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

### onAnyChange()

```ts
onAnyChange(listener, options): Unsubscribe;
```

Called when members are added or removed, or when any of the named props of any member
changes: one listener for "redraw the list". The per-member subscriptions follow the
list, so a member added later is covered and a removed one is let go. Several changes in
the same turn call the listener once.

`props` are the member's prop fields by name (`'name'`, `'length'`), not wire names.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |
| `options` | \{ `props?`: readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Chord`](Chord.md)\>[]; \} |
| `options.props?` | readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Chord`](Chord.md)\>[] |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
const sources = await session.loadSources();
const stop = sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
```

#### Inherited from

[`Collection`](Collection.md).[`onAnyChange`](Collection.md#onanychange)

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

#### Inherited from

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

#### Inherited from

[`Collection`](Collection.md).[`watch`](Collection.md#watch)
