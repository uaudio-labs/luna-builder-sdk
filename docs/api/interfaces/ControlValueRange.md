# Interface: ControlValueRange

The tick range of a write or trim: `[start, stop)`. Give both or neither; with neither, LUNA
uses the context's selection (fact 227).

## Properties

| Property | Type |
| ------ | ------ |
| <a id="start"></a> `start?` | `number` |
| <a id="stop"></a> `stop?` | `number` |
