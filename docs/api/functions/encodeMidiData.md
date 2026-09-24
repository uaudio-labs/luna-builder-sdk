# Function: encodeMidiData()

```ts
function encodeMidiData(
   status, 
   data1, 
   data2): number;
```

Pack three MIDI bytes the way the engine's table stores them (fact 39).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `status` | `number` | `undefined` |
| `data1` | `number` | `undefined` |
| `data2` | `number` | `0` |

## Returns

`number`
