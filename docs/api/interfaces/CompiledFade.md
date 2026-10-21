# Interface: CompiledFade

One fade of a compiled clip, as LUNA applies it (fact 116). Ticks are absolute.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="contributorclipuid"></a> `contributorClipUid` | `readonly` | `string` \| `undefined` | The clip on the other side of a crossfade; `undefined` for a plain fade. |
| <a id="crossfade"></a> `crossfade` | `readonly` | `boolean` | True when this fade is one side of a crossfade with [contributorClipUid](#contributorclipuid). |
| <a id="curvature"></a> `curvature` | `readonly` | `number` | -1 to 1; 0 is the shape's own curve. |
| <a id="shape"></a> `shape` | `readonly` | `string` | - |
| <a id="start"></a> `start` | `readonly` | `number` | - |
| <a id="stop"></a> `stop` | `readonly` | `number` | - |
| <a id="uid"></a> `uid` | `readonly` | `string` | The fade row, for editing it. |
