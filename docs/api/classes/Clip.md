# Class: Clip

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="bypass"></a> `bypass` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="cliptype"></a> `clipType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`ClipType`](../type-aliases/ClipType.md) \| `undefined`\> | - | - |
| <a id="gain"></a> `gain` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | Clip gain in dB. | - |
| <a id="layer"></a> `layer` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Stacking layer on its playlist; the higher layer plays where clips overlap. | - |
| <a id="midisourcestart"></a> `midiSourceStart` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | For a MIDI clip: the MIDI table tick that sits at this clip's start (fact 41). 0 for rows created in place; the clip's start tick for an imported MIDI file. | - |
| <a id="muted"></a> `muted` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | Whether the clip is muted (`mute`, reported as a boolean or 0/1). | - |
| <a id="name"></a> `name` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="rendersourceuid"></a> `renderSourceUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `undefined`\> | The time-stretched source LUNA renders when the clip's tick span does not match its source span at the session tempo, and the state of that render (`current` when it is the audio actually played). [clipAudio](../functions/clipAudio.md) picks between this and `sourceUid` (fact 73). | - |
| <a id="renderstate"></a> `renderState` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `undefined`\> | - | - |
| <a id="sourcestart"></a> `sourceStart` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Offset into the source file, nanoseconds. | - |
| <a id="sourcestop"></a> `sourceStop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | End offset into the source file, nanoseconds. | - |
| <a id="sourceuid"></a> `sourceUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | Uid of the source audio file under the session's workspace `audio` folder. | - |
| <a id="start"></a> `start` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Timeline start, ticks. | - |
| <a id="stop"></a> `stop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Timeline end, ticks. | - |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |

## Accessors

### controls

#### Get Signature

```ts
get controls(): Controls;
```

The clip's own controls (`<clip>/controls/<type>`). LUNA gives every clip a `gain` one
(fact 228); see [gainControl](#gaincontrol).

##### Example

```ts
await clip.controls.load();
clip.controls.items.map((c) => c.controlType.value); // ['gain']
```

##### Returns

[`Controls`](Controls.md)

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

### gainControl

#### Get Signature

```ts
get gainControl(): Control;
```

The clip gain control (fact 228): its `automation` lane is the clip-gain envelope, in dB,
with ticks relative to the clip's start, edited with the usual breakpoint verbs. Its value
follows [gain](#gain). [clipGainAt](../functions/clipGainAt.md) evaluates the lane as LUNA does.

##### Example

```ts
await clip.gainControl.load();
const lane = clip.gainControl.automation;
await lane.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -144 }]); // fade to silence
Luna.clipGainAt(lane.breakpoints, Luna.HALF_NOTE); // -72
```

##### Returns

[`Control`](Control.md)

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

### length

#### Get Signature

```ts
get length(): number | undefined;
```

Length on the timeline, ticks.

##### Returns

`number` \| `undefined`

***

### midi

#### Get Signature

```ts
get midi(): MidiClip;
```

This clip's MIDI as live `events` and `notes` lists. Created on first use and shared;
call `ready()` before reading. Empty for an audio clip.

##### Example

```ts
await clip.midi.ready();
clip.midi.notes.onChange(() => draw(clip.midi.notes.items));
```

##### Returns

[`MidiClip`](MidiClip.md)

***

### playlistUid

#### Get Signature

```ts
get playlistUid(): string;
```

The playlist this clip sits on, taken from its path.

##### Returns

`string`

***

### warps

#### Get Signature

```ts
get warps(): Warps;
```

The clip's warp markers (facts 229-231). Call `load()` before reading.

##### Example

```ts
await clip.warps.load();
clip.warps.markers; // [{ rowid, start, sourceStart, type }]
```

##### Returns

[`Warps`](Warps.md)

## Methods

### addMidi()

```ts
addMidi(events): Promise<unknown>;
```

Add raw MIDI events to this (MIDI) clip in one undo step.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `events` | [`MidiEvent`](../interfaces/MidiEvent.md)[] |

#### Returns

`Promise`\<`unknown`\>

***

### addNote()

```ts
addNote(
   note, 
   tick, 
   lengthTicks, 
   velocity, 
channel): Promise<unknown>;
```

Add a note: note-on at `tick`, note-off at `tick + lengthTicks`.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `note` | `number` | `undefined` |
| `tick` | `number` | `undefined` |
| `lengthTicks` | `number` | `undefined` |
| `velocity` | `number` | `100` |
| `channel` | `number` | `0` |

#### Returns

`Promise`\<`unknown`\>

***

### addNotes()

```ts
addNotes(notes): Promise<unknown>;
```

Add several notes to this (MIDI) clip in one `add_midi` post, so they land as one undo
step. Each note is a note-on at `tick` and a note-off at `tick + lengthTicks`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notes` | readonly [`ClipNote`](../interfaces/ClipNote.md)[] |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
// A C major triad on beat 1, then its arpeggio.
await clip.addNotes([
  ...[60, 64, 67].map((pitch) => ({ pitch, tick: 0, lengthTicks: Luna.QUARTER_NOTE })),
  ...[60, 64, 67].map((pitch, i) => ({ pitch, tick: (i + 1) * Luna.QUARTER_NOTE, lengthTicks: Luna.QUARTER_NOTE, velocity: 80 })),
]);
```

***

### bringToFront()

```ts
bringToFront(): Promise<unknown>;
```

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

### crossfade()

```ts
crossfade(
   next, 
   lengthTicks, 
options): Promise<void>;
```

Crossfade from this clip into `next`, which must start where this one stops on the same
playlist. For clips that overlap, such as one on top over the middle of another, crossfade
the segments either side of the edit with [CompiledClip.crossfade](CompiledClip.md#crossfade). `align` puts the fade across the edit (`center`, the default), before it or
after it. Calling again changes the length. Each clip's source must reach past the edit by
the part of the fade on the other side; LUNA does not check (fact 117).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `next` | `Clip` |
| `lengthTicks` | `number` |
| `options` | \{ `align?`: [`CrossfadeAlign`](../type-aliases/CrossfadeAlign.md); `shape?`: [`FadeShape`](../type-aliases/FadeShape.md); \} |
| `options.align?` | [`CrossfadeAlign`](../type-aliases/CrossfadeAlign.md) |
| `options.shape?` | [`FadeShape`](../type-aliases/FadeShape.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await left.crossfade(right, Luna.EIGHTH_NOTE);
```

***

### delete()

```ts
delete(): Promise<unknown>;
```

Delete this clip and resolve once it has left its playlist. `delete_clip` answers the
same whether or not anything was deleted (fact 71), so the model is the proof.

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await clip.delete();
```

***

### duplicate()

```ts
duplicate(): Promise<Clip>;
```

Copy the clip to start where it ends. One undo step; resolves to the copy.

#### Returns

`Promise`\<`Clip`\>

#### Example

```ts
const again = await clip.duplicate();
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

### move()

```ts
move(toTick, options): Promise<Clip>;
```

Move the clip so it starts at `toTick`, keeping its length, on its own playlist. One undo
step. Resolves to this clip, or with `copy` to the new copy once it is listed. LUNA's
`move_clips` moves a range (fact 117): this is the clip's whole span, so a clip lying
wholly on top of this one moves with it. To move what shows of a clip that others overlap,
the way dragging it in LUNA does, move its pieces from [Playlist.compiledClips](Playlist.md#compiledclips) with
[CompiledClip.move](CompiledClip.md#move). The user's selection is put back afterwards.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toTick` | `number` |
| `options` | \{ `copy?`: `boolean`; \} |
| `options.copy?` | `boolean` |

#### Returns

`Promise`\<`Clip`\>

#### Example

```ts
await clip.move(clip.start.value! + Luna.WHOLE_NOTE);
const copy = await clip.move(clip.stop.value!, { copy: true });
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

### removeCrossfade()

```ts
removeCrossfade(next): Promise<void>;
```

Remove the crossfade from this clip into `next`, both halves. Resolves at once when there
is none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `next` | `Clip` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await left.removeCrossfade(right);
```

***

### removeFadeIn()

```ts
removeFadeIn(): Promise<void>;
```

Remove the clip's plain fade-in. Resolves at once when there is none.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.removeFadeIn();
```

***

### removeFadeOut()

```ts
removeFadeOut(): Promise<void>;
```

Remove the clip's plain fade-out. Resolves at once when there is none.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.removeFadeOut();
```

***

### sendToBack()

```ts
sendToBack(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

***

### setFadeIn()

```ts
setFadeIn(lengthTicks, options): Promise<void>;
```

Fade the clip in over its first `lengthTicks`, or change the length of its fade-in. One
undo step, or two when `shape` changes an existing fade's shape. Without `shape` a new
fade is `log`, LUNA's default. Audio clips only: a MIDI or video clip rejects with
`unavailable`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lengthTicks` | `number` |
| `options` | \{ `shape?`: [`FadeShape`](../type-aliases/FadeShape.md); \} |
| `options.shape?` | [`FadeShape`](../type-aliases/FadeShape.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.setFadeIn(Luna.QUARTER_NOTE, { shape: 'equal_power' });
```

***

### setFadeOut()

```ts
setFadeOut(lengthTicks, options): Promise<void>;
```

Fade the clip out over its last `lengthTicks`, or change the length of its fade-out.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lengthTicks` | `number` |
| `options` | \{ `shape?`: [`FadeShape`](../type-aliases/FadeShape.md); \} |
| `options.shape?` | [`FadeShape`](../type-aliases/FadeShape.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.setFadeOut(Luna.HALF_NOTE);
```

***

### setMuted()

```ts
setMuted(muted): Promise<void>;
```

Mute or unmute the clip. One undo step. (LUNA's `mute_clips` toggles a range instead.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `muted` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.setMuted(true);
```

***

### slip()

```ts
slip(byNs): Promise<void>;
```

Slide the audio inside the clip without moving the clip: positive `byNs` moves the audio
later, so an earlier part of the source plays at the clip start. LUNA's own content nudge,
so warps move with it; one undo step. The step is one sample at the engine rate. Only a
clip on its track's active playlist can be slipped. A slip that would run past either end
of the source does nothing in LUNA (fact 117); one past the start is refused here with
`out_of_range`, one past the end rejects with `no_effect`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `byNs` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.slip(-10_000_000);   // 10 ms earlier
```

***

### snapshot()

```ts
snapshot(): ClipSnapshot;
```

Every field at once, as a frozen plain object, so a view draws one consistent state
rather than reading props across a push.

#### Returns

[`ClipSnapshot`](../interfaces/ClipSnapshot.md)

#### Example

```ts
playlist.clips.onChange(() => draw(playlist.clips.items.map((c) => c.snapshot())));
```

***

### split()

```ts
split(at): Promise<Clip[]>;
```

Cut the clip at one or more ticks inside it (LUNA's `separate_clips`). One undo step.
Resolves to the pieces in time order; this clip keeps the first. A fade-out moves to the
last piece, and a crossfade at a cut is not kept (fact 117).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `at` | `number` \| readonly `number`[] |

#### Returns

`Promise`\<`Clip`[]\>

#### Example

```ts
const [left, right] = await clip.split(clip.start.value! + Luna.WHOLE_NOTE);
```

***

### trim()

```ts
trim(
   startTick, 
   stopTick, 
options): Promise<unknown>;
```

Set new timeline bounds (ticks). With `split`, cut the clip instead of trimming it; with
`stretch`, time-compress or expand the content to fit rather than revealing or hiding
source audio.

`trim_clip` is a command of the **edit context**, not of the session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startTick` | `number` |
| `stopTick` | `number` |
| `options` | \{ `split?`: `boolean`; `stretch?`: `boolean`; \} |
| `options.split?` | `boolean` |
| `options.stretch?` | `boolean` |

#### Returns

`Promise`\<`unknown`\>

#### Example

```ts
await clip.trim(clip.start.value!, clip.stop.value! - Luna.QUARTER_NOTE);
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
