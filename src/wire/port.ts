/**
 * The transport seam. A Port speaks UANet verbs on paths and holds no model state.
 *
 * Three implementations exist: {@link WebSocketPort} (native LUNA),
 * `WasmPort` (the in-process WebAssembly engine, Phase 4) and {@link MockPort} (tests).
 * Everything above a Port sees the same normalised {@link Event} stream, so the Store and
 * the domain objects never know which engine they are talking to.
 */

/** UANet verbs. */
export type Verb = 'get' | 'set' | 'post' | 'subscribe' | 'unsubscribe';

/** Connection state as reported by {@link Port.onStatus}. */
export type PortStatus = 'connecting' | 'connected' | 'disconnected' | 'closed';

/** Structural change carried by an {@link Event}. Absent for a property value change. */
export type Operation = 'added' | 'removed';

/** A message as it appears on the wire (JSON dialect), before normalisation. */
export interface WireMessage {
  path: string;
  data?: unknown;
  operation?: Operation;
  parameters?: Record<string, unknown>;
  error?: string;
  /** Present on some server messages (`update`); ignored by the client. */
  cmd?: string;
}

/**
 * One change pushed by the engine, normalised: a trailing `/value` is stripped, multi-updates
 * are already expanded, and `operation` marks a child added or removed at `path`.
 *
 * @example
 * luna.raw.subscribe('/sessions/abc/tracks/t1', (e) => {
 *   // e.path === '/sessions/abc/tracks/t1/name', e.data === 'Vocal'
 * });
 */
export interface Event {
  path: string;
  data: unknown;
  operation?: Operation;
}

export type EventHandler = (event: Event) => void;
export type Unsubscribe = () => void;
export type StatusListener = (status: PortStatus, detail?: string) => void;

/**
 * Query parameters accepted by `get`, in camelCase. Booleans become `1`/`0` on the wire.
 * See `hbsystem/networking/docs/operations.md`.
 */
export interface GetOptions {
  /** Include properties (default on). */
  properties?: boolean;
  /** Include children (default on). */
  children?: boolean;
  /** Include commands (default on). */
  commands?: boolean;
  /** Collapse `{ value: X }` to `X` for every property. */
  flatvalue?: boolean;
  /** Include property metadata. */
  propinfo?: boolean;
  /** Include command parameter schemas. */
  cmdparams?: boolean;
  /** Only these property names; an array goes on the wire as a comma-separated list. */
  propfilter?: string | string[];
  /** Whole subtree. */
  recursive?: boolean;
  /** Subtree depth. */
  levels?: number;
  /** Include hidden objects. */
  hidden?: boolean;
  offset?: number;
  limit?: number;
  includedChildren?: string;
  excludedChildren?: string;
  /** Do not send a reply; the returned promise resolves to `undefined` immediately after send. */
  ignoreResponse?: boolean;
}

export interface SubscribeOptions {
  /** Receive changes for the whole subtree, not just this node and its direct properties. */
  recursive?: boolean;
}

/**
 * A connection to one engine.
 *
 * @example
 * const port = new Luna.WebSocketPort({ port: 4718 });
 * await port.open();
 * const sessions = await port.get('/sessions', { properties: false, commands: false });
 * port.subscribe('/sessions', (e) => console.log(e.path, e.operation ?? e.data), { recursive: true });
 * await port.close();
 */
export interface Port {
  /** True between `connected` and the next `disconnected`/`closed`. */
  readonly connected: boolean;
  /** Read a node or property. Resolves to the reply `data`. */
  get(path: string, options?: GetOptions): Promise<unknown>;
  /** Write a property. Resolves when the engine acknowledges. */
  set(path: string, data: unknown): Promise<void>;
  /** Invoke a command. Resolves to the reply `data` (often `null`). */
  post(path: string, data?: unknown): Promise<unknown>;
  /**
   * Receive pushes at or below `path`. Several handlers on one path share one wire subscription;
   * the wire `unsubscribe` is sent when the last handler is removed.
   */
  subscribe(path: string, handler: EventHandler, options?: SubscribeOptions): Unsubscribe;
  onStatus(listener: StatusListener): Unsubscribe;
  /** Disconnect and fail any in-flight requests with {@link ConnectionLost}. Idempotent. */
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------------------------
// Helpers shared by every Port implementation.
// ---------------------------------------------------------------------------------------------

const WIRE_KEYS: Record<keyof GetOptions, string> = {
  properties: 'properties',
  children: 'children',
  commands: 'commands',
  flatvalue: 'flatvalue',
  propinfo: 'propinfo',
  cmdparams: 'cmdparams',
  propfilter: 'propfilter',
  recursive: 'recursive',
  levels: 'levels',
  hidden: 'hidden',
  offset: 'offset',
  limit: 'limit',
  includedChildren: 'included_children',
  excludedChildren: 'excluded_children',
  ignoreResponse: 'ignore_response',
};

/** Convert {@link GetOptions} to wire query parameters. */
export function getOptionsToParams(options: GetOptions | undefined): Record<string, string> {
  const params: Record<string, string> = {};
  if (!options) return params;
  for (const key of Object.keys(options) as (keyof GetOptions)[]) {
    const value = options[key];
    if (value === undefined) continue;
    params[WIRE_KEYS[key]] = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  }
  return params;
}

/** Property updates arrive on `<node>/<prop>/value`; the model addresses `<node>/<prop>`. */
export function stripValueSuffix(path: string): string {
  return path.endsWith('/value') ? path.slice(0, -'/value'.length) : path;
}

/** Turn a decoded wire message into the normalised event the Store consumes. */
export function toEvent(message: WireMessage): Event {
  const event: Event = { path: stripValueSuffix(message.path), data: message.data };
  if (message.operation) event.operation = message.operation;
  return event;
}

/**
 * True when an event at `eventPath` belongs to a subscription on `subPath`.
 * Prefix matching: the engine only pushes what was subscribed, so a wider subscription on the
 * same connection is the only way a handler sees something deeper than it asked for.
 */
export function eventMatches(subPath: string, eventPath: string): boolean {
  if (subPath === '/' || subPath === '') return true;
  return eventPath === subPath || eventPath.startsWith(subPath + '/');
}

/**
 * Unwrap a property reply. A `get` on a property answers `{ value: X }` unless `flatvalue` was
 * requested, in which case it answers `X` directly.
 */
export function propertyValue(data: unknown): unknown {
  if (data !== null && typeof data === 'object' && !Array.isArray(data) && 'value' in data) {
    const keys = Object.keys(data);
    if (keys.length === 1 || keys.every((k) => k === 'value' || k === 'default' || k === 'type' || k === 'readonly')) {
      return (data as { value: unknown }).value;
    }
  }
  return data;
}

/** Split `<node>/<prop>` into its node path and property name. */
export function splitPath(path: string): { node: string; name: string } {
  const at = path.lastIndexOf('/');
  if (at <= 0) return { node: '/', name: path.slice(at + 1) };
  return { node: path.slice(0, at), name: path.slice(at + 1) };
}

/** Join path segments with single slashes. */
export function joinPath(...segments: string[]): string {
  const parts: string[] = [];
  for (const segment of segments) {
    for (const piece of segment.split('/')) {
      if (piece.length > 0) parts.push(piece);
    }
  }
  return '/' + parts.join('/');
}

/** Severity of a {@link LogFn} message. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Where a port reports what it does: status changes, reconnect attempts, timeouts, and
 * listeners that threw. The default sends `warn` and `error` to the console.
 *
 * @example
 * const luna = await Luna.connect({ log: (level, message, detail) => console.log(`[${level}] ${message}`, detail ?? '') });
 */
export type LogFn = (level: LogLevel, message: string, detail?: Record<string, unknown>) => void;

/** The default {@link LogFn}: warnings and errors to the console, the rest dropped. */
export const consoleLog: LogFn = (level, message, detail) => {
  if (level === 'error') console.error(`[Luna] ${message}`, detail ?? '');
  else if (level === 'warn') console.warn(`[Luna] ${message}`, detail ?? '');
};
