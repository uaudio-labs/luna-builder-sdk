# Class: CompiledClip

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="clipuid"></a> `clipUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The clip this segment is cut from; look it up with `playlist.clips.byId`. | - |
| <a id="fadein"></a> `fadeIn` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`CompiledFade`](../interfaces/CompiledFade.md) \| `undefined`\> | - | - |
| <a id="fadeout"></a> `fadeOut` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`CompiledFade`](../interfaces/CompiledFade.md) \| `undefined`\> | - | - |
| <a id="fullstart"></a> `fullStart` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | `start` moved earlier by an incoming crossfade, where this segment's audio already sounds under the one before it. Equal to `start` without one, and on a LUNA that does not report fades. | - |
| <a id="fullstop"></a> `fullStop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | `stop` moved later by an outgoing crossfade. Equal to `stop` without one. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="needsrender"></a> `needsRender` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | Whether this segment plays a rendering: time-stretched, with clip effects, or at another sample rate than the engine's. While LUNA makes one, `renderSourceUid` is `null` and this stays true, so the original file is not what plays (fact 116). `undefined` on a LUNA that does not report it. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="rendersourcestart"></a> `renderSourceStart` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | This segment's range in [renderSourceUid](#rendersourceuid), nanoseconds; `null` without a render. | - |
| <a id="rendersourcestop"></a> `renderSourceStop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | - | - |
| <a id="rendersourceuid"></a> `renderSourceUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | The rendering this segment plays when its clip is time-stretched: LUNA renders each compiled piece of a clip on its own, so a clip split by one on top has a render per piece and its own `renderSourceUid` names only one of them (fact 116). `null` when this segment is not rendered; `undefined` on a LUNA that does not report it. | - |
| <a id="reportsfades"></a> `reportsFades` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | Whether this LUNA reports fades on compiled clips. When false, `fadeIn` and `fadeOut` are always `undefined` because LUNA does not say, not because there are none; draw no fades and offer no fade editing. | - |
| <a id="sourcestart"></a> `sourceStart` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Source offset at `start`, nanoseconds. | - |
| <a id="sourcestop"></a> `sourceStop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Source offset at `stop`, nanoseconds. | - |
| <a id="start"></a> `start` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Where this segment starts playing, ticks. | - |
| <a id="stop"></a> `stop` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Where this segment stops playing, ticks. | - |

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

Crossfade from this segment into `next`, the segment that starts where this one stops on
the same playlist: butted clips, or overlapping ones where a clip on top begins or ends
over another (fact 117). `align` puts the fade across the edit (`center`, the default),
before it or after it; calling again changes the length. One undo step, or two when
`shape` changes an existing crossfade's shape. Resolves once LUNA shows it. Each clip's
source must reach past the edit by the part of the fade on the other side; LUNA does not
check. Audio clips only.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `next` | `CompiledClip` |
| `lengthTicks` | `number` |
| `options` | \{ `align?`: `"center"` \| `"before"` \| `"after"`; `shape?`: [`FadeShape`](../type-aliases/FadeShape.md); \} |
| `options.align?` | `"center"` \| `"before"` \| `"after"` |
| `options.shape?` | [`FadeShape`](../type-aliases/FadeShape.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const [a, b] = lane.compiledClips.inOrder();
await a.crossfade(b, Luna.EIGHTH_NOTE);
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
move(toTick, options): Promise<CompiledClip>;
```

Move what shows of this clip so it starts at `toTick`, as dragging it in LUNA does: LUNA's
`move_clips` over this segment's own range (fact 119). One undo step; resolves to the
segment at its new place. Where the clip runs on under another clip:

- if it shows again further along (or before), LUNA **splits** it at this segment's edge:
  the segment moves as a new clip, and the rest stays where it was;
- if the rest is hidden, LUNA **trims** it to this segment's edge and moves it.

A clip lying wholly on top of this one is not moved, unlike [Clip.move](Clip.md#move), which moves
everything inside the clip's span. The user's selection is put back afterwards.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toTick` | `number` |
| `options` | \{ `copy?`: `boolean`; \} |
| `options.copy?` | `boolean` |

#### Returns

`Promise`\<`CompiledClip`\>

#### Example

```ts
const moved = await seg.move(seg.start.value! + Luna.WHOLE_NOTE);
const copy = await seg.move(seg.stop.value!, { copy: true });
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

Remove the crossfade between this segment and `next`, both halves. Resolves at once when
there is none.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `next` | `CompiledClip` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await a.removeCrossfade(b);
```

***

### snapshot()

```ts
snapshot(): CompiledClipSnapshot;
```

Every field at once, as a frozen plain object, so a view draws one consistent state
rather than reading props across a push.

#### Returns

[`CompiledClipSnapshot`](../interfaces/CompiledClipSnapshot.md)

#### Example

```ts
lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder().map((c) => c.snapshot())));
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
