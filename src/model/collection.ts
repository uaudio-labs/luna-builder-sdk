/**
 * A live list of child Nodes under one parent path. Members are created from the parent's
 * child-name cell and disposed when the engine removes them.
 *
 * @example
 * session.tracks.items.map((t) => t.name.value);
 * session.tracks.byId(uid);
 * session.tracks.onChange(() => render());
 */
import type { Client } from '../client/client';
import type { List } from '../store/prop';
import type { GetOptions, Unsubscribe } from '../wire/port';
import type { Node } from './node';

export class Collection<T extends Node> implements List<T> {
  private members = new Map<string, T>();
  private ordered: readonly T[] = [];
  private loading: Promise<void> | undefined;
  private readonly listeners = new Set<() => void>();
  private namesUnsub: Unsubscribe | undefined;
  private syncedVersion = -1;
  /** Member paths already fetched, so a new child is loaded once and only once. */
  private readonly fetched = new Set<string>();

  /** @internal */
  constructor(
    readonly client: Client,
    /** Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. */
    readonly path: string,
    private readonly create: (childPath: string, name: string) => T,
    private readonly loadOptions: GetOptions = { levels: 2 },
  ) {
    this.sync();
    // Follow the child list from the start, not only while someone listens, so a member the
    // engine removed is disposed when it goes rather than on the next read.
    this.namesUnsub = this.client.store.children(this.path).onChange(() => {
      this.sync();
      for (const l of [...this.listeners]) l();
    });
  }

  /** Members in engine order. Empty until loaded or pushed. */
  get items(): readonly T[] {
    this.ensureSynced();
    return this.ordered;
  }

  get value(): readonly T[] {
    return this.items;
  }

  byId(id: string): T | undefined {
    this.ensureSynced();
    return this.members.get(id);
  }

  /** Fetch the member list (and, with the default `levels: 2`, each member's properties). */
  load(): Promise<void> {
    if (!this.loading) {
      this.loading = this.client.store.load(this.path, this.loadOptions).then(() => undefined);
    }
    return this.loading;
  }

  /**
   * Fetch the member list again, ignoring the once-only cache of {@link load}, and re-sync
   * the members. Use it after an edit whose push LUNA held back, or inside a transaction.
   *
   * @example
   * await session.tracks.reload();
   */
  async reload(): Promise<void> {
    this.loading = this.client.store.load(this.path, this.loadOptions).then(() => undefined);
    await this.loading;
    this.sync();
  }

  /**
   * Subscribe to this folder on the wire and load it, so members and their properties
   * follow engine pushes. Collections under a session that called `ready()` are already
   * covered; use this for folders outside one, such as `/renders` or `/jobs` (fact 34).
   * Refcounted through the Store; call `release` when done.
   *
   * @example
   * const w = luna.renders.watch();
   * await w.ready;
   * luna.renders.onChange(() => draw(luna.renders.items));
   */
  watch(options: { recursive?: boolean } = {}): { ready: Promise<void>; release: Unsubscribe } {
    const w = this.client.store.watch(this.path, {
      ...(options.recursive !== undefined ? { recursive: options.recursive } : {}),
      load: this.loadOptions,
    });
    this.loading ??= w.ready;
    return { ready: w.ready.then(() => { this.sync(); }), release: w.release };
  }

  /** Called when members are added or removed. */
  onChange(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** @internal */
  dispose(): void {
    this.namesUnsub?.();
    this.namesUnsub = undefined;
    this.listeners.clear();
    for (const m of this.members.values()) m.dispose();
    this.members.clear();
    this.ordered = [];
  }

  /** Rebuild members if the child-name cell moved since the last sync. */
  private ensureSynced(): void {
    if (this.client.store.children(this.path).version !== this.syncedVersion) this.sync();
  }

  /** Rebuild `members` from the child-name cell; keeps existing instances, disposes removed. */
  private sync(): void {
    const cell = this.client.store.children(this.path);
    this.syncedVersion = cell.version;
    const names = cell.value ?? [];
    const next = new Map<string, T>();
    for (const name of names) {
      const existing = this.members.get(name);
      next.set(name, existing ?? this.create(`${this.path}/${name}`, name));
    }
    for (const [name, member] of this.members) {
      if (!next.has(name)) {
        member.dispose();
        this.fetched.delete(`${this.path}/${name}`);
      }
    }
    // A child announced by an `added` push carries no properties on native LUNA (fact 7),
    // so a member that appears after the folder was read has nothing in its cells. Fetch
    // it once; the load notifies through the same cells when it lands.
    if (this.loading) {
      for (const [name] of next) {
        const path = `${this.path}/${name}`;
        if (this.members.has(name) || this.fetched.has(path)) continue;
        this.fetched.add(path);
        void this.client.store.load(path, this.loadOptions).catch(() => this.fetched.delete(path));
      }
    }
    this.members = next;
    this.ordered = names.map((n) => next.get(n)!);
  }

  /** @internal Re-read the child cell without notifying (used before first `onChange`). */
  refresh(): readonly T[] {
    this.sync();
    return this.ordered;
  }
}
