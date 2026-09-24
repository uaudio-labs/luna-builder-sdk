# Function: bindShortcuts()

```ts
function bindShortcuts(client, options): ShortcutsBinding;
```

Give an Add On LUNA's standard shortcuts for undo, redo, play and record, as a fallback
behind its own key handling.

Listens for `keydown` in the bubble phase on `options.target` (default the window), so
handlers on the page's elements and document run first; any of them that calls
`preventDefault()` keeps the key. Keys typed into text inputs, textareas, selects and
editable elements are left alone. Commands act on the focused session at the keypress,
so there is nothing to rebind when the user switches sessions.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | [`Client`](../classes/Client.md) |
| `options` | [`ShortcutsOptions`](../interfaces/ShortcutsOptions.md) & `object` |

## Returns

[`ShortcutsBinding`](../interfaces/ShortcutsBinding.md)

## Example

```ts
const luna = await Luna.connect();
const keys = Luna.bindShortcuts(luna, { onError: (e) => say(e.message, true) });
// later
keys.dispose();
```
