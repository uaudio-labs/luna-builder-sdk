# Function: listOf()

```ts
function listOf<T>(source, idOf): List<T>;
```

A [List](../interfaces/List.md) over a [Prop](../interfaces/Prop.md) of arrays.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | [`Prop`](../interfaces/Prop.md)\<readonly `T`[]\> |
| `idOf` | (`item`) => `string` |

## Returns

[`List`](../interfaces/List.md)\<`T`\>
