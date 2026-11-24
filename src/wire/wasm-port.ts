/**
 * {@link Port} over the in-page WebAssembly engine. Same paths, payloads and error codes as
 * native LUNA; a different transport. Measured against a real engine (EVIDENCE facts 35-38):
 *
 * - Out: `wasmd_send(method, pathWithQuery, bodyJson)` returns a request id.
 * - In: `WasmDeviced.onReply(id, error, json)` answers a request; `onUpdate(path, json)`
 *   carries pushes. A property push is `<node>/<prop>/value` with the value; a structural
 *   add is the node path with a `{ properties, ... }` object; a removal is the node path with
 *   `null`. A few boot-time announcements use a bare property path with a scalar.
 * - The engine does echo the writer's own `set` (unlike native LUNA); the Store dedupes.
 * - A missing path answers `{}`, as on native LUNA; engines before November 2026 answered
 *   error `uasrv.invalid_object` (fact 10).
 * - No reconnect: the engine boots once per page. `stopped`/`error` close the port.
 */
import type { WasmEngine } from '../engine/loader';
import { ConnectionLost, RequestTimeout, UAError } from './errors';
import {
  eventMatches,
  getOptionsToParams,
  stripValueSuffix,
  type Event,
  type EventHandler,
  type GetOptions,
  type Port,
  type PortStatus,
  type StatusListener,
  type SubscribeOptions,
  type Unsubscribe,
  type Verb,
} from './port';
import { appendParams, encodePayload } from './codec';

const METHOD: Record<Verb, number> = { get: 0, set: 1, post: 2, subscribe: 3, unsubscribe: 4 };

/** A track's or the session's record arm (`record_enabled`), with or without `/value`. */
const RECORD_ENABLED = /\/record_enabled(\/value)?(\?|$)/;

interface Pending {
  verb: Verb;
  path: string;
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface Subscription {
  path: string;
  recursive: boolean;
  handlers: Set<EventHandler>;
}

export interface WasmPortOptions {
  requestTimeoutMs?: number;
  onUnhandled?: (event: Event) => void;
}

/** Turn one `onUpdate(path, json)` into a normalised event. Exported for tests. */
export function wasmUpdateToEvent(path: string, json: string): Event {
  let data: unknown = undefined;
  if (json !== '') {
    try {
      data = JSON.parse(json);
    } catch {
      data = json;
    }
  }
  if (path.endsWith('/value')) return { path: stripValueSuffix(path), data };
  if (data === null) return { path, data: undefined, operation: 'removed' };
  if (data !== null && typeof data === 'object' && !Array.isArray(data) && ('properties' in data || 'children' in data)) {
    return { path, data, operation: 'added' };
  }
  return { path, data };
}

export class WasmPort implements Port {
  private status: PortStatus = 'disconnected';
  private readonly pending = new Map<number, Pending>();
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly statusListeners = new Set<StatusListener>();
  private readonly requestTimeoutMs: number;
  private readonly onUnhandled: ((event: Event) => void) | undefined;
  private stateUnsub: (() => void) | undefined;

  constructor(
    readonly engine: WasmEngine,
    options: WasmPortOptions = {},
  ) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 20_000;
    this.onUnhandled = options.onUnhandled;
    engine.attach(
      (id, error, json) => this.handleReply(id, error, json),
      (path, json) => this.handleUpdate(path, json),
    );
    this.stateUnsub = engine.onState((state, detail) => {
      if (state === 'running') this.setStatus('connected');
      else if (state === 'stopped' || state === 'error') {
        this.failPending();
        this.setStatus('closed', detail);
      } else if (state === 'booting' || state === 'loading') this.setStatus('connecting');
    });
    if (engine.state === 'running') this.status = 'connected';
  }

  get connected(): boolean {
    return this.status === 'connected';
  }

  /** Engine descriptor for logs. */
  get url(): string {
    return `wasm:${this.engine.engineUrl}`;
  }

  get(path: string, options?: GetOptions): Promise<unknown> {
    const params = getOptionsToParams(options);
    delete params['ignore_response'];
    return this.request('get', appendParams(path, params), '');
  }

  async set(path: string, data: unknown, params?: Record<string, string>): Promise<void> {
    // In a browser the page owns the microphone: arming is the moment to ask for it.
    if (data === true && RECORD_ENABLED.test(path)) this.engine.wantAudioInput();
    await this.request('set', appendParams(path, params), encodePayload(data));
  }

  post(path: string, data?: unknown): Promise<unknown> {
    return this.request('post', path, encodePayload(data));
  }

  subscribe(path: string, handler: EventHandler, options?: SubscribeOptions): Unsubscribe {
    const recursive = options?.recursive === true;
    const key = `${path}|${recursive ? 1 : 0}`;
    let sub = this.subscriptions.get(key);
    if (!sub) {
      sub = { path, recursive, handlers: new Set() };
      this.subscriptions.set(key, sub);
      if (this.connected) void this.request('subscribe', recursive ? appendParams(path, { recursive: '1' }) : path, '').catch(() => undefined);
    }
    sub.handlers.add(handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.subscriptions.get(key);
      if (!current) return;
      current.handlers.delete(handler);
      if (current.handlers.size === 0) {
        this.subscriptions.delete(key);
        if (this.connected) void this.request('unsubscribe', current.path, '').catch(() => undefined);
      }
    };
  }

  onStatus(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Detach from the engine. The engine keeps running; use `engine.shutdown()` to stop it. */
  async close(): Promise<void> {
    if (this.status === 'closed') return;
    this.failPending();
    this.stateUnsub?.();
    this.stateUnsub = undefined;
    this.setStatus('closed');
  }

  // -----------------------------------------------------------------------------------------

  private request(verb: Verb, path: string, body: string): Promise<unknown> {
    if (!this.connected) return Promise.reject(new ConnectionLost(verb, path));
    const id = this.engine.send(METHOD[verb], path, body);
    if (!id) return Promise.reject(new ConnectionLost(verb, path));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new RequestTimeout(verb, path, this.requestTimeoutMs));
      }, this.requestTimeoutMs);
      this.pending.set(id, { verb, path, resolve, reject, timer });
    });
  }

  private handleReply(id: number, error: string, json: string): void {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    clearTimeout(p.timer);
    if (error) {
      p.reject(new UAError(error, `${p.verb} ${p.path}: ${error}`, { cmd: p.verb, path: p.path }));
      return;
    }
    let data: unknown = null;
    if (json !== '') {
      try {
        data = JSON.parse(json);
      } catch {
        data = json;
      }
    }
    p.resolve(data);
  }

  private handleUpdate(path: string, json: string): void {
    const event = wasmUpdateToEvent(path, json);
    let delivered = false;
    for (const sub of this.subscriptions.values()) {
      if (!eventMatches(sub.path, event.path)) continue;
      delivered = true;
      for (const h of sub.handlers) {
        try {
          h(event);
        } catch (err) {
          console.error('[Luna.WasmPort] subscription handler threw', err);
        }
      }
    }
    if (!delivered) this.onUnhandled?.(event);
  }

  private failPending(): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      this.pending.delete(id);
      p.reject(new ConnectionLost(p.verb, p.path));
    }
  }

  private setStatus(status: PortStatus, detail?: string): void {
    if (this.status === status) return;
    this.status = status;
    for (const l of this.statusListeners) {
      try {
        l(status, detail);
      } catch (err) {
        console.error('[Luna.WasmPort] status listener threw', err);
      }
    }
  }
}
