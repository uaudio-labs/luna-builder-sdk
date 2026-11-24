# Class: Sessions

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="focused"></a> `focused` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`Session`](Session.md) \| `undefined`\> | The focused Session object, when it is among the open ones. | - |
| <a id="focuseduid"></a> `focusedUid` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`string`\> | Uid of the focused session, writable. | - |
| <a id="items"></a> `items` | `readonly` | [`Collection`](Collection.md)\<[`Session`](Session.md)\> | Open sessions. | - |
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

## Methods

### byPackageUid()

```ts
byPackageUid(packageUid): Session | undefined;
```

The open session whose package is `packageUid`, or `undefined`. Dashes and case are
ignored, so a uid from `workspace.recent()` or `query()` matches however it was written.
Call after `ready()`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |

#### Returns

[`Session`](Session.md) \| `undefined`

#### Example

```ts
await luna.sessions.ready();
const open = luna.sessions.byPackageUid(row.uid);
if (open) await luna.sessions.focusedUid.set(open.uid);
else await luna.sessions.open(row.uid);
```

***

### close()

```ts
close(uid): Promise<unknown>;
```

Close a session by uid.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uid` | `string` |

#### Returns

`Promise`\<`unknown`\>

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

### create()

```ts
create(options): Promise<Session>;
```

Create a new session, load it and wait until the engine reports it loaded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateSessionOptions`](../interfaces/CreateSessionOptions.md) |

#### Returns

`Promise`\<[`Session`](Session.md)\>

#### Example

```ts
const s = await luna.sessions.create({ name: 'Demo' });

// An Add On's own session, found again by a fixed package uid (fact 237):
const sessionPackageUid = '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7';
const row = (await luna.workspace.query()).find((r) => r.uid === sessionPackageUid);
const own = row?.online
  ? await luna.sessions.open(sessionPackageUid)
  : await luna.sessions.create({ name: 'My Add On', sessionPackageUid });
```

***

### createFromTemplate()

```ts
createFromTemplate(options): Promise<Session>;
```

Create a session copied from a session template (see `workspace.templates()`), load it
and wait until the engine reports it loaded. The new session is its own package; the
template is never changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateFromTemplateOptions`](../interfaces/CreateFromTemplateOptions.md) |

#### Returns

`Promise`\<[`Session`](Session.md)\>

#### Example

```ts
const [template] = await luna.workspace.templates();
const session = await luna.sessions.createFromTemplate({ templatePackageUid: template.uid, name: 'My Song' });
session.sessionPackageUid.value;   // the copy's own package, to reopen later with sessions.open()
```

***

### current()

```ts
current(): Session | undefined;
```

The focused session or, failing that, the first open one. Not yet `ready()`.

#### Returns

[`Session`](Session.md) \| `undefined`

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

### loadSession()

```ts
loadSession(uid, timeoutMs): Promise<Session>;
```

`load_session` then wait for `/sessions/<uid>/loaded` to become true (fact 15).

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `uid` | `string` | `undefined` |
| `timeoutMs` | `number` | `15_000` |

#### Returns

`Promise`\<[`Session`](Session.md)\>

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

### open()

```ts
open(sessionPackageUid, timeoutMs?): Promise<Session>;
```

Open an existing session package by its uid (see `/workspace/sessions`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionPackageUid` | `string` |
| `timeoutMs?` | `number` |

#### Returns

`Promise`\<[`Session`](Session.md)\>

***

### openOrFocus()

```ts
openOrFocus(packageUid, timeoutMs?): Promise<Session>;
```

Switch to the session of a package if it is open, else open it: the "open this" of a
recent-sessions list.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `timeoutMs?` | `number` |

#### Returns

`Promise`\<[`Session`](Session.md)\>

#### Example

```ts
row.onclick = () => void luna.sessions.openOrFocus(entry.uid);
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

#### Inherited from

[`Node`](Node.md).[`property`](Node.md#property)

***

### ready()

```ts
ready(): Promise<void>;
```

Subscribe to `/sessions` and load the list, with each open session's own properties
(name, `sessionPackageUid`, `loaded`) but not its contents. Idempotent. A session opened
later has its properties read as it appears (`await luna.settled()` waits for that).

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
