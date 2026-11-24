# Class: Context

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="collapsedfolders"></a> `collapsedFolders` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`[] \| `null`\> | - | - |
| <a id="contexttype"></a> `contextType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="focus"></a> `focus` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="grid"></a> `grid` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | Grid size such as `1_4`, `1_8`, `bar`. | - |
| <a id="gridenable"></a> `gridEnable` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="hiddentracks"></a> `hiddenTracks` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[] \| `null`\> | - | - |
| <a id="lastselectedtrack"></a> `lastSelectedTrack` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string` \| `null`\> | The focused track, distinct from the selected set. | - |
| <a id="linkeditandplay"></a> `linkEditAndPlay` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="pinnedtracks"></a> `pinnedTracks` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[] \| `null`\> | - | - |
| <a id="pixelspertick"></a> `pixelsPerTick` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | Zoom. | - |
| <a id="selectionnotes"></a> `selectionNotes` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<[`SelectedNotes`](../interfaces/SelectedNotes.md)[] \| `null`\> | Selected notes per playlist, in absolute ticks. The selection-based MIDI verbs (`mute_notes`, `clear`, `change_velocity`) act on this, not on a clip (fact 74). | - |
| <a id="selectionplaylists"></a> `selectionPlaylists` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`[] \| `null`\> | - | - |
| <a id="selectionstart"></a> `selectionStart` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number` \| `null`\> | Selection range in ticks; `null` when nothing is selected. | - |
| <a id="selectionstop"></a> `selectionStop` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number` \| `null`\> | - | - |
| <a id="selectiontracks"></a> `selectionTracks` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`[] \| `null`\> | - | - |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | - | - |
| <a id="settings"></a> `settings` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The window's saved settings, a JSON string LUNA writes on a delayed save. | - |
| <a id="timelineviewstarttick"></a> `timelineViewStartTick` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | The tick at the left edge of this window's timeline view, with [pixelsPerTick](#pixelspertick) the horizontal scroll (fact 159). Stored with the session, not undoable; `undefined` until something has set it. A page that draws its own timeline can share its scroll through it. **Example** `const x = (tick: number) => (tick - (ctx.timelineViewStartTick.value ?? 0)) * ctx.pixelsPerTick.value!; await ctx.timelineViewStartTick.set(Luna.WHOLE_NOTE * 8);` | - |
| <a id="waveformzoom"></a> `waveformZoom` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | LUNA's waveform zoom for this window: the amplitude multiplier its timeline draws audio with, 1 by default, doubled or halved by Zoom In/Out Waveform and bounded 1/8..256. Pass it with the clip gain to [waveformColumns](../functions/waveformColumns.md) to draw at LUNA's height. It is read from [settings](#settings), which LUNA saves some time after a change rather than at once (fact 94). **Example** `const gain = session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20);` | - |

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

### notes

#### Get Signature

```ts
get notes(): readonly SelectedNotes[];
```

The selected notes, decoded. Empty when nothing is selected.

##### Returns

readonly [`SelectedNotes`](../interfaces/SelectedNotes.md)[]

## Methods

### clear()

```ts
clear(): Promise<unknown>;
```

Delete the selected content.

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

### consolidate()

```ts
consolidate(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### copy()

```ts
copy(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### cut()

```ts
cut(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### duplicate()

```ts
duplicate(): Promise<unknown>;
```

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

### midiOperation()

```ts
midiOperation(op): Promise<void>;
```

Apply one of LUNA's MIDI operations to what this context selects (fact 158): the selected
notes with focus `notes`, the MIDI on the selected tracks in the range with `timeline`.
One undo entry. Resolves when LUNA answers; the edits arrive as MIDI table changes and
the selected notes follow. With nothing to act on LUNA changes nothing and answers
success. Rejects with `out_of_range` before sending for a value outside LUNA's range.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `op` | [`MidiOperation`](../type-aliases/MidiOperation.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await ctx.selectNotes(playlist.id, rows);
await ctx.midiOperation({ type: 'transpose', semitones: -12 });
await ctx.midiOperation({ type: 'duration', beats: 1 });
await ctx.midiOperation({ type: 'invert', around: 'root', scale: { root: 0, mask: 0b101010110101 } });
```

***

### muteClips()

```ts
muteClips(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### nudge()

```ts
nudge(ticks): Promise<unknown>;
```

Move the selection by `ticks` (negative moves earlier).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ticks` | `number` |

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

### paste()

```ts
paste(): Promise<unknown>;
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

### refreshSelection()

```ts
refreshSelection(): Promise<unknown>;
```

Re-read the six selection properties (they also arrive as events).

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

### restore()

```ts
restore(snapshot): Promise<void>;
```

Write a snapshot back. No undo entry; LUNA echoes each property.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`SelectionSnapshot`](../interfaces/SelectionSnapshot.md) |

#### Returns

`Promise`\<`void`\>

***

### run()

```ts
run(command, payload): Promise<unknown>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |
| `payload` | `Record`\<`string`, `unknown`\> |

#### Returns

`Promise`\<`unknown`\>

***

### select()

```ts
select(options): Promise<void>;
```

Set range, tracks, playlists and/or focus in one go; omitted parts are left alone. `focus`
is what LUNA's selection commands act on: `timeline` for clips (fact 117).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `focus?`: `string`; `playlistUids?`: `string`[]; `startTick?`: `number`; `stopTick?`: `number`; `trackUids?`: `string`[]; \} |
| `options.focus?` | `string` |
| `options.playlistUids?` | `string`[] |
| `options.startTick?` | `number` |
| `options.stopTick?` | `number` |
| `options.trackUids?` | `string`[] |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await ctx.select({ startTick: 0, stopTick: Luna.WHOLE_NOTE, playlistUids: [lane.id], focus: 'timeline' });
```

***

### selectAll()

```ts
selectAll(): Promise<unknown>;
```

Widen the selected range to everything on the selected tracks' playlists (clips, notes,
automation), keeping the tracks (fact 150). No undo entry.

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await session.selectTimeline({ tracks: [track] });
await session.context.selectAll();
```

***

### selectNotes()

```ts
selectNotes(playlistUid, notes): Promise<void>;
```

Select exactly these notes on one playlist, with the range and focus to match. Ticks are
absolute, as LUNA stores them: `[pitch, start, stop, rowid]`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `playlistUid` | `string` |
| `notes` | readonly readonly \[`number`, `number`, `number`, `number`\][] |

#### Returns

`Promise`\<`void`\>

***

### separateClips()

```ts
separateClips(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### snapshot()

```ts
snapshot(): SelectionSnapshot;
```

The six selection properties as LUNA holds them now. A wrapper that has to move the
user's selection to do its work takes one of these first and [restore](#restore)s it after,
so the page never disturbs what the user had selected.

#### Returns

[`SelectionSnapshot`](../interfaces/SelectionSnapshot.md)

#### Example

```ts
const saved = ctx.snapshot();
try { await ctx.selectNotes(playlistUid, rows); await ctx.run('mute_notes'); }
finally { await ctx.restore(saved); }
```

***

### trimControlValues()

```ts
trimControlValues(controls, range): Promise<void>;
```

Add a delta per control over `[start, stop)`, or over this context's selection when the
range is left out (`trim_control_values`, fact 227). One undo step for all of them.
Resolves on LUNA's reply; the lanes update by push.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `controls` | readonly [`ControlValue`](../interfaces/ControlValue.md)[] |
| `range` | [`ControlValueRange`](../interfaces/ControlValueRange.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.context.trimControlValues([{ control: vocal.gain, value: 3 }], { start: 0, stop: Luna.WHOLE_NOTE });
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

### writeControlValues()

```ts
writeControlValues(controls, range): Promise<void>;
```

Write an absolute value per control over `[start, stop)`, or over this context's selection
when the range is left out (`write_control_values`, fact 227). One undo step for all of
them. Resolves on LUNA's reply, which comes after the write; the lanes update by push.
An unknown control uid rejects with `device.database_error`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `controls` | readonly [`ControlValue`](../interfaces/ControlValue.md)[] |
| `range` | [`ControlValueRange`](../interfaces/ControlValueRange.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.context.writeControlValues(
  [{ control: vocal.gain, value: -12 }, { control: guitar.gain, value: -9 }],
  { start: 0, stop: Luna.WHOLE_NOTE * 2 },
);
```
