/**
 * A path-keyed mirror of the engine tree.
 *
 * - One {@link Cell} per `<node>/<property>` and one per node's child list.
 * - `load` fills cells from a `get`; `watch` subscribes and keeps them current.
 * - Subscriptions are refcounted by path so two views cost one wire subscription.
 * - `set` is optimistic: the cell moves now; if the engine rejects, the previous value is
 *   restored unless something newer has landed since.
 * - After a drop, every watched path is reloaded because pushes during the outage are gone.
 *
 * The Store is transport-agnostic: it only uses {@link Port}.
 */
import { propertyValue, splitPath, type Event, type GetOptions, type Port, type Unsubscribe } from '../wire/port';
import { Cell, Scheduler, nextVersion } from './prop';

interface Watch {
  path: string;
  recursive: boolean;
  refs: number;
  unsubscribe: Unsubscribe;
  ready: Promise<void>;
}

interface NodeReply {
  properties?: Record<string, unknown>;
  children?: { path?: string; [k: string]: unknown }[];
  commands?: unknown;
}

function isNodeReply(data: unknown): data is NodeReply {
  return data !== null && typeof data === 'object' && !Array.isArray(data) && ('properties' in data || 'children' in data || 'commands' in data);
}

export class Store {
  readonly scheduler: Scheduler;
  private readonly cells = new Map<string, Cell<unknown>>();
  private readonly childCells = new Map<string, Cell<string[]>>();
  private readonly watches = new Map<string, Watch>();
  private readonly loaded = new Map<string, GetOptions | undefined>();
  /** Nodes that have had at least one property written, by a read or a push. */
  private readonly propertied = new Set<string>();
  /** Reads sent and not yet answered, for {@link readsSettled}. */
  private readonly inflight = new Set<Promise<unknown>>();
  private readonly eventListeners = new Set<(event: Event) => void>();
  /** The last value the engine confirmed for each property cell, for rolling back a refused write. */
  private readonly confirmed = new Map<string, unknown>();
  private readonly statusUnsub: Unsubscribe;
  private wasDisconnected = false;
  private closed = false;

  constructor(readonly port: Port, scheduler = new Scheduler()) {
    this.scheduler = scheduler;
    this.statusUnsub = port.onStatus((status) => {
      if (status === 'disconnected') this.wasDisconnected = true;
      if (status === 'connected' && this.wasDisconnected) {
        this.wasDisconnected = false;
        void this.reloadAll();
      }
    });
  }

  /** The cell for `<node>/<property>`. Created on demand, `undefined` until loaded or pushed. */
  cell<T = unknown>(nodePath: string, property: string): Cell<T> {
    const key = `${nodePath}/${property}`;
    let cell = this.cells.get(key);
    if (!cell) {
      cell = new Cell<unknown>(this.scheduler);
      this.cells.set(key, cell);
    }
    return cell as Cell<T>;
  }

  /** The cell holding a node's child names, in engine order. */
  children(nodePath: string): Cell<string[]> {
    let cell = this.childCells.get(nodePath);
    if (!cell) {
      cell = new Cell<string[]>(this.scheduler);
      this.childCells.set(nodePath, cell);
    }
    return cell;
  }

  /** True once `load` or a push has given this node a child list. */
  knowsNode(nodePath: string): boolean {
    return this.childCells.has(nodePath);
  }

  /**
   * `get` a path and apply the reply to cells. Resolves to the raw reply. A property path fills
   * its own cell; a node path fills its properties and children, recursing into nested children
   * when the reply carries them (`levels`/`recursive`).
   */
  load(path: string, options?: GetOptions): Promise<unknown> {
    const read = this.read(path, options);
    this.inflight.add(read);
    const done = (): void => {
      this.inflight.delete(read);
    };
    read.then(done, done);
    return read;
  }

  /**
   * Resolve once no read is in flight, including reads started while waiting (a member the
   * engine just added is fetched on its own, and that fetch can start another). Never
   * rejects; a failed read counts as finished.
   *
   * @example
   * await luna.store.readsSettled();
   */
  async readsSettled(): Promise<void> {
    for (let round = 0; this.inflight.size > 0 && round < 16; round++) {
      await Promise.allSettled([...this.inflight]);
    }
  }

  /** How many reads are in flight. */
  get pendingReads(): number {
    return this.inflight.size;
  }

  /** True once any property of `nodePath` has been written by a read or a push. */
  hasProperties(nodePath: string): boolean {
    return this.propertied.has(nodePath);
  }

  private async read(path: string, options?: GetOptions): Promise<unknown> {
    const opts: GetOptions = { flatvalue: true, commands: false, ...options };
    // Stamp the reply with the moment the read was sent: anything that lands while it is in
    // flight is newer and must survive it.
    const version = nextVersion();
    const data = await this.port.get(path, opts);
    this.loaded.set(path, options);
    // How deep the reply's child lists are complete. Below that depth a child appears as a bare
    // name, and a missing `children` section says nothing about its children (fact 18).
    const depth = opts.children === false ? 0 : opts.recursive ? Infinity : (opts.levels ?? 1);
    this.apply(path, data, version, depth);
    return data;
  }

  /**
   * Subscribe to `path` and load it. Refcounted: the wire subscription is shared and released
   * when the last watcher calls `release`.
   */
  watch(path: string, options: { recursive?: boolean; load?: GetOptions | false } = {}): { ready: Promise<void>; release: Unsubscribe } {
    // A closed Store subscribes to nothing: a subscription made now would never be released.
    if (this.closed) return { ready: Promise.resolve(), release: () => {} };
    const recursive = options.recursive === true;
    const key = `${path}|${recursive ? 1 : 0}`;
    let watch = this.watches.get(key);
    if (!watch) {
      const subOptions = recursive ? { recursive: true } : {};
      const off = this.port.subscribe(path, (e) => this.onEvent(e), subOptions);
      let subscribed = true;
      const unsubscribe = () => {
        if (!subscribed) return;
        subscribed = false;
        off();
      };
      const ready =
        options.load === false
          ? Promise.resolve()
          : this.load(path, recursive ? { recursive: true, ...options.load } : options.load).then(() => undefined);
      const created: Watch = { path, recursive, refs: 0, unsubscribe, ready };
      // A failed first load must not be cached: drop the watch so the next `watch` retries.
      ready.catch(() => {
        if (this.watches.get(key) !== created) return;
        this.watches.delete(key);
        created.unsubscribe();
      });
      watch = created;
      this.watches.set(key, watch);
    }
    watch.refs++;
    let released = false;
    const w = watch;
    return {
      ready: w.ready,
      release: () => {
        if (released) return;
        released = true;
        w.refs--;
        if (w.refs === 0) {
          w.unsubscribe();
          if (this.watches.get(key) === w) {
            this.watches.delete(key);
            this.loaded.delete(path);
          }
        }
      },
    };
  }

  /**
   * Optimistic write. The cell takes `value` immediately with a fresh version; the engine's
   * acknowledgement resolves the promise. On rejection the previous value is restored if the
   * cell still holds our write, then the error is rethrown.
   */
  async set(nodePath: string, property: string, value: unknown): Promise<void> {
    const key = `${nodePath}/${property}`;
    const cell = this.cell(nodePath, property);
    // Roll back to what the engine last confirmed, not to whatever the cell held: that may
    // be another optimistic write still in flight, which could itself be refused.
    const fallback = this.confirmed.has(key) ? this.confirmed.get(key) : cell.value;
    const ours = nextVersion();
    cell.update(value, ours);
    try {
      await this.port.set(key, value);
      // Native LUNA does not echo a write to its writer (fact 6), so the answer is the confirmation.
      if (cell.version === ours) this.confirmed.set(key, value);
    } catch (err) {
      if (cell.version === ours) cell.update(fallback as unknown);
      throw err;
    }
  }

  /** Raw event tap, called before cells are written. For delta-stream properties. */
  onEvent(listener: (event: Event) => void): Unsubscribe;
  /** @internal */
  onEvent(event: Event): void;
  onEvent(arg: Event | ((event: Event) => void)): Unsubscribe | void {
    if (typeof arg === 'function') {
      this.eventListeners.add(arg);
      return () => {
        this.eventListeners.delete(arg);
      };
    }
    for (const l of this.eventListeners) l(arg);
    this.applyEvent(arg);
  }

  /** Drop a subtree from the mirror (after a `removed`, or when a view is disposed). */
  forget(nodePath: string): void {
    for (const key of [...this.cells.keys()]) {
      if (key.startsWith(nodePath + '/')) this.cells.delete(key);
    }
    for (const key of [...this.confirmed.keys()]) {
      if (key.startsWith(nodePath + '/')) this.confirmed.delete(key);
    }
    for (const key of [...this.childCells.keys()]) {
      if (key === nodePath || key.startsWith(nodePath + '/')) this.childCells.delete(key);
    }
    for (const key of [...this.loaded.keys()]) {
      if (key === nodePath || key.startsWith(nodePath + '/')) this.loaded.delete(key);
    }
    for (const key of [...this.propertied]) {
      if (key === nodePath || key.startsWith(nodePath + '/')) this.propertied.delete(key);
    }
  }

  /** Re-`get` every loaded path. Called automatically after a reconnect. */
  async reloadAll(): Promise<void> {
    const entries = [...this.loaded.entries()];
    await Promise.all(
      entries.map(([path, options]) =>
        this.load(path, options).catch(() => {
          /* the path may be gone; its next push will say so */
        }),
      ),
    );
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.statusUnsub();
    for (const w of this.watches.values()) w.unsubscribe();
    this.watches.clear();
    this.loaded.clear();
  }

  // -----------------------------------------------------------------------------------------

  private applyEvent(event: Event): void {
    if (event.operation) {
      const { node: parent, name } = splitPath(event.path);
      const list = this.children(parent);
      const current = list.value ?? [];
      if (event.operation === 'added') {
        if (!current.includes(name)) list.update([...current, name]);
        // Native LUNA sends no data with an add; the wasm engine sends the node's properties
        // (fact 13). Apply them when present so the new node is usable at once.
        if (isNodeReply(event.data)) this.apply(event.path, event.data, nextVersion(), 0);
        else if (!this.knowsNode(event.path)) this.children(event.path).update([]);
      } else {
        if (current.includes(name)) list.update(current.filter((c) => c !== name));
        this.forget(event.path);
      }
      return;
    }
    const { node, name } = splitPath(event.path);
    this.write(node, name, event.data, nextVersion());
  }

  /** Write a value the engine reported, and remember it as confirmed if it took. */
  private write(node: string, name: string, value: unknown, version: number): void {
    const cell = this.cell(node, name);
    this.propertied.add(node);
    cell.update(value, version);
    if (cell.version === version) this.confirmed.set(`${node}/${name}`, value);
  }

  /**
   * Apply a `get` reply. `depth` is how many levels below `path` the reply lists children
   * completely: there a missing `children` section means "no children" (fact 18); deeper,
   * a child is a bare name and says nothing about its own children.
   */
  private apply(path: string, data: unknown, version: number, depth = 1): void {
    // Fact 18: the engine omits empty sections, so a node with nothing in it (or a missing
    // path, fact 10) answers a bare `{}`. Treat that as an empty node, not a property value.
    if (data !== null && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
      if (depth >= 1 || !this.knowsNode(path)) this.children(path).update([], version);
      return;
    }
    if (isNodeReply(data)) {
      if (data.properties) {
        for (const [name, raw] of Object.entries(data.properties)) this.write(path, name, propertyValue(raw), version);
      }
      if (!Array.isArray(data.children)) {
        // Section omitted: no children (fact 18), when the read asked this deep.
        if (depth >= 1 || !this.knowsNode(path)) this.children(path).update([], version);
      } else {
        const names: string[] = [];
        for (const child of data.children) {
          const name = typeof child.path === 'string' ? child.path.split('/').filter(Boolean).pop() : undefined;
          if (!name) continue;
          names.push(name);
          const childPath = `${path === '/' ? '' : path}/${name}`;
          if (isNodeReply(child)) this.apply(childPath, child, version, depth - 1);
          else if (depth - 1 >= 1) this.children(childPath).update([], version);
          else if (!this.knowsNode(childPath)) this.children(childPath).update([], version);
        }
        this.children(path).update(names, version);
      }
      return;
    }
    // A property get: `<node>/<prop>` answered with the value.
    const { node, name } = splitPath(path);
    this.write(node, name, propertyValue(data), version);
  }
}
