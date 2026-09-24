# Class: Shortcuts

The standard shortcuts as an object: which command a key means, and running it. Most Add
Ons only need [bindShortcuts](../functions/bindShortcuts.md); use this directly to route keys from a listener the
page already has, or to run a command from a menu.

## Example

```ts
const shortcuts = new Luna.Shortcuts(luna);
shortcuts.commandFor({ key: 'z', code: 'KeyZ', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false }); // 'undo' on a Mac
await shortcuts.run('togglePlayback');
document.addEventListener('keydown', (e) => shortcuts.handle(e));
```

## Constructors

### Constructor

```ts
new Shortcuts(client, options): Shortcuts;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `client` | [`Client`](Client.md) |
| `options` | [`ShortcutsOptions`](../interfaces/ShortcutsOptions.md) |

#### Returns

`Shortcuts`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="bindings"></a> `bindings` | `readonly` | `Readonly`\<[`ShortcutBindings`](../type-aliases/ShortcutBindings.md)\> | The combos in effect, per command. |
| <a id="platform"></a> `platform` | `readonly` | [`ShortcutPlatform`](../type-aliases/ShortcutPlatform.md) | - |

## Methods

### commandFor()

```ts
commandFor(event): ShortcutCommand | undefined;
```

The command `event` is bound to, if any. Ignores focus and `defaultPrevented`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`ShortcutKeyEvent`](../type-aliases/ShortcutKeyEvent.md) |

#### Returns

[`ShortcutCommand`](../type-aliases/ShortcutCommand.md) \| `undefined`

***

### handle()

```ts
handle(event): boolean;
```

Run the command for a keydown the page has not handled. Returns true, having called
`preventDefault()`, when it ran one; false for a key that is claimed, typed into a text
field, unbound, a held-down transport key, or pressed with no session open.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `KeyboardEvent` |

#### Returns

`boolean`

***

### handleKeyUp()

```ts
handleKeyUp(event): void;
```

Keyup half of [handle](#handle): claims the keyup of a key whose keydown was handled, so
Space does not also activate a focused button.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `KeyboardEvent` |

#### Returns

`void`

***

### run()

```ts
run(command): Promise<void>;
```

Run a command on the focused session (or `options.session`), as LUNA's own shortcut
would. Resolves without doing anything when no session is open.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | [`ShortcutCommand`](../type-aliases/ShortcutCommand.md) |

#### Returns

`Promise`\<`void`\>
