# Class: RecordTake

A take being recorded on one track. Read it from [Session.recordTakes](Session.md#recordtakes); it is disposed
when recording stops and LUNA turns it into a clip.

Ticks are session ticks, like a clip's `start` and `stop`; `sourceStart` and `sourceStop` are
nanoseconds into the file being written. [events](#events) and [notes](#notes) use ticks from the
take's start, as a clip's MIDI does, so a note at `startTick` sits at `take.start.value +
startTick`. A note still held has no `stopTick`: draw it to `take.stop.value`.

## Example

```ts
const take = session.recordTakes.forTrack(track)[0];
if (take?.audio) {
  const range = await waves.range(take.audio.source, take.audio.startNs, take.audio.stopNs, 'coarse');
}
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="events"></a> `events` | `readonly` | [`List`](../interfaces/List.md)\<[`MidiRow`](../interfaces/MidiRow.md)\> | The messages recorded so far, in tick order, ticks from the take's start. | - |
| <a id="inputnodeuid"></a> `inputNodeUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The input it records from. | - |
| <a id="notes"></a> `notes` | `readonly` | [`List`](../interfaces/List.md)\<[`Note`](../interfaces/Note.md)\> | [events](#events) paired into notes; a held note has no `stopTick` yet. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="sourcestart"></a> `sourceStart` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Nanoseconds into the file where the take begins. | - |
| <a id="sourcestop"></a> `sourceStop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Nanoseconds into the file reached so far; grows while recording. | - |
| <a id="sourceuid"></a> `sourceUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The audio file being written; `undefined` on a MIDI take. | - |
| <a id="start"></a> `start` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Session tick where recording began. | - |
| <a id="stop"></a> `stop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Session tick reached so far; grows while recording. | - |
| <a id="trackuid"></a> `trackUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The track this take records onto. | - |

## Accessors

### audio

#### Get Signature

```ts
get audio(): ClipAudio | undefined;
```

The file being written and the part of it this take covers, for [Waveforms.range](Waveforms.md#range)
and [audioNsAtTick](../functions/audioNsAtTick.md); `undefined` on a MIDI take or before LUNA names the file. Its
overview grows as LUNA records: redraw when `stop` or `sourceStop` moves. The partial last
page is read again each time, so the waveform fills in.

##### Returns

[`ClipAudio`](../interfaces/ClipAudio.md) \| `undefined`

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

### isMidi

#### Get Signature

```ts
get isMidi(): boolean;
```

True for a take on a MIDI-capable track (an instrument track): LUNA gives it a `midi`
folder, which its messages arrive in. Known once the take has loaded.

##### Returns

`boolean`

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
