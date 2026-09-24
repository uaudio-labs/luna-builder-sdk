# Interface: RecordOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="inputuid"></a> `inputUid?` | `string` | A device input to route first, from [Client.audioInputs](../classes/Client.md#audioinputs). Left alone when omitted. |
| <a id="maxseconds"></a> `maxSeconds?` | `number` | Cap on a signal-only pass. Default 600. |
| <a id="seconds"></a> `seconds?` | `number` | How long to hold after the punch. Give this, a `signal`, or both. |
| <a id="signal"></a> `signal?` | `AbortSignal` | Abort the pass early. |
| <a id="starttick"></a> `startTick?` | `number` | Where to punch in. The current play start when omitted. |
| <a id="track"></a> `track` | `string` \| [`Track`](../classes/Track.md) | The audio track to record onto, or its uid. |
