# Class: Control

## Extends

- [`Node`](Node.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="automatable"></a> `automatable` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="client"></a> `client` | `readonly` | [`Client`](Client.md) | - | [`Node`](Node.md).[`client`](Node.md#client) |
| <a id="controltype"></a> `controlType` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="discrete"></a> `discrete` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean`\> | - | - |
| <a id="display"></a> `display` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | Formatted for display, as the engine formats it. | - |
| <a id="displayvalues"></a> `displayValues` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`[]\> | For discrete controls: the display string of each step. | - |
| <a id="initialized"></a> `initialized` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`boolean` \| `null`\> | `true` on a live control. A plugin parameter left behind when its slot was cleared has `initialized: null` (fact 86); [Effect.params](Effect.md#params) lists only live ones. | - |
| <a id="name"></a> `name` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="normalized"></a> `normalized` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | 0..1 view. | - |
| <a id="numsteps"></a> `numSteps` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="path"></a> `path` | `readonly` | `string` | Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. | [`Node`](Node.md).[`path`](Node.md#path) |
| <a id="real"></a> `real` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number` \| `boolean`\> | Value in units (dB, pan position) or boolean for switches. | - |
| <a id="realvalues"></a> `realValues` | `readonly` | [`Prop`](../interfaces/Prop.md)\<(`number` \| `boolean`)[]\> | For discrete controls: the real value of each step. | - |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | Owning session uid; needed for automation commands. Derived from the path when omitted. | - |
| <a id="taper"></a> `taper` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`Taper`](Taper.md) \| `null`\> | The fader taper LUNA maps this control's `normalized` to dB with (fact 134): a [Taper](Taper.md) for gain-type controls (gain, gain trim, input trims), `null` for the rest, `undefined` until the control type arrives. It changes, and notifies, when LUNA swaps the taper, as it does for a summing console on a bus input. **Example** `const taper = track.gain.taper.value!; taper.name; // '+12' taper.toNormalized(0); // 0.7818 track.gain.taper.onChange(() => redrawMarks(track.gain.taper.value));` | - |
| <a id="touchcount"></a> `touchCount` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | - | - |
| <a id="uid"></a> `uid` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`string`\> | - | - |
| <a id="value"></a> `value` | `readonly` | [`WritableProp`](../interfaces/WritableProp.md)\<`number`\> | Engine-native value. Writing here is undoable. | - |

## Accessors

### automation

#### Get Signature

```ts
get automation(): Automation;
```

Playback automation lane. Call `load()` on it before reading breakpoints.

##### Returns

[`Automation`](Automation.md)

***

### automationRecording

#### Get Signature

```ts
get automationRecording(): Automation;
```

Automation captured during the current record pass.

##### Returns

[`Automation`](Automation.md)

***

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

### inGesture

#### Get Signature

```ts
get inGesture(): boolean;
```

True while inside a [begin](#begin)/[end](#end) pair.

##### Returns

`boolean`

***

### isSwitch

#### Get Signature

```ts
get isSwitch(): boolean;
```

True when `real` is boolean-like (mute, solo, switches).

##### Returns

`boolean`

***

### on

#### Get Signature

```ts
get on(): boolean;
```

For switches: current state as a boolean.

##### Returns

`boolean`

***

### touchable

#### Get Signature

```ts
get touchable(): boolean;
```

True when writes to this control are touch-bracketed: automatable controls, and discrete
ones (switches, stepped parameters), which LUNA's GUI always brackets (fact 78). A control
whose `automatable` has not arrived yet counts as automatable.

##### Example

```ts
track.gain.touchable; // true
track.solo.touchable; // true: a switch, though not automatable
```

##### Returns

`boolean`

## Methods

### begin()

```ts
begin(): void;
```

Start a continuous gesture (pointer down). Sends `set_touch` on for a [touchable](#touchable)
control; writes until [end](#end) are not bracketed individually. Nested calls are
counted and only the outermost touches. Always pair with [end](#end), including on
cancelled drags; [bindGesture](../functions/bindGesture.md) does the pairing for a DOM element.

#### Returns

`void`

#### Example

```ts
gain.begin();
await gain.normalized.set(0.6);
gain.end();
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

### end()

```ts
end(): void;
```

Finish a continuous gesture (pointer up). Releases the touch the matching [begin](#begin)
took; an unmatched call is ignored, since LUNA rejects a release it never saw a touch for
(fact 78).

#### Returns

`void`

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

### resetToDefault()

```ts
resetToDefault(): Promise<void>;
```

Put the control back to its default value (`set_control_default_value`). LUNA knows each
control's default, so there is no default to read or hard-code: a double-click-to-reset
calls this. Like a one-shot write it is touch-bracketed, so it makes one undo step; inside
a [begin](#begin)/[end](#end) gesture it is not bracketed again. The new value arrives by
push. A plugin parameter whose plugin gives LUNA no default keeps its value (fact 92).

#### Returns

`Promise`\<`void`\>

#### Example

```ts
fader.addEventListener('dblclick', () => track.gain.resetToDefault());  // 0 dB
panKnob.addEventListener('dblclick', () => track.main.pans[0]?.resetToDefault()); // centre
```

***

### toggle()

```ts
toggle(): Promise<void>;
```

For switches: flip the state.

#### Returns

`Promise`\<`void`\>

***

### touch()

```ts
touch(touching): Promise<void>;
```

Raw touch state on the engine (`set_touch` command). Prefer begin/end; errors are swallowed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `touching` | `boolean` |

#### Returns

`Promise`\<`void`\>

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
