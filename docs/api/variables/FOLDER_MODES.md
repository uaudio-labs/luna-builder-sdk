# Variable: FOLDER\_MODES

```ts
const FOLDER_MODES: readonly FolderMode[];
```

Every [FolderMode](../type-aliases/FolderMode.md) (fact 136): `none` is an ordinary bus, `summing` and `container`
are folders.

## Example

```ts
for (const mode of Luna.FOLDER_MODES) select.add(new Option(mode));
```
