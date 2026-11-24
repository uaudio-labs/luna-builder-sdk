# Type Alias: KeptReason

```ts
type KeptReason = 
  | "session"
  | "undo"
  | "version"
  | "backup"
  | "origin"
  | "move_failed"
  | string & object;
```

Why LUNA keeps a file that [Workspace.unusedMedia](../classes/Workspace.md#unusedmedia) does not offer to remove.
