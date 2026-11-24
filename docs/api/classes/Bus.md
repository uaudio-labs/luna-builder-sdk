# Class: Bus

## Extends

- [`Channel`](Channel.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="automationmode"></a> `automationMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AutomationMode`](../type-aliases/AutomationMode.md)\> | - | [`Channel`](Channel.md).[`automationMode`](Channel.md#automationmode) |
| <a id="bustype"></a> `busType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Channel`](Channel.md).[`client`](Channel.md#client) |
| <a id="color"></a> `color` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | ARGB packed integer as the engine stores it. | [`Channel`](Channel.md).[`color`](Channel.md#color) |
| <a id="comments"></a> `comments` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | - | [`Channel`](Channel.md).[`comments`](Channel.md#comments) |
| <a id="controls"></a> `controls` | `readonly` | [`Controls`](Controls.md) | Strip-level controls (`solo`, trims, preamp). | [`Channel`](Channel.md).[`controls`](Channel.md#controls) |
| <a id="effects"></a> `effects` | `readonly` | [`Collection`](Collection.md)\<[`Effect`](Effect.md)\> | All insert slots, including `console` and `sidechain_filter`. See [effectSlots](Channel.md#effectslots). | [`Channel`](Channel.md).[`effects`](Channel.md#effects) |
| <a id="enabled"></a> `enabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | [`Channel`](Channel.md).[`enabled`](Channel.md#enabled) |
| <a id="foldermode"></a> `folderMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`FolderMode`](../type-aliases/FolderMode.md)\> | - | - |
| <a id="folderuid"></a> `folderUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | [`Channel`](Channel.md).[`folderUid`](Channel.md#folderuid) |
| <a id="frozen"></a> `frozen` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | [`Channel`](Channel.md).[`frozen`](Channel.md#frozen) |
| <a id="main"></a> `main` | `readonly` | [`Output`](Output.md) | The `main` output, always present. | [`Channel`](Channel.md).[`main`](Channel.md#main) |
| <a id="name"></a> `name` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | - | [`Channel`](Channel.md).[`name`](Channel.md#name) |
| <a id="order"></a> `order` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | [`Channel`](Channel.md).[`order`](Channel.md#order) |
| <a id="outputs"></a> `outputs` | `readonly` | [`Collection`](Collection.md)\<[`Output`](Output.md)\> | - | [`Channel`](Channel.md).[`outputs`](Channel.md#outputs) |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Channel`](Channel.md).[`path`](Channel.md#path) |
| <a id="presetname"></a> `presetName` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | That preset's name, or null. | - |
| <a id="presetuid"></a> `presetUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | The uid of the track preset last applied to this bus, or null (fact 169). | - |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | Uid of the owning session, for session-level commands that name this channel. | [`Channel`](Channel.md).[`sessionUid`](Channel.md#sessionuid) |
| <a id="stemformat"></a> `stemFormat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`StemFormat`](../type-aliases/StemFormat.md)\> | - | [`Channel`](Channel.md).[`stemFormat`](Channel.md#stemformat) |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | [`Channel`](Channel.md).[`uid`](Channel.md#uid) |

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

[`Channel`](Channel.md).[`disposed`](Channel.md#disposed)

***

### effectSlots

#### Get Signature

```ts
get effectSlots(): Effect[];
```

The user-facing `effect_0`..`effect_N` slots in order.

##### Returns

[`Effect`](Effect.md)[]

#### Inherited from

[`Channel`](Channel.md).[`effectSlots`](Channel.md#effectslots)

***

### gain

#### Get Signature

```ts
get gain(): Control;
```

Main output gain.

##### Returns

[`Control`](Control.md)

#### Inherited from

[`Channel`](Channel.md).[`gain`](Channel.md#gain)

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

[`Channel`](Channel.md).[`id`](Channel.md#id)

***

### isFolder

#### Get Signature

```ts
get isFolder(): boolean;
```

A folder is an aux bus whose folder mode is not `none`.

##### Returns

`boolean`

***

### isMaster

#### Get Signature

```ts
get isMaster(): boolean;
```

##### Returns

`boolean`

***

### loadedEffects

#### Get Signature

```ts
get loadedEffects(): Effect[];
```

Effect slots that hold a plugin.

##### Returns

[`Effect`](Effect.md)[]

#### Inherited from

[`Channel`](Channel.md).[`loadedEffects`](Channel.md#loadedeffects)

***

### meter

#### Get Signature

```ts
get meter(): Meter;
```

Main output level meter.

##### Returns

[`Meter`](Meter.md)

#### Inherited from

[`Channel`](Channel.md).[`meter`](Channel.md#meter)

***

### mute

#### Get Signature

```ts
get mute(): Control;
```

Main output mute.

##### Returns

[`Control`](Control.md)

#### Inherited from

[`Channel`](Channel.md).[`mute`](Channel.md#mute)

***

### pan

#### Get Signature

```ts
get pan(): Control;
```

Main output pan.

##### Returns

[`Control`](Control.md)

#### Inherited from

[`Channel`](Channel.md).[`pan`](Channel.md#pan)

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

[`Channel`](Channel.md).[`command`](Channel.md#command)

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

[`Channel`](Channel.md).[`commandEnabled`](Channel.md#commandenabled)

***

### delete()

```ts
delete(): Promise<void>;
```

Delete this bus in one undo step (`delete_bus`), and resolve once it has left
`session.buses` (fact 168). A folder's contents stay where they were, now outside it; use
[deleteWithContents](#deletewithcontents) to take them too. Sends and outputs that fed the bus are kept,
marked `device.missing_bus` (fact 83).

#### Returns

`Promise`\<`void`\>

#### Throws

`device.database_error` for the master bus, `uasrv.invalid_type` for a
cue bus or one LUNA does not know.

#### Example

```ts
const fx = await session.newBus({ name: 'Scratch FX' });
await fx.delete();
```

***

### deleteWithContents()

```ts
deleteWithContents(): Promise<void>;
```

Delete this folder and everything inside it, nested folders included, in one undo step
(`buses/delete_folder_with_contents`), and resolve once all of it has left the session
(fact 168).

#### Returns

`Promise`\<`void`\>

#### Throws

`uasrv.invalid_value` when this bus is not a folder (or LUNA does not
know it).

#### Example

```ts
const drums = session.folders.find((f) => f.name.value === 'Drums');
await drums?.deleteWithContents();
```

***

### insert()

```ts
insert(pluginId, slot?): Promise<Effect | undefined>;
```

Load a plugin into the first empty effect slot (or a named slot).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `slot?` | `string` |

#### Returns

`Promise`\<[`Effect`](Effect.md) \| `undefined`\>

#### Inherited from

[`Channel`](Channel.md).[`insert`](Channel.md#insert)

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

[`Channel`](Channel.md).[`load`](Channel.md#load)

***

### loadPreset()

```ts
loadPreset(preset): Promise<void>;
```

Apply a track preset to this bus in one undo step, as LUNA's bus header PRESETS > Assign
does: `/presets/devices/track/load` with `is_bus` (fact 169). The preset's plugins, sends
and mixer settings replace the bus's; [presetUid](#presetuid) follows. A plugin's preset is
refused on a bus (`uasrv.invalid_type`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preset` | `string` \| `Pick`\<[`PresetRow`](../interfaces/PresetRow.md), `"uid"`\> |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const [row] = await luna.presets.query({ deviceTypeId: 'track', tags: ['Bus'] });
await bus.loadPreset(row);
```

***

### loadStrip()

```ts
loadStrip(): Promise<void>;
```

Load this strip's properties plus the main output's controls in two round trips.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`Channel`](Channel.md).[`loadStrip`](Channel.md#loadstrip)

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

[`Channel`](Channel.md).[`onDispose`](Channel.md#ondispose)

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

[`Channel`](Channel.md).[`property`](Channel.md#property)

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

[`Channel`](Channel.md).[`reload`](Channel.md#reload)

***

### setAutomationMode()

```ts
setAutomationMode(mode): Promise<unknown>;
```

Set this track's or bus's automation mode (`off | read | write | touch | latch`) in one
undo step. `set_automode_on_tracks` takes track and bus uids alike (fact 167);
[automationMode](Channel.md#automationmode) follows on LUNA's push.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mode` | `"read"` \| `"off"` \| `"write"` \| `"touch"` \| `"latch"` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await track.setAutomationMode('touch');
await session.master!.setAutomationMode('read');
```

#### Inherited from

[`Channel`](Channel.md).[`setAutomationMode`](Channel.md#setautomationmode)

***

### setFolderMode()

```ts
setFolderMode(mode): Promise<void>;
```

Change this aux bus's [FolderMode](../type-aliases/FolderMode.md) in one undo step, and resolve once
[folderMode](#foldermode) shows it (fact 136). LUNA reroutes the main output of everything inside
it: into a `'summing'` folder, past a `'container'` one. `'none'` makes it an ordinary bus
and moves what was directly inside it to the session root.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mode` | [`FolderMode`](../type-aliases/FolderMode.md) |

#### Returns

`Promise`\<`void`\>

#### Throws

`uasrv.invalid_value` for a bus that is not an aux bus.

#### Example

```ts
const drums = await session.newFolder({ name: 'Drums', mode: 'container' });
await drums.setFolderMode('summing'); // its tracks now play through it
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

[`Channel`](Channel.md).[`watch`](Channel.md#watch)
