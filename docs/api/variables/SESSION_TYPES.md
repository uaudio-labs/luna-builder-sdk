# Variable: SESSION\_TYPES

```ts
const SESSION_TYPES: readonly ["default", "multi", "history", "template", "track_preset", "device_mixer", "volt", "standalone"];
```

Session package types, in LUNA's order: a package's `session_type` is this index in a
`/workspace/query` row (a template is 3, fact 151) and this string on a session or package
node. `multi` is no longer made, `history` and `track_preset` are LUNA's own packages (see
[HIDDEN\_SESSION\_TYPES](HIDDEN_SESSION_TYPES.md)).

## Example

```ts
Luna.SESSION_TYPES[3];   // 'template'
```
