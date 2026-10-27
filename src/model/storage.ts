/**
 * Session storage: data an Add On keeps with the session, so it travels with it and comes
 * back when the session is opened again. LUNA stores it in the session database under
 * `/sessions/<uid>/storage/<context>/<record>/<field>`, each value any JSON (fact 129).
 * `<context>` is a reverse-DNS name you own, such as `com.example.my-add-on`.
 *
 * A field must be added before it can be set. Every edit can be made undoable, so it shows
 * in LUNA's undo history; by default it is not, which suits view state such as a panel
 * height.
 *
 * A context need not be your Add On's id alone. Any name that is not empty and has no `/`
 * works, so one Add On can own several contexts, each your id plus a suffix:
 * `com.example.sequencer.tracks`, `com.example.sequencer.view`. Use the three levels for what
 * they are: the context is a kind of data, the record one thing of that kind (a track's
 * uid, say) and each field one part of it. Do not put a whole record in one field value. A
 * field holds one JSON value that each `set` replaces whole, so a record kept as one value
 * is rewritten for every part that changes, and its parts cannot differ in undo, with a
 * note edit undoable but a view change not. One field per part fixes both. A context's
 * {@link StorageContext.clear} leaves your other contexts alone.
 *
 * @example
 * const store = session.storage.context('com.example.my-add-on');
 * await store.load();
 * await store.add('layout', 'timeline', { height: 200 });
 * const timeline = store.value<{ height: number }>('layout', 'timeline');
 * timeline.onChange(() => (panel.style.height = `${timeline.value?.height ?? 200}px`));
 * await store.set('layout', 'timeline', { height: 320 });
 * await store.set('channels', track.id, { color: 'green' }, { undoable: true });
 *
 * @example
 * // One context per kind of data, one record per track, one field per part.
 * const tracks = session.storage.context('com.example.sequencer.tracks');
 * await tracks.load();
 * await tracks.add(track.id, 'pattern', { steps: 16, notes: [] });
 * await tracks.add(track.id, 'channel', 0);
 * await tracks.set(track.id, 'pattern', { steps: 16, notes }, { undoable: true });
 * await tracks.set(track.id, 'channel', 9);
 */
import type { Client } from '../client/client';
import type { Prop, WritableProp } from '../store/prop';
import { UAError } from '../wire/errors';
import { Node } from './node';
import { settle } from './settle';

/** Options for an edit of session storage. */
export interface StorageEditOptions {
  /** Record the edit in the session's undo history. Default `false`. */
  undoable?: boolean;
}

/** Structural JSON equality, ignoring object key order. */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const other = b as unknown[];
    return a.length === other.length && a.every((v, i) => sameJson(v, other[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => Object.hasOwn(b as object, k) && sameJson((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/**
 * A value as LUNA will hold it: it goes over the wire as JSON, so keys whose value is
 * `undefined` are dropped and `undefined` array entries become `null` (fact 129). Comparing
 * against this, not the value passed in, is what lets a write of `{ a: 1, b: undefined }`
 * settle.
 */
function asStored(value: unknown): unknown {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

/** LUNA puts each name in a path, so it must be non-empty and free of `/` (fact 129). */
function requireName(value: unknown, what: string): string {
  if (typeof value !== 'string' || value === '' || value.includes('/')) {
    throw new UAError('invalid_value', `${what} must be a non-empty string without '/'`);
  }
  return value;
}

/**
 * `/sessions/<uid>/storage/<context>`: one context's records. Get one with
 * `session.storage.context(name)`.
 *
 * @example
 * const store = session.storage.context('com.example.my-add-on');
 * await store.load();
 * store.records.value; // ['layout']
 */
export class StorageContext extends Node {
  /** Names of this context's records. */
  readonly records: Prop<string[]>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly owner: SessionStorage,
  ) {
    super(client, path);
    this.records = this.childNames();
  }

  /** The context's reverse-DNS name. */
  get name(): string {
    return this.id;
  }

  /**
   * Fetch this context's records and their values. Call once before reading
   * {@link value}; pushes keep them current while the session is watched.
   *
   * @example await store.load();
   */
  override load(): Promise<void> {
    return super.load({ levels: 2, commands: false, flatvalue: true });
  }

  /**
   * The value of one field as a live prop, `undefined` while it does not exist.
   * `set` on it is a non-undoable write of an existing field.
   *
   * @example
   * const timeline = store.value<{ height: number }>('layout', 'timeline');
   * timeline.onChange(() => console.log(timeline.value?.height));
   * await timeline.set({ height: 240 });
   */
  value<T = unknown>(record: string, field: string): WritableProp<T> {
    const path = `${this.path}/${requireName(record, 'record')}`;
    const cell = this.client.store.cell<T>(path, requireName(field, 'field'));
    return {
      get value() {
        return cell.value;
      },
      onChange: (listener) => cell.onChange(listener),
      set: (value: T) => this.set(record, field, value),
    };
  }

  /**
   * Add a field with an initial value (default `null`) and resolve once it is visible.
   * A field that already exists keeps its value.
   *
   * @example await store.add('layout', 'timeline', { height: 200 });
   */
  add(record: string, field: string, value: unknown = null, options: StorageEditOptions = {}): Promise<void> {
    return this.owner.add(this.name, record, field, value, options);
  }

  /**
   * Set an existing field and resolve once the new value is visible. Rejects with
   * `uasrv.invalid_property` if the field was never added.
   *
   * @example await store.set('layout', 'timeline', { height: 320 }, { undoable: true });
   */
  set(record: string, field: string, value: unknown, options: StorageEditOptions = {}): Promise<void> {
    return this.owner.set(this.name, record, field, value, options);
  }

  /**
   * Remove one field, or a whole record when `field` is left out.
   *
   * @example
   * await store.remove('layout', 'timeline');
   * await store.remove('layout');
   */
  remove(record: string, field?: string, options: StorageEditOptions = {}): Promise<void> {
    return this.owner.remove(this.name, record, field, options);
  }

  /**
   * Remove every record in this context.
   *
   * @example await store.clear();
   */
  clear(options: StorageEditOptions = {}): Promise<void> {
    return this.owner.remove(this.name, undefined, undefined, options);
  }
}

/**
 * `/sessions/<uid>/storage`: every Add On's session storage, by context.
 *
 * @example
 * await session.storage.load();
 * session.storage.contexts.value; // ['com.example.my-add-on']
 * const store = session.storage.context('com.example.my-add-on');
 */
export class SessionStorage extends Node {
  /** Names of the contexts that hold at least one field. */
  readonly contexts: Prop<string[]>;
  private readonly byName = new Map<string, StorageContext>();

  /** @internal */
  constructor(client: Client, sessionPath: string) {
    super(client, `${sessionPath}/storage`);
    this.contexts = this.childNames();
  }

  /**
   * Fetch the context names.
   *
   * @example await session.storage.load();
   */
  override load(): Promise<void> {
    return super.load({ levels: 1, commands: false, flatvalue: true });
  }

  /**
   * One context's records. It need not exist yet: the first {@link StorageContext.add}
   * creates it.
   *
   * `name` is any non-empty name without `/`, not only your Add On's id. Give each kind of data
   * its own context, your id plus a suffix, then use a record per item and a field per part,
   * rather than one record in one value: each `set` replaces a value whole, and only whole
   * values can be undoable or not.
   *
   * @example
   * const store = session.storage.context('com.example.my-add-on');
   * const tracks = session.storage.context('com.example.my-add-on.tracks');
   * await tracks.add(track.id, 'channel', 0);
   */
  context(name: string): StorageContext {
    requireName(name, 'context');
    let ctx = this.byName.get(name);
    if (!ctx) {
      ctx = new StorageContext(this.client, `${this.path}/${name}`, this);
      this.byName.set(name, ctx);
    }
    return ctx;
  }

  /** @internal */
  async add(context: string, record: string, field: string, value: unknown, options: StorageEditOptions): Promise<void> {
    const body = this.body(context, record, field, options);
    await this.post('add_field', { ...body, value });
    await this.settleOn(context, record, () => this.client.store.cell(`${this.path}/${context}/${record}`, field).value !== undefined, 'add field');
  }

  /** @internal */
  async set(context: string, record: string, field: string, value: unknown, options: StorageEditOptions): Promise<void> {
    const body = this.body(context, record, field, options);
    await this.post('set_field', { ...body, value });
    const stored = asStored(value);
    await this.settleOn(context, record, () => sameJson(this.client.store.cell(`${this.path}/${context}/${record}`, field).value, stored), 'set field');
  }

  /** @internal */
  async remove(context: string, record: string | undefined, field: string | undefined, options: StorageEditOptions): Promise<void> {
    requireName(context, 'context');
    if (record !== undefined) requireName(record, 'record');
    if (field !== undefined) {
      if (record === undefined) throw new UAError('invalid_value', 'remove: a field needs its record');
      requireName(field, 'field');
    }
    await this.post('remove_field', {
      context,
      ...(record !== undefined ? { record } : {}),
      ...(field !== undefined ? { field } : {}),
      undoable: options.undoable === true,
    });
    const store = this.client.store;
    const contextPath = `${this.path}/${context}`;
    if (record !== undefined && field !== undefined) {
      // LUNA pushes nothing when a single field goes, and answers remove_field only after
      // the database write (fact 129), so the reply is the proof.
      store.cell(`${contextPath}/${record}`, field).update(undefined);
      return;
    }
    const gone =
      record === undefined
        ? () => !(store.children(this.path).value ?? []).includes(context)
        : () => !(store.children(contextPath).value ?? []).includes(record);
    await this.settleOn(context, record, gone, 'remove field');
  }

  private body(context: string, record: string, field: string, options: StorageEditOptions) {
    return {
      context: requireName(context, 'context'),
      record: requireName(record, 'record'),
      field: requireName(field, 'field'),
      undoable: options.undoable === true,
    };
  }

  /** Wait for the edit to show, re-reading the context while it has not. */
  private settleOn(context: string, record: string | undefined, done: () => boolean, what: string): Promise<void> {
    const store = this.client.store;
    const contextPath = `${this.path}/${context}`;
    return settle(done, what, {
      path: record !== undefined ? `${contextPath}/${record}` : contextPath,
      refresh: async () => {
        await store.load(this.path, { levels: 1, commands: false, flatvalue: true });
        if (store.knowsNode(contextPath)) await store.load(contextPath, { levels: 2, commands: false, flatvalue: true });
      },
      flush: () => store.scheduler.flush(),
    });
  }

  protected override release(): void {
    for (const ctx of this.byName.values()) ctx.dispose();
    this.byName.clear();
  }
}
