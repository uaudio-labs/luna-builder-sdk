# Interface: ShortcutsOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bindings"></a> `bindings?` | `Partial`\<[`ShortcutBindings`](../type-aliases/ShortcutBindings.md)\> | Replace the combos of some commands; `[]` disables one. The rest keep their defaults. |
| <a id="oncommand"></a> `onCommand?` | (`command`, `event`) => `void` | Called after a key was matched and its command started. |
| <a id="onerror"></a> `onError?` | (`error`, `command`) => `void` | Called when a command the shortcuts ran fails. Default: `console.warn`. |
| <a id="platform"></a> `platform?` | [`ShortcutPlatform`](../type-aliases/ShortcutPlatform.md) | Which platform `Mod` resolves for. Detected from `navigator` when omitted. |
| <a id="session"></a> `session?` | () => [`Session`](../classes/Session.md) \| `undefined` | The session a command acts on. Default: `client.sessions.current()` at the keypress. |
