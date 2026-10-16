# Function: bindShortcuts()

```ts
function bindShortcuts(client, options): ShortcutsBinding;
```

Give a page LUNA's standard shortcuts for undo, redo, play and record, as a fallback behind
its own key handling, when LUNA is not there to handle them.

Inside LUNA (its native bridge is present) this installs nothing: LUNA already runs every
key the page does not `preventDefault()` through its own shortcut table (fact 81), which
covers every command and follows the user's remapping; claiming four keys here would
override that. Elsewhere it
listens for `keydown` in the bubble phase on `options.target` (default the window), so
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
