# Class: MockEngine

## Constructors

### Constructor

```ts
new MockEngine(options): MockEngine;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MockEngineOptions`](../interfaces/MockEngineOptions.md) |

#### Returns

`MockEngine`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="addoninstalls"></a> `addOnInstalls` | `public` | ( \| \{ `id`: `string`; \} \| \{ `url`: `string`; \})[] | `[]` | Every install `/gui/install_add_on` started, in order: `{ id }` with the package id, or `{ url }` with what LUNA fetches: a repo's URL (`https://github.com/<owner>/<repo>`), or a Drive file's direct download (`https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`), or an iCloud Drive share as `https://www.icloud.com/iclouddrive/<id>`, which LUNA resolves, or a Dropbox file's download (`https://www.dropbox.com/scl/fi/<id>/<name>?rlkey=<key>&dl=1`). |
| <a id="addonuninstalls"></a> `addOnUninstalls` | `public` | `string`[] | `[]` | Every Add On id (lowercase) `/gui/uninstall_add_on` asked the user about, in order, whatever the answer. |
| <a id="builtinaddons"></a> `builtInAddOns` | `public` | `string`[] | `[]` | Add On ids (lowercase) under `/gui/add_ons` that are built into LUNA, which `/gui/uninstall_add_on` refuses. |
| <a id="folders"></a> `folders` | `public` | `Record`\<`string`, `string`[]\> | `{}` | The disk `/gui/list_files` reads: each folder's absolute path to the names inside it, a trailing `/` marking a subfolder. A name starting with `.` is hidden, as in LUNA. **Example** `engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store'];` |
| <a id="grantedfolders"></a> `grantedFolders` | `public` | `string`[] | `[]` | The folders `/gui/list_files` may read, it and every folder inside them (fact 106). LUNA grants a folder the user picks in `show_folder_dialog` (the mock does too, for each of `nextDialogFiles`) or drops on an Add On; set this, or call [grantFolder](#grantfolder), to model a drop or a grant saved from an earlier run. Anything else is `uasrv.not_permitted`. The mock does not model links or LUNA's cap on how many folders it keeps. **Example** `engine.folders['/Samples'] = ['kick.wav']; engine.grantFolder('/Samples');` |
| <a id="importedpackages"></a> `importedPackages` | `public` | `string`[] | `[]` | Package ids in [marketplace](#marketplace) that were imported from a link, which `/gui/remove_imported_add_on` removes (from here and from `marketplace`); any other package is the marketplace's own and is refused. |
| <a id="installingpackages"></a> `installingPackages` | `public` | `string`[] | `[]` | Package ids `/gui/install_add_on` treats as already installing. |
| <a id="marketplace"></a> `marketplace` | `public` | `Record`\<`string`, `string`[]\> | `{}` | The marketplace `/gui/install_add_on` installs from: each package id to the ids of the Add Ons in it, all lowercase. **Example** `engine.marketplace['uaudio-labs.midi-notation'] = ['com.uaudio.midi-notation', 'com.uaudio.score-view'];` |
| <a id="mediafiles"></a> `mediaFiles` | `public` | `Record`\<`string`, `true` \| `null` \| `string`\> | `{}` | The files `/gui/serve_media_file` finds, by absolute path: `true` for an audio, video or MIDI file it serves, `null` for one it refuses (not media, or media in name only), or the path a link leads to, which is served under that path. A path not listed is missing. **Example** `engine.mediaFiles['/Movies/cut.mov'] = true; engine.mediaFiles['/Movies/notes.mp4'] = null; engine.mediaFiles['/Movies/latest.mov'] = '/Movies/cut.mov';` |
| <a id="mediaserved"></a> `mediaServed` | `public` | `object`[] | `[]` | Every file `/gui/serve_media_file` served, in order, by lowercase Add On id. |
| <a id="midisent"></a> `midiSent` | `readonly` | [`MockMidiSent`](../interfaces/MockMidiSent.md)[] | `[]` | Live MIDI LUNA delivered through `/sessions/send_midi` and `send_midi_all_notes_off`, oldest first. |
| <a id="nextdialogfiles"></a> `nextDialogFiles` | `public` | `string`[] | `[]` | What the next mock file dialog "selects"; empty means the user cancelled. |
| <a id="requests"></a> `requests` | `readonly` | `object`[] | `[]` | Every request any port made, oldest first. Useful for asserting what a model did. |
| <a id="touches"></a> `touches` | `readonly` | `string`[] | `[]` | `set_touch` calls, as `<control path>:on|off`, oldest first. |
| <a id="transactions"></a> `transactions` | `readonly` | `string`[] | `[]` | Transaction commands seen: `begin`, `commit`, `abort`. |
| <a id="uninstallanswer"></a> `uninstallAnswer` | `public` | `"remove"` \| `"cancel"` | `'remove'` | How the user answers LUNA's prompt for `/gui/uninstall_add_on`: `'remove'` (the default) takes the Add On out of `/gui/add_ons`, `'cancel'` leaves it. |

## Methods

### addAssignment()

```ts
addAssignment(
   output, 
   busUid, 
   busPath): string;
```

Route `output` to the bus at `busPath` the way LUNA records it (fact 83): append a row to
`assignments` and add an `assignment_objects/<uid>` node. Returns the assignment uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `output` | `string` |
| `busUid` | `string` |
| `busPath` | `string` |

#### Returns

`string`

***

### addBus()

```ts
addBus(
   sessionUid, 
   id, 
   options): void;
```

Add a bus. `busType` is `aux`, `master` or `cue_0`..`cue_3`; cue buses have only a main
output (fact 83). Orders after everything already in the session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `id` | `string` |
| `options` | \{ `busType?`: `string`; `color?`: `number`; `name?`: `string`; `stemFormat?`: `string`; \} |
| `options.busType?` | `string` |
| `options.color?` | `number` |
| `options.name?` | `string` |
| `options.stemFormat?` | `string` |

#### Returns

`void`

***

### addChord()

```ts
addChord(
   sessionUid, 
   tick, 
   name): number;
```

Put a chord on a session's Chord ruler, as a user typing one in LUNA would: it replaces
any chord at `tick`, and `♭`/`♯` are stored as `b`/`#` (fact 100). Returns the rowid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `tick` | `number` |
| `name` | `string` |

#### Returns

`number`

#### Example

```ts
engine.addChord('abc', 0, 'Am7');
```

***

### addDevice()

```ts
addDevice(id, options): void;
```

Add a hardware device with `inputs` named inputs, the shape `luna.audioInputs()` reads
(fact 76).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `options` | \{ `inputs?`: `string`[]; `online?`: `boolean`; `stemFormat?`: `string`; \} |
| `options.inputs?` | `string`[] |
| `options.online?` | `boolean` |
| `options.stemFormat?` | `string` |

#### Returns

`void`

#### Example

```ts
engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'] });
```

***

### addMidiClip()

```ts
addMidiClip(
   sessionUid, 
   trackUid, 
   options): string;
```

Add an empty MIDI clip to a track's current playlist, the way LUNA makes one for notes
drawn in place. `midiSourceStart` is the table tick at the clip's start (fact 41): 0 by
default. `insert_clip` cannot make one: it needs a source (fact 112). Returns the clip uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `options` | \{ `midiSourceStart?`: `number`; `name?`: `string`; `startTick?`: `number`; `stopTick?`: `number`; \} |
| `options.midiSourceStart?` | `number` |
| `options.name?` | `string` |
| `options.startTick?` | `number` |
| `options.stopTick?` | `number` |

#### Returns

`string`

#### Example

```ts
const clipUid = engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE });
```

***

### addMidiDevice()

```ts
addMidiDevice(name, options): string;
```

Add a MIDI device under LUNA's device (`/devices/<LUNA_DEVICE_UID>/midi`, fact 123). The
first call also adds LUNA's device, the `midi` folder, and the `All` and `None` entries
LUNA lists beside the real devices, each with an input port only. The device gets an input
and an output port unless `input` or `output` is false. Returns the device's uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `options` | \{ `deviceType?`: `string`; `input?`: `boolean`; `output?`: `boolean`; `uid?`: `string`; \} |
| `options.deviceType?` | `string` |
| `options.input?` | `boolean` |
| `options.output?` | `boolean` |
| `options.uid?` | `string` |

#### Returns

`string`

#### Example

```ts
engine.addMidiDevice('Volt 876');
engine.addMidiDevice('IAC Driver Bus 1', { uid: 'iac1' });
```

***

### addNode()

```ts
addNode(path, spec): void;
```

Create a node (and any missing ancestors). Pushes `added` to subscribers.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `spec` | [`MockNodeSpec`](../interfaces/MockNodeSpec.md) |

#### Returns

`void`

***

### addPackage()

```ts
addPackage(uid, options): void;
```

Register a session package in the workspace.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `favorite?`: `boolean`; `lastOpened?`: `number`; `name?`: `string`; \} |
| `options.favorite?` | `boolean` |
| `options.lastOpened?` | `number` |
| `options.name?` | `string` |

#### Returns

`void`

***

### addPlugin()

```ts
addPlugin(pluginId, options): void;
```

Add a plugin to the catalog. `effectType` is the manifest's (comma separated, `effect`
when absent); `formats` the `[input, output]` stem formats it runs in (any when absent).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `options` | \{ `categories?`: `string`[]; `effectType?`: `string`; `favorite?`: `boolean`; `formats?`: \[`string`, `string`\][]; `manufacturer?`: `string`; `name?`: `string`; \} |
| `options.categories?` | `string`[] |
| `options.effectType?` | `string` |
| `options.favorite?` | `boolean` |
| `options.formats?` | \[`string`, `string`\][] |
| `options.manufacturer?` | `string` |
| `options.name?` | `string` |

#### Returns

`void`

***

### addPreset()

```ts
addPreset(
   pluginId, 
   name, 
   options): string;
```

Add a preset for a plugin to the library (fact 98), with any `tags` (fact 120). Returns
its uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `name` | `string` |
| `options` | \{ `factory?`: `boolean`; `favorite?`: `boolean`; `tags?`: `string`[]; `uid?`: `string`; `version?`: `number`; \} |
| `options.factory?` | `boolean` |
| `options.favorite?` | `boolean` |
| `options.tags?` | `string`[] |
| `options.uid?` | `string` |
| `options.version?` | `number` |

#### Returns

`string`

***

### addPresetTagGroup()

```ts
addPresetTagGroup(
   pluginId, 
   name, 
   tags, 
   options): string;
```

Add a group of preset tags for a plugin, as LUNA keeps them: a sub-category named `name`
under the category `category` (default `Default`) holding the tags (fact 120). Returns
the sub-category uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `name` | `string` |
| `tags` | `string`[] |
| `options` | \{ `category?`: `string`; \} |
| `options.category?` | `string` |

#### Returns

`string`

***

### addSession()

```ts
addSession(uid, options): void;
```

Convenience: a session shaped like LUNA's, with a transport, a master bus, named tracks
(each with `outputs/main/controls/{gain,pan,mute}`, `controls/solo`, a meter and one
playlist), and the session-level commands the SDK uses.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `focused?`: `boolean`; `name?`: `string`; `packageUid?`: `string`; `tracks?`: `string`[]; \} |
| `options.focused?` | `boolean` |
| `options.name?` | `string` |
| `options.packageUid?` | `string` |
| `options.tracks?` | `string`[] |

#### Returns

`void`

***

### addSource()

```ts
addSource(
   packageUid, 
   uid, 
   options): void;
```

Add a source audio file to a session package's workspace folder. With `analysis`, it also
carries a fine and a coarse overview, sized from its length the way LUNA's is: one fine
pair per 125 samples at 48 kHz, one coarse pair per twelve fine (fact 72).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `uid` | `string` |
| `options` | \{ `analysis?`: `boolean`; `lengthNs?`: `number`; `name?`: `string`; `sampleRate?`: `number`; `stemFormat?`: `string`; \} |
| `options.analysis?` | `boolean` |
| `options.lengthNs?` | `number` |
| `options.name?` | `string` |
| `options.sampleRate?` | `number` |
| `options.stemFormat?` | `string` |

#### Returns

`void`

***

### addTrack()

```ts
addTrack(
   sessionUid, 
   id, 
   options): void;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `id` | `string` |
| `options` | \{ `name?`: `string`; `stemFormat?`: `string`; `trackType?`: `string`; \} |
| `options.name?` | `string` |
| `options.stemFormat?` | `string` |
| `options.trackType?` | `string` |

#### Returns

`void`

***

### addTrackPreset()

```ts
addTrackPreset(name, options): string;
```

Add a track preset to the library (fact 132). Like LUNA when it saves one, it is tagged
with its category (`Audio`, `Instrument`, `Bus`, or `Multi-Track` for more than one
track) besides any `tags`. `new_track` with it makes one track of `trackType` named after
it, or, with `trackNames`, a track per name, named as the preset saved them. Returns its uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `options` | \{ `factory?`: `boolean`; `favorite?`: `boolean`; `tags?`: `string`[]; `trackNames?`: `string`[]; `trackType?`: `"instrument"` \| `"audio"` \| `"bus"`; `uid?`: `string`; \} |
| `options.factory?` | `boolean` |
| `options.favorite?` | `boolean` |
| `options.tags?` | `string`[] |
| `options.trackNames?` | `string`[] |
| `options.trackType?` | `"instrument"` \| `"audio"` \| `"bus"` |
| `options.uid?` | `string` |

#### Returns

`string`

***

### addTrackPresetTagGroup()

```ts
addTrackPresetTagGroup(
   name, 
   tags, 
   options): string;
```

Add a group of track preset tags, as [addPresetTagGroup](#addpresettaggroup) does for a plugin.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `tags` | `string`[] |
| `options` | \{ `category?`: `string`; \} |
| `options.category?` | `string` |

#### Returns

`string`

***

### children()

```ts
children(nodePath): string[];
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

`string`[]

***

### controlPathByUid()

```ts
controlPathByUid(uid): string | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |

#### Returns

`string` \| `undefined`

***

### fail()

```ts
fail(
   path, 
   code, 
   times): void;
```

Make the next `times` requests on `path` fail with `code`.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `path` | `string` | `undefined` |
| `code` | `string` | `undefined` |
| `times` | `number` | `1` |

#### Returns

`void`

***

### finishRender()

```ts
finishRender(uid, options): void;
```

Drive a render to a terminal state, the way LUNA's engine would (fact 44). With
`percent` only, it reports progress without finishing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `error?`: `string`; `percent?`: `number`; `remove?`: `boolean`; `state?`: `"completed"` \| `"aborted"` \| `"failed"`; \} |
| `options.error?` | `string` |
| `options.percent?` | `number` |
| `options.remove?` | `boolean` |
| `options.state?` | `"completed"` \| `"aborted"` \| `"failed"` |

#### Returns

`void`

#### Example

```ts
engine.finishRender(uid, { percent: 50 });
engine.finishRender(uid, { state: 'completed' });
```

***

### finishTake()

```ts
finishTake(
   sessionUid, 
   trackUid, 
   options): string;
```

Finish a record pass the way LUNA does: punch in, then on the caller's stop drop a
finalized take clip on the track's active playlist with a source to match (fact 75).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `options` | \{ `name?`: `string`; `startTick?`: `number`; `stopTick?`: `number`; \} |
| `options.name?` | `string` |
| `options.startTick?` | `number` |
| `options.stopTick?` | `number` |

#### Returns

`string`

#### Example

```ts
engine.onRecord(({ sessionUid, trackUid }) => engine.finishTake(sessionUid, trackUid, { startTick: 0, stopTick: Luna.WHOLE_NOTE }));
```

***

### grantFolder()

```ts
grantFolder(path): void;
```

Let `/gui/list_files` read the folder at `path` and the folders inside it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`void`

***

### has()

```ts
has(path): boolean;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`boolean`

***

### isMidiOutputPortUid()

```ts
isMidiOutputPortUid(uid): boolean;
```

True when `uid` is a mock MIDI device's output port uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |

#### Returns

`boolean`

***

### loadTrackPreset()

```ts
loadTrackPreset(data): null;
```

`post /presets/devices/track/load` (fact 132): a track preset or an instrument plugin's
preset onto a track. The track records the preset and takes its name unless its
`name_modified` is true; a name set through `set` does not make it so.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

`null`

***

### locationAt()

```ts
locationAt(sessionPath, tick): Record<string, unknown>;
```

The session `location` LUNA reports for `tick`: bar|beat from the session's time
signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91), and `min_sec`
from the tempo map (fact 96).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionPath` | `string` |
| `tick` | `number` |

#### Returns

`Record`\<`string`, `unknown`\>

***

### midiEdit()

```ts
midiEdit(
   clipPath, 
   operation, 
   rows): void;
```

A MIDI clip's table (facts 39-41): apply `rows` and push the matching delta, exactly as
LUNA does — the stored property stays the whole table, so a `get` answers the table
while subscribers see only the delta.

`added` and `changed` carry rows; `deleted` needs only their `rowid`s. Rows given
without a `rowid` get the next id free across the session's clips, as in LUNA. Ticks are table ticks.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `clipPath` | `string` |
| `operation` | `"added"` \| `"changed"` \| `"deleted"` |
| `rows` | [`MockMidiRow`](../interfaces/MockMidiRow.md)[] |

#### Returns

`void`

#### Example

```ts
engine.midiEdit(clipPath, 'added', [{ tick: 0, status: 0x90, data1: 60, data2: 100 }]);
engine.midiEdit(clipPath, 'deleted', [{ rowid: 1 }]);
```

***

### overrideCommand()

```ts
overrideCommand(path, handler): void;
```

Replace the handler of the command at `path` (for example
`/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `handler` | [`CommandHandler`](../type-aliases/CommandHandler.md) |

#### Returns

`void`

#### Example

```ts
engine.overrideCommand('/sessions/abc/delete_clip', () => null);
```

***

### port()

```ts
port(): MockPort;
```

A new client connection.

#### Returns

[`MockPort`](MockPort.md)

***

### propertyNames()

```ts
propertyNames(nodePath): string[];
```

Names of a node's properties.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

`string`[]

***

### queryPlugins()

```ts
queryPlugins(data): object;
```

`/plugins/query` (fact 127), with LUNA's slot rules. Categories pass through untranslated.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `plugins` | `Record`\<`string`, `unknown`\>[] |

***

### queryPresets()

```ts
queryPresets(data): object;
```

`/presets/query` (facts 98, 120, 132). A plugin's presets, or a device type's; with
`device_type_id: "track"` and `include_instrument_presets`, also every installed instrument
plugin's presets, with `Instrument` dropped from the tags they must match and added to the
tags they report, and an `is_instrument_preset` column.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `folders` | `unknown`[] |
| `results` | `Record`\<`string`, `unknown`\> |

***

### receiveMidi()

```ts
receiveMidi(
   device, 
   messages, 
   options): number;
```

MIDI arriving from a device, as LUNA publishes it (fact 125): one batch on the device's
input port `midi_events`, and the same batch on `All`'s. Like LUNA, nothing is published
on a port no one subscribes to by its `midi_events` path, and a `get` reads no events.
`device` is a uid from [addMidiDevice](#addmididevice) or a device name; each message is
`[status, data1, data2]`, stamped `timeMs` (default 0) apart by `stepMs` (default 1).
Returns how many ports published.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `device` | `string` |
| `messages` | readonly readonly \[`number`, `number`, `number`\][] |
| `options` | \{ `stepMs?`: `number`; `timeMs?`: `number`; \} |
| `options.stepMs?` | `number` |
| `options.timeMs?` | `number` |

#### Returns

`number`

#### Example

```ts
engine.addMidiDevice('Volt 876', { uid: 'volt' });
engine.receiveMidi('volt', [[0x90, 60, 100], [0x80, 60, 0]]);
```

***

### removeNode()

```ts
removeNode(path): void;
```

Remove a node and its subtree. Pushes `removed` to subscribers.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`void`

***

### setAssistantEnabled()

```ts
setAssistantEnabled(enabled): void;
```

Connect or disconnect UA Assistant, which preset recommendations need (fact 121).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `enabled` | `boolean` |

#### Returns

`void`

***

### setPresetRecommendations()

```ts
setPresetRecommendations(pluginId, recommend): void;
```

Script what UA Assistant recommends for a plugin. Without one the mock ranks the plugin's
presets by how many words of the query appear in their name or tags.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `recommend` | (`query`) => `object`[] |

#### Returns

`void`

***

### settled()

```ts
settled(): Promise<void>;
```

Resolves once every queued push has been delivered.

#### Returns

`Promise`\<`void`\>

***

### setValue()

```ts
setValue(
   nodePath, 
   property, 
   value): void;
```

Engine-side property change: updates the tree and pushes to every subscribed port.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |
| `property` | `string` |
| `value` | `unknown` |

#### Returns

`void`

***

### value()

```ts
value(nodePath, property): unknown;
```

Read a property directly (no port involved).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |
| `property` | `string` |

#### Returns

`unknown`

***

### demo()

```ts
static demo(options): MockEngine;
```

A small ready-made engine: one focused session, `Demo`, with four audio tracks. What a
page gets from `?engine=mock` when it defines no `LunaMockSetup`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MockEngineOptions`](../interfaces/MockEngineOptions.md) |

#### Returns

`MockEngine`

#### Example

```ts
const engine = Luna.MockEngine.demo();
const luna = await Luna.connect({ port_: engine.port() });
```
