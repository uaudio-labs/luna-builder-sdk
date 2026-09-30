# Class: Automation

An observable ordered collection with id lookup.

## Extends

- [`Collection`](Collection.md)\<[`BreakpointNode`](BreakpointNode.md)\>

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Collection`](Collection.md).[`client`](Collection.md#client) |
| <a id="path"></a> `path` | `readonly` | `string` | Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. | [`Collection`](Collection.md).[`path`](Collection.md#path) |

## Accessors

### breakpoints

#### Get Signature

```ts
get breakpoints(): Breakpoint[];
```

Breakpoints sorted by tick.

##### Returns

[`Breakpoint`](../interfaces/Breakpoint.md)[]

***

### items

#### Get Signature

```ts
get items(): readonly T[];
```

Members in engine order. Empty until loaded or pushed.

##### Returns

readonly `T`[]

#### Inherited from

[`Collection`](Collection.md).[`items`](Collection.md#items)

***

### value

#### Get Signature

```ts
get value(): readonly T[];
```

##### Returns

readonly `T`[]

#### Inherited from

[`Collection`](Collection.md).[`value`](Collection.md#value)

## Methods

### byId()

```ts
byId(id): BreakpointNode | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

[`BreakpointNode`](BreakpointNode.md) \| `undefined`

#### Inherited from

[`Collection`](Collection.md).[`byId`](Collection.md#byid)

***

### clear()

```ts
clear(startTick, stopTick?): Promise<void>;
```

Delete the breakpoint at `tick`, or every breakpoint in `[startTick, stopTick]`. Resolves
once they are gone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `startTick` | `number` |
| `stopTick?` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await track.gain.automation.clear(0, Luna.WHOLE_NOTE * 4);
```

***

### insert()

```ts
insert(points, clearRange?): Promise<void>;
```

Insert breakpoints. With `clearRange`, existing breakpoints in that range are removed first;
without it, new points stack on existing ones. Values go on the wire as float literals,
because LUNA stores a bare whole number as 0 (fact 82). Resolves once every point is in
the lane.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `points` | [`Breakpoint`](../interfaces/Breakpoint.md)[] |
| `clearRange?` | \{ `startTick`: `number`; `stopTick`: `number`; \} |
| `clearRange.startTick?` | `number` |
| `clearRange.stopTick?` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await track.gain.automation.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
```

***

### load()

```ts
load(): Promise<void>;
```

Fetch the member list (and, with the default `levels: 2`, each member's properties).

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`Collection`](Collection.md).[`load`](Collection.md#load)

***

### membersReady()

```ts
membersReady(): Promise<void>;
```

Resolve once every member the engine has added has its properties loaded. Resolves at
once when nothing is being fetched.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
await Luna.settle(() => lane.clips.items.length > before, 'insert clip');
await lane.clips.membersReady();
lane.clips.items.at(-1).start.value;   // loaded, not undefined
```

#### Inherited from

[`Collection`](Collection.md).[`membersReady`](Collection.md#membersready)

***

### move()

```ts
move(fromTick, toTick): Promise<void>;
```

Move the breakpoint at `fromTick` to `toTick`. Resolves once it has moved.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `fromTick` | `number` |
| `toTick` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await track.gain.automation.move(0, Luna.QUARTER_NOTE);
```

***

### onChange()

```ts
onChange(listener): Unsubscribe;
```

Called when members are added or removed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Inherited from

[`Collection`](Collection.md).[`onChange`](Collection.md#onchange)

***

### reload()

```ts
reload(): Promise<void>;
```

Fetch the member list again, ignoring the once-only cache of [load](#load), and re-sync
the members. Use it after an edit whose push LUNA held back, or inside a transaction.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await session.tracks.reload();
```

#### Inherited from

[`Collection`](Collection.md).[`reload`](Collection.md#reload)

***

### setValue()

```ts
setValue(tick, value): Promise<void>;
```

Set the value of the breakpoint at `tick`, sent as a float literal (fact 82). Resolves
once the lane shows it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tick` | `number` |
| `value` | `number` |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await track.gain.automation.setValue(0, -3);
```

***

### watch()

```ts
watch(options): object;
```

Subscribe to this folder on the wire and load it, so members and their properties
follow engine pushes. Collections under a session that called `ready()` are already
covered; use this for folders outside one, such as `/renders` or `/jobs` (fact 34).
Refcounted through the Store; call `release` when done.

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
const w = luna.renders.watch();
await w.ready;
luna.renders.onChange(() => draw(luna.renders.items));
```

#### Inherited from

[`Collection`](Collection.md).[`watch`](Collection.md#watch)
