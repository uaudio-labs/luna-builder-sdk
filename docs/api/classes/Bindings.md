# Class: Bindings

## Constructors

### Constructor

```ts
new Bindings(): Bindings;
```

#### Returns

`Bindings`

## Accessors

### busy

#### Get Signature

```ts
get busy(): boolean;
```

True while a drag bound with this group, or a [hold](#hold), is in progress.

##### Returns

`boolean`

## Methods

### add()

```ts
add<T>(item): T;
```

Release `item` with the group. After [dispose](#dispose) it is released at once.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`Releasable`](../type-aliases/Releasable.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | `T` |

#### Returns

`T`

#### Example

```ts
const g = bindings.add(Luna.bindGesture(canvas, control, { capture: true }));
bindings.add(() => clearInterval(timer));
```

***

### clear()

```ts
clear(): void;
```

Release everything added so far, end any drag and drop the holds. The group stays usable:
call it in each rebuild, just before replacing the DOM. A rebuild still waiting in
[whenIdle](#whenidle) is kept, and runs once nothing holds the group.

#### Returns

`void`

#### Example

```ts
function render() { strips.clear(); ... }
```

***

### dispose()

```ts
dispose(): void;
```

[clear](#clear), drop any waiting [whenIdle](#whenidle) rebuild (its promise resolves), and
release anything added afterwards at once.

#### Returns

`void`

***

### hold()

```ts
hold(): () => void;
```

Keep the group busy until the returned function is called, for an edit that is not a drag
(an inline rename). Releasing twice is harmless; [clear](#clear) drops every hold.

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Example

```ts
const done = bindings.hold();
input.addEventListener('blur', done, { once: true });
```

***

### on()

```ts
on(prop, listener): Unsubscribe;
```

Subscribe to `prop` for as long as the group lives.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `prop` | [`Prop`](../interfaces/Prop.md)\<`unknown`\> |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Example

```ts
bindings.on(track.name, () => { label.textContent = track.name.value ?? ''; });
```

***

### whenIdle()

```ts
whenIdle(rebuild): Promise<void>;
```

Run `rebuild` now when the group is idle. While it is busy, or while an earlier async
`rebuild` is still running, run it once afterwards instead; asked again meanwhile, the
latest `rebuild` replaces the waiting one, so a burst of changes costs one rebuild. The
promise settles when the `rebuild` that finally ran has finished.

An async `rebuild` can find the group busy again after an `await` (a drag began while it
loaded). It should then ask again and return without touching the DOM:
`if (strips.busy) { void strips.whenIdle(render); return; }`. Returning that promise
instead would wait on itself.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rebuild` | () => `void` \| `Promise`\<`void`\> |

#### Returns

`Promise`\<`void`\>

#### Example

```ts
session.tracks.onChange(() => void strips.whenIdle(render));
```
