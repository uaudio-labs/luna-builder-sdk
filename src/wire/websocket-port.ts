/**
 * {@link Port} over a browser (or Node 22) `WebSocket` to LUNA's engine (`deviced`,
 * port 4718).
 *
 * Behaviour:
 * - Requests carry a non-numeric correlation id (`ua_id=r1`) that the engine echoes in
 *   `parameters`; a message without it is a push (EVIDENCE fact 1).
 * - Every request has a timeout. A drop fails every in-flight request with {@link ConnectionLost}
 *   and requests made while disconnected fail fast; nothing is queued.
 * - After the first successful open, drops reconnect with exponential backoff and every live
 *   subscription is re-sent. Listeners get `disconnected` then `connected`, which the Store
 *   uses to reload what it mirrors.
 * - Heartbeat: reads `/status/timeout_ms` and pings `/ping` at half that interval when it is
 *   non-zero, so an idle page is not dropped by the engine (EVIDENCE fact 5).
 */
import { appendParams, correlationId, decodeMessage, encodeRequest } from './codec';
import { ConnectionLost, NotRunning, RequestTimeout, UAError } from './errors';
import { expandMulti } from './multi';
import {
  consoleLog,
  type LogFn,
  eventMatches,
  getOptionsToParams,
  propertyValue,
  toEvent,
  type EventHandler,
  type GetOptions,
  type Port,
  type PortStatus,
  type StatusListener,
  type SubscribeOptions,
  type Unsubscribe,
  type Verb,
} from './port';

/** The subset of the WebSocket API this port uses; lets tests inject a fake. */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
}

export type SocketConstructor = new (url: string) => SocketLike;

export interface WebSocketPortOptions {
  /** Full URL. Overrides `host`/`port`. */
  url?: string;
  /** Default `localhost`. */
  host?: string;
  /** Default 4718, LUNA's engine. */
  port?: number;
  /** Injected WebSocket implementation (tests). Default `globalThis.WebSocket`. */
  WebSocket?: SocketConstructor;
  /** Per-request timeout. Default 10 000 ms. */
  requestTimeoutMs?: number;
  /** Reconnect after a drop. Default true. */
  reconnect?: boolean;
  /** Backoff bounds. Defaults 250 ms and 10 000 ms. */
  reconnectMinMs?: number;
  reconnectMaxMs?: number;
  /** Send `/ping` to defeat the engine's idle timeout. Default true. */
  heartbeat?: boolean;
  /** Query parameter used for correlation. Default `ua_id`. */
  idKey?: string;
  /** Called for messages that are neither replies nor matched by a subscription. */
  onUnhandled?: (message: unknown) => void;
  /** Status changes, reconnects, timeouts and listener errors. Default: warnings and errors to the console. */
  log?: LogFn;
}

export const DEFAULT_LUNA_PORT = 4718;

interface Pending {
  verb: Verb;
  path: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface Subscription {
  path: string;
  recursive: boolean;
  handlers: Set<EventHandler>;
}

const OPEN = 1;

function unref(timer: ReturnType<typeof setTimeout>): void {
  const t = timer as unknown as { unref?: () => void };
  if (typeof t.unref === 'function') t.unref();
}

export class WebSocketPort implements Port {
  readonly url: string;

  private readonly Socket: SocketConstructor;
  private readonly requestTimeoutMs: number;
  private readonly reconnectEnabled: boolean;
  private readonly reconnectMinMs: number;
  private readonly reconnectMaxMs: number;
  private readonly heartbeatEnabled: boolean;
  private readonly idKey: string;
  private readonly onUnhandled: ((message: unknown) => void) | undefined;
  private readonly log: LogFn;

  private socket: SocketLike | undefined;
  private status: PortStatus = 'disconnected';
  private everConnected = false;
  private closed = false;
  private nextId = 1;
  private readonly pending = new Map<string, Pending>();
  private readonly subscriptions = new Map<string, Subscription>();
  private readonly statusListeners = new Set<StatusListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private reconnectDelay: number;
  private heartbeatTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(options: WebSocketPortOptions = {}) {
    this.url = options.url ?? `ws://${options.host ?? 'localhost'}:${options.port ?? DEFAULT_LUNA_PORT}`;
    const Socket = options.WebSocket ?? (globalThis as { WebSocket?: SocketConstructor }).WebSocket;
    if (!Socket) throw new UAError('no_websocket', 'No WebSocket implementation available; pass one in options.WebSocket');
    this.Socket = Socket;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
    this.reconnectEnabled = options.reconnect ?? true;
    this.reconnectMinMs = options.reconnectMinMs ?? 250;
    this.reconnectMaxMs = options.reconnectMaxMs ?? 10_000;
    this.reconnectDelay = this.reconnectMinMs;
    this.heartbeatEnabled = options.heartbeat ?? true;
    this.idKey = options.idKey ?? 'ua_id';
    this.onUnhandled = options.onUnhandled;
    this.log = options.log ?? consoleLog;
  }

  get connected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Connect. Resolves once the socket is open. Rejects with {@link NotRunning} if the first
   * attempt fails, or has not opened within `requestTimeoutMs`; later drops are handled by
   * reconnect instead.
   */
  open(): Promise<void> {
    if (this.closed) return Promise.reject(new ConnectionLost());
    if (this.status === 'connected') return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const socket = new this.Socket(this.url);
      this.socket = socket;
      this.setStatus('connecting');
      const openTimer = setTimeout(() => {
        // A host that drops the handshake silently would otherwise hold this for the OS's TCP timeout.
        if (this.socket !== socket || settled) return;
        this.log('warn', `no answer from ${this.url} within ${this.requestTimeoutMs} ms`, { url: this.url, timeoutMs: this.requestTimeoutMs });
        dropped();
      }, this.requestTimeoutMs);
      unref(openTimer);
      // Browsers follow `error` with `close`, but Node 22's built-in WebSocket fires only
      // `error` on a refused connection and stays CONNECTING (fact 101). Either ends the attempt.
      const dropped = () => {
        clearTimeout(openTimer);
        if (this.socket !== socket) return;
        this.socket = undefined;
        socket.onopen = socket.onerror = socket.onclose = socket.onmessage = null;
        try {
          if (socket.readyState !== 3) socket.close();
        } catch {
          /* already gone */
        }
        this.stopHeartbeat();
        this.failPending();
        if (!settled) {
          settled = true;
          this.setStatus('disconnected');
          if (!this.everConnected) {
            reject(new NotRunning(this.url));
            return;
          }
        } else if (!this.closed) {
          this.setStatus('disconnected');
        }
        this.scheduleReconnect();
      };
      socket.onopen = () => {
        clearTimeout(openTimer);
        settled = true;
        this.everConnected = true;
        this.reconnectDelay = this.reconnectMinMs;
        this.setStatus('connected');
        this.resubscribeAll();
        this.startHeartbeat();
        resolve();
      };
      socket.onmessage = (ev) => this.handleFrame(ev.data);
      socket.onerror = dropped;
      socket.onclose = dropped;
    });
  }

  async get(path: string, options?: GetOptions): Promise<unknown> {
    return this.request('get', path, getOptionsToParams(options), undefined, options?.ignoreResponse === true);
  }

  async set(path: string, data: unknown, params?: Record<string, string>): Promise<void> {
    await this.request('set', path, { ...params }, data, false);
  }

  async post(path: string, data?: unknown): Promise<unknown> {
    return this.request('post', path, {}, data, false);
  }

  subscribe(path: string, handler: EventHandler, options?: SubscribeOptions): Unsubscribe {
    const recursive = options?.recursive === true;
    const key = `${path}|${recursive ? 1 : 0}`;
    let sub = this.subscriptions.get(key);
    if (!sub) {
      sub = { path, recursive, handlers: new Set() };
      this.subscriptions.set(key, sub);
      if (this.connected) this.sendSubscribe(sub);
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
        if (this.connected) this.fireAndForget('unsubscribe', current.path, {});
      }
    };
  }

  onStatus(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.stopHeartbeat();
    const socket = this.socket;
    this.socket = undefined;
    this.failPending();
    this.setStatus('closed');
    if (socket) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 300);
        unref(timer);
        socket.onclose = () => {
          clearTimeout(timer);
          resolve();
        };
        try {
          socket.close();
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    }
  }

  // -----------------------------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------------------------

  private request(verb: Verb, path: string, params: Record<string, string>, data: unknown, ignoreResponse: boolean): Promise<unknown> {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN || !this.connected) {
      return Promise.reject(new ConnectionLost(verb, path));
    }
    if (ignoreResponse) {
      socket.send(encodeRequest(verb, path, params, data));
      return Promise.resolve(undefined);
    }
    const id = `r${this.nextId++}`;
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.log('warn', `${verb} ${path} timed out`, { verb, path, ms: this.requestTimeoutMs });
        reject(new RequestTimeout(verb, path, this.requestTimeoutMs));
      }, this.requestTimeoutMs);
      unref(timer);
      this.pending.set(id, { verb, path, resolve, reject, timer });
      socket.send(encodeRequest(verb, path, { ...params, [this.idKey]: id }, data));
    });
  }

  private fireAndForget(verb: Verb, path: string, params: Record<string, string>): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN) return;
    socket.send(encodeRequest(verb, appendParams(path, { ignore_response: '1' }), params));
  }

  private sendSubscribe(sub: Subscription): void {
    this.fireAndForget('subscribe', sub.path, sub.recursive ? { recursive: '1' } : {});
  }

  private resubscribeAll(): void {
    for (const sub of this.subscriptions.values()) this.sendSubscribe(sub);
  }

  private handleFrame(data: unknown): void {
    if (typeof data !== 'string') return;
    const message = decodeMessage(data);
    if (!message) return;
    for (const entry of expandMulti(message)) {
      const id = correlationId(entry, this.idKey);
      if (id !== undefined) {
        const pending = this.pending.get(id);
        if (!pending) continue;
        this.pending.delete(id);
        clearTimeout(pending.timer);
        if (entry.error !== undefined) {
          pending.reject(new UAError(entry.error, `${pending.verb} ${pending.path}: ${entry.error}`, { cmd: pending.verb, path: pending.path }));
        } else {
          pending.resolve(entry.data);
        }
        continue;
      }
      if (entry.parameters && 'ignore_response' in entry.parameters) continue;
      const event = toEvent(entry);
      let delivered = false;
      for (const sub of this.subscriptions.values()) {
        if (!eventMatches(sub.path, event.path)) continue;
        delivered = true;
        for (const handler of sub.handlers) {
          try {
            handler(event);
          } catch (err) {
            this.log('error', 'subscription handler threw', { path: event.path, error: err });
          }
        }
      }
      if (!delivered) this.onUnhandled?.(entry);
    }
  }

  private failPending(): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      this.pending.delete(id);
      p.reject(new ConnectionLost(p.verb, p.path));
    }
  }

  private scheduleReconnect(): void {
    if (this.closed || !this.reconnectEnabled || !this.everConnected || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.reconnectMaxMs);
    this.log('info', `reconnecting to ${this.url} in ${delay} ms`, { url: this.url, delayMs: delay });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.closed) return;
      this.open().catch(() => {
        /* onclose schedules the next attempt */
      });
    }, delay);
    unref(this.reconnectTimer);
  }

  private startHeartbeat(): void {
    if (!this.heartbeatEnabled) return;
    this.get('/status/timeout_ms', { flatvalue: true })
      .then((data) => {
        const timeoutMs = Number(propertyValue(data));
        if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || this.closed || !this.connected) return;
        const interval = Math.max(1000, Math.floor(timeoutMs / 2));
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
          if (!this.connected) return;
          this.fireAndForget('get', '/ping', {});
        }, interval);
        unref(this.heartbeatTimer as unknown as ReturnType<typeof setTimeout>);
      })
      .catch(() => {
        /* engines without /status/timeout_ms just have no heartbeat */
      });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
  }

  private setStatus(status: PortStatus, detail?: string): void {
    if (this.status === status) return;
    this.status = status;
    this.log(status === 'disconnected' && this.everConnected && !this.closed ? 'warn' : 'debug', `${this.url} ${status}`, { url: this.url, status });
    for (const listener of this.statusListeners) {
      try {
        listener(status, detail);
      } catch (err) {
        this.log('error', 'status listener threw', { status, error: err });
      }
    }
  }
}
