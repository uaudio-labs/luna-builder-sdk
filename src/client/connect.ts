/**
 * One call to a connected client.
 *
 * Resolution order:
 * 1. `port_` — use this transport as-is (tests, custom transports).
 * 2. `engine: 'wasm'` (or `?engine=wasm` on the page URL) — boot the in-page WebAssembly engine.
 * 3. `url` / `host` / `port` — explicit WebSocket target.
 * 4. `?host=` / `?port=` on the page URL — set by LUNA when it opens an Add On.
 * 5. `ws://localhost:4718` — LUNA's engine on this machine.
 *
 * @example
 * const luna = await Luna.connect();                    // inside LUNA, or LUNA on localhost
 * const luna = await Luna.connect({ engine: 'wasm' });  // plain web page, wasm engine
 * const luna = await Luna.connect({ port_: engine.port() }); // tests
 */
import { bootWasmEngine, type BootOptions } from '../engine/loader';
import type { LogFn, Port } from '../wire/port';
import { WasmPort } from '../wire/wasm-port';
import { DEFAULT_LUNA_PORT, WebSocketPort, type SocketConstructor } from '../wire/websocket-port';
import { Client, type Engine } from './client';
import { locationOptions } from './detect';

export interface ConnectOptions {
  /** Which engine to reach. Default: infer from the other options and the page URL. */
  engine?: Engine;
  url?: string;
  host?: string;
  port?: number;
  /** Per-request timeout. Default 10 000 ms. */
  requestTimeoutMs?: number;
  /** Injected WebSocket implementation (tests, Node). */
  WebSocket?: SocketConstructor;
  /** Use this transport instead of opening one. Its status is taken as-is. */
  port_?: Port;
  /** Directory URL of `devicedwasm.js`/`.wasm` for `engine: 'wasm'`. Default `/__engine/` (the `ua-builder serve` mount). */
  engineUrl?: string;
  /** Extra wasm boot options (persistence, logging, timeout). */
  wasm?: Omit<BootOptions, 'engineUrl'>;
  /**
   * Where the connection reports status changes, reconnects, timeouts and listener errors.
   * Default: warnings and errors to the console.
   *
   * @example
   * await Luna.connect({ log: (level, message) => level !== 'debug' && console.log(level, message) });
   */
  log?: LogFn;
}

export async function connect(options: ConnectOptions = {}): Promise<Client> {
  if (options.port_) {
    return new Client(options.port_, options.engine ?? 'mock');
  }
  const fromLocation = locationOptions();
  if (options.engine === 'wasm' || (options.engine === undefined && fromLocation.engine === 'wasm')) {
    const boot: BootOptions = { ...(options.wasm ?? {}) };
    if (options.engineUrl !== undefined) boot.engineUrl = options.engineUrl;
    else if (fromLocation.engineUrl !== undefined) boot.engineUrl = fromLocation.engineUrl;
    const engine = await bootWasmEngine(boot);
    const port = new WasmPort(engine, options.requestTimeoutMs !== undefined ? { requestTimeoutMs: options.requestTimeoutMs } : {});
    return new Client(port, 'wasm');
  }
  const host = options.host ?? fromLocation.host;
  const port = options.port ?? fromLocation.port ?? DEFAULT_LUNA_PORT;
  const wsOptions: ConstructorParameters<typeof WebSocketPort>[0] = { port };
  if (options.url !== undefined) wsOptions.url = options.url;
  if (host !== undefined) wsOptions.host = host;
  if (options.requestTimeoutMs !== undefined) wsOptions.requestTimeoutMs = options.requestTimeoutMs;
  if (options.WebSocket !== undefined) wsOptions.WebSocket = options.WebSocket;
  if (options.log !== undefined) wsOptions.log = options.log;
  const wsPort = new WebSocketPort(wsOptions);
  await wsPort.open();
  const engine: Engine = options.engine ?? 'luna';
  return new Client(wsPort, engine);
}
