# Function: settle()

```ts
function settle(
   done, 
   what, 
options): Promise<void>;
```

Poll `done` until it holds, or reject with `no_effect`. Socket replies and event frames
land between the yields; with `refresh`, the node is re-read after a short grace and then
periodically, covering both a batch transaction and an event lost on the wire.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `done` | () => `boolean` |
| `what` | `string` |
| `options` | [`SettleOptions`](../interfaces/SettleOptions.md) |

## Returns

`Promise`\<`void`\>
