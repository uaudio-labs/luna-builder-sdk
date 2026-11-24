# Class: Presets

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |

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

### find()

```ts
find(pluginId, name): Promise<PresetRow | undefined>;
```

The plugin's preset name exactly `name` (case-insensitive), or `undefined`. When the
library holds a user preset and a factory preset of the same name, the user one wins,
matching what LUNA's preset browser opens.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `name` | `string` |

#### Returns

`Promise`\<[`PresetRow`](../interfaces/PresetRow.md) \| `undefined`\>

#### Example

```ts
const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
preset?.uid;
```

***

### forgetInstruments()

```ts
forgetInstruments(): void;
```

Read the installed instruments again on the next query, for example after one was installed.

#### Returns

`void`

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

### query()

```ts
query(options): Promise<PresetRow[]>;
```

Query the preset database (fact 98). Columnar on the wire; rows here. Search and tags
combine: a row must match both (fact 120).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`PresetQueryOptions`](../interfaces/PresetQueryOptions.md) |

#### Returns

`Promise`\<[`PresetRow`](../interfaces/PresetRow.md)[]\>

#### Example

```ts
const rows = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'EQ' });
rows[0]?.uid; rows[0]?.name; rows[0]?.factory;
const clean = await luna.presets.query({ pluginId, tags: ['Clean', 'Jazz'], withTags: true });
clean[0]?.tags; // ['Clean', 'Jazz', ...]
```

***

### recommend()

```ts
recommend(pluginId, text): Promise<PresetRecommendation[]>;
```

Presets UA Assistant recommends for free text, best first, five at most (fact 121). Needs
UA Assistant connected to LUNA ([Assistant.enabled](Assistant.md#enabled)), and an instance of the plugin
created since it connected, which is when LUNA builds the plugin's search index. Otherwise
this rejects with the engine's code: `ua.unknown` (no assistant),
`assistant.preset_search_not_initialized_error` (no index yet), or
`assistant.input_classifier_rejected` (text the assistant will not search on). Empty text
resolves to `[]` without asking.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `text` | `string` |

#### Returns

`Promise`\<[`PresetRecommendation`](../interfaces/PresetRecommendation.md)[]\>

#### Example

```ts
const recs = await luna.presets.recommend('uaudio_paradise_guitar_studio', 'warm jazz clean');
await slot.loadPreset(recs[0].uid);
```

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

### selection()

```ts
selection(pluginId, options): PresetSelection;
```

A live preset selection over one plugin: set `search` and `tags`, read `presets` and
`recommendations`. Requests are debounced and a reply that a newer one overtook is
dropped, so the lists always match the inputs. Recommendations come from the search text,
keep only presets carrying the selected tags (so with tags selected there can be fewer
than the assistant's five), and stay empty while UA Assistant is not connected. A refused
request leaves them empty and its code in `recommendationError`. Call `dispose()` when done.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `options` | [`PresetSelectionOptions`](../interfaces/PresetSelectionOptions.md) |

#### Returns

[`PresetSelection`](PresetSelection.md)

#### Example

```ts
const sel = luna.presets.selection('uaudio_paradise_guitar_studio');
await sel.ready();
sel.groups.value;                       // tag groups for the chips
await sel.search.set('warm');
await sel.toggleTag('Clean');
await sel.settled();
sel.presets.items.map((p) => p.name);   // names containing "warm", tagged Clean
sel.recommendations.items[0]?.name;     // the assistant's best match, tagged Clean
await slot.loadPreset(sel.presets.items[0].uid);
sel.dispose();
```

***

### setFavorite()

```ts
setFavorite(
   preset, 
   favorite, 
options): Promise<void>;
```

Mark a preset a favorite, or not (fact 175): a write of its `favorite`, which LUNA keeps
per owner. A plugin's preset is under its plugin: pass `pluginId` (the one you queried
with), or a row that carries one (an instrument preset in a track query). Anything else is
taken as a track preset. A row passed in has its `favorite` updated once LUNA accepts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preset` | \| `string` \| `Pick`\<[`PresetRow`](../interfaces/PresetRow.md), `"uid"`\> & `Partial`\<`Pick`\<[`PresetRow`](../interfaces/PresetRow.md), `"favorite"` \| `"pluginId"`\>\> |
| `favorite` | `boolean` |
| `options` | \{ `deviceTypeId?`: `string`; `pluginId?`: `string`; \} |
| `options.deviceTypeId?` | `string` |
| `options.pluginId?` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const [row] = await luna.presets.query({ pluginId: 'uaudio_qi', search: 'Vocal' });
await luna.presets.setFavorite(row, true, { pluginId: 'uaudio_qi' });
const [track] = await luna.presets.query({ deviceTypeId: 'track', search: 'Bass Rig' });
await luna.presets.setFavorite(track, true);
```

***

### tagGroups()

```ts
tagGroups(pluginId): Promise<PresetTagGroup[]>;
```

The plugin's tag groups, in LUNA's order (fact 120). Empty for a plugin whose presets
are not tagged.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |

#### Returns

`Promise`\<[`PresetTagGroup`](../interfaces/PresetTagGroup.md)[]\>

#### Example

```ts
const groups = await luna.presets.tagGroups('uaudio_paradise_guitar_studio');
groups.map((g) => g.name); // ['TYPE', 'GENRE', 'DESCRIPTION']
```

***

### trackPresetPlugins()

```ts
trackPresetPlugins(preset): Promise<TrackPresetPlugin[] | undefined>;
```

The plugins a track preset uses, as LUNA's preset browser checks them before applying
one (fact 176): read from the preset's package, `/workspace/sessions/<uid>`. Resolves to
`undefined` when LUNA reports no list (not a track preset, or an older LUNA): that means
unknown, not "no plugins".

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preset` | `string` \| `Pick`\<[`PresetRow`](../interfaces/PresetRow.md), `"uid"`\> |

#### Returns

`Promise`\<[`TrackPresetPlugin`](../interfaces/TrackPresetPlugin.md)[] \| `undefined`\>

#### Example

```ts
const needs = await luna.presets.trackPresetPlugins(row);
const missing = needs?.filter((p) => !luna.plugins.byId(p.pluginId)?.installed.value) ?? [];
```

***

### trackSelection()

```ts
trackSelection(options): TrackPresetSelection;
```

A live selection over track presets, as LUNA's track preset browser offers them: a
`category` (one of [TRACK\_PRESET\_CATEGORIES](../variables/TRACK_PRESET_CATEGORIES.md), or `null` for all), tags, and search
text. With no category or `Instrument`, installed instrument plugins' presets are listed
too, marked `isInstrumentPreset` (fact 132). Pass a row to [Session.newTrackFromPreset](Session.md#newtrackfrompreset)
to make a track from it, or to [Track.loadPreset](Track.md#loadpreset) to apply it to a track. Call
`dispose()` when done.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TrackPresetSelectionOptions`](../interfaces/TrackPresetSelectionOptions.md) |

#### Returns

[`TrackPresetSelection`](TrackPresetSelection.md)

#### Example

```ts
const sel = luna.presets.trackSelection({ category: 'Instrument' });
await sel.ready();
await sel.search.set('piano');
await sel.settled();
const [track] = await session.newTrackFromPreset(sel.presets.items[0]);
await track.loadPreset(sel.presets.items[1]);   // replace it with another
sel.dispose();
```

***

### trackTagGroups()

```ts
trackTagGroups(): Promise<PresetTagGroup[]>;
```

The tag groups LUNA's track preset browser shows: the track presets' own groups and every
installed instrument plugin's, merged by group name, without the category tags (`Audio`,
`Instrument`, `Bus`, `Multi-Track`), which [TRACK\_PRESET\_CATEGORIES](../variables/TRACK_PRESET_CATEGORIES.md) lists (fact 132).

#### Returns

`Promise`\<[`PresetTagGroup`](../interfaces/PresetTagGroup.md)[]\>

#### Example

```ts
const groups = await luna.presets.trackTagGroups();
groups.map((g) => g.name); // ['GENRE', 'TYPE', ...]
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
