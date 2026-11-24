# Variable: HIDDEN\_SESSION\_TYPES

```ts
const HIDDEN_SESSION_TYPES: readonly SessionType[];
```

The session types an Add On listing the user's sessions should leave out: LUNA's undo
history packages and the packages that hold track presets, which the user never opens as
sessions.

## Example

```ts
const shown = rows.filter((row) => !Luna.isHiddenSessionType(row.sessionType));
```
