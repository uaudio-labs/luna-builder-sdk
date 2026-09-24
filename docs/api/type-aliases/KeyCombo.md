# Type Alias: KeyCombo

```ts
type KeyCombo = string;
```

A key combination as `Modifier+...+Key`. Modifiers are `Mod` (Cmd on a Mac, Ctrl
elsewhere), `Cmd`, `Ctrl`, `Alt` and `Shift`, and the ones named must be exactly the ones
held. The key is a `KeyboardEvent.key` (`z`, case-insensitive) or `KeyboardEvent.code`
(`Space`, `Numpad0`, `KeyZ`).
