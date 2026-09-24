# Class: Output

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="assignments"></a> `assignments` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`OutputAssignment`](../interfaces/OutputAssignment.md)[]\> | Raw destination rows. Prefer [destinations](#destinations), which carries the handle to delete one. | - |
| <a id="busuid"></a> `busUid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | The first destination's bus uid, or `null` when unrouted. LUNA's own `bus_uid` property is always null. | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="controls"></a> `controls` | `readonly` | [`Controls`](Controls.md) | - | - |
| <a id="destination"></a> `destination` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`Destination`](../interfaces/Destination.md) \| `undefined`\> | The first destination, or `undefined` when unrouted. | - |
| <a id="destinations"></a> `destinations` | `readonly` | [`Prop`](../interfaces/Prop.md)\<readonly [`Destination`](../interfaces/Destination.md)[]\> | Every destination, live, in LUNA's order. Usually zero or one; [assign](#assign) appends. **Example** `send.destinations.onChange(() => label.textContent = send.destinations.value.map((d) => d.name).join(', '));` | - |
| <a id="meter"></a> `meter` | `readonly` | [`Meter`](Meter.md) | - | - |
| <a id="outputtype"></a> `outputType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |

## Accessors

### assigned

#### Get Signature

```ts
get assigned(): boolean;
```

Whether the output routes anywhere.

##### Returns

`boolean`

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

### enabled

#### Get Signature

```ts
get enabled(): Control;
```

Send enable, for a send. A control, not a node property.

##### Returns

[`Control`](Control.md)

***

### gain

#### Get Signature

```ts
get gain(): Control;
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

### index

#### Get Signature

```ts
get index(): number | undefined;
```

The slot number for a `send_N` or `cue_N` output, `undefined` for `main`.

##### Returns

`number` \| `undefined`

***

### isCue

#### Get Signature

```ts
get isCue(): boolean;
```

`cue_0`..`cue_3`. Cue outputs are routed by LUNA and refuse the routing commands.

##### Returns

`boolean`

***

### isSend

#### Get Signature

```ts
get isSend(): boolean;
```

`send_0`..`send_7`.

##### Returns

`boolean`

***

### mute

#### Get Signature

```ts
get mute(): Control;
```

##### Returns

[`Control`](Control.md)

***

### pan

#### Get Signature

```ts
get pan(): Control;
```

The pan control: `pan` on a mono channel; on a stereo channel `pan_left`, with
[panRight](#panright) beside it (fact 84). Use [pans](#pans) to handle both.

##### Example

```ts
for (const p of track.main.pans) p.normalized.set(0.5);
```

##### Returns

[`Control`](Control.md)

***

### panLeft

#### Get Signature

```ts
get panLeft(): Control;
```

Left pan on a stereo channel; the one pan on a mono channel.

##### Returns

[`Control`](Control.md)

***

### panRight

#### Get Signature

```ts
get panRight(): Control;
```

Right pan on a stereo channel; the one pan on a mono channel.

##### Returns

[`Control`](Control.md)

***

### pans

#### Get Signature

```ts
get pans(): Control[];
```

Every pan control: one on a mono channel, left and right on a stereo one.

##### Returns

[`Control`](Control.md)[]

***

### preFader

#### Get Signature

```ts
get preFader(): Control;
```

Pre- or post-fader, for a send. A control, not a node property.

##### Returns

[`Control`](Control.md)

***

### stereo

#### Get Signature

```ts
get stereo(): boolean;
```

True on a stereo channel, where pan is two controls, `pan_left` and `pan_right`
(fact 84). Read from the owning channel's `stem_format`, or from the controls when
they are loaded.

##### Returns

`boolean`

## Methods

### assign()

```ts
assign(bus): Promise<string>;
```

Route this send to a bus and resolve to the new assignment uid, once the destination is
in [destinations](#destinations). One "New Output Assignment" undo entry.

LUNA **appends**: a send that is already routed keeps its old destination too
(fact 43), so use [retarget](#retarget) to replace rather than add.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bus` | \| `string` \| \{ `id`: `string`; \} |

#### Returns

`Promise`\<`string`\>

#### Throws

`out_of_range` on a cue output; `uasrv.invalid_type` for an unknown bus.

#### Example

```ts
const reverb = session.buses.items.find((b) => b.name.value === 'Reverb');
await track.outputs.byId('send_0').assign(reverb.id);
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

### moveTo()

```ts
moveTo(channel, options): Promise<void>;
```

Move this send's routing and control values to another channel's slot (`move_send`) —
the same slot number by default — or copy them with `copy: true`. One "Move Send"
entry. Resolves once this slot has emptied (or, for a copy, once LUNA has answered).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | \| `string` \| \{ `id`: `string`; \} |
| `options` | \{ `copy?`: `boolean`; `index?`: `number`; \} |
| `options.copy?` | `boolean` |
| `options.index?` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await drums.outputs.byId('send_0').moveTo(bass.id);
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

### retarget()

```ts
retarget(bus, name): Promise<string>;
```

Replace every destination with `bus`: unassign, then assign, because the engine's
forward verb only appends (fact 43). One undo entry named `name` when the send was
already routed; inside a caller's `session.transaction()` it joins that batch.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `bus` | \| `string` \| \{ `id`: `string`; \} |
| `name` | `string` |

#### Returns

`Promise`\<`string`\>

#### Example

```ts
await track.outputs.byId('send_0').retarget(delayBus.id);
```

***

### unassign()

```ts
unassign(target?): Promise<void>;
```

Remove one destination (a [Destination](../interfaces/Destination.md) or its uid), or every one when called
with nothing. One "Delete Output Assignment" entry per removal; nothing to remove is a
no-op. Resolves once the destinations are gone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target?` | `string` \| [`Destination`](../interfaces/Destination.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await track.outputs.byId('send_0').unassign();
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
