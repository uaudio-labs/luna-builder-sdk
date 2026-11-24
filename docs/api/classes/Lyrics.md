# Class: Lyrics

An observable ordered collection with id lookup.

## Extends

- [`Collection`](Collection.md)\<[`Lyric`](Lyric.md)\>

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
get sorted(): Lyric[];
```

The lines by [Lyric.location](Lyric.md#location). Ruler and transcribed lines are in different units,
so sort within one kind.

##### Example

```ts
session.lyrics.sorted.filter((l) => l.sourceUid.value === source.id).map((l) => l.text.value);
```

##### Returns

[`Lyric`](Lyric.md)[]

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

### add()

```ts
add(
   location, 
   text, 
options): Promise<Lyric>;
```

Add a line at `location` and resolve to it once it is listed. A ruler line by default,
at a tick; with `sourceUid`, a line of that recording's lyrics, at nanoseconds into it.
A line of the same kind already at `location` is replaced, as in LUNA (fact 153). One
undo entry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `location` | `number` |
| `text` | `string` |
| `options` | [`AddLyricOptions`](../interfaces/AddLyricOptions.md) |

#### Returns

`Promise`\<[`Lyric`](Lyric.md)\>

#### Example

```ts
const line = await session.lyrics.add(Luna.WHOLE_NOTE * 8, 'Second verse');
```

***

### byId()

```ts
byId(id): Lyric | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`Lyric`](Lyric.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

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
| `options` | \{ `props?`: readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Lyric`](Lyric.md)\>[]; \} |
| `options.props?` | readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Lyric`](Lyric.md)\>[] |

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

### providers()

```ts
providers(): Promise<LyricProviders>;
```

Read which transcription providers LUNA has. LUNA computes these when asked and pushes
no change (fact 204), so this is a read, not a prop.

#### Returns

`Promise`\<[`LyricProviders`](../interfaces/LyricProviders.md)\>

#### Example

```ts
const { available, providers, defaultProvider } = await session.lyrics.providers();
```

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

### transcribe()

```ts
transcribe(options): JobRun;
```

Transcribe the lyrics of a clip, or of the edit context's selection, as LUNA's Transcribe
Lyrics does: `extract_lyrics`, which runs as a `lyric_transcription` job (facts 200, 204).
The transcribed lines arrive in this list, each naming its source and placed in
nanoseconds into it (fact 152); with `addToRuler` LUNA also writes ruler lines in ticks.
The returned [JobRun](JobRun.md) reports progress and resolves when the job completes, with
`empty: true` when there was nothing to transcribe.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TranscribeOptions`](../interfaces/TranscribeOptions.md) |

#### Returns

[`JobRun`](JobRun.md)

#### Example

```ts
const run = session.lyrics.transcribe({ clip, provider: (await session.lyrics.providers()).defaultProvider });
await run;
session.lyrics.sorted.filter((l) => l.sourceUid.value === clip.sourceUid.value).map((l) => l.text.value);
```

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
