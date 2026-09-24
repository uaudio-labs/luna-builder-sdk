# Type Alias: ShortcutKeyEvent

```ts
type ShortcutKeyEvent = Pick<KeyboardEvent, "key" | "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">;
```

The parts of a `KeyboardEvent` a binding matches on.
