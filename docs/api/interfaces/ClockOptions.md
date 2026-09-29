# Interface: ClockOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bindings"></a> `bindings?` | [`Bindings`](../classes/Bindings.md) | Release the clock with this group. |
| <a id="render"></a> `render?` | (`seconds`) => `void` | Paint the element for the estimated playhead seconds. Called on bind, on every engine push, and each animation frame while playing. Default: `el.textContent` set to `Luna.formatMinSec(seconds, { fraction: 1 })`. |
