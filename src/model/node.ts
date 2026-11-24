/**
 * Base for every domain object. A Node is a view over one engine path: its properties are
 * {@link Prop}s backed by Store cells, its commands are `post`s on child paths.
 *
 * Nodes hold no state of their own; two Nodes on the same path see the same cells.
 */
import type { Client } from '../client/client';
import { Cell, writable, type Prop, type WritableProp } from '../store/prop';
import { Disposed } from '../wire/errors';
import type { GetOptions, Port, Unsubscribe } from '../wire/port';

export abstract class Node {
  private loading: Promise<void> | undefined;
  private isDisposed = false;
  private disposeListeners: (() => void)[] | undefined;

  /** @internal */
  constructor(
    readonly client: Client,
    /** Engine path of this object, for example `/sessions/<uid>/tracks/<id>`. */
    readonly path: string,
  ) {}

  /** Last path segment: the uid or name the engine addresses this node by. */
  get id(): string {
    return this.path.slice(this.path.lastIndexOf('/') + 1);
  }

  /**
   * Fetch this node's properties (and child names) once. Later calls return the same promise.
   * Pushes keep the cells current afterwards as long as an ancestor is watched.
   */
  load(options?: GetOptions): Promise<void> {
    if (!this.loading) {
      this.loading = this.client.store.load(this.path, options).then(() => undefined);
    }
    return this.loading;
  }

  /** Fetch again, ignoring the once-only cache of {@link load}. */
  reload(options?: GetOptions): Promise<void> {
    this.loading = this.client.store.load(this.path, options).then(() => undefined);
    return this.loading;
  }

  /**
   * Subscribe to this node so its props follow engine pushes, and load it. Nodes under a
   * session that called `ready()` are already covered; use this for nodes outside a session
   * (for example `luna.gui.main`, `luna.preferences`). Call `release` when done.
   */
  watch(options: { recursive?: boolean } = {}): { ready: Promise<void>; release: Unsubscribe } {
    const w = this.client.store.watch(this.path, { ...(options.recursive !== undefined ? { recursive: options.recursive } : {}), load: { flatvalue: true, commands: false } });
    this.loading ??= w.ready;
    return w;
  }

  /**
   * Whether LUNA would take `command` on this node now (`<command>/enabled`, fact 234), as
   * LUNA greys out its own menu items: `false` for `paste` with nothing copied, for example.
   * Follows LUNA from the first call until this node is disposed. `undefined` until read, and
   * for a command that publishes no enabled state (most are always enabled).
   *
   * @example
   * const canPaste = session.context.commandEnabled('paste');
   * canPaste.onChange(() => (pasteButton.disabled = canPaste.value === false));
   */
  commandEnabled(command: string): Prop<boolean> {
    const path = this.commandPath(command);
    if (!this.commandWatches.has(path)) {
      const w = this.client.store.watch(path, { load: { flatvalue: true, commands: false, children: false } });
      w.ready.catch(() => undefined);
      this.commandWatches.set(path, w.release);
      if (this.commandWatches.size === 1) this.onDispose(() => { for (const release of this.commandWatches.values()) release(); this.commandWatches.clear(); });
    }
    return this.client.store.cell<boolean>(path, 'enabled');
  }

  private readonly commandWatches = new Map<string, Unsubscribe>();

  /** Where `command`'s node is: under this node. */
  protected commandPath(command: string): string {
    return `${this.path}/${command}`;
  }

  /** Read-only property view. `value` is `undefined` until loaded or pushed. */
  protected prop<T>(name: string): Prop<T> {
    return this.client.store.cell<T>(this.path, name);
  }

  /**
   * Any property of this node by its engine name, for properties the typed surface does not
   * cover yet. Prefer a typed member when one exists.
   *
   * @example
   * track.property<number>('latency_override').value
   * await track.property<string>('comments').set('take 3')
   */
  property<T = unknown>(name: string): WritableProp<T> {
    return this.writableProp<T>(name);
  }

  /** Invoke any command on this node by name. Prefer a typed method when one exists. */
  command<R = unknown>(name: string, payload?: unknown): Promise<R> {
    return this.post<R>(name, payload);
  }

  /**
   * Writable property view; `set` is optimistic with rollback, and refuses once disposed.
   * `toWire` gives the form sent to the engine when it differs from the value the view holds.
   */
  protected writableProp<T>(name: string, toWire?: (value: T) => unknown): WritableProp<T> {
    const cell = this.client.store.cell<T>(this.path, name);
    return writable(cell, (v) => (this.isDisposed ? Promise.reject(new Disposed(this.constructor.name, this.path)) : this.client.store.set(this.path, name, v, toWire ? toWire(v) : v)));
  }

  /** The cell holding this node's child names. */
  protected childNames(): Cell<string[]> {
    return this.client.store.children(this.path);
  }

  /** Invoke a command on this node. Refuses once disposed. */
  protected post<R = unknown>(command: string, payload?: unknown): Promise<R> {
    if (this.isDisposed) return Promise.reject(new Disposed(this.constructor.name, this.path));
    return this.wire.post(`${this.path}/${command}`, payload) as Promise<R>;
  }

  /**
   * `client.raw` for this object's own commands, refusing with {@link Disposed} once the
   * object is gone. Domain methods post through this rather than `client.raw`.
   */
  protected get wire(): Pick<Port, 'get' | 'set' | 'post'> {
    const raw = this.client.raw;
    const check = <T>(run: () => Promise<T>): Promise<T> => (this.isDisposed ? Promise.reject(new Disposed(this.constructor.name, this.path)) : run());
    return {
      get: (path, options) => check(() => raw.get(path, options)),
      set: (path, data, params) => check(() => (params ? raw.set(path, data, params) : raw.set(path, data))),
      post: (path, data) => check(() => raw.post(path, data)),
    };
  }

  /** Throw {@link Disposed} if this object is gone. Commands that post elsewhere call it first. */
  protected assertLive(): void {
    if (this.isDisposed) throw new Disposed(this.constructor.name, this.path);
  }

  /**
   * True once the engine removed this node or its owner was disposed. A disposed object's
   * props stop updating and its commands reject with {@link Disposed}.
   */
  get disposed(): boolean {
    return this.isDisposed;
  }

  /**
   * Called once when this object is disposed. Returns an unsubscribe.
   *
   * @example
   * track.onDispose(() => row.remove());
   */
  onDispose(listener: () => void): Unsubscribe {
    if (this.isDisposed) {
      listener();
      return () => {};
    }
    (this.disposeListeners ??= []).push(listener);
    return () => {
      this.disposeListeners = this.disposeListeners?.filter((l) => l !== listener);
    };
  }

  /** @internal Called when the engine removes this node or its owner goes. Idempotent. */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.release();
    const listeners = this.disposeListeners ?? [];
    this.disposeListeners = undefined;
    for (const l of listeners) {
      try {
        l();
      } catch (err) {
        console.error('[Luna] onDispose listener threw', err);
      }
    }
  }

  /** Release what this object owns. Subclasses override this, not {@link dispose}. */
  protected release(): void {
    /* nothing by default */
  }
}
