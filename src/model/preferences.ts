/**
 * Session preferences: settings an Add On keeps with the session, so they travel with it
 * and come back when it is opened again. LUNA stores them in the session database under
 * `/sessions/<uid>/preferences/<context>/<preference>/<property>`, each value any JSON
 * (fact 110). `<context>` is a reverse-DNS name you own, such as `com.example.my-add-on`.
 *
 * A property must be added before it can be set. Every edit can be made undoable, so it
 * shows in LUNA's undo history; by default it is not, which suits view state such as a
 * panel height.
 *
 * A context need not be your Add On's id alone. Any name that is not empty and has no `/`
 * works, so one Add On can own several contexts, each your id plus a suffix:
 * `com.example.sequencer.tracks`, `com.example.sequencer.view`. Use the three levels for what
 * they are: the context is a kind of data, the preference one thing of that kind (a track's
 * uid, say) and each property one field of it. Do not put a whole record in one property
 * value. A property holds one JSON value that each `set` replaces whole, so a record kept as
 * one value is rewritten for every field that changes, and its fields cannot differ in
 * undo, with a note edit undoable but a view change not. One property per field fixes both.
 * A context's {@link PreferenceContext.clear} leaves your other contexts alone.
 *
 * @example
 * const prefs = session.preferences.context('com.example.my-add-on');
 * await prefs.load();
 * await prefs.add('layout', 'timeline', { height: 200 });
 * const timeline = prefs.value<{ height: number }>('layout', 'timeline');
 * timeline.onChange(() => (panel.style.height = `${timeline.value?.height ?? 200}px`));
 * await prefs.set('layout', 'timeline', { height: 320 });
 * await prefs.set('channels', track.id, { color: 'green' }, { undoable: true });
 *
 * @example
 * // One context per kind of data, one preference per track, one property per field.
 * const tracks = session.preferences.context('com.example.sequencer.tracks');
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

/** Options for an edit of a session preference. */
export interface PreferenceEditOptions {
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

/** LUNA puts each name in a path, so it must be non-empty and free of `/` (fact 110). */
function requireName(value: unknown, what: string): string {
  if (typeof value !== 'string' || value === '' || value.includes('/')) {
    throw new UAError('invalid_value', `${what} must be a non-empty string without '/'`);
  }
  return value;
}

/**
 * `/sessions/<uid>/preferences/<context>`: one context's preferences. Get one with
 * `session.preferences.context(name)`.
 *
 * @example
 * const prefs = session.preferences.context('com.example.my-add-on');
 * await prefs.load();
 * prefs.preferences.value; // ['layout']
 */
export class PreferenceContext extends Node {
  /** Names of this context's preferences. */
  readonly preferences: Prop<string[]>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly owner: SessionPreferences,
  ) {
    super(client, path);
    this.preferences = this.childNames();
  }

  /** The context's reverse-DNS name. */
  get name(): string {
    return this.id;
  }

  /**
   * Fetch this context's preferences and their values. Call once before reading
   * {@link value}; pushes keep them current while the session is watched.
   *
   * @example await prefs.load();
   */
  override load(): Promise<void> {
    return super.load({ levels: 2, commands: false, flatvalue: true });
  }

  /**
   * The value of one property as a live prop, `undefined` while it does not exist.
   * `set` on it is a non-undoable write of an existing property.
   *
   * @example
   * const timeline = prefs.value<{ height: number }>('layout', 'timeline');
   * timeline.onChange(() => console.log(timeline.value?.height));
   * await timeline.set({ height: 240 });
   */
  value<T = unknown>(preference: string, property: string): WritableProp<T> {
    const path = `${this.path}/${requireName(preference, 'preference')}`;
    const cell = this.client.store.cell<T>(path, requireName(property, 'property'));
    return {
      get value() {
        return cell.value;
      },
      onChange: (listener) => cell.onChange(listener),
      set: (value: T) => this.set(preference, property, value),
    };
  }

  /**
   * Add a property with an initial value (default `null`) and resolve once it is visible.
   * A property that already exists keeps its value.
   *
   * @example await prefs.add('layout', 'timeline', { height: 200 });
   */
  add(preference: string, property: string, value: unknown = null, options: PreferenceEditOptions = {}): Promise<void> {
    return this.owner.add(this.name, preference, property, value, options);
  }

  /**
   * Set an existing property and resolve once the new value is visible. Rejects with
   * `uasrv.invalid_property` if the property was never added.
   *
   * @example await prefs.set('layout', 'timeline', { height: 320 }, { undoable: true });
   */
  set(preference: string, property: string, value: unknown, options: PreferenceEditOptions = {}): Promise<void> {
    return this.owner.set(this.name, preference, property, value, options);
  }

  /**
   * Remove one property, or a whole preference when `property` is left out.
   *
   * @example
   * await prefs.remove('layout', 'timeline');
   * await prefs.remove('layout');
   */
  remove(preference: string, property?: string, options: PreferenceEditOptions = {}): Promise<void> {
    return this.owner.remove(this.name, preference, property, options);
  }

  /**
   * Remove every preference in this context.
   *
   * @example await prefs.clear();
   */
  clear(options: PreferenceEditOptions = {}): Promise<void> {
    return this.owner.remove(this.name, undefined, undefined, options);
  }
}

/**
 * `/sessions/<uid>/preferences`: every Add On's session preferences, by context.
 *
 * @example
 * await session.preferences.load();
 * session.preferences.contexts.value; // ['com.example.my-add-on']
 * const prefs = session.preferences.context('com.example.my-add-on');
 */
export class SessionPreferences extends Node {
  /** Names of the contexts that hold at least one property. */
  readonly contexts: Prop<string[]>;
  private readonly byName = new Map<string, PreferenceContext>();

  /** @internal */
  constructor(client: Client, sessionPath: string) {
    super(client, `${sessionPath}/preferences`);
    this.contexts = this.childNames();
  }

  /**
   * Fetch the context names.
   *
   * @example await session.preferences.load();
   */
  override load(): Promise<void> {
    return super.load({ levels: 1, commands: false, flatvalue: true });
  }

  /**
   * One context's preferences. It need not exist yet: the first {@link PreferenceContext.add}
   * creates it.
   *
   * `name` is any non-empty name without `/`, not only your Add On's id. Give each kind of data
   * its own context, your id plus a suffix, then use a preference per item and a property per
   * field, rather than one record in one value: each `set` replaces a value whole, and only
   * whole values can be undoable or not.
   *
   * @example
   * const prefs = session.preferences.context('com.example.my-add-on');
   * const tracks = session.preferences.context('com.example.my-add-on.tracks');
   * await tracks.add(track.id, 'channel', 0);
   */
  context(name: string): PreferenceContext {
    requireName(name, 'context');
    let ctx = this.byName.get(name);
    if (!ctx) {
      ctx = new PreferenceContext(this.client, `${this.path}/${name}`, this);
      this.byName.set(name, ctx);
    }
    return ctx;
  }

  /** @internal */
  async add(context: string, preference: string, property: string, value: unknown, options: PreferenceEditOptions): Promise<void> {
    const body = this.body(context, preference, property, options);
    await this.post('add_preference', { ...body, value });
    await this.settleOn(context, preference, () => this.client.store.cell(`${this.path}/${context}/${preference}`, property).value !== undefined, 'add preference');
  }

  /** @internal */
  async set(context: string, preference: string, property: string, value: unknown, options: PreferenceEditOptions): Promise<void> {
    const body = this.body(context, preference, property, options);
    await this.post('set_preference', { ...body, value });
    await this.settleOn(context, preference, () => sameJson(this.client.store.cell(`${this.path}/${context}/${preference}`, property).value, value), 'set preference');
  }

  /** @internal */
  async remove(context: string, preference: string | undefined, property: string | undefined, options: PreferenceEditOptions): Promise<void> {
    requireName(context, 'context');
    if (preference !== undefined) requireName(preference, 'preference');
    if (property !== undefined) {
      if (preference === undefined) throw new UAError('invalid_value', 'remove: a property needs its preference');
      requireName(property, 'property');
    }
    await this.post('remove_preference', {
      context,
      ...(preference !== undefined ? { preference } : {}),
      ...(property !== undefined ? { property } : {}),
      undoable: options.undoable === true,
    });
    const store = this.client.store;
    const contextPath = `${this.path}/${context}`;
    if (preference !== undefined && property !== undefined) {
      // LUNA pushes nothing when a single property goes, and answers remove_preference only
      // after the database write (fact 110), so the reply is the proof.
      store.cell(`${contextPath}/${preference}`, property).update(undefined);
      return;
    }
    const gone =
      preference === undefined
        ? () => !(store.children(this.path).value ?? []).includes(context)
        : () => !(store.children(contextPath).value ?? []).includes(preference);
    await this.settleOn(context, preference, gone, 'remove preference');
  }

  private body(context: string, preference: string, property: string, options: PreferenceEditOptions) {
    return {
      context: requireName(context, 'context'),
      preference: requireName(preference, 'preference'),
      property: requireName(property, 'property'),
      undoable: options.undoable === true,
    };
  }

  /** Wait for the edit to show, re-reading the context while it has not. */
  private settleOn(context: string, preference: string | undefined, done: () => boolean, what: string): Promise<void> {
    const store = this.client.store;
    const contextPath = `${this.path}/${context}`;
    return settle(done, what, {
      path: preference !== undefined ? `${contextPath}/${preference}` : contextPath,
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
