# Class: Workspace

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="packages"></a> `packages` | `readonly` | [`Collection`](Collection.md)\<[`SessionPackage`](SessionPackage.md)\> | All packages. Large; prefer [query](#query) or [recent](#recent) unless you need live updates. | - |
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

### addTag()

```ts
addTag(packageUid, tag): Promise<void>;
```

Tag a session package, as a template or session is tagged for [templates](#templates) and
[query](#query) to find (fact 161). LUNA writes the tag into the package's metadata, so it
travels with it. Rejects with `uasrv.read_only_property` for a factory package and
`device.database_error` for an unknown one.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `tag` | `string` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await luna.workspace.addTag(session.sessionPackageUid.value!, 'brochure');
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

### deleteUnusedMedia()

```ts
deleteUnusedMedia(packageUid, options): Promise<UnusedMedia>;
```

Remove a package's unused audio files (LUNA's Delete Unused Media, fact 240). By default
they go to the trash, in a "<session> (Unused Media)" folder; `toTrash: false` deletes them
for good. `clearUndo` first clears the session's undo history, so files only undo kept go
too; `deleteAutoBackups` also removes the auto-backups that are all that uses a file,
where LUNA allows it. Answers what was removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `options` | \{ `clearUndo?`: `boolean`; `deleteAutoBackups?`: `boolean`; `toTrash?`: `boolean`; \} |
| `options.clearUndo?` | `boolean` |
| `options.deleteAutoBackups?` | `boolean` |
| `options.toTrash?` | `boolean` |

#### Returns

`Promise`\<[`UnusedMedia`](../interfaces/UnusedMedia.md)\>

#### Example

```ts
const done = await luna.workspace.deleteUnusedMedia(pkgUid, { toTrash: true });
console.log(`${done.unusedCount} files moved to the trash`);
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

### query()

```ts
query(options): Promise<SessionPackageRow[]>;
```

Query the workspace database. Columnar on the wire; rows here.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`QueryOptions`](../interfaces/QueryOptions.md) |

#### Returns

`Promise`\<[`SessionPackageRow`](../interfaces/SessionPackageRow.md)[]\>

***

### recent()

```ts
recent(limit): Promise<SessionPackageRow[]>;
```

Most recently opened packages, newest first.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `limit` | `number` | `20` |

#### Returns

`Promise`\<[`SessionPackageRow`](../interfaces/SessionPackageRow.md)[]\>

***

### recentList()

```ts
recentList(limit): Promise<RecentSessions>;
```

The most recently opened packages as a live list, newest first, with `openSessionUid` on
the rows that are open now. It queries again whenever a session is opened, closed or
switched to (LUNA moves `last_opened` then), and on `refresh()`. Call `dispose()` when
done.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `limit` | `number` | `20` |

#### Returns

`Promise`\<[`RecentSessions`](RecentSessions.md)\>

#### Example

```ts
const recent = await luna.workspace.recentList(10);
const draw = () => list.replaceChildren(...recent.items.map((r) => row(r.name, r.openSessionUid !== undefined)));
recent.onChange(draw);
draw();
```

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

### search()

```ts
search(text): Promise<unknown>;
```

Full-text search over session metadata.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

#### Returns

`Promise`\<`unknown`\>

***

### templates()

```ts
templates(options): Promise<SessionPackageRow[]>;
```

The session templates (`.lunatemplate` packages) on disk, for
`sessions.createFromTemplate()`. A template's `uid` is stored inside the package, so it is
the same on every machine and survives a rename.

`tag` keeps the templates carrying that tag, and `factory` the ones LUNA ships (`true`)
or the user's (`false`); LUNA filters both itself (fact 162). LUNA restamps its factory
templates' uids when it is built, so a tag is the steadier way to find one of those.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`TemplateQueryOptions`](../interfaces/TemplateQueryOptions.md) |

#### Returns

`Promise`\<[`SessionPackageRow`](../interfaces/SessionPackageRow.md)[]\>

#### Example

```ts
const template = (await luna.workspace.templates()).find((t) => t.uid === MY_TEMPLATE_UID);
if (template) await luna.sessions.createFromTemplate({ templatePackageUid: template.uid, name: 'My Song' });
const [brochure] = await luna.workspace.templates({ tag: 'brochure', factory: true });
```

***

### unusedMedia()

```ts
unusedMedia(packageUid, options): Promise<UnusedMedia>;
```

What `deleteUnusedMedia` would remove from a package, without removing anything (LUNA's
pre-flight, fact 240). `unusedUids` and `kept` need a LUNA that lists files; an older one
answers the counts only and leaves both `undefined`.

LUNA keeps a file that the session uses now, that undo or a saved version could bring
back, or that only an auto-backup uses; `kept` gives the reason for each.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `packageUid` | `string` |
| `options` | \{ `clearUndo?`: `boolean`; \} |
| `options.clearUndo?` | `boolean` |

#### Returns

`Promise`\<[`UnusedMedia`](../interfaces/UnusedMedia.md)\>

#### Example

```ts
const plan = await luna.workspace.unusedMedia(session.sessionPackageUid.value!);
plan.unusedCount;                                  // files that would go
plan.unusedUids?.map((uid) => sources.byId(uid)?.displayName.value);
plan.kept?.filter((k) => k.reason === 'undo');     // freed by clearing undo
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
