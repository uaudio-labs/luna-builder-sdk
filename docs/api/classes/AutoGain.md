# Class: AutoGain

`/auto_gain`: the Auto Gain service. All of its properties are read-only. The service only
exists when LUNA's Auto Gain feature is on; check [available](#available) first (fact 191).

## Example

```ts
const w = luna.autoGain.watch();
await w.ready;
await luna.autoGain.start(track);
luna.autoGain.status.onChange(() => {
  if (luna.autoGain.status.value === 'done_listening') console.log('gain set');
});
```

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="channels"></a> `channels` | `readonly` | [`Collection`](Collection.md)\<[`AutoGainChannel`](AutoGainChannel.md)\> | The channels Auto Gain is listening to, with their live peaks. | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="countdown"></a> `countDown` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | Seconds of listening left in the current pass. | - |
| <a id="info"></a> `info` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | Extra information for the current status. | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="status"></a> `status` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`AutoGainStatus`](../type-aliases/AutoGainStatus.md)\> | The service's state. | - |
| <a id="statusstr"></a> `statusStr` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | A human-readable status line, as LUNA shows it. | - |

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

### available()

```ts
available(): Promise<boolean>;
```

Whether this LUNA has the Auto Gain service: true when `/` lists `auto_gain` (fact 191).
Cached once answered.

#### Returns

`Promise`\<`boolean`\>

#### Example

```ts
if (!(await luna.autoGain.available())) button.hidden = true;
```

***

### channelFor()

```ts
channelFor(target): AutoGainChannel | undefined;
```

The channel Auto Gain is listening to for `target`, if any.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`AutoGainTarget`](../type-aliases/AutoGainTarget.md) |

#### Returns

[`AutoGainChannel`](AutoGainChannel.md) \| `undefined`

#### Example

```ts
const listening = luna.autoGain.channelFor(track) !== undefined;
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

### start()

```ts
start(target, options): Promise<void>;
```

Start Auto Gain on a track: `post /auto_gain/start_auto_gain {session_uid, channel_uid,
auto_start, duration}` (fact 192). LUNA adds a channel under `channels`, turns on the input's
signal-level analysis for it, and (with `autoStart`) starts listening. Starting a channel
that is already listening changes nothing. LUNA answers before it acts and does not refuse
a track whose input cannot take part: check `track.supportsAutoGain` first.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`AutoGainTarget`](../type-aliases/AutoGainTarget.md) |
| `options` | [`AutoGainStartOptions`](../interfaces/AutoGainStartOptions.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.autoGain.start(track, { duration: 8 });
```

***

### stop()

```ts
stop(target): Promise<void>;
```

Stop Auto Gain on a track: `post /auto_gain/stop_auto_gain {session_uid, channel_uid}`
(fact 193). Its channel goes, and the input's signal-level analysis is turned off.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`AutoGainTarget`](../type-aliases/AutoGainTarget.md) |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.autoGain.stop(track);
```

***

### stopAll()

```ts
stopAll(): Promise<void>;
```

Stop Auto Gain on every channel, whoever started it: `stop_auto_gain {all: true}` (fact 193).

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.autoGain.stopAll();
```

***

### watch()

```ts
watch(options): object;
```

Subscribe to the service recursively and load it, so the status and the channels with
their peaks follow LUNA. Call `release` when done.

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

#### Example

```ts
const w = luna.autoGain.watch();
await w.ready;
```

#### Overrides

[`Node`](Node.md).[`watch`](Node.md#watch)
