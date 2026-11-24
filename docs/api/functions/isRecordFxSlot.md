# Function: isRecordFxSlot()

```ts
function isRecordFxSlot(slot): boolean;
```

Whether a slot is one of the record FX slots (`record_fx_0`, `record_fx_1`, ...): the
inserts LUNA prints into a recording, as opposed to the `effect_N` playback inserts.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `slot` | `string` |

## Returns

`boolean`

## Example

```ts
Luna.isRecordFxSlot('record_fx_0');   // true
Luna.isRecordFxSlot('effect_0');      // false
const recordFx = track.effects.items.filter((e) => Luna.isRecordFxSlot(e.id));
```
