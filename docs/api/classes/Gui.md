# Class: Gui

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="addons"></a> `addOns` | `readonly` | [`Collection`](Collection.md)\<[`AddOn`](AddOn.md)\> | Installed Add Ons, by manifest id in lowercase (`byId('com.example.foo')`). | - |
| <a id="armmode"></a> `armMode` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | Record-arm mode of LUNA's transport bar. | - |
| <a id="blessedfolders"></a> `blessedFolders` | `readonly` | [`Prop`](../interfaces/Prop.md)\<readonly `string`[] \| `undefined`\> | The blessed folders (fact 133): the folders the user lets every Add On read, as absolute paths with links resolved. [listFiles](#listfiles) and [listAllFiles](#listallfiles) list anything in them, and [serveMediaFile](#servemediafile) gives a URL for any file in them, of any type, but hidden ones. The user manages them in LUNA's Settings > Add Ons > FOLDERS; a page asks for one with [addBlessedFolder](#addblessedfolder). `undefined` until known, and on a LUNA without them. Follows LUNA once [watchBlessedFolders](#watchblessedfolders) has run. | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="pluginwindows"></a> `pluginWindows` | `readonly` | [`Prop`](../interfaces/Prop.md)\<readonly [`PluginWindow`](../interfaces/PluginWindow.md)[] \| `undefined`\> | The plugin editor windows open in LUNA, opened from the page or by the user (fact 126). `undefined` until known, and on a LUNA that does not publish them. Follows LUNA once [watchPluginWindows](#watchpluginwindows) has run, which `session.ready()` does. Read one slot's state from `effect.editorOpen`. | - |
| <a id="priorlaunchcount"></a> `priorLaunchCount` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="sessionstoragepath"></a> `sessionStoragePath` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The folder LUNA creates new sessions in, as set in its Settings (fact 160). Read-only; it follows the setting once `/gui` is watched. `undefined` on an engine without `/gui`. **Example** `await luna.gui.watch().ready; luna.gui.sessionStoragePath.value; // e.g. "/Users/me/Music/LUNA"` | - |
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

### addBlessedFolder()

```ts
addBlessedFolder(path): Promise<void>;
```

Ask the user to let every Add On read the folder at `path` and every folder inside it,
making it a blessed folder (fact 133). LUNA shows its own prompt ("An Add On wants to read
the folder ..."), with DON'T ALLOW as the default, so a page can never bless one
silently. Resolves as the prompt opens, not once answered: watch [blessedFolders](#blessedfolders)
(after [watchBlessedFolders](#watchblessedfolders)) for the result. Resolves at once, without asking, when
the folder is already blessed or inside one that is.

LUNA never asks for a folder too broad for one answer: a disk's root, the home folder or
a folder holding it (`/Users`), or `~/Library`; ask for a folder inside one instead
(`~/Music`). Once the user says DON'T ALLOW, LUNA does not ask for that folder again until
it restarts. The user can still add any folder in Settings > Add Ons > FOLDERS.

Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for a relative path or
a file, `uasrv.filesystem_error` when nothing is at `path`, `uasrv.not_permitted`
(without asking) for a folder too broad or one the user refused this session, and
`uasrv.too_many_requests` while LUNA is already asking. A LUNA without the command
rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.watchBlessedFolders();
await luna.gui.addBlessedFolder('/Users/me/Samples');
luna.gui.blessedFolders.onChange(() => console.log(luna.gui.blessedFolders.value));
```

***

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
[listFiles](#listfiles) or the engine, not to `fetch`. LUNA then asks the user, once for all the
folders picked, whether every Add On may read them (fact 133). If they allow it, each
becomes a blessed folder: [listFiles](#listfiles) reads it and every folder inside it, from now on
and after LUNA restarts. If not, you still get the paths (for `session.importPath()`), but
[listFiles](#listfiles) refuses them; check [blessedFolders](#blessedfolders). Nothing is asked for a folder
already blessed or inside one. Needs `/gui` ([Gui.available](#available)) and a
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

### hidePlugin()

```ts
hidePlugin(
   channelUid, 
   slot, 
options): Promise<unknown>;
```

Close the editor window of the plugin in `slot`, if it is open. See [showPlugin](#showplugin).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelUid` | `string` |
| `slot` | `string` |
| `options` | \{ `contextType?`: `string`; `sessionUid?`: `string`; \} |
| `options.contextType?` | `string` |
| `options.sessionUid?` | `string` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await luna.gui.hidePlugin(track.id, 'effect_0');
await luna.gui.hidePlugin(track.id, 'effect_0', { contextType: 'alt_1' });
```

***

### installAddOn()

```ts
installAddOn(from): Promise<void>;
```

Install Add Ons into LUNA, as LUNA's Add On Showcase does (fact 128). Give
`{ id }`, a showcase package id or the id of an Add On in one (its whole package
installs), or `{ url }`: a public GitHub repo (`https://github.com/<owner>/<repo>`; the
scheme, `www.`, `.git` and a path inside the repo are tolerated), whose latest release
LUNA lists in the showcase and installs every `.lunaaddon` of; or a Google Drive share
link to a `.lunaaddon` (`https://drive.google.com/file/d/<id>/view?usp=sharing`), an
iCloud Drive one (`https://www.icloud.com/iclouddrive/<id>#<name>`) or a Dropbox one
(`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=0`), which LUNA downloads
and installs. The file has to be shared with anyone who has the link: LUNA does not
sign in to Google, iCloud or Dropbox. Either way LUNA asks the user to add the Add Ons, or
replace what is installed, so the user always confirms. A url that installs and is not
one of the showcase's own repos is saved, and LUNA lists it in its showcase from
then on, to install again; [removeAddOn](#removeaddon) forgets it.

Resolves as LUNA starts, not once installed: watch [addOns](#addons) for the result. A
repo whose latest release has nothing LUNA can install, or a shared file that is not
shared with anyone, a folder, or not an Add On, is only found out after this resolves, and LUNA tells the user. Rejects with a `Luna.Error` whose `code` is
`uasrv.invalid_value` for an id no showcase package has, a url that is not a GitHub
repo or a Drive, iCloud Drive or Dropbox file link, or both given; `uasrv.missing_field` for neither; `uasrv.too_many_requests` while
that package is already installing. A LUNA without the command (an older one, or one
without its Add On showcase) rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | \| \{ `id`: `string`; \} \| \{ `url`: `string`; \} |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.installAddOn({ url: 'https://github.com/uaudio-labs/video-window' });
await luna.gui.installAddOn({ url: 'https://drive.google.com/file/d/<id>/view?usp=sharing' });
await luna.gui.installAddOn({ url: 'https://www.icloud.com/iclouddrive/<id>#my-add-on' });
await luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fi/<id>/my-add-on.lunaaddon?rlkey=<key>&dl=0' });
await luna.gui.installAddOn({ id: 'uaudio-labs.midi-notation' });
```

***

### isPluginOpen()

```ts
isPluginOpen(
   channelUid, 
   slot, 
   sessionUid?): boolean | undefined;
```

True when LUNA has the editor of `slot` on `channelUid` open; `undefined` until known.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelUid` | `string` |
| `slot` | `string` |
| `sessionUid?` | `string` |

#### Returns

`boolean` \| `undefined`

***

### listAllFiles()

```ts
listAllFiles(path): Promise<{
  files: NestedFileEntry[];
  truncated: boolean;
}>;
```

Everything below the folder at `path`, every folder inside it included (fact 133): each
folder's entry is followed by its own contents, each level in [listFiles](#listfiles)' order,
and every entry has its `relativePath`. Hidden files and folders are left out, and a link
to a folder is listed but not followed. `truncated` is true when LUNA stopped at its
limit (10,000 entries, or 5 seconds of reading); list a folder further down to see the rest. `path` must be a
blessed folder or inside one, with the same errors as [listFiles](#listfiles). A LUNA that
cannot list recursively rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<\{
  `files`: [`NestedFileEntry`](../interfaces/NestedFileEntry.md)[];
  `truncated`: `boolean`;
\}\>

#### Example

```ts
const { files } = await luna.gui.listAllFiles('/Users/me/Samples');
const loops = files.filter((f) => !f.isDirectory && f.relativePath.startsWith('Loops/'));
```

***

### listFiles()

```ts
listFiles(path): Promise<FileEntry[]>;
```

The files and folders directly inside the folder at `path`, as LUNA sees the disk (fact
106). Hidden entries are left out; the rest are in natural order, as LUNA's own browsers
sort: case ignored, and numbers by value, so `take2` comes before `take10`. `path` must
be absolute.

LUNA lists only the blessed folders ([blessedFolders](#blessedfolders)) and the folders inside them:
one picked with [chooseFolders](#choosefolders) or dropped on an Add On (`Luna.onPathDrop()`) and
allowed in LUNA's prompt, allowed through [addBlessedFolder](#addblessedfolder), or added in Settings >
Add Ons > FOLDERS. LUNA
remembers them across restarts, at most 64 (the oldest are forgotten first), until the
user removes them there. They are LUNA-wide, not per Add On. A path is judged where it
really is, so `..` or a link out of a blessed folder is refused, and so is a hidden
folder inside one (`.git`). For everything below a
folder in one call, use [listAllFiles](#listallfiles).

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

### removeAddOn()

```ts
removeAddOn(id): Promise<void>;
```

Forget a link [installAddOn](#installaddon) (or LUNA's IMPORT URL) saved, as Remove from
Showcase in LUNA does (fact 128). `id` is the package's id under
`/gui/showcase/packages`, or the id of an Add On in it. Its listing leaves LUNA's
showcase now and at the next launch; the installed Add On is not touched. Rejects with
a `Luna.Error` whose `code` is `uasrv.invalid_value` for an id no showcase package
has, `uasrv.not_permitted` for a package of the showcase's own repos, and
`uasrv.missing_field` with no id. A LUNA without the command rejects with
`Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.removeAddOn('com.uaudio.qwerty_midi');
```

***

### removeBlessedFolder()

```ts
removeBlessedFolder(path): Promise<void>;
```

Stop letting Add Ons read a blessed folder (fact 133), without asking: removing access
needs no consent. `path` must be one of [blessedFolders](#blessedfolders); a folder inside one cannot
be removed on its own. [blessedFolders](#blessedfolders) has changed by the time this resolves.
Rejects with a `Luna.Error` whose `code` is `uasrv.invalid_value` for any other path. A
LUNA without the command rejects with `Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
for (const folder of luna.gui.blessedFolders.value ?? []) await luna.gui.removeBlessedFolder(folder);
```

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

The URL your Add On's page loads a local file from, given its absolute `path` (from
[chooseFiles](#choosefiles), [listFiles](#listfiles), `Luna.onPathDrop()`, or a path you saved, say in
`session.storage`). Set it as a `<video>`, `<audio>` or `<img>` `src`, or read the bytes
with XMLHttpRequest (fact 114). This is how a page plays or reads a file it knows only by
path.

Any file in a blessed folder ([blessedFolders](#blessedfolders)) is served whatever its type: JSON,
text, images, PDFs as well as media (fact 133). Hidden files below the blessed folder
(`.git`, `.env`) and links that lead out of it are not. Outside the blessed folders only
audio, video and MIDI are served, as below.

`addOnId` is your manifest's `id`: the file is served to that Add On's pages only. On
macOS the URL is `ua-content://<your Add On>/<path>` and supports byte ranges, so media
seeks without reading the whole file; on Windows it is a `file:///` URL, which media
elements and XMLHttpRequest load but `fetch()` refuses. Ask again
after every reload: LUNA forgets the files it served when it quits.

Outside the blessed folders only real media is served. LUNA follows links and checks the file they lead to: it needs
an audio, video or MIDI extension (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `wav`, `aif`,
`aiff`, `mp3`, `m4a`, `flac`, `ogg`, `oga`, `opus`, `mid`, `midi`) and that format's
signature in its first bytes (`MThd` for a Standard MIDI File). Rejects with a
`Luna.Error` whose `code` is `uasrv.invalid_value` for a relative path, a folder, or a
file outside the blessed folders that is not audio, video or MIDI; `uasrv.filesystem_error` when
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
setPage(page, contextType): Promise<void>;
```

Switch the main window (or another context's window) to a page, and resolve once the
window's `page` shows it (fact 236). LUNA refuses a page it cannot switch to, `lunaplay`
among them, with `uasrv.invalid_value`.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `page` | [`SettablePage`](../type-aliases/SettablePage.md) | `undefined` |
| `contextType` | `string` | `'main'` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.setPage('mixer');
luna.gui.main.page.value; // 'mixer'
```

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

### showPlugin()

```ts
showPlugin(
   channelUid, 
   slot, 
options): Promise<unknown>;
```

Open the editor window of the plugin in `slot` on a track or bus, as clicking it in
LUNA's mixer does (or bring it to the front). LUNA answers before the window opens, and
an empty slot opens nothing: `effect.openEditor()` waits for the window and says so.
`sessionUid` defaults to the session in LUNA's window. `contextType` names the LUNA window
to open it from (`main` by default; an Add On in an alternate window passes its own, such
as `alt_1`); a window that is not open rejects with `uasrv.invalid_object`, and a name LUNA
does not know means `main` (fact 178). A LUNA without the command rejects with
`Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channelUid` | `string` |
| `slot` | `string` |
| `options` | \{ `contextType?`: `string`; `sessionUid?`: `string`; \} |
| `options.contextType?` | `string` |
| `options.sessionUid?` | `string` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await luna.gui.showPlugin(track.id, 'effect_0');
await luna.gui.showPlugin(track.id, 'effect_0', { contextType: 'alt_1' });
```

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

### suppressProgress()

```ts
suppressProgress(options): Promise<ProgressSuppression>;
```

Hold back LUNA's modal progress dialog while this page shows its own progress UI, and
close one already open (fact 223). The hold is app-wide: it withholds the dialog of every
task but one started with `nativeProgressBar`. Release it from a `finally`; a watchdog
releases it after `maxMs` (default two minutes), and so does the page going away when it
still can. LUNA does not drop an Add On's hold when the Add On closes (fact 224).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SuppressProgressOptions`](../interfaces/SuppressProgressOptions.md) |

#### Returns

`Promise`\<[`ProgressSuppression`](../interfaces/ProgressSuppression.md)\>

#### Example

```ts
const hold = await luna.gui.suppressProgress();
try {
  await work();
} finally {
  await hold.release();
}
```

***

### thisInstance()

```ts
thisInstance(instanceId): Promise<AddOnInstance | undefined>;
```

This page's own instance (fact 143), from the `add_on_inst` LUNA puts in an Add On page's
URL, watched so its size follows LUNA. `undefined` outside LUNA, on a LUNA older than
instances, or when no live instance has that id. Pass an id to look up another page.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `instanceId` | `string` \| `undefined` |

#### Returns

`Promise`\<[`AddOnInstance`](AddOnInstance.md) \| `undefined`\>

#### Example

```ts
const me = await luna.gui.thisInstance();
if (me) console.log(me.addOnId, me.instanceId, me.width.value, me.height.value);
```

***

### uninstallAddOn()

```ts
uninstallAddOn(id): Promise<void>;
```

Ask the user to remove an installed Add On (fact 130). LUNA shows its own prompt ("Remove
"Video Window"?"), so a page can never remove one silently. If the user agrees, LUNA closes
the Add On wherever it shows, deletes its folder in the Add Ons folder (with every other
Add On installed in that folder, which the prompt names) and rescans, so it leaves
[addOns](#addons). An Add On installed with `ua-builder install` on macOS is a symlink: LUNA
removes only the link, never your project.

Resolves as the prompt opens, not once removed: watch [addOns](#addons) for the result (it
stays there if the user cancels). Rejects with a `Luna.Error` whose `code` is
`uasrv.invalid_value` for an id not in [addOns](#addons), `uasrv.not_permitted` for an Add On
built into LUNA, `uasrv.too_many_requests` while LUNA is already asking, and
`uasrv.missing_field` with no id. A LUNA without the command rejects with
`Luna.Unsupported`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.uninstallAddOn('com.uaudio.video_window');
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

***

### watchBlessedFolders()

```ts
watchBlessedFolders(): Promise<void>;
```

Follow [blessedFolders](#blessedfolders) for the life of the connection. Idempotent; resolves once
the first list is in, or at once on an engine without `/gui`.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.watchBlessedFolders();
luna.gui.blessedFolders.onChange(() => render(luna.gui.blessedFolders.value ?? []));
```

***

### watchPluginWindows()

```ts
watchPluginWindows(): Promise<void>;
```

Follow [pluginWindows](#pluginwindows) for the life of the connection. Idempotent; resolves once
the first list is in, or at once on an engine without `/gui`. `session.ready()` calls it.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.gui.watchPluginWindows();
luna.gui.pluginWindows.value; // [{ sessionUid, channelUid, slot: 'effect_0' }]
```
