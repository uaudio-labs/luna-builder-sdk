# Class: Gui

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="addons"></a> `addOns` | `readonly` | [`Collection`](Collection.md)\<[`AddOn`](AddOn.md)\> | Installed Add Ons, by manifest id. | - |
| <a id="armmode"></a> `armMode` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | Record-arm mode of LUNA's transport bar. | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="priorlaunchcount"></a> `priorLaunchCount` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="windows"></a> `windows` | `readonly` | [`Collection`](Collection.md)\<[`GuiWindow`](GuiWindow.md)\> | Windows by context type; `main` is the arrangement window. | - |

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

***

### main

#### Get Signature

```ts
get main(): GuiWindow;
```

The main window.

##### Returns

[`GuiWindow`](GuiWindow.md)

## Methods

### chooseFiles()

```ts
chooseFiles(options): Promise<string[]>;
```

Native open-file dialog. Resolves to the chosen absolute paths, or `[]` if cancelled.
`filters` are wildcards such as `['*.wav', '*.aif;*.aiff']`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `allowMultiple?`: `boolean`; `defaultPath?`: `string`; `filters?`: `string`[]; `timeoutMs?`: `number`; `title?`: `string`; \} |
| `options.allowMultiple?` | `boolean` |
| `options.defaultPath?` | `string` |
| `options.filters?` | `string`[] |
| `options.timeoutMs?` | `number` |
| `options.title?` | `string` |

#### Returns

`Promise`\<`string`[]\>

***

### chooseSavePath()

```ts
chooseSavePath(options): Promise<string | undefined>;
```

Native save dialog. Resolves to the chosen path, or `undefined` if cancelled.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `defaultPath?`: `string`; `extensions?`: `string`[]; `timeoutMs?`: `number`; \} |
| `options.defaultPath?` | `string` |
| `options.extensions?` | `string`[] |
| `options.timeoutMs?` | `number` |

#### Returns

`Promise`\<`string` \| `undefined`\>

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

### execute()

```ts
execute(command, data): Promise<unknown>;
```

Run a LUNA rack command by id with extra fields as its data. Escape hatch.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |
| `data` | `Record`\<`string`, `unknown`\> |

#### Returns

`Promise`\<`unknown`\>

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

### openPluginManager()

```ts
openPluginManager(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### openSettings()

```ts
openSettings(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### openUrl()

```ts
openUrl(url): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

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

### revealPath()

```ts
revealPath(path): Promise<unknown>;
```

Reveal a file or folder in Finder / Explorer.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`unknown`\>

***

### setPage()

```ts
setPage(page, contextType): Promise<unknown>;
```

Switch the main window (or another context's window) to a page.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `page` | `string` | `undefined` |
| `contextType` | `string` | `'main'` |

#### Returns

`Promise`\<`unknown`\>

***

### showAddOn()

```ts
showAddOn(id): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`unknown`\>

***

### showFeedback()

```ts
showFeedback(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### showSessionInFinder()

```ts
showSessionInFinder(sessionPackageUid?): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionPackageUid?` | `string` |

#### Returns

`Promise`\<`unknown`\>

***

### startTask()

```ts
startTask(title, options): Promise<ProgressTask>;
```

Show a progress task in LUNA. Call `progress()` with 0..100, then `done()`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `title` | `string` |
| `options` | \{ `nativeProgressBar?`: `boolean`; \} |
| `options.nativeProgressBar?` | `boolean` |

#### Returns

`Promise`\<[`ProgressTask`](../interfaces/ProgressTask.md)\>

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
