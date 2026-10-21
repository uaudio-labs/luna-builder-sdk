# Interface: CompiledClipLike

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="needsrender"></a> `needsRender?` | `readonly` | \| `boolean` \| \{ `value`: `boolean` \| `undefined`; \} | True when the segment plays a rendering, made or still being made. |
| <a id="rendersourcestart"></a> `renderSourceStart?` | `readonly` | \| `number` \| \{ `value`: `number` \| `null` \| `undefined`; \} \| `null` | - |
| <a id="rendersourcestop"></a> `renderSourceStop?` | `readonly` | \| `number` \| \{ `value`: `number` \| `null` \| `undefined`; \} \| `null` | - |
| <a id="rendersourceuid"></a> `renderSourceUid?` | `readonly` | \| `string` \| \{ `value`: `string` \| `null` \| `undefined`; \} \| `null` | The segment's own rendering: a uid, `null` for none, `undefined` when LUNA does not say. |
| <a id="sourcestart"></a> `sourceStart` | `readonly` | \| `number` \| \{ `value`: `number` \| `undefined`; \} \| `undefined` | - |
| <a id="sourcestop"></a> `sourceStop` | `readonly` | \| `number` \| \{ `value`: `number` \| `undefined`; \} \| `undefined` | - |
| <a id="start"></a> `start` | `readonly` | \| `number` \| \{ `value`: `number` \| `undefined`; \} \| `undefined` | - |
| <a id="stop"></a> `stop` | `readonly` | \| `number` \| \{ `value`: `number` \| `undefined`; \} \| `undefined` | - |
