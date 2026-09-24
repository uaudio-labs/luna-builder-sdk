# Function: decodeMidiData()

```ts
function decodeMidiData(packed): object;
```

Unpack the three MIDI bytes the engine packs into one number (fact 39).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `packed` | `number` |

## Returns

`object`

| Name | Type |
| ------ | ------ |
| `data1` | `number` |
| `data2` | `number` |
| `status` | `number` |
