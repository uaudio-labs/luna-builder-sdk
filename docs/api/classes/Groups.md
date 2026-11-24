# Class: Groups

The session's groups. Not loaded by `session.ready()`: call [load](#load) first.

## Example

```ts
await session.groups.load();
session.groups.sorted.map((g) => g.name.value);
```

## Extends

- [`Collection`](Collection.md)\<[`Group`](Group.md)\>

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
get sorted(): Group[];
```

Groups in LUNA's display order.

##### Returns

[`Group`](Group.md)[]

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
add(options): Promise<Group>;
```

Make a group in one undo step, enabled in every edit context, and resolve to it once it
and its members are in this list (fact 215).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`NewGroupOptions`](../interfaces/NewGroupOptions.md) |

#### Returns

`Promise`\<[`Group`](Group.md)\>

#### Example

```ts
const g = await session.groups.add({ name: 'Drums', attributes: ['mix', 'edit'], members: [kick, snare] });
```

***

### affectedTracks()

```ts
affectedTracks(
   track, 
   attributes, 
options): Promise<string[]>;
```

The tracks and buses an operation on `track` would reach (fact 218): the edit context's
selection when it holds `track`, else `track` alone, plus every member of each group that
holds `track` and shares an attribute with `attributes`. Reads only; changes nothing. The
uids come in no particular order.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `track` | [`ChannelRef`](../type-aliases/ChannelRef.md) |
| `attributes` | \| [`GroupAttribute`](../type-aliases/GroupAttribute.md) \| readonly [`GroupAttribute`](../type-aliases/GroupAttribute.md)[] |
| `options` | [`AffectedTracksOptions`](../interfaces/AffectedTracksOptions.md) |

#### Returns

`Promise`\<`string`[]\>

#### Example

```ts
const uids = await session.groups.affectedTracks(track, 'mix');
```

***

### byId()

```ts
byId(id): Group | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`Group`](Group.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

***

### load()

```ts
load(): Promise<void>;
```

Read the groups and each group's members.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.groups.load();
```

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
| `options` | \{ `props?`: readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Group`](Group.md)\>[]; \} |
| `options.props?` | readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Group`](Group.md)\>[] |

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

### reorder()

```ts
reorder(groups, options): Promise<void>;
```

Move `groups` (in the order given) to just after `after`, or to the front when `after`
is `null` or left out, and resolve once LUNA shows the new order. LUNA answers the same
whether or not it moved anything, so a move it refused rejects with `no_effect`
(fact 217).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `groups` | readonly (`string` \| [`Group`](Group.md))[] |
| `options` | \{ `after?`: `string` \| [`Group`](Group.md) \| `null`; \} |
| `options.after?` | `string` \| [`Group`](Group.md) \| `null` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.groups.reorder([vocals], { after: drums });
await session.groups.reorder([drums]);            // to the front
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
