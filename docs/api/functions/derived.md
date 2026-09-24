# Function: derived()

```ts
function derived<T>(sources, compute): Prop<T>;
```

A read-only [Prop](../interfaces/Prop.md) computed from other props. Recomputes lazily on read and notifies
when any source notifies.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sources` | readonly [`Prop`](../interfaces/Prop.md)\<`unknown`\>[] |
| `compute` | () => `T` |

## Returns

[`Prop`](../interfaces/Prop.md)\<`T`\>

## Example

```ts
const isStopped = Luna.derived([transport.playing], () => transport.playing.value === false);
```
