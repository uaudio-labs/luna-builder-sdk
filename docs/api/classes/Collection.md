# Class: Collection\<T\>

An observable ordered collection with id lookup.

## Extended by

- [`Controls`](Controls.md)
- [`CompiledClips`](CompiledClips.md)
- [`Markers`](Markers.md)
- [`Lyrics`](Lyrics.md)
- [`ErrorNotices`](ErrorNotices.md)
- [`Groups`](Groups.md)
- [`MidiOutputs`](MidiOutputs.md)
- [`Chords`](Chords.md)
- [`Automation`](Automation.md)
- [`Warps`](Warps.md)
- [`Plugins`](Plugins.md)
- [`Devices`](Devices.md)
- [`MidiDevices`](MidiDevices.md)
- [`Renders`](Renders.md)
- [`Jobs`](Jobs.md)
- [`DeviceInputs`](DeviceInputs.md)
- [`DeviceOutputs`](DeviceOutputs.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`Node`](Node.md) |

## Implements

- [`List`](../interfaces/List.md)\<`T`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - |
| <a id="path"></a> `path` | `readonly` | `string` | Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. |

## Accessors

### items

#### Get Signature

```ts
get items(): readonly T[];
```

Members in engine order. Empty until loaded or pushed.

##### Returns

readonly `T`[]

#### Implementation of

[`List`](../interfaces/List.md).[`items`](../interfaces/List.md#items)

***

### value

#### Get Signature

```ts
get value(): readonly T[];
```

##### Returns

readonly `T`[]

#### Implementation of

[`List`](../interfaces/List.md).[`value`](../interfaces/List.md#value)

## Methods

### byId()

```ts
byId(id): T | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`T` \| `undefined`

#### Implementation of

[`List`](../interfaces/List.md).[`byId`](../interfaces/List.md#byid)

***

### load()

```ts
load(): Promise<void>;
```

Fetch the member list (and, with the default `levels: 2`, each member's properties).

#### Returns

`Promise`\<`void`\>

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
| `options` | \{ `props?`: readonly [`PropKey`](../type-aliases/PropKey.md)\<`T`\>[]; \} |
| `options.props?` | readonly [`PropKey`](../type-aliases/PropKey.md)\<`T`\>[] |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
const sources = await session.loadSources();
const stop = sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
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

#### Implementation of

[`List`](../interfaces/List.md).[`onChange`](../interfaces/List.md#onchange)

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
