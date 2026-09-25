# Interface: DragOptions

## Extends

- `CommonOptions`

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="axis"></a> `axis?` | `"x"` \| `"y"` \| `"both"` | Which pointer travel moves the value: up (`'y'`, default), right (`'x'`), or either (`'both'`). | - |
| <a id="bindings"></a> `bindings?` | [`Bindings`](../classes/Bindings.md) | Hold this group for each drag and dispose the binding with it. | `CommonOptions.bindings` |
| <a id="label"></a> `label?` | `string` | `aria-label`, when the element has none. | - |
| <a id="onbegin"></a> `onBegin?` | (`event`) => `void` | Called after the controls are touched, with the pointer-down event. | `CommonOptions.onBegin` |
| <a id="onend"></a> `onEnd?` | (`event?`) => `void` | Called after the release, once the element shows LUNA's settled value. | `CommonOptions.onEnd` |
| <a id="onerror"></a> `onError?` | (`error`) => `void` | A rejected write or reset. Default: `console.error`. | `CommonOptions.onError` |
| <a id="pixelsperunit"></a> `pixelsPerUnit?` | `number` | Pixels of travel for the whole 0..1 range. Default 200. | - |
| <a id="render"></a> `render?` | (`normalized`) => `void` | Paint the element for a normalized value. Called on bind, on every write the element makes, and on LUNA's changes outside a drag. | - |
| <a id="reset"></a> `reset?` | `boolean` | Double-click puts the controls back to LUNA's default (`resetToDefault()`, one undo step). Default true. | `CommonOptions.reset` |
| <a id="step"></a> `step?` | `number` | Arrow-key step in normalized units; Page Up/Down move ten steps, Home/End go to the ends. Default 0.01. | - |
