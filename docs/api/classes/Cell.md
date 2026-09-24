# Class: Cell\<T\>

The concrete [Prop](../interfaces/Prop.md): a value with a version stamp and listeners.
The version lets the Store decide whether an incoming value is newer than a pending write.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Implements

- [`Prop`](../interfaces/Prop.md)\<`T`\>

## Constructors

### Constructor

```ts
new Cell<T>(scheduler, initial?): Cell<T>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scheduler` | [`Scheduler`](Scheduler.md) |
| `initial?` | `T` |

#### Returns

`Cell`\<`T`\>

## Accessors

### value

#### Get Signature

```ts
get value(): T | undefined;
```

##### Returns

`T` \| `undefined`

#### Implementation of

[`Prop`](../interfaces/Prop.md).[`value`](../interfaces/Prop.md#value)

***

### version

#### Get Signature

```ts
get version(): number;
```

Version of the current value; 0 until first written.

##### Returns

`number`

## Methods

### onChange()

```ts
onChange(listener): Unsubscribe;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`Prop`](../interfaces/Prop.md).[`onChange`](../interfaces/Prop.md#onchange)

***

### update()

```ts
update(
   value, 
   version, 
   equals): boolean;
```

Write with a stamp. Returns true if the value changed. A write stamped older than the
current value is ignored, so a read that was answered late cannot undo a push or a
write that landed while it was in flight.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `value` | `T` | `undefined` |
| `version` | `number` | `...` |
| `equals` | (`a`, `b`) => `boolean` | `shallowEquals` |

#### Returns

`boolean`
