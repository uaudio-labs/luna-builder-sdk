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

### sendToBack()

```ts
sendToBack(): Promise<unknown>;
```

#### Returns

`Promise`\<`unknown`\>

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
