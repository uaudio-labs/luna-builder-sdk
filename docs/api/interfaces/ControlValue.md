# Interface: ControlValue

One control and its value for [Context.writeControlValues](../classes/Context.md#writecontrolvalues) / [Context.trimControlValues](../classes/Context.md#trimcontrolvalues).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="control"></a> `control` | `string` \| [`Control`](../classes/Control.md) | The control, or its `uid`. A `Control` must have its `uid` loaded. |
| <a id="value"></a> `value` | `number` | Absolute value for a write, delta for a trim; in the control's native unit (dB for gain). |
