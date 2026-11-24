# Class: DeviceInput

`/devices/<device>/inputs/<uid>`: one input of an audio device, the thing a track's
`inputNodeUid` points at (facts 76, 185). All of its properties are read-only.

The props follow the engine while the input is watched: `device.inputs.watch()` follows every
input of the device (hotplug, `in_use`, analysis results); [watchAnalysis](#watchanalysis) watches this
one input while it holds an analysis on.

## Example

```ts
const input = device.inputs.items[0];
console.log(input.name.value, input.stemFormat.value, input.deviceChannels.value);
await track.inputNodeUid.set(input.id);
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="channelindex"></a> `channelIndex` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`[]\> | The hardware's channel index list (`ChannelIndex`), as the driver reports it. | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="devicechannels"></a> `deviceChannels` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`[]\> | The device's channel numbers this input reads, from 0 (`device_channels`). | - |
| <a id="deviceid"></a> `deviceId` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | Uid of the device the input belongs to (`device_id`). | - |
| <a id="devicename"></a> `deviceName` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="instrument"></a> `instrument` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string` \| `null`\> | Detected instrument name while instrument analysis is on; `null` means none (fact 187). | - |
| <a id="instrumentanalysisenabled"></a> `instrumentAnalysisEnabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | `instrument_analysis_enabled`. | - |
| <a id="inuse"></a> `inUse` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | True while a track in any open session records from this input (fact 185). | - |
| <a id="iodesc"></a> `ioDesc` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`Record`\<`string`, `unknown`\>\> | The input's description as LUNA saves it with a track (`io_desc`): `name`, `stem_format`, `device_channels`, `IOType`, `ChannelIndex`, `Name`, `DeviceHwID`, `hardware_index`. Read-only here. | - |
| <a id="iotype"></a> `ioType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | The hardware's I/O types (`IOType`), for example `["Mic"]`; empty for a plain driver. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="signallevelanalysisenabled"></a> `signalLevelAnalysisEnabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | `signal_level_analysis_enabled`. Turn it on with [watchAnalysis](#watchanalysis). | - |
| <a id="signallevelpeak"></a> `signalLevelPeak` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | The input's peak since the last result, as a linear gain (0..1, 1 = full scale), while signal-level analysis is on. `-144` (LUNA's dB floor) means no result: the analysis is off, or the input is below its silence threshold (fact 187). | - |
| <a id="stemformat"></a> `stemFormat` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`StemFormat`](../type-aliases/StemFormat.md)\> | `mono` or `stereo`. | - |
| <a id="stereodetect"></a> `stereoDetect` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | True when stereo-detect analysis hears a stereo source; false also means no result (fact 187). | - |
| <a id="stereodetectanalysisenabled"></a> `stereoDetectAnalysisEnabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | `stereo_detect_analysis_enabled`. | - |
| <a id="tempo"></a> `tempo` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Detected tempo in BPM while tempo analysis is on; `0` means none detected (fact 187). | - |
| <a id="tempoanalysisenabled"></a> `tempoAnalysisEnabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | `tempo_analysis_enabled`. | - |
| <a id="type"></a> `type` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The engine's object type, `input`. | - |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | The input's uid; the same as [Node.id](Node.md#id). | - |

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

### snapshot()

```ts
snapshot(): AudioInput;
```

The input as the plain record [Client.audioInputs](Client.md#audioinputs) returns, from the current props.

#### Returns

[`AudioInput`](../interfaces/AudioInput.md)

#### Example

```ts
const rows = device.inputs.items.map((i) => i.snapshot());
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

***

### watchAnalysis()

```ts
watchAnalysis(kind): object;
```

Turn an input analysis on for as long as you hold it, and watch this input so its result
prop follows the engine. `release()` turns it back off.

The `<kind>_analysis_enabled` switch is shared engine state: LUNA's own GUI, Auto Gain and
other clients use the same one (fact 186). So the SDK reference-counts holds per connection
and input, reads the switch before the first hold, and turns it on only if it was off; when
the last hold is released it turns it off again only if it was the one that turned it on.
A switch someone else had on is left on. Another client, or Auto Gain finishing, can still
turn it off while you hold it (fact 188); watch `signalLevelAnalysisEnabled` (and friends)
if that matters.

`ready` rejects if the write is refused; release the hold anyway.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`InputAnalysisKind`](../type-aliases/InputAnalysisKind.md) |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `ready` | `Promise`\<`void`\> |
| `release` | [`Unsubscribe`](../type-aliases/Unsubscribe.md) |

#### Example

```ts
const hold = input.watchAnalysis('signal_level');
await hold.ready;
const off = input.signalLevelPeak.onChange(() => meter.value = Math.max(0, input.signalLevelPeak.value ?? 0));
// later
off();
hold.release();
```
