# Type Alias: QwertyKeyEvent

```ts
type QwertyKeyEvent = Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "preventDefault"> & Partial<Pick<KeyboardEvent, "target" | "isComposing">>;
```

The parts of a `KeyboardEvent` the keyboard reads.
