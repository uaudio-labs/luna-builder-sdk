# Interface: RangeOptions

## Extends

- `CommonOptions`

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="bindings"></a> `bindings?` | [`Bindings`](../classes/Bindings.md) | Hold this group for each drag and dispose the binding with it. | `CommonOptions.bindings` |
| <a id="onbegin"></a> `onBegin?` | (`event`) => `void` | Called after the controls are touched, with the pointer-down event. | `CommonOptions.onBegin` |
| <a id="onend"></a> `onEnd?` | (`event?`) => `void` | Called after the release, once the element shows LUNA's settled value. | `CommonOptions.onEnd` |
| <a id="onerror"></a> `onError?` | (`error`) => `void` | A rejected write or reset. Default: `console.error`. | `CommonOptions.onError` |
| <a id="reset"></a> `reset?` | `boolean` | Double-click puts the controls back to LUNA's default (`resetToDefault()`, one undo step). Default true. | `CommonOptions.reset` |
| <a id="view"></a> `view?` | `"normalized"` \| `"real"` | Which view of the control the input's value is. `'normalized'` (default) maps the input's `min`..`max` onto 0..1, so `min="0" max="1000"` gives a finer fader. `'real'` writes the input's value as units (dB, pan position), for an input whose `min`/`max` are in units. | - |
