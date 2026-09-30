# Class: MockEngine

## Constructors

### Constructor

```ts
new MockEngine(): MockEngine;
```

#### Returns

`MockEngine`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="nextdialogfiles"></a> `nextDialogFiles` | `public` | `string`[] | `[]` | What the next mock file dialog "selects"; empty means the user cancelled. |
| <a id="requests"></a> `requests` | `readonly` | `object`[] | `[]` | Every request any port made, oldest first. Useful for asserting what a model did. |
| <a id="touches"></a> `touches` | `readonly` | `string`[] | `[]` | `set_touch` calls, as `<control path>:on|off`, oldest first. |
| <a id="transactions"></a> `transactions` | `readonly` | `string`[] | `[]` | Transaction commands seen: `begin`, `commit`, `abort`. |

## Methods

### addAssignment()

```ts
addAssignment(
   output, 
   busUid, 
   busPath): string;
```

Route `output` to the bus at `busPath` the way LUNA records it (fact 83): append a row to
`assignments` and add an `assignment_objects/<uid>` node. Returns the assignment uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `output` | `string` |
| `busUid` | `string` |
| `busPath` | `string` |

#### Returns

`string`

***

### addBus()

```ts
addBus(
   sessionUid, 
   id, 
   options): void;
```

Add a bus. `busType` is `aux`, `master` or `cue_0`..`cue_3`; cue buses have only a main
output (fact 83). Orders after everything already in the session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `id` | `string` |
| `options` | \{ `busType?`: `string`; `color?`: `number`; `name?`: `string`; `stemFormat?`: `string`; \} |
| `options.busType?` | `string` |
| `options.color?` | `number` |
| `options.name?` | `string` |
| `options.stemFormat?` | `string` |

#### Returns

`void`

***

### addChord()

```ts
addChord(
   sessionUid, 
   tick, 
   name): number;
```

Put a chord on a session's Chord ruler, as a user typing one in LUNA would: it replaces
any chord at `tick`, and `♭`/`♯` are stored as `b`/`#` (fact 100). Returns the rowid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `tick` | `number` |
| `name` | `string` |

#### Returns

`number`

#### Example

```ts
engine.addChord('abc', 0, 'Am7');
```

***

### addDevice()

```ts
addDevice(id, options): void;
```

Add a hardware device with `inputs` named inputs, the shape `luna.audioInputs()` reads
(fact 76).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `options` | \{ `inputs?`: `string`[]; `online?`: `boolean`; `stemFormat?`: `string`; \} |
| `options.inputs?` | `string`[] |
| `options.online?` | `boolean` |
| `options.stemFormat?` | `string` |

#### Returns

`void`

#### Example

```ts
engine.addDevice('Apollo', { inputs: ['In 1', 'In 2'] });
```

***

### addNode()

```ts
addNode(path, spec): void;
```

Create a node (and any missing ancestors). Pushes `added` to subscribers.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `spec` | [`MockNodeSpec`](../interfaces/MockNodeSpec.md) |

#### Returns

`void`

***

### addPackage()

```ts
addPackage(uid, options): void;
```

Register a session package in the workspace.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `favorite?`: `boolean`; `lastOpened?`: `number`; `name?`: `string`; \} |
| `options.favorite?` | `boolean` |
| `options.lastOpened?` | `number` |
| `options.name?` | `string` |

#### Returns

`void`

***

### addPlugin()

```ts
addPlugin(pluginId, options): void;
```

Add a plugin to the catalog.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `options` | \{ `categories?`: `string`[]; `manufacturer?`: `string`; `name?`: `string`; \} |
| `options.categories?` | `string`[] |
| `options.manufacturer?` | `string` |
| `options.name?` | `string` |

#### Returns

`void`

***

### addPreset()

```ts
addPreset(
   pluginId, 
   name, 
   options): string;
```

Add a preset for a plugin to the library (fact 98). Returns its uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |
| `name` | `string` |
| `options` | \{ `factory?`: `boolean`; `favorite?`: `boolean`; `uid?`: `string`; `version?`: `number`; \} |
| `options.factory?` | `boolean` |
| `options.favorite?` | `boolean` |
| `options.uid?` | `string` |
| `options.version?` | `number` |

#### Returns

`string`

***

### addSession()

```ts
addSession(uid, options): void;
```

Convenience: a session shaped like LUNA's, with a transport, a master bus, named tracks
(each with `outputs/main/controls/{gain,pan,mute}`, `controls/solo`, a meter and one
playlist), and the session-level commands the SDK uses.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `focused?`: `boolean`; `name?`: `string`; `packageUid?`: `string`; `tracks?`: `string`[]; \} |
| `options.focused?` | `boolean` |
| `options.name?` | `string` |
| `options.packageUid?` | `string` |
| `options.tracks?` | `string`[] |

#### Returns

`void`

***

### addSource()

```ts
addSource(
   packageUid, 
   uid, 
   options): void;
```

Add a source audio file to a session package's workspace folder. With `analysis`, it also
carries a fine and a coarse overview, sized from its length the way LUNA's is: one fine
pair per 125 samples at 48 kHz, one coarse pair per twelve fine (fact 72).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `uid` | `string` |
| `options` | \{ `analysis?`: `boolean`; `lengthNs?`: `number`; `name?`: `string`; `sampleRate?`: `number`; `stemFormat?`: `string`; \} |
| `options.analysis?` | `boolean` |
| `options.lengthNs?` | `number` |
| `options.name?` | `string` |
| `options.sampleRate?` | `number` |
| `options.stemFormat?` | `string` |

#### Returns

`void`

***

### addTrack()

```ts
addTrack(
   sessionUid, 
   id, 
   options): void;
```

Add a track with the standard control layout and one playlist.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `id` | `string` |
| `options` | \{ `name?`: `string`; `stemFormat?`: `string`; `trackType?`: `string`; \} |
| `options.name?` | `string` |
| `options.stemFormat?` | `string` |
| `options.trackType?` | `string` |

#### Returns

`void`

***

### children()

```ts
children(nodePath): string[];
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |

#### Returns

`string`[]

***

### controlPathByUid()

```ts
controlPathByUid(uid): string | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |

#### Returns

`string` \| `undefined`

***

### fail()

```ts
fail(
   path, 
   code, 
   times): void;
```

Make the next `times` requests on `path` fail with `code`.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `path` | `string` | `undefined` |
| `code` | `string` | `undefined` |
| `times` | `number` | `1` |

#### Returns

`void`

***

### finishRender()

```ts
finishRender(uid, options): void;
```

Drive a render to a terminal state, the way LUNA's engine would (fact 44). With
`percent` only, it reports progress without finishing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |
| `options` | \{ `error?`: `string`; `percent?`: `number`; `remove?`: `boolean`; `state?`: `"completed"` \| `"aborted"` \| `"failed"`; \} |
| `options.error?` | `string` |
| `options.percent?` | `number` |
| `options.remove?` | `boolean` |
| `options.state?` | `"completed"` \| `"aborted"` \| `"failed"` |

#### Returns

`void`

#### Example

```ts
engine.finishRender(uid, { percent: 50 });
engine.finishRender(uid, { state: 'completed' });
```

***

### finishTake()

```ts
finishTake(
   sessionUid, 
   trackUid, 
   options): string;
```

Finish a record pass the way LUNA does: punch in, then on the caller's stop drop a
finalized take clip on the track's active playlist with a source to match (fact 75).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionUid` | `string` |
| `trackUid` | `string` |
| `options` | \{ `name?`: `string`; `startTick?`: `number`; `stopTick?`: `number`; \} |
| `options.name?` | `string` |
| `options.startTick?` | `number` |
| `options.stopTick?` | `number` |

#### Returns

`string`

#### Example

```ts
engine.onRecord(({ sessionUid, trackUid }) => engine.finishTake(sessionUid, trackUid, { startTick: 0, stopTick: Luna.WHOLE_NOTE }));
```

***

### has()

```ts
has(path): boolean;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`boolean`

***

### locationAt()

```ts
locationAt(sessionPath, tick): Record<string, unknown>;
```

The session `location` LUNA reports for `tick`: bar|beat from the session's time
signatures, whose `bar` numbers need not put bar 1 at tick 0 (fact 91), and `min_sec`
from the tempo map (fact 96).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionPath` | `string` |
| `tick` | `number` |

#### Returns

`Record`\<`string`, `unknown`\>

***

### midiEdit()

```ts
midiEdit(
   clipPath, 
   operation, 
   rows): void;
```

A MIDI clip's table (facts 39-41): apply `rows` and push the matching delta, exactly as
LUNA does — the stored property stays the whole table, so a `get` answers the table
while subscribers see only the delta.

`added` and `changed` carry rows; `deleted` needs only their `rowid`s. Rows given
without a `rowid` get the next free one. Ticks are table ticks.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `clipPath` | `string` |
| `operation` | `"added"` \| `"changed"` \| `"deleted"` |
| `rows` | [`MockMidiRow`](../interfaces/MockMidiRow.md)[] |

#### Returns

`void`

#### Example

```ts
engine.midiEdit(clipPath, 'added', [{ tick: 0, status: 0x90, data1: 60, data2: 100 }]);
engine.midiEdit(clipPath, 'deleted', [{ rowid: 1 }]);
```

***

### overrideCommand()

```ts
overrideCommand(path, handler): void;
```

Replace the handler of the command at `path` (for example
`/sessions/abc/set_marker`), to reproduce a verb that answers without acting (fact 71).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `handler` | [`CommandHandler`](../type-aliases/CommandHandler.md) |

#### Returns

`void`

#### Example

```ts
engine.overrideCommand('/sessions/abc/delete_clip', () => null);
```

***

### port()

```ts
port(): MockPort;
```

A new client connection.

#### Returns

[`MockPort`](MockPort.md)

***

### removeNode()

```ts
removeNode(path): void;
```

Remove a node and its subtree. Pushes `removed` to subscribers.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`void`

***

### settled()

```ts
settled(): Promise<void>;
```

Resolves once every queued push has been delivered.

#### Returns

`Promise`\<`void`\>

***

### setValue()

```ts
setValue(
   nodePath, 
   property, 
   value): void;
```

Engine-side property change: updates the tree and pushes to every subscribed port.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |
| `property` | `string` |
| `value` | `unknown` |

#### Returns

`void`

***

### value()

```ts
value(nodePath, property): unknown;
```

Read a property directly (no port involved).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodePath` | `string` |
| `property` | `string` |

#### Returns

`unknown`

***

### demo()

```ts
static demo(): MockEngine;
```

A small ready-made engine: one focused session, `Demo`, with four audio tracks. What a
page gets from `?engine=mock` when it defines no `LunaMockSetup`.

#### Returns

`MockEngine`

#### Example

```ts
const engine = Luna.MockEngine.demo();
const luna = await Luna.connect({ port_: engine.port() });
```
