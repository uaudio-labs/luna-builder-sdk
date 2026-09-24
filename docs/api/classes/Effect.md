# Class: Effect

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="bypasscontrol"></a> `bypassControl` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | Name of the control that carries the IN/OUT state, or `null` if the plugin has none. | - |
| <a id="bypasscontrolactivelow"></a> `bypassControlActiveLow` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean` \| `null`\> | - | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="controls"></a> `controls` | `readonly` | [`Controls`](Controls.md) | Every child of the slot's `controls` folder, including parameters a cleared plugin left behind (fact 86). Prefer [params](#params). | - |
| <a id="enabled"></a> `enabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | Reported by the engine; not the bypass state. See [in](#in). | - |
| <a id="frozen"></a> `frozen` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="in"></a> `in` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean` \| `undefined`\> | IN (true) or bypassed (false); `undefined` until known or when the plugin has no bypass control. | - |
| <a id="inserttype"></a> `insertType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="instanceid"></a> `instanceId` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | The plugin instance id, set once the plugin has loaded (fact 86). `plugin_name` is not a load signal: it can stay null for a loaded plugin; the catalog has the name. | - |
| <a id="loaded"></a> `loaded` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | True once a plugin is loaded in this slot without an error. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="pluginerror"></a> `pluginError` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="pluginid"></a> `pluginId` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | Plugin id (for example `com.uaudio.uadx.1176`), or `null` when the slot is empty. | - |
| <a id="pluginlicenseerror"></a> `pluginLicenseError` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="pluginname"></a> `pluginName` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="pluginpower"></a> `pluginPower` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="presetdirty"></a> `presetDirty` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="presetname"></a> `presetName` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="presetuid"></a> `presetUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="sidechainallowed"></a> `sidechainAllowed` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="sidechaininuse"></a> `sidechainInUse` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |

## Accessors

### bypass

#### Get Signature

```ts
get bypass(): Control | undefined;
```

The control carrying the IN/OUT state, if the plugin has one.

##### Returns

[`Control`](Control.md) \| `undefined`

***

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

***

### isEffectSlot

#### Get Signature

```ts
get isEffectSlot(): boolean;
```

True for the user-facing `effect_N` slots.

##### Returns

`boolean`

***

### isEmpty

#### Get Signature

```ts
get isEmpty(): boolean;
```

##### Returns

`boolean`

***

### params

#### Get Signature

```ts
get params(): Control[];
```

The plugin's live parameters, in engine order: the `controls` that are `initialized`.
A cleared slot keeps its old parameters as ghosts (fact 86); they are left out here.
Writes are touch-bracketed like any control, which makes them undoable (fact 85).

##### Example

```ts
await slot.controls.load();
for (const p of slot.params) console.log(p.name.value, p.display.value);
```

##### Returns

[`Control`](Control.md)[]

## Methods

### clear()

```ts
clear(): Promise<unknown>;
```

Remove the plugin from this slot.

#### Returns

`Promise`\<`unknown`\>

***

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

### nextPreset()

```ts
nextPreset(): Promise<unknown>;
```

Step through the plugin's presets.

#### Returns

`Promise`\<`unknown`\>

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

### previousPreset()

```ts
previousPreset(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

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

### setIn()

```ts
setIn(on, contextType): Promise<unknown>;
```

Set IN (true) or bypass (false) through the engine's undoable, group-aware path.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `on` | `boolean` | `undefined` |
| `contextType` | `string` | `'main'` |

#### Returns

`Promise`\<`unknown`\>

***

### setPlugin()

```ts
setPlugin(pluginId, options): Promise<unknown>;
```

Load a plugin into this slot (replacing any current one) and resolve once it has
loaded. `set_inserts` answers `null` whether or not the plugin exists (fact 86), so the
slot is the proof: an unknown or unusable plugin rejects with the slot's
`plugin_error` as the code (for example `mixer.missing_plug-in`). Pass `wait: false`
to resolve on the reply alone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `options` | \{ `pluginName?`: `string`; `presetName?`: `string`; `timeoutMs?`: `number`; `wait?`: `boolean`; \} |
| `options.pluginName?` | `string` |
| `options.presetName?` | `string` |
| `options.timeoutMs?` | `number` |
| `options.wait?` | `boolean` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await slot.setPlugin('com.uaudio.uadx.1176');
slot.loaded.value; // true
```

***

### waitForPlugin()

```ts
waitForPlugin(timeoutMs, pluginId?): Promise<void>;
```

Resolve once the slot holds a loaded plugin (it has an instance id) or reports a
`plugin_error` (fact 86). With `pluginId`, wait for that plugin rather than whatever
the slot held before. Rejects with [RequestTimeout](RequestTimeout.md) after `timeoutMs`.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `timeoutMs` | `number` | `10_000` |
| `pluginId?` | `string` | `undefined` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await slot.waitForPlugin();
if (slot.pluginError.value) show(slot.pluginError.value);
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
