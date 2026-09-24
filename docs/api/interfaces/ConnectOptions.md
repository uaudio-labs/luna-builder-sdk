# Interface: ConnectOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="engine"></a> `engine?` | [`Engine`](../type-aliases/Engine.md) | Which engine to reach. Default: infer from the other options and the page URL. |
| <a id="engineurl"></a> `engineUrl?` | `string` | Directory URL of `devicedwasm.js`/`.wasm` for `engine: 'wasm'`. Default `/__engine/` (the `ua-builder serve` mount). |
| <a id="host"></a> `host?` | `string` | - |
| <a id="log"></a> `log?` | [`LogFn`](../type-aliases/LogFn.md) | Where the connection reports status changes, reconnects, timeouts and listener errors. Default: warnings and errors to the console. **Example** `await Luna.connect({ log: (level, message) => level !== 'debug' && console.log(level, message) });` |
| <a id="port"></a> `port?` | `number` | - |
| <a id="port_"></a> `port_?` | [`Port`](Port.md) | Use this transport instead of opening one. Its status is taken as-is. |
| <a id="requesttimeoutms"></a> `requestTimeoutMs?` | `number` | Per-request timeout. Default 10 000 ms. |
| <a id="url"></a> `url?` | `string` | - |
| <a id="wasm"></a> `wasm?` | `Omit`\<[`BootOptions`](BootOptions.md), `"engineUrl"`\> | Extra wasm boot options (persistence, logging, timeout). |
| <a id="websocket"></a> `WebSocket?` | [`SocketConstructor`](../type-aliases/SocketConstructor.md) | Injected WebSocket implementation (tests, Node). |
