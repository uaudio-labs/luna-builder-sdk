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
| <a id="blessanswer"></a> `blessAnswer` | `public` | `"allow"` \| `"dont_allow"` | `'allow'` | How the user answers LUNA's prompt for `/gui/add_blessed_folder` and for folders picked in `show_folder_dialog`: `'allow'` (the default) blesses them, `'dont_allow'` leaves them out. |
| <a id="blessrequests"></a> `blessRequests` | `public` | `string`[] | `[]` | Every folder LUNA asked the user about (`/gui/add_blessed_folder`, `show_folder_dialog`), in order, whatever the answer. |
| <a id="builtinaddons"></a> `builtInAddOns` | `public` | `string`[] | `[]` | Add On ids (lowercase) under `/gui/add_ons` that are built into LUNA, which `/gui/uninstall_add_on` refuses. |
| <a id="folders"></a> `folders` | `public` | `Record`\<`string`, `string`[]\> | `{}` | The disk `/gui/list_files` reads: each folder's absolute path to the names inside it, a trailing `/` marking a subfolder. A name starting with `.` is hidden, as in LUNA. **Example** `engine.folders['/Samples'] = ['kick.wav', 'Loops/', '.DS_Store'];` |
| <a id="importedfiles"></a> `importedFiles` | `readonly` | `object`[] | `[]` | MIDI and video files `import_file` copied into packages (fact 163). |
| <a id="importedpackages"></a> `importedPackages` | `public` | `string`[] | `[]` | Package ids in [showcase](#showcase) that were imported from a link, which `/gui/remove_add_on` removes (from here and from `showcase`); any other package is the showcase's own and is refused. |
| <a id="installingpackages"></a> `installingPackages` | `public` | `string`[] | `[]` | Package ids `/gui/install_add_on` treats as already installing. |
| <a id="installtokens"></a> `installTokens` | `public` | `Record`\<`string`, `string`\> | `{}` | Each installed Add On's install token, by lowercase id: 32 lowercase hex digits that LUNA gives an install (fact 114) and that end its page host (`<id>_t<token>`). The mock makes one up the first time an id needs it; set one to pin it. **Example** `engine.installTokens['com.example.demo'] = '0123456789abcdef0123456789abcdef';` |
| <a id="listlimit"></a> `listLimit` | `public` | `number` | `10000` | Entries a recursive `/gui/list_files` returns before it sets `truncated` (LUNA: 10,000). |
| <a id="mediafiles"></a> `mediaFiles` | `public` | `Record`\<`string`, `true` \| `null` \| `string`\> | `{}` | The files `/gui/serve_media_file` finds, by absolute path: `true` for an audio, video or MIDI file it serves, `null` for one it refuses (not media, or media in name only), or the path a link leads to, which is served under that path. A path not listed is missing. **Example** `engine.mediaFiles['/Movies/cut.mov'] = true; engine.mediaFiles['/Movies/notes.mp4'] = null; engine.mediaFiles['/Movies/latest.mov'] = '/Movies/cut.mov';` |
| <a id="mediaserved"></a> `mediaServed` | `public` | `object`[] | `[]` | Every file `/gui/serve_media_file` served, in order, by lowercase Add On id. |
| <a id="midisent"></a> `midiSent` | `readonly` | [`MockMidiSent`](../interfaces/MockMidiSent.md)[] | `[]` | Live MIDI LUNA delivered through `/sessions/send_midi` and `send_midi_all_notes_off`, oldest first. |
| <a id="nextdialogfiles"></a> `nextDialogFiles` | `public` | `string`[] | `[]` | What the next mock file dialog "selects"; empty means the user cancelled. |
| <a id="offlinepackages"></a> `offlinePackages` | `readonly` | `Set`\<`string`\> | `undefined` | Packages whose file is missing: the query answers `file_online: false` for them. |
| <a id="packagetags"></a> `packageTags` | `readonly` | `Map`\<`string`, `string`[]\> | `undefined` | Tags per session package, added with `/workspace/add_tag` or set here (fact 161). |
| <a id="pageroutes"></a> `pageRoutes` | `readonly` | `object`[] | `[]` | Every route `set_page` handed to a page, in order (fact 243). The mock only records them. |
| <a id="preferencefiles"></a> `preferenceFiles` | `readonly` | `Map`\<`string`, `Record`\<`string`, `unknown`\>\> | `undefined` | Preference contexts as LUNA keeps them on disk, one record per context (fact 232): a context is loaded into `/preferences/<context>` only when `init_preference` names it. Seed one to model values left by an earlier run. |
| <a id="requests"></a> `requests` | `readonly` | `object`[] | `[]` | Every request any port made, oldest first. Useful for asserting what a model did. |
| <a id="showcase"></a> `showcase` | `public` | `Record`\<`string`, `string`[]\> | `{}` | The showcase `/gui/install_add_on` installs from: each package id to the ids of the Add Ons in it, all lowercase. **Example** `engine.showcase['uaudio-labs.midi-notation'] = ['com.uaudio.midi-notation', 'com.uaudio.score-view'];` |
| <a id="templatetracks"></a> `templateTracks` | `readonly` | `Map`\<`string`, `string`[]\> | `undefined` | Per template package, the tracks a session made from it starts with. |
| <a id="touches"></a> `touches` | `readonly` | `string`[] | `[]` | `set_touch` calls, as `<control path>:on|off`, oldest first. |
| <a id="transactions"></a> `transactions` | `readonly` | `string`[] | `[]` | Transaction commands seen: `begin`, `commit`, `abort`. |
| <a id="uninstallanswer"></a> `uninstallAnswer` | `public` | `"remove"` \| `"cancel"` | `'remove'` | How the user answers LUNA's prompt for `/gui/uninstall_add_on`: `'remove'` (the default) takes the Add On out of `/gui/add_ons`, `'cancel'` leaves it. |

## Accessors

### grantedFolders

#### Get Signature

```ts
get grantedFolders(): string[];
```

The folders `/gui/list_files` may read, it and every folder inside them (facts 106, 133):
the blessed folders. LUNA asks the user before blessing a folder picked in
`show_folder_dialog` (the mock asks [blessAnswer](#blessanswer) for each of `nextDialogFiles`
that is in [folders](#folders)) or dropped on an Add On; set this, or call
[grantFolder](#grantfolder), to model an allowed drop or a folder blessed in an earlier run.
Anything else is `uasrv.not_permitted`.
The mock does not model links or LUNA's cap on how many folders it keeps.

##### Example

```ts
engine.folders['/Samples'] = ['kick.wav'];
engine.grantFolder('/Samples');
```

##### Returns

`string`[]

#### Set Signature

```ts
set grantedFolders(folders): void;
```

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `folders` | `string`[] |

##### Returns

`void`

***

### progressSuppressions

#### Get Signature

```ts
get progressSuppressions(): ReadonlyMap<string, string>;
```

The `/gui` progress suppression handles held, uid (no dashes) to owner (fact 223).

##### Returns

`ReadonlyMap`\<`string`, `string`\>

## Methods

### addAnalysis()

```ts
addAnalysis(
   packageUid, 
   sourceUid, 
   kind, 
   payload, 
   options): void;
```

Add an analysis result to a source (fact 205): `<source>/analysis/<kind>` with `count`,
`md5` and versions, and its stored result as `payload`, which a `file/data` read answers.
`transients` pages by `index`/`count` like LUNA; the others answer whole. Pass the payload
in LUNA's shape (fact 207), e.g. `{ data: { keyData: [{ key: 'C major', confidence: 0.9 }] } }`.
Adding it again updates the node, as a re-analysis does (fact 206).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `sourceUid` | `string` |
| `kind` | `string` |
| `payload` | `Record`\<`string`, `unknown`\> |
| `options` | \{ `count?`: `number`; `md5?`: `string` \| `null`; `sourcePath?`: `string`; \} |
| `options.count?` | `number` |
| `options.md5?` | `string` \| `null` |
| `options.sourcePath?` | `string` |

#### Returns

`void`

#### Example

```ts
engine.addAnalysis('pkg1', 'src1', 'instrument', { instrument: 'vocals', confidence: 0.8 });
```

***

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

Add a hardware device with `inputs` named inputs (uids `in_1`, `in_2`, ...) and `outputs`
named outputs (`out_1`, ...), with the properties LUNA's input and output nodes publish
(facts 76, 185, 189). Each input carries the four live analyses, off (fact 186). With
`autoGain`, tracks routed to its inputs report `supports_auto_gain` (fact 194).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `options` | \{ `autoGain?`: `boolean`; `inputs?`: `string`[]; `ioType?`: `string`; `online?`: `boolean`; `outputs?`: `string`[]; `stemFormat?`: `string`; \} |
| `options.autoGain?` | `boolean` |
| `options.inputs?` | `string`[] |
| `options.ioType?` | `string` |
| `options.online?` | `boolean` |
| `options.outputs?` | `string`[] |
| `options.stemFormat?` | `string` |

#### Returns

`void`

#### Example

```ts
engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'], outputs: ['Monitor'], autoGain: true });
```

***

### addDeviceInput()

```ts
addDeviceInput(
   deviceId, 
   name, 
   options): string;
```

Plug an input into a device that exists (hotplug): LUNA pushes it as `added` (fact 185).
Unplug one with `removeNode`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deviceId` | `string` |
| `name` | `string` |
| `options` | \{ `channel?`: `number`; `ioType?`: `string`; `stemFormat?`: `string`; `uid?`: `string`; \} |
| `options.channel?` | `number` |
| `options.ioType?` | `string` |
| `options.stemFormat?` | `string` |
| `options.uid?` | `string` |

#### Returns

`string`

#### Example

```ts
engine.addDeviceInput('Apollo', 'Hi-Z', { uid: 'hiz' });
```

***

### addErrorNotice()

```ts
addErrorNotice(notice): string;
```

Raise an error notice in `/errors` (fact 235), as LUNA's error service does: `group` is
stored as LUNA stores it, JSON text. Answers its uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notice` | \{ `code`: `string`; `groups?`: `string`[]; `level?`: `string`; `payload?`: `string`; `timestamp?`: `number`; `title?`: `string`; `uid?`: `string`; \} |
| `notice.code` | `string` |
| `notice.groups?` | `string`[] |
| `notice.level?` | `string` |
| `notice.payload?` | `string` |
| `notice.timestamp?` | `number` |
| `notice.title?` | `string` |
| `notice.uid?` | `string` |

#### Returns

`string`

***

### addLyric()

```ts
addLyric(session, line): number;
```

Add a lyric line to a session (fact 152): a ruler line at a tick, or with `sourceUid` a line
transcribed from that source, at nanoseconds into it. `words` is stored as LUNA sends it, a
JSON string. Answers the line's rowid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `session` | `string` |
| `line` | \{ `length?`: `number`; `location`: `number`; `rowid?`: `number`; `sourceUid?`: `string`; `text`: `string`; `words?`: `object`[]; \} |
| `line.length?` | `number` |
| `line.location` | `number` |
| `line.rowid?` | `number` |
| `line.sourceUid?` | `string` |
| `line.text` | `string` |
| `line.words?` | `object`[] |

#### Returns

`number`

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

Register a session package in the workspace. `template` makes it a session template
(`.lunatemplate`) that `new_session_from_template` copies, with `tracks` as the new
session's tracks; `online: false` is one whose file is missing. `sessionType` is the
row's `session_type` (`'default'`, `'standalone'`, ...), `directoryPath` its folder.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `directoryPath?`: `string`; `factory?`: `boolean`; `favorite?`: `boolean`; `lastOpened?`: `number`; `name?`: `string`; `online?`: `boolean`; `sessionType?`: `string`; `template?`: `boolean`; `tracks?`: `string`[]; \} |
| `options.directoryPath?` | `string` |
| `options.factory?` | `boolean` |
| `options.favorite?` | `boolean` |
| `options.lastOpened?` | `number` |
| `options.name?` | `string` |
| `options.online?` | `boolean` |
| `options.sessionType?` | `string` |
| `options.template?` | `boolean` |
| `options.tracks?` | `string`[] |

#### Returns

`void`

***

### addPlugin()

```ts
addPlugin(pluginId, options): void;
```

Add a plugin to the catalog. `effectType` is the manifest's (comma separated, `effect`
when absent); `formats` the `[input, output]` stem formats it runs in (any when absent);
`version` its installed version (`1.0.0` when absent).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `options` | \{ `categories?`: `string`[]; `effectType?`: `string`; `favorite?`: `boolean`; `formats?`: \[`string`, `string`\][]; `manufacturer?`: `string`; `name?`: `string`; `sdkType?`: `string`; `version?`: `string`; \} |
| `options.categories?` | `string`[] |
| `options.effectType?` | `string` |
| `options.favorite?` | `boolean` |
| `options.formats?` | \[`string`, `string`\][] |
| `options.manufacturer?` | `string` |
| `options.name?` | `string` |
| `options.sdkType?` | `string` |
| `options.version?` | `string` |

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
| `options` | \{ `description?`: `string`; `factory?`: `boolean`; `favorite?`: `boolean`; `tags?`: `string`[]; `uid?`: `string`; `version?`: `number`; \} |
| `options.description?` | `string` |
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
| `options` | \{ `analysis?`: `boolean`; `format?`: `string`; `lengthNs?`: `number`; `name?`: `string`; `origin?`: `number`; `sampleRate?`: `number`; `stemFormat?`: `string`; `unnamed?`: `boolean`; \} |
| `options.analysis?` | `boolean` |
| `options.format?` | `string` |
| `options.lengthNs?` | `number` |
| `options.name?` | `string` |
| `options.origin?` | `number` |
| `options.sampleRate?` | `number` |
| `options.stemFormat?` | `string` |
| `options.unnamed?` | `boolean` |

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
| `options` | \{ `description?`: `string`; `factory?`: `boolean`; `favorite?`: `boolean`; `plugins?`: `object`[]; `tags?`: `string`[]; `trackNames?`: `string`[]; `trackType?`: `"bus"` \| `"instrument"` \| `"audio"`; `uid?`: `string`; \} |
| `options.description?` | `string` |
| `options.factory?` | `boolean` |
| `options.favorite?` | `boolean` |
| `options.plugins?` | `object`[] |
| `options.tags?` | `string`[] |
| `options.trackNames?` | `string`[] |
| `options.trackType?` | `"bus"` \| `"instrument"` \| `"audio"` |
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

### closeAddOnInstance()

```ts
closeAddOnInstance(addOnId, instanceId): void;
```

Close a page opened with [openAddOnInstance](#openaddoninstance).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `addOnId` | `string` |
| `instanceId` | `string` |

#### Returns

`void`

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

### finishJob()

```ts
finishJob(uid): void;
```

End a job started under a `hold` plan (see [planNextJob](#plannextjob)).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |

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
| `options` | \{ `error?`: `string`; `percent?`: `number`; `remove?`: `boolean`; `state?`: `"completed"` \| `"failed"` \| `"aborted"`; \} |
| `options.error?` | `string` |
| `options.percent?` | `number` |
| `options.remove?` | `boolean` |
| `options.state?` | `"completed"` \| `"failed"` \| `"aborted"` |

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

### installToken()

```ts
installToken(id): string;
```

The install token of the Add On `id` (lowercase), made up on first use.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`string`

#### Example

```ts
const host = `com.example.demo_t${engine.installToken('com.example.demo')}`;
```

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

### keepMedia()

```ts
keepMedia(
   packageUid, 
   uid, 
   reason): void;
```

Make `delete_unused_media` keep a file of a package for `reason` (`'undo'`, `'version'`,
`'backup'`, ...), as LUNA keeps one undo history or a saved version still uses (fact 240).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `uid` | `string` |
| `reason` | `string` |

#### Returns

`void`

#### Example

```ts
engine.keepMedia('pkg_abc', 'src3', 'undo');
```

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

### openAddOnInstance()

```ts
openAddOnInstance(addOnId, options): string;
```

Open a page of an installed Add On, as LUNA does when it shows one (fact 143): a node at
`/gui/add_ons/<id>/instances/<add_on_inst>` with its `target` and size. The target is
`options.target`, one of the Add On's `targets` (the host the user swapped it to), or else
the first, its default. Width and height are writable for a `'window'` and clamped to the
Add On's `min_*`/`max_*`. Returns the id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `addOnId` | `string` |
| `options` | \{ `height?`: `number`; `instanceId?`: `string`; `target?`: `string`; `width?`: `number`; \} |
| `options.height?` | `number` |
| `options.instanceId?` | `string` |
| `options.target?` | `string` |
| `options.width?` | `number` |

#### Returns

`string`

#### Example

```ts
const inst = engine.openAddOnInstance('com.example.demo', { width: 400, height: 300 });
```

***

### overrideCommand()

```ts
overrideCommand(path, handler): void;
```

Replace the handler of the command at `path` (for example
`/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71),
or add a command the mock does not model to a node it has.

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
engine.overrideCommand('/workspace/some_new_command', (data) => ({ ok: true }));
```

***

### planNextJob()

```ts
planNextJob(plan): void;
```

How the next job the mock starts ends (facts 200-202): `completed` (default), `empty`
(LUNA's `failed` with `job.no_result`), `failed` with `error`, or `instant`, where the job
is added, finished and removed in one turn, as LUNA's cached-analysis path can (fact 202).
`hold` keeps it running until [finishJob](#finishjob) or a cancel.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `plan` | [`MockJobPlan`](../interfaces/MockJobPlan.md) |

#### Returns

`void`

#### Example

```ts
engine.planNextJob({ outcome: 'failed', error: 'job.provider_unavailable' });
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
`[status, data1, data2]`, or a whole SysEx `[0xf0, ..., 0xf7]` (fact 138), stamped `timeMs`
(default 0) apart by `stepMs` (default 1). Returns how many ports published.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `device` | `string` |
| `messages` | readonly (readonly `number`[] \| readonly \[`number`, `number`, `number`\])[] |
| `options` | \{ `stepMs?`: `number`; `timeMs?`: `number`; \} |
| `options.stepMs?` | `number` |
| `options.timeMs?` | `number` |

#### Returns

`number`

#### Example

```ts
engine.addMidiDevice('Volt 876', { uid: 'volt' });
engine.receiveMidi('volt', [[0x90, 60, 100], [0x80, 60, 0], [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7]]);
```

***

### recordMidi()

```ts
recordMidi(
   sessionUid, 
   trackUid, 
   events): number[];
```

Record MIDI messages into the take in progress on a track, as LUNA publishes them while
recording: one `midi/<rowid>` node each, its `tick` a session tick (fact 149). Returns the
row ids.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `events` | readonly `object`[] |

#### Returns

`number`[]

#### Example

```ts
engine.recordMidi('abc', 'keys', [
  { tick: 0, status: 0x90, data1: 60, data2: 100 },
  { tick: Luna.QUARTER_NOTE, status: 0x80, data1: 60, data2: 0 },
]);
```

***

### recordProgress()

```ts
recordProgress(sessionUid, stopTick): void;
```

Move every take in progress in a session on to `stopTick`, as LUNA does while recording:
`stop` and `length` grow, and an audio take's `source_stop`, file length and overview grow
with them (fact 149). The mock runs at 120 BPM: a beat is 0.5 s.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `stopTick` | `number` |

#### Returns

`void`

#### Example

```ts
await session.transport.recordEnabled.set(true);
engine.recordProgress('abc', Luna.WHOLE_NOTE);
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

### resetWebClient()

```ts
resetWebClient(owner): void;
```

An embedded LUNA page (`dashboard`, `luna_play`, ...) reloading: drops its and every legacy suppression (fact 224).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `owner` | `string` |

#### Returns

`void`

***

### setActiveAudioEngine()

```ts
setActiveAudioEngine(info): void;
```

Change the root's `active_audio_engine` (fact 190), as LUNA does when the driver or the
audio setting changes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `info` | \{ `audio_engine_type`: `string`; `devices`: `unknown`[]; `enabled`: `boolean`; `outputs?`: `unknown`[]; \} |
| `info.audio_engine_type` | `string` |
| `info.devices` | `unknown`[] |
| `info.enabled` | `boolean` |
| `info.outputs?` | `unknown`[] |

#### Returns

`void`

#### Example

```ts
engine.setActiveAudioEngine({ enabled: false, audio_engine_type: '', devices: [] });
```

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

### setCommandEnabled()

```ts
setCommandEnabled(
   nodePath, 
   command, 
   enabled): void;
```

Publish whether `command` on `nodePath` is enabled, as LUNA does at
`<nodePath>/<command>/enabled` (fact 234), and push changes. Posting the command is not
affected: LUNA's own handlers decide what a disabled command does.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |
| `command` | `string` |
| `enabled` | `boolean` |

#### Returns

`void`

***

### setInputAnalysis()

```ts
setInputAnalysis(
   deviceId, 
   inputUid, 
   results): boolean;
```

Publish analysis results on a device input, as LUNA does when a result is due (fact 187).
A result for an analysis that is off is dropped, as LUNA has nothing running to produce it;
returns whether anything was published. A signal-level peak also reaches any Auto Gain
channel listening to a track on that input (fact 191).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deviceId` | `string` |
| `inputUid` | `string` |
| `results` | \{ `instrument?`: `string` \| `null`; `signalLevelPeak?`: `number`; `stereoDetect?`: `boolean`; `tempo?`: `number`; \} |
| `results.instrument?` | `string` \| `null` |
| `results.signalLevelPeak?` | `number` |
| `results.stereoDetect?` | `boolean` |
| `results.tempo?` | `number` |

#### Returns

`boolean`

#### Example

```ts
engine.setInputAnalysis('Apollo', 'in_1', { signalLevelPeak: 0.5, tempo: 120 });
```

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

### startJob()

```ts
startJob(spec): string;
```

Start a job under `/jobs/<uid>` as deviced's Job_Service does (fact 200): the node appears
(status `queued`) a turn after the command answers, runs and reports progress a turn at a
time, then publishes its error and terminal status and is removed in the same turn.
`work` runs just before it ends and answers whether anything was found. Returns the uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | \{ `jobType`: `string`; `sessionUid`: `string`; `targetUid?`: `string`; `work?`: () => `boolean`; \} |
| `spec.jobType` | `string` |
| `spec.sessionUid` | `string` |
| `spec.targetUid?` | `string` |
| `spec.work?` | () => `boolean` |

#### Returns

`string`

#### Example

```ts
const uid = engine.startJob({ sessionUid: 'abc', jobType: 'chord_extraction' });
```

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
