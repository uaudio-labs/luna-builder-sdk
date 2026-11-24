# Class: ActiveAudioEngine

The audio engine LUNA is running (the root's read-only `active_audio_engine`, fact 190):
whether audio is on, which kind of engine, and which drivers it uses. Lets an Add On tell
when audio is down.

## Example

```ts
const w = luna.activeAudioEngine.watch();
await w.ready;
luna.activeAudioEngine.enabled.onChange(() => banner.hidden = luna.activeAudioEngine.enabled.value !== false);
```

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="devices"></a> `devices` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AudioDeviceInfo`](../interfaces/AudioDeviceInfo.md)[]\> | `info.devices`. |
| <a id="enabled"></a> `enabled` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | `info.enabled`. |
| <a id="enginetype"></a> `engineType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | `info.audio_engine_type`. |
| <a id="info"></a> `info` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`ActiveAudioEngineInfo`](../interfaces/ActiveAudioEngineInfo.md)\> | The whole value, as LUNA sends it. |

## Methods

### isDeviceActive()

```ts
isDeviceActive(driver): boolean;
```

True when the engine is running and uses `driver`: an id from `luna.drivers.connected`
(`AudioDeviceInfo.id`) or the entry itself. Not a `/devices/<uid>` uid: those name device
databases, not drivers (fact 190). False before the value is loaded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `driver` | \| `string` \| `Pick`\<[`AudioDeviceInfo`](../interfaces/AudioDeviceInfo.md), `"id"`\> |

#### Returns

`boolean`

#### Example

```ts
await luna.drivers.load();
await luna.activeAudioEngine.load();
const live = (luna.drivers.connected.value ?? []).filter((d) => luna.activeAudioEngine.isDeviceActive(d));
```

***

### load()

```ts
load(): Promise<void>;
```

Read the value once. Later calls return the same promise.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.activeAudioEngine.load();
luna.activeAudioEngine.engineType.value; // 'apollo'
```

***

### watch()

```ts
watch(): object;
```

Subscribe to the property and read it, so the props follow LUNA. Refcounted through the
Store; call `release` when done.

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `ready` | `Promise`\<`void`\> |
| `release` | [`Unsubscribe`](../type-aliases/Unsubscribe.md) |

#### Example

```ts
const w = luna.activeAudioEngine.watch();
await w.ready;
```
