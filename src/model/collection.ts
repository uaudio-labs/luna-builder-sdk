/**
 * A live list of child Nodes under one parent path. Members are created from the parent's
 * child-name cell and disposed when the engine removes them.
 *
 * Once the collection is loaded, a member the engine adds later is in `items` at once, but
 * native LUNA announces an add with no data (fact 7), so its props read `undefined` until the
 * SDK has fetched it. `onChange` waits for that fetch: a listener never sees the new member
 * empty. `await collection.membersReady()`, or `await luna.settled()`, waits for it too.
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
  /** Members handed out by {@link member} before the engine listed them, by name. */
  private early = new Map<string, T>();
  private ordered: readonly T[] = [];
  private loading: Promise<void> | undefined;
  private readonly listeners = new Set<() => void>();
  private namesUnsub: Unsubscribe | undefined;
  private syncedVersion = -1;
  /** Member paths already fetched, so a new child is loaded once and only once. */
  private readonly fetched = new Set<string>();
  /** Added members whose first read has not landed, by name. `onChange` waits for them. */
  private readonly pending = new Map<string, Promise<void>>();
  private disposed = false;
  /** The members listeners were last told about. */
  private announced: readonly T[] = [];

  /** @internal */
  constructor(
    readonly client: Client,
    /** Path of the node whose children are the members, for example `/sessions/<uid>/tracks`. */
    readonly path: string,
    private readonly create: (childPath: string, name: string) => T,
    private readonly loadOptions: GetOptions = { levels: 2 },
  ) {
    this.sync();
    this.announced = this.ordered;
    // Follow the child list from the start, not only while someone listens, so a member the
    // engine removed is disposed when it goes rather than on the next read.
    this.namesUnsub = this.client.store.children(this.path).onChange(() => {
      this.sync();
      // An add still being fetched is announced when it lands, not now while it is empty.
      this.announce();
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

  /**
   * @internal The member named `id`, or a handle for one the engine has not listed yet (a
   * track made inside a batch transaction, whose push LUNA holds until the commit). The
   * collection adopts that same instance when the engine lists it, so `byId(id)` and `items`
   * hand back the object the caller already holds. Its props read `undefined` until then.
   */
  member(id: string): T {
    this.ensureSynced();
    const existing = this.members.get(id) ?? this.early.get(id);
    if (existing) return existing;
    const made = this.create(`${this.path}/${id}`, id);
    this.early.set(id, made);
    return made;
  }

  /**
   * Resolve once every member the engine has added has its properties loaded. Resolves at
   * once when nothing is being fetched.
   *
   * @example
   * await session.insertClip({ trackUid: track.id, sourceUid, startTick: 0, stopTick: Luna.WHOLE_NOTE });
   * await Luna.settle(() => lane.clips.items.length > before, 'insert clip');
   * await lane.clips.membersReady();
   * lane.clips.items.at(-1).start.value;   // loaded, not undefined
   */
  async membersReady(): Promise<void> {
    this.ensureSynced();
    while (this.pending.size > 0) await Promise.allSettled([...this.pending.values()]);
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

  /**
   * Called when members are added or removed, or when any of the named props of any member
   * changes: one listener for "redraw the list". The per-member subscriptions follow the
   * list, so a member added later is covered and a removed one is let go. Several changes in
   * the same turn call the listener once.
   *
   * `props` are the member's prop fields by name (`'name'`, `'length'`), not wire names.
   *
   * @example
   * const sources = await session.loadSources();
   * const stop = sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
   */
  onAnyChange(listener: () => void, options: { props?: ReadonlyArray<PropKey<T>> } = {}): Unsubscribe {
    const props = options.props ?? [];
    const perMember = new Map<T, Unsubscribe[]>();
    let queued = false;
    let stopped = false;
    const fire = (): void => {
      if (queued || stopped) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (!stopped) listener();
      });
    };
    const follow = (): void => {
      const now = new Set(this.items);
      for (const [member, unsubs] of perMember) {
        if (now.has(member)) continue;
        for (const u of unsubs) u();
        perMember.delete(member);
      }
      for (const member of now) {
        if (perMember.has(member)) continue;
        const unsubs: Unsubscribe[] = [];
        for (const key of props) {
          const prop = (member as unknown as Record<string, unknown>)[key as string];
          if (isProp(prop)) unsubs.push(prop.onChange(fire));
        }
        perMember.set(member, unsubs);
      }
    };
    follow();
    const stopList = this.onChange(() => {
      follow();
      fire();
    });
    return () => {
      stopped = true;
      stopList();
      for (const unsubs of perMember.values()) for (const u of unsubs) u();
      perMember.clear();
    };
  }

  /** @internal */
  dispose(): void {
    this.disposed = true;
    this.pending.clear();
    this.namesUnsub?.();
    this.namesUnsub = undefined;
    this.listeners.clear();
    for (const m of this.members.values()) m.dispose();
    for (const m of this.early.values()) m.dispose();
    this.members.clear();
    this.early.clear();
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
      const existing = this.members.get(name) ?? this.early.get(name);
      this.early.delete(name);
      next.set(name, existing ?? this.create(`${this.path}/${name}`, name));
    }
    for (const [name, member] of this.members) {
      if (!next.has(name)) {
        member.dispose();
        this.fetched.delete(`${this.path}/${name}`);
        this.pending.delete(name);
      }
    }
    // A child announced by an `added` push carries no properties on native LUNA (fact 7),
    // so a member that appears after the folder was read has nothing in its cells. Fetch
    // it once, and hold its onChange until the read lands so no listener sees it empty.
    // One that already has properties (the wasm engine sends them with the add, fact 13, and
    // a folder read fills every member) shows at once.
    if (this.loading) {
      for (const [name] of next) {
        const path = `${this.path}/${name}`;
        if (this.members.has(name) || this.fetched.has(path)) continue;
        this.fetched.add(path);
        const hold = !this.client.store.hasProperties(path);
        const read = this.client.store.load(path, this.loadOptions).then(
          () => undefined,
          () => {
            this.fetched.delete(path);
          },
        );
        if (!hold) continue;
        const arrived: Promise<void> = read.then((): void => this.arrived(name, arrived));
        this.pending.set(name, arrived);
      }
    }
    this.members = next;
    this.ordered = names.map((n) => next.get(n)!);
  }

  /** A held member's first read landed (or failed): tell listeners. */
  private arrived(name: string, read: Promise<void>): void {
    if (this.disposed || this.pending.get(name) !== read) return;
    this.pending.delete(name);
    this.announce();
  }

  /** Notify if the members a listener can see differ from those it was last told about. */
  private announce(): void {
    const now = this.pending.size ? this.ordered.filter((m) => !this.pending.has(nameOf(m))) : this.ordered;
    if (sameMembers(this.announced, now)) return;
    this.announced = now;
    for (const l of [...this.listeners]) l();
  }

  /** @internal Re-read the child cell without notifying (used before first `onChange`). */
  refresh(): readonly T[] {
    this.sync();
    return this.ordered;
  }
}

/** The names of a member's fields that are props, for {@link Collection.onAnyChange}. */
export type PropKey<T> = { [K in keyof T]: T[K] extends { onChange(listener: () => void): Unsubscribe; readonly value: unknown } ? K : never }[keyof T] & string;

function isProp(value: unknown): value is { onChange(listener: () => void): Unsubscribe } {
  return typeof value === 'object' && value !== null && typeof (value as { onChange?: unknown }).onChange === 'function' && 'value' in value;
}

function sameMembers<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((m, i) => m === b[i]);
}

function nameOf(node: Node): string {
  return node.path.slice(node.path.lastIndexOf('/') + 1);
}
