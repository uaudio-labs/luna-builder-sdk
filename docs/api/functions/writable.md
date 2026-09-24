# Function: writable()

```ts
function writable<T>(view, setter): WritableProp<T>;
```

Wrap a [Prop](../interfaces/Prop.md) with a setter to make a [WritableProp](../interfaces/WritableProp.md).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `view` | [`Prop`](../interfaces/Prop.md)\<`T`\> |
| `setter` | (`value`) => `Promise`\<`void`\> |

## Returns

[`WritableProp`](../interfaces/WritableProp.md)\<`T`\>
