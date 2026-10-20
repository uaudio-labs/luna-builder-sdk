# Class: MidiClip

The MIDI of one clip, reached as `clip.midi`. Both lists notify once per frame, like
every other [List](../interfaces/List.md). An audio clip's table is empty.

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="events"></a> `events` | `readonly` | [`List`](../interfaces/List.md)\<[`MidiRow`](../interfaces/MidiRow.md)\> | Every row, in tick order. `byId` takes a row id. | - |
| <a id="notes"></a> `notes` | `readonly` | [`List`](../interfaces/List.md)\<[`Note`](../interfaces/Note.md)\> | Paired notes, in start order. `byId` takes a note-on row id. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |

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

### deleteNotes()

```ts
deleteNotes(notes): Promise<void>;
```

Delete notes: `clear` over a selection of exactly these notes, one undo entry, with the
user's selection restored afterwards. Inside a `session.transaction()` batch it joins the
batch's undo step, so deleting notes and writing their replacements with
[Clip.addNotes](Clip.md#addnotes) undoes as one.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notes` | readonly (`number` \| [`Note`](../interfaces/Note.md))[] |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.midi.deleteNotes([clip.midi.notes.items[0]!]);
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

### ready()

```ts
ready(): Promise<void>;
```

Read the table and start following edits. Idempotent, like `Node.load`.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await clip.midi.ready();
```

***

### refresh()

```ts
refresh(): Promise<void>;
```

Re-read the whole table. LUNA holds deltas back inside a batch transaction, so call
this after one if the lists look behind; deltas that arrive later still apply.

#### Returns

`Promise`\<`void`\>

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

### setMuted()

```ts
setMuted(notes, muted): Promise<void>;
```

Mute or unmute notes. LUNA's `mute_notes` is a toggle over the selection (fact 74), so
this selects only the notes whose state must change, posts once, and restores the user's
selection. Nothing is posted — and no undo entry made — when nothing needs changing.
Which notes need changing is read from [notes](#setmuted-1), which a batch transaction does not
update until its commit: mute a note once per batch.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notes` | readonly (`number` \| [`Note`](../interfaces/Note.md))[] |
| `muted` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// Mute everything quieter than 40, as one undo entry.
await clip.midi.setMuted(clip.midi.notes.items.filter((n) => n.velocity < 40), true);
```

***

### setVelocities()

```ts
setVelocities(changes, options): Promise<void>;
```

Set several notes' velocities in one post: one "Change Velocities" undo entry for the
whole batch, where [setVelocity](#setvelocity) in a loop would be one entry per note. `off`
targets each note's note-off row instead of its note-on.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `changes` | readonly `object`[] |
| `options` | \{ `off?`: `boolean`; \} |
| `options.off?` | `boolean` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// Scale every velocity in the clip by a percentage, as one undo entry.
await clip.midi.setVelocities(clip.midi.notes.items.map((n) => ({ note: n, velocity: Math.max(1, Math.min(127, Math.round(n.velocity * 1.25))) })));
```

***

### setVelocity()

```ts
setVelocity(
   note, 
   velocity, 
options): Promise<void>;
```

Set one note's velocity. `off` targets the note-off row. One "Change Velocities" undo entry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `note` | `number` \| [`Note`](../interfaces/Note.md) |
| `velocity` | `number` |
| `options` | \{ `off?`: `boolean`; \} |
| `options.off?` | `boolean` |

#### Returns

`Promise`\<`void`\>

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
