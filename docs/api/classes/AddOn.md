# Class: AddOn

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="addonid"></a> `addOnId` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The manifest's `id`, in lowercase: LUNA compares ids without case. | - |
| <a id="categories"></a> `categories` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | The manifest's `categories`, such as `['MIDI', 'Utility']` (see [ADD\_ON\_CATEGORIES](../variables/ADD_ON_CATEGORIES.md)), or `[]` when it has none. LUNA does not check the names, so one from a newer SDK can appear. `undefined` on a LUNA older than the property. **Example** `const midi = luna.gui.addOns.items.filter((a) => a.categories.value?.includes('MIDI'));` | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="description"></a> `description` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The manifest's `description`, an array of strings already concatenated, or `''` when it has none. | - |
| <a id="fixedsize"></a> `fixedSize` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | The manifest's `fixed_size`: `false` unless it says `true`. Meaningful for `'window'` only. `undefined` on a LUNA older than the property. | - |
| <a id="floating"></a> `floating` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | The manifest's `floating`: `true` unless it says `false`. Meaningful for `'window'` only. | - |
| <a id="icon"></a> `icon` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | Absolute file path of the icon, or `''`. | - |
| <a id="installedfrom"></a> `installedFrom` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AddOnInstalledFrom`](../type-aliases/AddOnInstalledFrom.md)\> | Where it is installed (fact 131): `'folder'`, a folder in LUNA's Add Ons folder (from a `.lunaaddon`, the showcase, or copied there); `'link'`, a symlink there, as `ua-builder install` makes on macOS; `'built_in'`, bundled with LUNA. [Gui.uninstallAddOn](Gui.md#uninstalladdon) removes `'folder'` and `'link'` ones (a link loses only the link) and refuses `'built_in'`. `undefined` on a LUNA older than the property. **Example** `const removable = addOn.installedFrom.value === 'folder' || addOn.installedFrom.value === 'link';` | - |
| <a id="instances"></a> `instances` | `readonly` | [`Collection`](Collection.md)\<[`AddOnInstance`](AddOnInstance.md)\> | Its pages open in LUNA right now, by `add_on_inst` (fact 143): one per window, browser panel, editor panel or app page showing it. Use [Gui.thisInstance](Gui.md#thisinstance) for your own page. **Example** `await addOn.instances.load(); addOn.instances.items.map((i) => `${i.target.value} ${i.width.value}x${i.height.value}`);` | - |
| <a id="manufacturer"></a> `manufacturer` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The manifest's `manufacturer`, or `''` when it has none. | - |
| <a id="maxheight"></a> `maxHeight` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | - | - |
| <a id="maxwidth"></a> `maxWidth` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | - | - |
| <a id="minheight"></a> `minHeight` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | - | - |
| <a id="minwidth"></a> `minWidth` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | The manifest's `min_width`, `min_height`, `max_width` and `max_height` (fact 143): the window's size limits in pixels, `null` when the manifest declares none. LUNA stops the user's resize at them and clamps [AddOnInstance.resize](AddOnInstance.md#resize) to them. Meaningful for `'window'` only. `undefined` on a LUNA older than the properties. **Example** `const tooNarrow = addOn.minWidth.value != null && innerWidth < addOn.minWidth.value;` | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The manifest's `name`: its menu item and panel header. | - |
| <a id="network"></a> `network` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | Every server the Add On would connect to (fact 147): its manifest's `network` hosts, normalized (`'api.example.com'`, `'*.example.com'`, `'host:8443'`), plus a hosted page's own server. `[]` when none. `undefined` on a LUNA older than the property. **Example** `const servers = addOn.network.value ?? [];` | - |
| <a id="networkallowed"></a> `networkAllowed` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | Those of [AddOn.network](#network) the user allowed (fact 147). Only LUNA's own prompts and Settings > Add Ons > SERVERS change it; nothing an Add On sends can. A page loads with the set fixed and is loaded again when it changes. **Example** `const blocked = (addOn.network.value ?? []).filter((h) => !addOn.networkAllowed.value?.includes(h));` | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="requiresplugins"></a> `requiresPlugins` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`PluginRequirement`](../interfaces/PluginRequirement.md)[]\> | The manifest's `requires_plugins` as LUNA read it (fact 148): the plugins the Add On needs, each with every `plugin_id` it accepts (always an array), its `min_version` (`''` for any) and whether it is `optional`; `[]` when it has none. Whether each is met is not here, since it changes with the installed plugins: ask [Plugins.unmetRequirements](Plugins.md#unmetrequirements). LUNA lists an Add On whose non-optional requirement is unmet disabled, with the plugin it needs, and will not open it. `undefined` on a LUNA older than the property. **Example** `await luna.plugins.load(); const missing = luna.plugins.unmetRequirements(addOn.requiresPlugins.value ?? []); if (missing.length) banner.textContent = `Install ${missing.map((r) => r.name).join(', ')}`;` | - |
| <a id="runhidden"></a> `runHidden` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | The manifest's `run_hidden`: `false` unless it says `true`. With `true` LUNA keeps the page running at full speed while it is hidden. `undefined` on a LUNA older than the property. | - |
| <a id="showwithsession"></a> `showWithSession` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | The manifest's `show_with_session`: `false` unless it says `true`. Meaningful for `'window'` only. | - |
| <a id="targets"></a> `targets` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AddOnTarget`](../type-aliases/AddOnTarget.md)[]\> | Every host the Add On can be shown in, default first (fact 144): the manifest's `targets`, such as `['window', 'browser']`, or a one-entry list from its single `target`. The user can swap an Add On with more than one between them from its header. The host a page is in now is its [AddOnInstance.target](AddOnInstance.md#target). `undefined` on a LUNA older than the property. **Example** `const canBePanel = addOn.targets.value?.includes('browser') ?? false; const defaultHost = addOn.targets.value?.[0];` | - |
| <a id="unloadonclose"></a> `unloadOnClose` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | The manifest's `unload_on_close`: `false` unless it says `true`. With `true` LUNA unloads the page when the Add On is closed and loads it fresh when it is opened again, instead of keeping it running hidden. Meaningful for `'window'`, `'browser'` and `'editor'`. `undefined` on a LUNA older than the property. | - |
| <a id="version"></a> `version` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The manifest's `version`, or `''` when it has none. Follows a replace (fact 131). | - |

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

### show()

```ts
show(): Promise<unknown>;
```

Show it in LUNA in the host it is in now (one of [targets](#targets)): navigate to an `'app'`,
 open a `'window'` (toggling it like its menu item), show a `'browser'` in the secondary
 browser, or an `'editor'` in the Timeline's editor panel (never toggling either closed).

#### Returns

`Promise`\<`unknown`\>

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
