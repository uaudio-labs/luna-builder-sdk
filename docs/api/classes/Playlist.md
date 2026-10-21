# Class: Playlist

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="clips"></a> `clips` | `readonly` | [`Collection`](Collection.md)\<[`Clip`](Clip.md)\> | - | - |
| <a id="compiledclips"></a> `compiledClips` | `readonly` | [`CompiledClips`](CompiledClips.md) | What the playlist actually plays: the clips with overlaps resolved by layer, and their fades (fact 116). Draw from these rather than from `clips`. | - |
| <a id="frozen"></a> `frozen` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="stemformat"></a> `stemFormat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="trackuid"></a> `trackUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="version"></a> `version` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Take number, 1-based. | - |

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

## Methods

### addFades()

```ts
addFades(options): Promise<void>;
```

Fade in and out every clip on the lane between two ticks, `lengthNs` long, the way
LUNA's Batch Fades does: butted clips get a crossfade. LUNA picks the lane through its
track, so this works only on the track's active playlist (fact 117). One undo step.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `lengthNs`: `number`; `shape?`: [`FadeShape`](../type-aliases/FadeShape.md); `startTick`: `number`; `stopTick`: `number`; \} |
| `options.lengthNs` | `number` |
| `options.shape?` | [`FadeShape`](../type-aliases/FadeShape.md) |
| `options.startTick` | `number` |
| `options.stopTick` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await lane.addFades({ startTick: 0, stopTick: session.transport.maxTick.value!, lengthNs: 10_000_000 });
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

### createNotes()

```ts
createNotes(notes): Promise<{
  clip: Clip;
  notes: Note[];
}>;
```

Write notes onto this lane, making the MIDI clip to hold them if there is none there
(LUNA's `create_note`). One undo entry for the whole batch. Ticks are absolute, and every
note is on channel 0.

A note goes into the clip its note-on falls in. When no clip on the lane is under the
notes, LUNA makes one MIDI clip spanning the whole bars they cover, named after the track,
and kept clear of the clips either side (fact 111). Notes whose note-ons fall in two
different clips land in both, and the call then rejects with `no_effect`, since it resolves
to a single clip: write to one clip per call.

The returned `notes` are read back from the clip, so their ticks are clip-relative
(fact 41): subtract `clip.start.value` from what you passed in to match them up.

LUNA answers `null` and instead *selects* what it created, so the new row ids are read
back out of the selection, and the notes out of the clip. The user's selection is
restored afterwards.

Inside a continuous `session.transaction()` each call replaces the notes the previous
call wrote, which is how an Add On previews a part it regenerates as the user adjusts
it: one undo step, holding the last take (fact 115). A batch transaction holds the clip's
notes back until its commit, so this refuses inside one; write into an existing clip
there with [Clip.addNotes](Clip.md#addnotes).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notes` | readonly [`NewNote`](../interfaces/NewNote.md)[] |

#### Returns

`Promise`\<\{
  `clip`: [`Clip`](Clip.md);
  `notes`: [`Note`](../interfaces/Note.md)[];
\}\>

#### Examples

```ts
const bar = session.musical.timeline.tickAt({ bar: 1 });
const { clip, notes } = await lane.createNotes(
  [60, 64, 67].map((pitch, i) => ({ pitch, startTick: bar + i * Luna.TICKS_PER_BEAT, stopTick: bar + (i + 1) * Luna.TICKS_PER_BEAT })),
);
```

```ts
// Try three roots as one gesture: LUNA keeps only the last take, and one undo removes it.
const bar = session.musical.timeline.tickAt({ bar: 2 });
const take = (pitch) => [{ pitch, startTick: bar, stopTick: bar + Luna.TICKS_PER_BEAT }];
await session.transaction('Pick a root', async () => {
  for (const pitch of [60, 62, 64]) await lane.createNotes(take(pitch));
}, { continuous: true });
```

***

### deleteFades()

```ts
deleteFades(startTick, stopTick): Promise<void>;
```

Remove every fade, crossfades included, that lies wholly between two ticks on this lane
(LUNA's `delete_fades`). One undo step.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startTick` | `number` |
| `stopTick` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await lane.deleteFades(0, session.transport.maxTick.value!);
```

***

### heal()

```ts
heal(startTick, stopTick): Promise<void>;
```

Join clips that were split apart and still play on from each other in their source
(LUNA's `heal_separation`). It acts on clips starting after `startTick` up to and
**including** `stopTick`, and on the clip running into `startTick`, so a clip that begins
exactly at `stopTick` and continues the same audio is joined too (fact 117). One undo
step; the user's selection is put back afterwards.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startTick` | `number` |
| `stopTick` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await lane.heal(clip.start.value!, clip.stop.value! - 1);
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

### split()

```ts
split(at): Promise<void>;
```

Cut every clip on this lane at each tick (LUNA's `separate_clips`). One undo step.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `at` | `number` \| readonly `number`[] |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await lane.split([bar(5), bar(9)]);
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
