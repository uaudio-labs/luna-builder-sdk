# Interface: ShortcutsBinding

The listeners [bindShortcuts](../functions/bindShortcuts.md) installed.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="installed"></a> `installed` | `readonly` | `boolean` | False inside LUNA, which handles the page's unclaimed keys itself (fact 81). |
| <a id="shortcuts"></a> `shortcuts` | `readonly` | [`Shortcuts`](../classes/Shortcuts.md) | - |

## Methods

### dispose()

```ts
dispose(): void;
```

Remove the listeners.

#### Returns

`void`
