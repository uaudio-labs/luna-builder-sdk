# Type Alias: Releasable

```ts
type Releasable = 
  | Unsubscribe
  | {
  dispose: void;
};
```

Something [Bindings](../classes/Bindings.md) can release: an unsubscribe function or an object with `dispose()`.
