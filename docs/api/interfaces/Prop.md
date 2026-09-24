# Interface: Prop\<T\>

A readable, observable value. `value` is `undefined` until the first load or push.

## Extended by

- [`WritableProp`](WritableProp.md)
- [`List`](List.md)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="value"></a> `value` | `readonly` | `T` \| `undefined` |

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
