# Class: Warps

The `warps` folder of a clip.

## Extends

- [`Collection`](Collection.md)\<[`Warp`](Warp.md)\>

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

### markers

#### Get Signature

```ts
get markers(): WarpMarker[];
```

The markers as plain data, sorted by `start`; ones whose properties have not loaded are
left out.

##### Example

```ts
for (const w of clip.warps.markers) drawMarker(clip.start.value! + w.start);
```

##### Returns

[`WarpMarker`](../interfaces/WarpMarker.md)[]

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
byId(id): Warp | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`Warp`](Warp.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

***

### delete()

```ts
delete(start, stop?): Promise<void>;
```

Delete the marker at clip tick `start`, or with `stop` every marker strictly between the
two: LUNA leaves markers at `start` and at `stop` alone (`delete_warp`, fact 231). One undo
step. Resolves once they are gone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `start` | `number` |
| `stop?` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.warps.delete(Luna.QUARTER_NOTE);
await clip.warps.delete(0, Luna.WHOLE_NOTE); // the ones inside, not at 0 or the bar
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
| `options` | \{ `props?`: readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Warp`](Warp.md)\>[]; \} |
| `options.props?` | readonly [`PropKey`](../type-aliases/PropKey.md)\<[`Warp`](Warp.md)\>[] |

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

### removeTimeStretch()

```ts
removeTimeStretch(): Promise<void>;
```

Remove the clip's time stretch (`remove_tce`, fact 231): every marker goes and LUNA sets
the clip's `stop` so it plays its source span at the session tempo. One undo step. An
audio clip only: LUNA refuses others with `uasrv.invalid_object`. Resolves once the
markers are gone; the clip's new `stop` arrives by push.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.warps.removeTimeStretch();
```

***

### set()

```ts
set(options): Promise<WarpMarker>;
```

Add a marker pinning clip tick `start` to `sourceStart` ns, or with `rowid` move that
marker there (`set_warp`, fact 230); the marker becomes a `user` one. Where an existing
marker's source point is within [WARP\_TRANSIENT\_ZONE\_NS](../variables/WARP_TRANSIENT_ZONE_NS.md) of `sourceStart`, LUNA
keeps that marker and adds none. Two markers at one tick or one source point are refused
(`uasrv.invalid_object`). One undo step. Resolves to the marker once the list shows it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SetWarpOptions`](../interfaces/SetWarpOptions.md) |

#### Returns

`Promise`\<[`WarpMarker`](../interfaces/WarpMarker.md)\>

#### Example

```ts
const w = await clip.warps.set({ start: Luna.QUARTER_NOTE, sourceStart: 600_000_000 });
await clip.warps.set({ rowid: w.rowid, start: Luna.QUARTER_NOTE * 2, sourceStart: 600_000_000 });
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
