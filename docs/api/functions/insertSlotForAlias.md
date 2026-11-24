# Function: insertSlotForAlias()

```ts
function insertSlotForAlias(pluginId): InsertSlot | undefined;
```

The slot an alias plug-in id stands for, so a chain's `alias.console` entry can be shown
as the channel's console slot: `alias.console` gives `'console'`. Any other id, an alias
included whose slot LUNA does not know, gives `undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |

## Returns

[`InsertSlot`](../type-aliases/InsertSlot.md) \| `undefined`

## Example

```ts
for (const slot of track.effects.items) {
  const target = Luna.insertSlotForAlias(slot.pluginId.value ?? '');
  if (target) showAsLink(slot, track.effects.byId(target));   // the console plug-in
}
```
