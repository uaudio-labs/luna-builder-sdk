# Interface: WritableProp\<T\>

A [Prop](Prop.md) that can be written. `set` is optimistic: `value` moves at once and rolls back on rejection.

## Extends

- [`Prop`](Prop.md)\<`T`\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Modifier | Type | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="value"></a> `value` | `readonly` | `T` \| `undefined` | [`Prop`](Prop.md).[`value`](Prop.md#value) |

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

#### Inherited from

[`Prop`](Prop.md).[`onChange`](Prop.md#onchange)

***

### set()

```ts
set(value): Promise<void>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `T` |

#### Returns

`Promise`\<`void`\>
