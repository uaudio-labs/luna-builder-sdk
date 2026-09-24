# Interface: List\<T\>

An observable ordered collection with id lookup.

## Extends

- [`Prop`](Prop.md)\<readonly `T`[]\>

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Modifier | Type | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="items"></a> `items` | `readonly` | readonly `T`[] | - |
| <a id="value"></a> `value` | `readonly` | readonly `T`[] \| `undefined` | [`Prop`](Prop.md).[`value`](Prop.md#value) |

## Methods

### byId()

```ts
byId(id): T | undefined;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`T` \| `undefined`

***

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
