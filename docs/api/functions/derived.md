# Function: derived()

```ts
function derived<T>(
   sources, 
   compute, 
options): Prop<T>;
```

A read-only [Prop](../interfaces/Prop.md) computed from other props. Recomputes lazily on read and notifies
when any source notifies. With `distinct: true` it notifies only when the computed value
actually moved ([shallowEquals](shallowEquals.md)) — for a value carved out of a chatty source, such as
the tempo on `location` pushes.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sources` | readonly [`Prop`](../interfaces/Prop.md)\<`unknown`\>[] |
| `compute` | () => `T` \| `undefined` |
| `options` | \{ `distinct?`: `boolean`; \} |
| `options.distinct?` | `boolean` |

## Returns

[`Prop`](../interfaces/Prop.md)\<`T`\>

## Example

```ts
const isStopped = Luna.derived([transport.playing], () => transport.playing.value === false);
const tempo = Luna.derived([t.location], () => t.location.value?.tempo, { distinct: true });
```
