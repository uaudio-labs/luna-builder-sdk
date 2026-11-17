# Class: Plugins

An observable ordered collection with id lookup.

## Extends

- [`Collection`](Collection.md)\<[`Plugin`](Plugin.md)\>

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Collection`](Collection.md).[`client`](Collection.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. | [`Collection`](Collection.md).[`path`](Collection.md#path) |

## Accessors

### categories

#### Get Signature

```ts
get categories(): string[];
```

All categories in the catalog, sorted.

##### Returns

`string`[]

***

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

### byCategory()

```ts
byCategory(category): Plugin[];
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `category` | `string` |

#### Returns

[`Plugin`](Plugin.md)[]

***

### byId()

```ts
byId(id): Plugin | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`Plugin`](Plugin.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

***

### find()

```ts
find(query): Plugin[];
```

Case-insensitive match on name, short names, manufacturer or id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |

#### Returns

[`Plugin`](Plugin.md)[]

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

### query()

```ts
query(options): Promise<PluginRow[]>;
```

Ask LUNA for the installed plugins matching a search, categories and favorites, sorted by
name (fact 127). With `insertType`, only those LUNA's plugins browser offers for that slot:
an instrument slot takes instruments, an effect slot effects, and with `channelUid` only
plugins that run in the channel's format. LUNA applies the rules; the catalog need not be
loaded. A LUNA without the query rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PluginQueryOptions`](../interfaces/PluginQueryOptions.md) |

#### Returns

`Promise`\<[`PluginRow`](../interfaces/PluginRow.md)[]\>

#### Example

```ts
const eqs = await luna.plugins.query({ categories: ['EQ'], search: 'pultec' });
const instruments = await luna.plugins.query({ insertType: 'instrument' });
await track.effects.byId('effect_0')!.setPlugin(eqs[0].pluginId);
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

### rescan()

```ts
rescan(): Promise<unknown>;
```

Ask the engine to rescan installed plugins.

#### Returns

`Promise`\<`unknown`\>

***

### unmetRequirements()

```ts
unmetRequirements(requirements, options): PluginRequirement[];
```

The `requirements` the loaded catalog does not meet, as LUNA decides (fact 148): none of a
requirement's `plugin_id` is installed at its `min_version` or later. Pass an Add On's
[AddOn.requiresPlugins](AddOn.md#requiresplugins); with `blockingOnly`, the ones not marked `optional`, which
are what keeps LUNA from opening it. Load the catalog first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `requirements` | readonly [`PluginRequirement`](../interfaces/PluginRequirement.md)[] |
| `options` | \{ `blockingOnly?`: `boolean`; \} |
| `options.blockingOnly?` | `boolean` |

#### Returns

[`PluginRequirement`](../interfaces/PluginRequirement.md)[]

#### Example

```ts
await luna.plugins.load();
const me = luna.gui.addOns.byId('com.eventfield.clingy-ex-addon');
for (const r of luna.plugins.unmetRequirements(me?.requiresPlugins.value ?? [])) {
  console.warn(`needs ${r.name}${r.min_version ? ` ${r.min_version}` : ''}`);
}
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
