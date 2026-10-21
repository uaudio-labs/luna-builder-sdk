# Class: MidiDevice

`/devices/<LUNA>/midi/<uid>`: a MIDI device LUNA sees, as its MIDI settings list it. Besides
the real devices, LUNA lists `All` and `None`, whose settings read `null`; `isPhysical` is
false for those two (fact 123).

## Example

```ts
await luna.midiDevices.load();
for (const d of luna.midiDevices.items.filter((d) => d.isPhysical)) {
  console.log(d.name.value, d.midiDeviceType.value);
}
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="inputports"></a> `inputPorts` | `readonly` | [`Collection`](Collection.md)\<[`MidiPort`](MidiPort.md)\> | Ports that receive MIDI from the device. `All` and `None` have one too. Empty on a LUNA that does not publish ports (fact 123). | - |
| <a id="lastmidicontrol"></a> `lastMidiControl` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`[]\> | `[status, data1, data2]` of the last controller LUNA received from it; `[255, 255, 255]` before any. | - |
| <a id="lastmidinote"></a> `lastMidiNote` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`[]\> | `[status, data1, data2]` of the last note LUNA received from it; `[255, 255, 255]` before any. | - |
| <a id="midiclockgenerationenabled"></a> `midiClockGenerationEnabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean` \| `null`\> | - | - |
| <a id="midiclockgenerationmode"></a> `midiClockGenerationMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | For example `song1`. | - |
| <a id="midiclockgenerationoffsetms"></a> `midiClockGenerationOffsetMs` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | - | - |
| <a id="mididevicemode"></a> `midiDeviceMode` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | - | - |
| <a id="mididevicetype"></a> `midiDeviceType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | `normal` for a plain MIDI device; `null` for `All` and `None`. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="outputlateness"></a> `outputLateness` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number` \| `null`\> | Milliseconds LUNA shifts MIDI sent to this device. | - |
| <a id="outputports"></a> `outputPorts` | `readonly` | [`Collection`](Collection.md)\<[`MidiPort`](MidiPort.md)\> | Ports that send MIDI to the device; empty for a device with no MIDI out (fact 123). | - |
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

***

### inputPort

#### Get Signature

```ts
get inputPort(): MidiPort | undefined;
```

The device's first input port. LUNA gives a device at most one.

##### Returns

[`MidiPort`](MidiPort.md) \| `undefined`

***

### isPhysical

#### Get Signature

```ts
get isPhysical(): boolean;
```

False for LUNA's `All` and `None` entries, true for a device that exists.

##### Returns

`boolean`

***

### outputPort

#### Get Signature

```ts
get outputPort(): MidiPort | undefined;
```

The device's first output port, or `undefined` when it has no MIDI out.

##### Returns

[`MidiPort`](MidiPort.md) \| `undefined`

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
