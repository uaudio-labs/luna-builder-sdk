# Interface: CompiledClipSnapshot

A compiled clip's state at one moment, as plain data: what a view draws from.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="clipuid"></a> `clipUid` | `readonly` | `string` \| `undefined` |
| <a id="fadein"></a> `fadeIn` | `readonly` | [`CompiledFade`](CompiledFade.md) \| `undefined` |
| <a id="fadeout"></a> `fadeOut` | `readonly` | [`CompiledFade`](CompiledFade.md) \| `undefined` |
| <a id="fullstart"></a> `fullStart` | `readonly` | `number` \| `undefined` |
| <a id="fullstop"></a> `fullStop` | `readonly` | `number` \| `undefined` |
| <a id="id"></a> `id` | `readonly` | `string` |
| <a id="name"></a> `name` | `readonly` | `string` \| `undefined` |
| <a id="needsrender"></a> `needsRender` | `readonly` | `boolean` \| `undefined` |
| <a id="rendersourcestart"></a> `renderSourceStart` | `readonly` | `number` \| `undefined` |
| <a id="rendersourcestop"></a> `renderSourceStop` | `readonly` | `number` \| `undefined` |
| <a id="rendersourceuid"></a> `renderSourceUid` | `readonly` | `string` \| `null` \| `undefined` |
| <a id="reportsfades"></a> `reportsFades` | `readonly` | `boolean` |
| <a id="sourcestart"></a> `sourceStart` | `readonly` | `number` \| `undefined` |
| <a id="sourcestop"></a> `sourceStop` | `readonly` | `number` \| `undefined` |
| <a id="start"></a> `start` | `readonly` | `number` \| `undefined` |
| <a id="stop"></a> `stop` | `readonly` | `number` \| `undefined` |
