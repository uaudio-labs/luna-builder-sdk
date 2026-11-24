# Type Alias: PropKey\<T\>

```ts
type PropKey<T> = { [K in keyof T]: T[K] extends { value: unknown; onChange: any } ? K : never }[keyof T] & string;
```

The names of a member's fields that are props, for [Collection.onAnyChange](../classes/Collection.md#onanychange).

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
