# Type Alias: TransactionMode

```ts
type TransactionMode = "batch" | "continuous";
```

Which kind of [Session.transaction](../classes/Session.md#transaction) is open: `'batch'` holds every command for one
undo step and holds pushes until the commit; `'continuous'` keeps only the last command.
