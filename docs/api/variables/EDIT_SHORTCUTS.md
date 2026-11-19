# Variable: EDIT\_SHORTCUTS

```ts
const EDIT_SHORTCUTS: Readonly<Pick<ShortcutBindings, "selectAll" | "cut" | "copy" | "paste" | "clear" | "duplicate">>;
```

LUNA's default keys for its edit commands (fact 150): Cmd+A to select all, Cmd+X, Cmd+C,
Cmd+V (Ctrl off the Mac), Backspace or Delete to clear, and Cmd+D for Duplicate Selection. Pass them as
`bindings` to have [Shortcuts](../classes/Shortcuts.md) run them; each acts on LUNA's edit selection, which
`options.prepare` can point at what the page shows first (`session.selectTimeline`).

## Example

```ts
const keys = new Luna.Shortcuts(luna, {
  bindings: Luna.EDIT_SHORTCUTS,
  prepare: (command, session) => session.selectTimeline({ tracks: [shownTrack] }),
});
document.addEventListener('keydown', (e) => keys.handle(e));
```
