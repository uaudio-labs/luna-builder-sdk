# Class: Transport

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="arrangementstart"></a> `arrangementStart` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | Where [returnToZero](#returntozero) goes (ticks). LUNA reads it as 0 until it is set (fact 89). | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="countinenabled"></a> `countInEnabled` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="countingin"></a> `countingIn` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="location"></a> `location` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`TransportLocation`](../interfaces/TransportLocation.md)\> | Live playhead, pushed many times per second while playing. | - |
| <a id="looping"></a> `looping` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="loopstart"></a> `loopStart` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | - | - |
| <a id="loopstop"></a> `loopStop` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | - | - |
| <a id="maxtick"></a> `maxTick` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="playing"></a> `playing` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="playstart"></a> `playStart` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | Where playback starts (ticks); also the resting playhead when stopped. | - |
| <a id="postrollenabled"></a> `postRollEnabled` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="prerollenabled"></a> `preRollEnabled` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="punchedin"></a> `punchedIn` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="recordenabled"></a> `recordEnabled` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`boolean`\> | - | - |
| <a id="recplaymode"></a> `recPlayMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="tempopercent"></a> `tempoPercent` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |

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

### seconds

#### Get Signature

```ts
get seconds(): number;
```

Current playhead in wall-clock seconds: [tick](#tick) converted through the session's
tempo map (`session.musical.timeline.seconds`), so tempo changes are honoured. Like
[tick](#tick), it is the live location while playing and the play start when stopped.

The tempo map loads with the session (`session.ready()`, which `luna.session()` awaits),
so it is safe to read on any session obtained normally. Read before that, it throws
`unavailable` rather than converting at a guessed tempo.

##### Example

```ts
el.textContent = Luna.formatMinSec(t.seconds, { fraction: 1 });
```

##### Returns

`number`

***

### tick

#### Get Signature

```ts
get tick(): number;
```

Current playhead in ticks: the live location while playing, else the play start.

##### Returns

`number`

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

### play()

```ts
play(): Promise<void>;
```

#### Returns

`Promise`\<`void`\>

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

### record()

```ts
record(): Promise<void>;
```

Arm and start recording.

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

### returnToZero()

```ts
returnToZero(options): Promise<void>;
```

LUNA's Return To Zero (fact 89): [seek](#seek) to the arrangement start. That is tick 0
until the session sets one, and tick 0 need not be bar 1 (fact 91); for bar 1 use
`seek({ bar: 1 })`. Unlike LUNA's button it leaves the edit selection alone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SeekOptions`](../interfaces/SeekOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.transport.returnToZero();
```

***

### seek()

```ts
seek(to, options): Promise<void>;
```

Move the playhead the way LUNA's own locate does (fact 89): the play start and both loop
points go to the target, so a drawn loop range is replaced by an empty one. Resolves once
LUNA shows the move; while playing, the playhead jumps as `options.sync` says.

Tick 0 is not necessarily bar 1: a session with bars before bar 1 starts its timeline
earlier (fact 91). Seek to `{ bar: 1 }` for the downbeat of bar 1.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | [`SeekTarget`](../type-aliases/SeekTarget.md) |
| `options` | [`SeekOptions`](../interfaces/SeekOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await t.seek({ bar: 1 });                    // the downbeat of bar 1, wherever it is
await t.seek({ bar: 9, beat: 3 });
await t.seek(Luna.WHOLE_NOTE * 4);           // a raw tick
await t.seek({ bar: 17 }, { sync: 'next_bar' });
```

***

### setLoop()

```ts
setLoop(startTick, stopTick): Promise<void>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startTick` | `number` |
| `stopTick` | `number` |

#### Returns

`Promise`\<`void`\>

***

### stop()

```ts
stop(): Promise<void>;
```

#### Returns

`Promise`\<`void`\>

***

### sync()

```ts
sync(at): Promise<void>;
```

Restart playback, optionally quantised to the next bar or loop end.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `at` | `"now"` \| `"next_bar"` \| `"loop_end"` | `'now'` |

#### Returns

`Promise`\<`void`\>

***

### toggle()

```ts
toggle(): Promise<void>;
```

#### Returns

`Promise`\<`void`\>

***

### toggleRecord()

```ts
toggleRecord(): Promise<void>;
```

LUNA's record toggle (fact 80): flip the session's `record_enabled`, and start playback
when that turned record on while stopped. Turning record off leaves playback running.

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
