# Class: Session

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="buses"></a> `buses` | `readonly` | [`Collection`](Collection.md)\<[`Bus`](Bus.md)\> | - | - |
| <a id="canredo"></a> `canRedo` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="canundo"></a> `canUndo` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="changecount"></a> `changeCount` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="commandpercentcomplete"></a> `commandPercentComplete` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="commandstatus"></a> `commandStatus` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="context"></a> `context` | `readonly` | [`Context`](Context.md) | The `main` edit context: selection, zoom and the context edit commands. | - |
| <a id="contexts"></a> `contexts` | `readonly` | [`Collection`](Collection.md)\<[`Context`](Context.md)\> | Edit contexts (`main`, `editor`, `alt_<n>`). | - |
| <a id="focusedtrack"></a> `focusedTrack` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`Track`](Track.md)\> | The track the user is working on: the main context's `lastSelectedTrack`, else the first selected track, else the first visible track. `undefined` only when the session has no visible track. Notifies when the answer moves to a different track, not on every selection write. The last fallback follows tracks being added and removed, not a reorder. **Example** `const draw = () => (label.textContent = session.focusedTrack.value?.name.value ?? 'No track'); session.focusedTrack.onChange(draw); draw();` | - |
| <a id="loaded"></a> `loaded` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="markers"></a> `markers` | `readonly` | [`Markers`](Markers.md) | - | - |
| <a id="musical"></a> `musical` | `readonly` | [`Musical`](Musical.md) | Tempo map, time and key signatures, and tick/bar/seconds conversion. | - |
| <a id="name"></a> `name` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="playlists"></a> `playlists` | `readonly` | [`Collection`](Collection.md)\<[`Playlist`](Playlist.md)\> | All playlists (take lanes) in the session; each names its track. | - |
| <a id="readonly"></a> `readOnly` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="sessionpackagepath"></a> `sessionPackagePath` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="sessionpackageuid"></a> `sessionPackageUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="solomode"></a> `soloMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="storage"></a> `storage` | `readonly` | [`SessionStorage`](SessionStorage.md) | Data Add Ons keep with this session, by reverse-DNS context (fact 129). | - |
| <a id="tempoestablished"></a> `tempoEstablished` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="tracks"></a> `tracks` | `readonly` | [`Collection`](Collection.md)\<[`Track`](Track.md)\> | - | - |
| <a id="transport"></a> `transport` | `readonly` | [`Transport`](Transport.md) | - | - |
| <a id="uid"></a> `uid` | `readonly` | `string` | - | - |

## Accessors

### batching

#### Get Signature

```ts
get batching(): boolean;
```

True while a [transaction](#transaction) is open, of either kind.

##### Returns

`boolean`

***

### channelsInOrder

#### Get Signature

```ts
get channelsInOrder(): (Bus | Track)[];
```

Every track and bus in LUNA's order (fact 137): one `order` runs 1..N across both, each
folder followed at once by everything inside it. This includes LUNA's system tracks
(click, count-in) and buses (master, cues); filter on `trackType` and `busType` for what
a page shows. [tracksInOrder](#tracksinorder) is the same order with the buses left out.

##### Example

```ts
// LUNA's track list as an indented outline.
const depth = (ch) => (ch?.folderUid.value ? 1 + depth(session.buses.byId(ch.folderUid.value)) : 0);
for (const ch of session.channelsInOrder) console.log('  '.repeat(depth(ch)) + ch.name.value);
```

##### Returns

([`Bus`](Bus.md) \| [`Track`](Track.md))[]

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

### folders

#### Get Signature

```ts
get folders(): Bus[];
```

The folder tracks, in no particular order: the buses whose folder mode is not `'none'`.
Use [folderContents](#foldercontents) for the hierarchy.

##### Example

```ts
for (const folder of session.folders) console.log(folder.name.value, folder.folderMode.value);
```

##### Returns

[`Bus`](Bus.md)[]

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

### master

#### Get Signature

```ts
get master(): Bus | undefined;
```

The master bus, once buses are loaded.

##### Returns

[`Bus`](Bus.md) \| `undefined`

***

### sources

#### Get Signature

```ts
get sources(): 
  | Collection<AudioSource>
  | undefined;
```

Source audio files of this session, under `/workspace/sessions/<package uid>/audio`.
`undefined` until the session's package uid is known (after `ready()`).

##### Returns

  \| [`Collection`](Collection.md)\<[`AudioSource`](AudioSource.md)\>
  \| `undefined`

***

### tracksInOrder

#### Get Signature

```ts
get tracksInOrder(): Track[];
```

Tracks sorted by their `order` key; buses and folders, which share it, are left out (fact 137).

##### Returns

[`Track`](Track.md)[]

***

### transactionMode

#### Get Signature

```ts
get transactionMode(): TransactionMode | undefined;
```

The kind of [transaction](#transaction) open now, or `undefined` outside one.

##### Returns

[`TransactionMode`](../type-aliases/TransactionMode.md) \| `undefined`

***

### visibleTracks

#### Get Signature

```ts
get visibleTracks(): Track[];
```

Tracks a user sees: `tracksInOrder` without LUNA's system `click` and `count_in` tracks
(fact 28).

##### Returns

[`Track`](Track.md)[]

## Methods

### addMarker()

```ts
addMarker(
   tick, 
   name, 
options): Promise<unknown>;
```

Add a marker at `tick` and resolve once it is in [markers](#markers). `set_marker` answers
`null` whether or not it did anything (fact 71), so the list is the proof.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |
| `name` | `string` |
| `options` | \{ `color?`: `number`; `comments?`: `string`; \} |
| `options.color?` | `number` |
| `options.comments?` | `string` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await session.addMarker(Luna.WHOLE_NOTE * 8, 'Chorus');
```

***

### bounce()

```ts
bounce(options): Promise<{
  fileUids: string[];
  render: Render;
}>;
```

Bounce channels through LUNA's render engine (fact 44). Resolves once the render is
running, so the caller can watch `render.progress` and `await render.done()`.

Without `outputPaths` the finished audio is added to the session as sources, one per
channel, under the returned `fileUids`; with them it is written to those paths instead.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`BounceOptions`](../interfaces/BounceOptions.md) |

#### Returns

`Promise`\<\{
  `fileUids`: `string`[];
  `render`: [`Render`](Render.md);
\}\>

#### Example

```ts
const { render } = await session.bounce({ channelUids: [vocal.id], range: { startTick: 0, stopTick: 8 * Luna.TICKS_PER_BEAT } });
await render.done();
```

***

### close()

```ts
close(): Promise<unknown>;
```

Close this session.

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

### deleteTracks()

```ts
deleteTracks(trackUids): Promise<unknown>;
```

Delete tracks by uid in one undo step, and resolve once they have left [tracks](#tracks).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `trackUids` | `string`[] |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await session.deleteTracks([scratch.id]);
```

***

### exportMain()

```ts
exportMain(options): Promise<{
  file: string | undefined;
  render: Render;
}>;
```

LUNA's own export (`export_session`): the main bus over the timeline selection, or
`range`, to the session's export folder. The reply carries the path it wrote.

The render is already running when this resolves, so a very short offline export can
finish and be dropped before anything observes it; `render.done()` then rejects with
`removed` although the file was written (fact 44).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ExportOptions`](../interfaces/ExportOptions.md) |

#### Returns

`Promise`\<\{
  `file`: `string` \| `undefined`;
  `render`: [`Render`](Render.md);
\}\>

#### Example

```ts
const { render, file } = await session.exportMain({ name: 'Rough mix' });
```

***

### folderContents()

```ts
folderContents(folder): (Bus | Track)[];
```

The tracks and buses directly inside `folder`, or at the session root for `null`, sorted
by their `order`. Their own `folderUid` names the folder. At the root this includes
LUNA's system tracks and buses (click, count-in, master, cues).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `folder` | `string` \| [`Bus`](Bus.md) \| `null` |

#### Returns

([`Bus`](Bus.md) \| [`Track`](Track.md))[]

#### Example

```ts
const walk = (folder, depth = 0) => {
  for (const ch of session.folderContents(folder)) {
    console.log('  '.repeat(depth) + ch.name.value);
    if (ch instanceof Luna.Bus && ch.isFolder) walk(ch, depth + 1);
  }
};
walk(null);
```

***

### importFile()

```ts
importFile(path, trackUid?): Promise<unknown>;
```

LUNA's own import: the File > Import action. Imports an audio, MIDI or video file at
the selection start, onto `trackUid` or a new track, making a clip as LUNA does.

A **path route** command run by LUNA's UI, so it needs `/gui`: without it (a headless
engine) it rejects with `Luna.Unsupported` (fact 103). To add a source without a
clip, or without `/gui`, use [importPath](#importpath); for a browser `File`, [uploadFile](#uploadfile).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `trackUid?` | `string` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
const [path] = await luna.gui.chooseFiles({ filters: ['*.wav', '*.mid'] });
if (path) await session.importFile(path, track.id);
```

***

### importPath()

```ts
importPath(path, options): Promise<AudioSource>;
```

Copy a file the engine can read from disk into this session's package as a new audio
source, and resolve to it once the workspace lists it (fact 42, `local_copy`). No clip
is made: pass the source's `id` to [insertClip](#insertclip).

This is the **path route**, an optimization: the engine reads `path` itself, so the bytes
never pass through the page. Take the path from `luna.gui.chooseFiles()` or
`Luna.onPathDrop()`. It needs no `/gui`, but the engine must see the file: a native
engine on the same machine. A path the engine cannot open rejects
with LUNA's `device.database_error`. For a browser `File`, use [uploadFile](#uploadfile).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `options` | [`ImportPathOptions`](../interfaces/ImportPathOptions.md) |

#### Returns

`Promise`\<[`AudioSource`](AudioSource.md)\>

#### Example

```ts
const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
if (path) {
  const source = await session.importPath(path);
  await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
}
```

***

### insertClip()

```ts
insertClip(options): Promise<Clip>;
```

Insert a clip onto a track's active playlist, or onto a given playlist, in one undo step,
and resolve to the new [Clip](Clip.md) once its playlist lists it with its properties
loaded. LUNA answers the clip's uid. Timeline position is in ticks; source offsets are
nanoseconds (fact 16).

`sourceUid` is required for every clip type, MIDI included: LUNA answers
`uasrv.invalid_property` without one (fact 112). To start a MIDI clip of your own, write
its notes with [Playlist.createNotes](Playlist.md#createnotes), which makes the clip. With `copyOf` the new
clip is a copy of another (its gain, fades, warps and MIDI), and the source, its offsets
and the name default to that clip's (fact 135).

Inside a batch [transaction](#transaction) this resolves at once to the clip with its `id` set
and its props `undefined` until the commit, as [newTrack](#newtrack) does.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`InsertClipOptions`](../interfaces/InsertClipOptions.md) |

#### Returns

`Promise`\<[`Clip`](Clip.md)\>

#### Examples

```ts
const clip = await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: Luna.WHOLE_NOTE });
clip.start.value; // 0
```

```ts
// Repeat a slice four bars later, in front of what is there.
const again = await session.insertClip({ playlistUid: lane.id, copyOf: slice, startTick: slice.start.value! + 4 * Luna.WHOLE_NOTE, stopTick: slice.stop.value! + 4 * Luna.WHOLE_NOTE });
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

### moveClips()

```ts
moveClips(toTick, options): Promise<unknown>;
```

Move or copy the clips in a tick range (or the context selection when omitted) so they
start at `toTick`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toTick` | `number` |
| `options` | \{ `contextType?`: `string`; `copy?`: `boolean`; `startTick?`: `number`; `stopTick?`: `number`; `trackUids?`: `string`[]; \} |
| `options.contextType?` | `string` |
| `options.copy?` | `boolean` |
| `options.startTick?` | `number` |
| `options.stopTick?` | `number` |
| `options.trackUids?` | `string`[] |

#### Returns

`Promise`\<`unknown`\>

***

### moveToFolder()

```ts
moveToFolder(
   items, 
   folder, 
options): Promise<void>;
```

Move tracks and buses (folders too, with everything inside them) into `folder`, or to
the session root with `null`, in one undo step (LUNA's `move_to_folder`, fact 136), and
resolve once each one's [Channel.folderUid](Channel.md#folderuid) shows it. They go first in the folder, or
after `options.after` (fact 137); [reorder](#reorder) moves them within it. LUNA reroutes the main output
of everything moved to the nearest summing folder it is now in, else the master.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `items` | readonly (`string` \| [`Channel`](Channel.md))[] |
| `folder` | `string` \| [`Bus`](Bus.md) \| `null` |
| `options` | [`MoveToFolderOptions`](../interfaces/MoveToFolderOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Throws

`uasrv.invalid_value` when `folder` is not a folder, or would end up
inside itself.

#### Example

```ts
const vocals = await session.newFolder({ name: 'Vocals' });
await session.moveToFolder([lead, harmony], vocals);
await session.moveToFolder([harmony], null); // back to the root
```

***

### newBus()

```ts
newBus(options): Promise<Bus>;
```

Create an aux bus (`new_track` with `track_type: "bus"`, fact 83) in one undo step, and
resolve to the [Bus](Bus.md) once it is listed in [buses](#buses) with its properties loaded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`NewBusOptions`](../interfaces/NewBusOptions.md) |

#### Returns

`Promise`\<[`Bus`](Bus.md)\>

#### Example

```ts
const reverb = await session.newBus({ name: 'Reverb' });
await track.outputs.byId('send_0').assign(reverb);
```

***

### newFolder()

```ts
newFolder(options): Promise<Bus>;
```

Create a folder track in one undo step, and resolve to it once it is listed in
[buses](#buses) with its properties loaded (fact 136). A folder is an aux bus whose
[Bus.folderMode](Bus.md#foldermode) is not `'none'`, so it is a [Bus](Bus.md) with `isFolder` true. It goes
last in the session, or first inside `folderUid` (fact 137). Put
tracks in it with `newTrack({ folderUid })` or [moveToFolder](#movetofolder); list them with
[folderContents](#foldercontents).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`NewFolderOptions`](../interfaces/NewFolderOptions.md) |

#### Returns

`Promise`\<[`Bus`](Bus.md)\>

#### Throws

`device.database_error` when `folderUid` is not a folder.

#### Examples

```ts
const drums = await session.newFolder({ name: 'Drums' });
const [kick, snare] = await session.newTrack({ name: 'Drum', count: 2, makeNameUnique: true, folderUid: drums.id });
```

```ts
// A folder that only groups, inside another folder.
const perc = await session.newFolder({ name: 'Perc', mode: 'container', folderUid: drums.id });
```

***

### newPlaylists()

```ts
newPlaylists(trackUids, options): Promise<unknown>;
```

Create a new playlist version on the given tracks, empty or duplicating the current one.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `trackUids` | `string`[] |
| `options` | \{ `duplicate?`: `boolean`; \} |
| `options.duplicate?` | `boolean` |

#### Returns

`Promise`\<`unknown`\>

***

### newTrack()

```ts
newTrack(options): Promise<Track[]>;
```

Create tracks in one undo step, and resolve to them once they are listed in
[tracks](#tracks) with their properties loaded: one [Track](Track.md), or `count` of them. LUNA
answers the new uids (fact 135), so nothing has to be found by name.

Inside a batch [transaction](#transaction) LUNA holds the new tracks back until the commit (facts
74, 135), so this resolves at once to tracks whose `id` is set and whose props read
`undefined` until then. They are the objects `session.tracks` lists after the commit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`NewTrackOptions`](../interfaces/NewTrackOptions.md) |

#### Returns

`Promise`\<[`Track`](Track.md)[]\>

#### Examples

```ts
const [bass] = await session.newTrack({ name: 'Bass', stemFormat: 'mono' });
bass.name.value; // 'Bass'
```

```ts
// A track and its clip as one undo entry.
await session.transaction('Add loop', async () => {
  const [track] = await session.newTrack({ name: 'Loop', stemFormat: 'stereo' });
  await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
});
```

***

### newTrackFromPreset()

```ts
newTrackFromPreset(preset, options): Promise<Track[]>;
```

Make a track from a preset in one undo step (fact 132), as LUNA's New Track From Preset
does, and resolve to the new tracks once they are listed in [tracks](#tracks) with their
properties loaded. The preset is a row from [Presets.trackSelection](Presets.md#trackselection) or
`luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true })`:

- a track preset makes its tracks with its plugins and settings: one named `name`, or
  for a multi-track preset several, keeping the names saved in it; a master bus preset
  loads onto the master bus and makes none, so `[]`;
- an instrument plugin's preset makes a stereo instrument track with the plugin on it,
  on that preset; an effect plugin's preset an audio track with the plugin.

LUNA selects the new tracks. Rejects with `device.database_error` for an unknown preset.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preset` | `Pick`\<[`PresetRow`](../interfaces/PresetRow.md), `"uid"` \| `"name"`\> |
| `options` | [`NewTrackFromPresetOptions`](../interfaces/NewTrackFromPresetOptions.md) |

#### Returns

`Promise`\<[`Track`](Track.md)[]\>

#### Example

```ts
const sel = luna.presets.trackSelection({ category: 'Instrument' });
await sel.ready();
const [track] = await session.newTrackFromPreset(sel.presets.items[0]);
track.name.value; // the preset's name
```

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

### playlistFor()

```ts
playlistFor(track): Playlist | undefined;
```

The active playlist of a track, once playlists are loaded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `track` | [`Track`](Track.md) |

#### Returns

[`Playlist`](Playlist.md) \| `undefined`

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

### ready()

```ts
ready(): Promise<void>;
```

Subscribe to the whole session and load its properties, tracks and buses.
Idempotent; resolves when the initial state is in the cells.

#### Returns

`Promise`\<`void`\>

***

### record()

```ts
record(options): Promise<Clip>;
```

Record one pass onto an audio track and resolve to the finalized take.

The flow measured on 4543 (fact 75): route and arm the track and confirm the arm by a
read, roll the transport in record (writing the session's `record_enabled` starts
playback by itself), wait for `punchedIn` so any count-in is over and capture has really
begun, hold for `seconds` or until `signal` aborts, then stop and disarm. The take
finalizes onto the track's active playlist as a clip whose source is born under
`<session>/record/audio/<uid>` and migrates to the workspace audio folder about half a
second later, so this waits for the source to be listed too — the take is drawable by
[clipAudio](../functions/clipAudio.md) the moment it resolves.

LUNA punches in only when the punch point lies inside `loop_start..loop_stop`, looping on
or not; outside it the transport rolls, the count-in completes and nothing is captured.
The marks are therefore widened around the punch and put back afterwards.

The capture is always stopped and the track disarmed, even on error.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`RecordOptions`](../interfaces/RecordOptions.md) |

#### Returns

`Promise`\<[`Clip`](Clip.md)\>

#### Example

```ts
const inputs = await luna.audioInputs();
const take = await session.record({ track: drums, inputUid: inputs[0]?.uid, seconds: 8 });
console.log(take.name.value, take.length! / Luna.TICKS_PER_BEAT, 'beats');
```

***

### redo()

```ts
redo(count): Promise<unknown>;
```

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `count` | `number` | `1` |

#### Returns

`Promise`\<`unknown`\>

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

### reorder()

```ts
reorder(items, options): Promise<void>;
```

Move tracks and buses to just after `after`, or first, in one undo step (LUNA's
`change_order`, fact 137), and resolve once [channelsInOrder](#channelsinorder) shows the new order.
The items keep their order among themselves as given, and a folder moves with everything
inside it.

Nothing changes folder: LUNA keeps each folder's contents together right after it, so an
anchor inside another folder only decides where the item lands among its own siblings.
Use [moveToFolder](#movetofolder) to change folder. LUNA answers the same whether or not anything
moved, so an id this session does not list rejects here rather than doing nothing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `items` | readonly (`string` \| [`Channel`](Channel.md))[] |
| `options` | [`ReorderOptions`](../interfaces/ReorderOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Throws

`out_of_range` for a track or bus (or anchor) the session does not list.

#### Example

```ts
// Put the bass just after the drums, then the vocal first.
await session.reorder([bass], { after: drums });
await session.reorder([vocal]);
```

***

### save()

```ts
save(options): Promise<unknown>;
```

Save (commit) the session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `comments?`: `string`; `label?`: `string`; \} |
| `options.comments?` | `string` |
| `options.label?` | `string` |

#### Returns

`Promise`\<`unknown`\>

***

### setFadeCurve()

```ts
setFadeCurve(fades, options): Promise<void>;
```

Set the shape and/or curvature of fades, given as `seg.fadeIn.value` / `seg.fadeOut.value`
from [Playlist.compiledClips](Playlist.md#compiledclips) (pass both halves of a crossfade). LUNA's
`change_fade_curvature`, one undo step; it also reaches the matching fades of tracks in the
same edit group. `curvature` is -1 to 1, 0 being the shape's own curve; `reset` puts back
`log` with curvature 0 (fact 117).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fades` | readonly ( \| \{ `uid`: `string`; \} \| `undefined`)[] |
| `options` | \{ `curvature?`: `number`; `reset?`: `boolean`; `shape?`: [`FadeShape`](../type-aliases/FadeShape.md); \} |
| `options.curvature?` | `number` |
| `options.reset?` | `boolean` |
| `options.shape?` | [`FadeShape`](../type-aliases/FadeShape.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const seg = lane.compiledClips.ofClip(clip.id)[0];
await session.setFadeCurve([seg.fadeIn.value], { shape: 'equal_power', curvature: 0.3 });
```

***

### setPlaylist()

```ts
setPlaylist(trackUid, version): Promise<unknown>;
```

Make a playlist version active on a track.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `trackUid` | `string` |
| `version` | `number` |

#### Returns

`Promise`\<`unknown`\>

***

### transaction()

```ts
transaction<T>(
   name, 
   fn, 
options): Promise<T>;
```

Run `fn` as one undoable step. Aborts (discarding pending changes) if `fn` throws.
Called while a transaction is already open, `fn` runs inside that one: wrappers that batch
their own steps (`Output.retarget`) then join the caller's undo entry instead of nesting.

A batch (the default) holds LUNA's pushes until the commit, so the model shows the edits
only once this resolves. With `continuous`, every command replaces the one before it
(see [TransactionOptions.continuous](../interfaces/TransactionOptions.md#continuous)).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `fn` | () => `Promise`\<`T`\> |
| `options` | [`TransactionOptions`](../interfaces/TransactionOptions.md) |

#### Returns

`Promise`\<`T`\>

#### Examples

```ts
await session.transaction('Rename all', async () => {
  for (const t of session.tracks.items) await t.name.set(`${t.name.value} (mix)`);
});
```

```ts
// Rewrite a clip's notes as one undo step: delete the old ones, write the new ones.
await session.transaction('Humanize', async () => {
  const old = clip.midi.notes.items;
  await clip.midi.deleteNotes(old);
  await clip.addNotes(old.map((n) => ({ pitch: n.pitch, tick: Math.max(0, n.startTick + Math.round((Math.random() - 0.5) * 40)), lengthTicks: n.stopTick! - n.startTick, velocity: n.velocity })));
});
await clip.midi.refresh();
```

***

### undo()

```ts
undo(count): Promise<unknown>;
```

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `count` | `number` | `1` |

#### Returns

`Promise`\<`unknown`\>

***

### uploadFile()

```ts
uploadFile(options): Promise<AudioSource>;
```

Upload a file the engine cannot read from disk - a browser `File`, or any bytes - into
this session's package as a new audio source, and resolve to it once the workspace
lists it (fact 42).

This is the **File route**, and the one that works everywhere: in LUNA and in a browser,
with no `/gui`. Get the `File` from `<input type="file">` or an HTML
`drop` event; the page can decode and audition the same `File` too. When the page only
needs the file in the session and has an engine-readable path (from
`luna.gui.chooseFiles()` or `Luna.onPathDrop()`), [importPath](#importpath) is the faster path
route: nothing is copied through the page.

The bytes go up base64-encoded in `chunkBytes` pieces through the engine's
`begin`/`transfer`/`end` phases, with `onProgress` after each chunk. A failed transfer
is cancelled, so a half-written file is not left behind. No clip is made: pass the
returned source's `id` to [insertClip](#insertclip) for that. LUNA files identical bytes only
once: uploading a file already in the session resolves to that source (fact 42). Use
[importFile](#importfile) instead
when LUNA can already read the path itself.

In LUNA 3.1.0.4589 and earlier `<input type="file">` opens nothing (fact 104), so offer an
HTML drop zone as well: `zone.ondrop = (e) => { e.preventDefault(); load(e.dataTransfer.files[0]); }`
with `zone.ondragover = (e) => e.preventDefault()`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`UploadOptions`](../interfaces/UploadOptions.md) |

#### Returns

`Promise`\<[`AudioSource`](AudioSource.md)\>

#### Example

```ts
const source = await session.uploadFile({
  bytes: fileInput.files[0],
  onProgress: (sent, total) => (bar.value = sent / total),
});
await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
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
