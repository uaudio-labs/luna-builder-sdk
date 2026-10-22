# Class: Gui

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="addons"></a> `addOns` | `readonly` | [`Collection`](Collection.md)\<[`AddOn`](AddOn.md)\> | Installed Add Ons, by manifest id in lowercase (`byId('com.example.foo')`). | - |
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

### available()

```ts
available(): Promise<boolean>;
```

True when the engine has LUNA's `/gui` (fact 103). Read once per connection: the
root's children are listed, because a `get` of a missing `/gui` answers `{}` (fact 10).

#### Returns

`Promise`\<`boolean`\>

#### Example

```ts
const paths = (await luna.gui.available()) ? await luna.gui.chooseFiles() : [];
```

***

### chooseFiles()

```ts
chooseFiles(options): Promise<string[]>;
```

LUNA's native open-file dialog. Resolves to the chosen **absolute paths**, or `[]` if
cancelled. `filters` are wildcards such as `['*.wav', '*.aif;*.aiff']`.

This is the **path route**, an optimization for getting files into the session: the
engine reads the paths from disk (`session.importPath()`, `session.importFile()`), so the
bytes never pass through the page. The page itself cannot read these paths; `fetch`
and XHR refuse them. Needs `/gui` ([Gui.available](#available)) and a native engine that can
see the file.

Want the audio in the page (decode, audition, slice)? Do not use this: use
`<input type="file">`, which gives `File` objects everywhere, and
`session.uploadFile({ bytes: file })` to put one into the session.

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

#### Example

```ts
const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
if (path) await session.importPath(path);
```

***

### chooseFolders()

```ts
chooseFolders(options): Promise<string[]>;
```

LUNA's native folder dialog. Resolves to the chosen folders' **absolute paths**, or `[]`
if cancelled. A path route like [chooseFiles](#choosefiles): hand the paths to
[listFiles](#listfiles) or the engine, not to `fetch`. Picking a folder lets [listFiles](#listfiles)
read it and every folder inside it, from now on and after LUNA restarts. Needs `/gui` ([Gui.available](#available)) and a
LUNA that has the dialog (fact 106); an older one rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `allowMultiple?`: `boolean`; `defaultPath?`: `string`; `timeoutMs?`: `number`; `title?`: `string`; \} |
| `options.allowMultiple?` | `boolean` |
| `options.defaultPath?` | `string` |
| `options.timeoutMs?` | `number` |
| `options.title?` | `string` |

#### Returns

`Promise`\<`string`[]\>

#### Example

```ts
const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
if (folder) console.log(await luna.gui.listFiles(folder));
```

***

### chooseSavePath()

```ts
chooseSavePath(options): Promise<string | undefined>;
```

LUNA's native save dialog. Resolves to the chosen absolute path, or `undefined` if
cancelled. Like [chooseFiles](#choosefiles) the path is for the engine (for example a render's
`outputPaths`); the page cannot write to it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `defaultPath?`: `string`; `extensions?`: `string`[]; `timeoutMs?`: `number`; \} |
| `options.defaultPath?` | `string` |
| `options.extensions?` | `string`[] |
| `options.timeoutMs?` | `number` |

#### Returns

`Promise`\<`string` \| `undefined`\>

#### Example

```ts
const path = await luna.gui.chooseSavePath({ extensions: ['wav'] });
```

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

### listFiles()

```ts
listFiles(path): Promise<FileEntry[]>;
```

The files and folders directly inside the folder at `path`, as LUNA sees the disk (fact
106). Hidden entries are left out; the rest are in natural order, as LUNA's own browsers
sort: case ignored, and numbers by value, so `take2` comes before `take10`. `path` must
be absolute.

LUNA lists only folders the user gave it: one picked with [chooseFolders](#choosefolders) or
dropped on an Add On (`Luna.onPathDrop()`), or a folder inside one. LUNA remembers
them across restarts, at most 64 (the oldest are forgotten first), until the user
clicks FORGET FOLDERS in Settings > Add Ons. They are LUNA-wide, not per Add On. A
path is judged where it really is, so `..` or a link out of a granted folder is
refused.

Rejects with a `Luna.Error` whose `code` is `uasrv.not_permitted` when `path` is not in
a granted folder (whether or not anything is there: ask with [chooseFolders](#choosefolders)),
`uasrv.filesystem_error` when nothing is at `path` or it cannot be read, and
`uasrv.invalid_value` when `path` is relative or names a file. An older LUNA without
the command rejects with `Luna.Unsupported`; an older LUNA lists any folder.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`FileEntry`](../interfaces/FileEntry.md)[]\>

#### Example

```ts
const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
for (const entry of folder ? await luna.gui.listFiles(folder) : []) {
  if (!entry.isDirectory && entry.name.endsWith('.wav')) await session.importPath(entry.path);
}
```

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

### serveMediaFile()

```ts
serveMediaFile(addOnId, path): Promise<string>;
```

The URL your Add On's page loads a local audio or video file from, given its absolute
`path` (from [chooseFiles](#choosefiles), `Luna.onPathDrop()`, or a path you saved, say in
`session.preferences`). Set it as a `<video>` or `<audio>` `src`, or read the bytes with
XMLHttpRequest (fact 114). This is how a page plays or reads a file it knows only by path.

`addOnId` is your manifest's `id`: the file is served to that Add On's pages only. On
macOS the URL is `ua-content://<your Add On>/<path>` and supports byte ranges, so media
seeks without reading the whole file; on Windows it is a `file:///` URL, which media
elements and XMLHttpRequest load but `fetch()` refuses. Ask again
after every reload: LUNA forgets the files it served when it quits.

Only real media is served. LUNA follows links and checks the file they lead to: it needs
an audio or video extension (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `wav`, `aif`, `aiff`,
`mp3`, `m4a`, `flac`, `ogg`, `oga`, `opus`) and that format's signature in its first
bytes. Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative
path, a folder, or a file that is not audio or video; `uasrv.filesystem_error` when
nothing is at `path` (a session opened on another computer, a file moved) or it cannot
be read; `uasrv.not_installed` when `addOnId` names no installed Add On with a local
page. A LUNA without the command rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `addOnId` | `string` |
| `path` | `string` |

#### Returns

`Promise`\<`string`\>

#### Example

```ts
const [path] = await luna.gui.chooseFiles({ filters: ['*.mov;*.mp4'] });
if (path) video.src = await luna.gui.serveMediaFile('com.example.my-add-on', path);
```

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
