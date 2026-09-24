# Interface: WebSocketPortOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="heartbeat"></a> `heartbeat?` | `boolean` | Send `/ping` to defeat the engine's idle timeout. Default true. |
| <a id="host"></a> `host?` | `string` | Default `localhost`. |
| <a id="idkey"></a> `idKey?` | `string` | Query parameter used for correlation. Default `ua_id`. |
| <a id="log"></a> `log?` | [`LogFn`](../type-aliases/LogFn.md) | Status changes, reconnects, timeouts and listener errors. Default: warnings and errors to the console. |
| <a id="onunhandled"></a> `onUnhandled?` | (`message`) => `void` | Called for messages that are neither replies nor matched by a subscription. |
| <a id="port"></a> `port?` | `number` | Default 4718, LUNA's engine. |
| <a id="reconnect"></a> `reconnect?` | `boolean` | Reconnect after a drop. Default true. |
| <a id="reconnectmaxms"></a> `reconnectMaxMs?` | `number` | - |
| <a id="reconnectminms"></a> `reconnectMinMs?` | `number` | Backoff bounds. Defaults 250 ms and 10 000 ms. |
| <a id="requesttimeoutms"></a> `requestTimeoutMs?` | `number` | Per-request timeout. Default 10 000 ms. |
| <a id="url"></a> `url?` | `string` | Full URL. Overrides `host`/`port`. |
| <a id="websocket"></a> `WebSocket?` | [`SocketConstructor`](../type-aliases/SocketConstructor.md) | Injected WebSocket implementation (tests). Default `globalThis.WebSocket`. |
