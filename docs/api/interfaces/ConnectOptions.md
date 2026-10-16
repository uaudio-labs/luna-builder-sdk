# Interface: ConnectOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="engine"></a> `engine?` | `Engine` | Which engine to reach: `'luna'` or `'mock'`. Default: infer from the other options and the page URL. |
| <a id="host"></a> `host?` | `string` | - |
| <a id="log"></a> `log?` | [`LogFn`](../type-aliases/LogFn.md) | Where the connection reports status changes, reconnects, timeouts and listener errors. Default: warnings and errors to the console. **Example** `await Luna.connect({ log: (level, message) => level !== 'debug' && console.log(level, message) });` |
| <a id="port"></a> `port?` | `number` | - |
| <a id="port_"></a> `port_?` | [`Port`](Port.md) | Use this transport instead of opening one. Its status is taken as-is. |
| <a id="requesttimeoutms"></a> `requestTimeoutMs?` | `number` | Per-request timeout. Default 10 000 ms. |
| <a id="setup"></a> `setup?` | (`engine`) => `void` \| `Promise`\<`void`\> | For `engine: 'mock'`: fill the engine before the client connects. Without it the page's `globalThis.LunaMockSetup` is used, and without that [MockEngine.demo](../classes/MockEngine.md#demo)'s session. The client reaches the engine afterwards as `luna.mock`. **Example** `await Luna.connect({ engine: 'mock', setup: (engine) => engine.addSession('s', { tracks: ['Vox', 'Bass'] }) });` |
| <a id="url"></a> `url?` | `string` | - |
| <a id="websocket"></a> `WebSocket?` | [`SocketConstructor`](../type-aliases/SocketConstructor.md) | Injected WebSocket implementation (tests, Node). |
