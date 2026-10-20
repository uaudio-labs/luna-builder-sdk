# Abstract Class: Node

## Extended by

- [`Control`](Control.md)
- [`Meter`](Meter.md)
- [`Output`](Output.md)
- [`Channel`](Channel.md)
- [`Transport`](Transport.md)
- [`Clip`](Clip.md)
- [`Playlist`](Playlist.md)
- [`AudioSource`](AudioSource.md)
- [`Effect`](Effect.md)
- [`Marker`](Marker.md)
- [`SessionPreferences`](SessionPreferences.md)
- [`PreferenceContext`](PreferenceContext.md)
- [`Chord`](Chord.md)
- [`Context`](Context.md)
- [`BreakpointNode`](BreakpointNode.md)
- [`Gui`](Gui.md)
- [`AddOn`](AddOn.md)
- [`GuiWindow`](GuiWindow.md)
- [`MidiClip`](MidiClip.md)
- [`Plugin`](Plugin.md)
- [`Presets`](Presets.md)
- [`TempoEvent`](TempoEvent.md)
- [`TimeSignature`](TimeSignature.md)
- [`KeySignature`](KeySignature.md)
- [`Workspace`](Workspace.md)
- [`SessionPackage`](SessionPackage.md)
- [`Drivers`](Drivers.md)
- [`Device`](Device.md)
- [`Preferences`](Preferences.md)
- [`Render`](Render.md)
- [`Job`](Job.md)
- [`Session`](Session.md)
- [`Sessions`](Sessions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. |

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

***

### id

#### Get Signature

```ts
get id(): string;
```

Last path segment: the uid or name the engine addresses this node by.

##### Returns

`string`

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

***

### reload()

```ts
reload(options?): Promise<void>;
```

Fetch again, ignoring the once-only cache of [load](#load).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`GetOptions`](../interfaces/GetOptions.md) |

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
