# Type Alias: NewSessionType

```ts
type NewSessionType = 
  | "default"
  | "multi"
  | "history"
  | "template"
  | "track_preset"
  | "device_mixer"
  | "volt"
  | "standalone";
```

The kind of session package `new_session` makes. LUNA's own list; `'default'` is an
ordinary session, `'standalone'` one kept in a standalone sessions subfolder named by
[CreateSessionOptions.standaloneId](../interfaces/CreateSessionOptions.md#standaloneid).
