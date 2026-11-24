# Class: Client

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="activeaudioengine"></a> `activeAudioEngine` | `readonly` | [`ActiveAudioEngine`](ActiveAudioEngine.md) | The audio engine LUNA is running: on or off, its kind, the drivers it uses (fact 190). |
| <a id="assistant"></a> `assistant` | `readonly` | [`Assistant`](Assistant.md) | Whether UA Assistant is connected to LUNA (`/assistant`); preset recommendations need it. |
| <a id="autogain"></a> `autoGain` | `readonly` | [`AutoGain`](AutoGain.md) | LUNA's Auto Gain service (`/auto_gain`, fact 191). Check `available()` first. |
| <a id="devices"></a> `devices` | `readonly` | [`Devices`](Devices.md) | - |
| <a id="drivers"></a> `drivers` | `readonly` | [`Drivers`](Drivers.md) | - |
| <a id="engine"></a> `engine` | `readonly` | `Engine` | Which engine this client is talking to: `'luna'` or `'mock'`. |
| <a id="errors"></a> `errors` | `readonly` | [`ErrorNotices`](ErrorNotices.md) | LUNA's error notices (fact 235), read-only. Follows LUNA once watched. **Example** `await luna.errors.watch().ready; luna.errors.sorted.map((e) => `${e.level.value}: ${e.title.value}`);` |
| <a id="gui"></a> `gui` | `readonly` | [`Gui`](Gui.md) | LUNA's host surface (dialogs, pages, Add Ons). Only present inside LUNA. |
| <a id="jobs"></a> `jobs` | `readonly` | [`Jobs`](Jobs.md) | - |
| <a id="mididevices"></a> `midiDevices` | `readonly` | [`MidiDevices`](MidiDevices.md) | The MIDI devices LUNA sees (`/devices/<LUNA>/midi`), `All` and `None` included. |
| <a id="plugins"></a> `plugins` | `readonly` | [`Plugins`](Plugins.md) | The plugin catalog (`/plugins`). Call `load()` once before reading. |
| <a id="preferences"></a> `preferences` | `readonly` | [`Preferences`](Preferences.md) | - |
| <a id="presets"></a> `presets` | `readonly` | [`Presets`](Presets.md) | The preset library (`/presets`): query, tag groups, recommendations, live selection. |
| <a id="raw"></a> `raw` | `readonly` | [`Port`](../interfaces/Port.md) | The transport. Escape hatch: `luna.raw.get('/sessions')`. |
| <a id="renders"></a> `renders` | `readonly` | [`Renders`](Renders.md) | - |
| <a id="secrets"></a> `secrets` | `readonly` | [`Secrets`](Secrets.md) | API keys and tokens in the OS credential store, scoped to this Add On (page memory outside LUNA). |
| <a id="sessions"></a> `sessions` | `readonly` | [`Sessions`](Sessions.md) | Open sessions and the commands that create or open them. |
| <a id="status"></a> `status` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`PortStatus`](../type-aliases/PortStatus.md)\> | Connection status as a [Prop](../interfaces/Prop.md). |
| <a id="store"></a> `store` | `readonly` | [`Store`](Store.md) | The path-keyed mirror the domain objects read from. |
| <a id="workspace"></a> `workspace` | `readonly` | [`Workspace`](Workspace.md) | Session packages on disk and the workspace query. |

## Accessors

### connected

#### Get Signature

```ts
get connected(): boolean;
```

##### Returns

`boolean`

***

### mock

#### Get Signature

```ts
get mock(): MockEngine | undefined;
```

The in-memory engine when `engine === 'mock'`, for driving the page as a second client
would: `luna.mock.setValue(path, 'name', 'Lead')`.

##### Returns

[`MockEngine`](MockEngine.md) \| `undefined`

## Methods

### audioInputs()

```ts
audioInputs(): Promise<AudioInput[]>;
```

The device inputs a track can record from (`/devices/<device>/inputs`, fact 76). Assign
one with `track.inputNodeUid.set(input.uid)`, or pass it to `session.record()`.

Read on each call and not cached: devices come and go, and `inUse` changes as tracks are
armed. To follow those changes, watch `device.inputs` on each of `luna.devices` instead
(fact 185); `input.snapshot()` gives the same record.

#### Returns

`Promise`\<[`AudioInput`](../interfaces/AudioInput.md)[]\>

#### Example

```ts
const inputs = await luna.audioInputs();
for (const i of inputs) console.log(i.name, i.stemFormat, i.inUse ? '(in use)' : '');
await track.inputNodeUid.set(inputs[0]!.uid);
```

***

### close()

```ts
close(): Promise<void>;
```

Disconnect and release everything.

#### Returns

`Promise`\<`void`\>

***

### session()

```ts
session(options): Promise<Session>;
```

The focused session (or the first open one), subscribed and loaded.

With no session open it rejects at once with [NoSessionOpen](NoSessionOpen.md), unless `wait` is set:
then it waits for the user to open or create one. Loading is bounded by `timeoutMs`
(default 15 000 ms; with `wait`, no limit unless given), after which it rejects with
`RequestTimeout` rather than hanging.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `timeoutMs?`: `number`; `wait?`: `boolean`; \} |
| `options.timeoutMs?` | `number` |
| `options.wait?` | `boolean` |

#### Returns

`Promise`\<[`Session`](Session.md)\>

#### Example

```ts
const session = await luna.session();
console.log(session.name.value, session.tracks.items.length);

// A page that opens before any session does:
const s = await luna.session({ wait: true });
```

***

### settled()

```ts
settled(): Promise<void>;
```

Deliver every pending change notification now, and resolve once they have run. Handy in
tests: after `await engine.settled()` the prop *values* are already current, but
`onChange` listeners are coalesced to the next frame — this flushes them immediately, so
`await engine.settled(); await luna.settled();` is deterministic without waiting for a
requestAnimationFrame or timer.

It also waits for reads in flight, such as the properties of a member the engine just
added (the collection holds that member's `onChange` until they land), so a new clip or
track has its values when this resolves.

#### Returns

`Promise`\<`void`\>
