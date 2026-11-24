/**
 * The `/sessions` node: open sessions, the focused one, and the commands that open and
 * create sessions.
 *
 * @example
 * await luna.sessions.ready();
 * luna.sessions.items.map((s) => s.name.value);
 * luna.sessions.focused.value?.uid;
 * const s = await luna.sessions.create({ name: 'Demo' });   // created, loaded, ready
 * const t = await luna.sessions.createFromTemplate({ templatePackageUid: uid, name: 'Song' });
 */
import type { Client } from '../client/client';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { RequestTimeout } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { Session } from './session';

/**
 * The kind of session package `new_session` makes. LUNA's own list; `'default'` is an
 * ordinary session, `'standalone'` one kept in a standalone sessions subfolder named by
 * {@link CreateSessionOptions.standaloneId}.
 */
export type NewSessionType = 'default' | 'multi' | 'history' | 'template' | 'track_preset' | 'device_mixer' | 'volt' | 'standalone';

export interface CreateSessionOptions {
  name: string;
  /** Folder to create the session package in; the engine default when omitted. */
  directoryPath?: string;
  /**
   * The new package's uid, a UUID (dashes are ignored); LUNA makes one when omitted. Give a
   * fixed one so an Add On can find its own session again in `workspace.query()` (the row whose
   * `uid` it is) and reopen it with `sessions.open()` (fact 237).
   */
  sessionPackageUid?: string;
  /** The kind of package; `'default'` when omitted. An unknown value is treated as `'default'` by LUNA. */
  sessionType?: NewSessionType;
  /**
   * With `sessionType: 'standalone'`: the standalone sessions subfolder to create the package
   * in, in place of `directoryPath`.
   */
  standaloneId?: string;
  /** How long to wait for `loaded`. Default 15 000 ms. */
  timeoutMs?: number;
}

export interface CreateFromTemplateOptions {
  /** The template's package uid, from `workspace.templates()`. Dashes are ignored. */
  templatePackageUid: string;
  /** The new session's name. */
  name: string;
  /** Folder to create the session package in; the engine default when omitted. */
  directoryPath?: string;
  /** How long to wait for `loaded`. Default 15 000 ms. */
  timeoutMs?: number;
}

/**
 * A package uid in the form LUNA keeps it: dashes stripped (as `open_session` does), lower case.
 *
 * @example Luna.normalizePackageUid('7D3C0F9E-2B8A-…') // '7d3c0f9e2b8a…'
 */
export function normalizePackageUid(uid: string | undefined | null): string {
  return typeof uid === 'string' ? uid.replaceAll('-', '').toLowerCase() : '';
}

/** A session uid as LUNA writes them: a v4 UUID without dashes. */
function newSessionUid(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
    ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  return uuid.replaceAll('-', '');
}

export class Sessions extends Node {
  /** Open sessions. */
  readonly items: Collection<Session>;
  /** Uid of the focused session, writable. */
  readonly focusedUid: WritableProp<string>;
  /** The focused Session object, when it is among the open ones. */
  readonly focused: Prop<Session | undefined>;

  private readyPromise: Promise<void> | undefined;

  /** @internal */
  constructor(client: Client) {
    super(client, '/sessions');
    this.items = new Collection<Session>(client, '/sessions', (_path, uid) => new Session(client, uid), { levels: 1, commands: false, flatvalue: true });
    this.focusedUid = this.writableProp<string>('focused_session');
    this.focused = derived([this.focusedUid, this.items], () => {
      const uid = this.focusedUid.value;
      return uid ? this.items.byId(uid) : undefined;
    });
  }

  /**
   * Subscribe to `/sessions` and load the list, with each open session's own properties
   * (name, `sessionPackageUid`, `loaded`) but not its contents. Idempotent. A session opened
   * later has its properties read as it appears (`await luna.settled()` waits for that).
   */
  ready(): Promise<void> {
    if (!this.readyPromise) {
      const watch = this.client.store.watch('/sessions', { load: { flatvalue: true, commands: false } });
      this.readyPromise = watch.ready.then(async () => {
        this.items.refresh();
        await Promise.all(this.items.items.map((s) => this.readHeader(s)));
        this.items.onChange(() => {
          for (const s of this.items.items) void this.readHeader(s);
        });
      });
    }
    return this.readyPromise;
  }

  private readonly headers = new WeakSet<Session>();

  /** Read a session's own properties once, so `sessionPackageUid` is known without `ready()`. */
  private readHeader(session: Session): Promise<void> {
    if (this.headers.has(session) || session.sessionPackageUid.value !== undefined) return Promise.resolve();
    this.headers.add(session);
    return this.client.store.load(session.path, { children: false, commands: false, flatvalue: true }).then(
      () => undefined,
      () => { this.headers.delete(session); },
    );
  }

  /**
   * The open session whose package is `packageUid`, or `undefined`. Dashes and case are
   * ignored, so a uid from `workspace.recent()` or `query()` matches however it was written.
   * Call after `ready()`.
   *
   * @example
   * await luna.sessions.ready();
   * const open = luna.sessions.byPackageUid(row.uid);
   * if (open) await luna.sessions.focusedUid.set(open.uid);
   * else await luna.sessions.open(row.uid);
   */
  byPackageUid(packageUid: string): Session | undefined {
    const want = normalizePackageUid(packageUid);
    if (!want) return undefined;
    return this.items.items.find((s) => normalizePackageUid(s.sessionPackageUid.value) === want);
  }

  /**
   * Switch to the session of a package if it is open, else open it: the "open this" of a
   * recent-sessions list.
   *
   * @example
   * row.onclick = () => void luna.sessions.openOrFocus(entry.uid);
   */
  async openOrFocus(packageUid: string, timeoutMs?: number): Promise<Session> {
    await this.ready();
    const open = this.byPackageUid(packageUid);
    if (!open) return this.open(packageUid, timeoutMs);
    if (this.focusedUid.value !== open.uid) await this.focusedUid.set(open.uid);
    return open;
  }

  /** The focused session or, failing that, the first open one. Not yet `ready()`. */
  current(): Session | undefined {
    return this.focused.value ?? this.items.items[0];
  }

  /**
   * Create a new session, load it and wait until the engine reports it loaded.
   *
   * @example
   * const s = await luna.sessions.create({ name: 'Demo' });
   *
   * // An Add On's own session, found again by a fixed package uid (fact 237):
   * const sessionPackageUid = '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7';
   * const row = (await luna.workspace.query()).find((r) => r.uid === sessionPackageUid);
   * const own = row?.online
   *   ? await luna.sessions.open(sessionPackageUid)
   *   : await luna.sessions.create({ name: 'My Add On', sessionPackageUid });
   */
  async create(options: CreateSessionOptions): Promise<Session> {
    const payload: Record<string, unknown> = { name: options.name };
    if (options.directoryPath !== undefined) payload['directory_path'] = options.directoryPath;
    if (options.sessionPackageUid !== undefined) payload['session_package_uid'] = options.sessionPackageUid.replaceAll('-', '');
    if (options.sessionType !== undefined) payload['session_type'] = options.sessionType;
    if (options.standaloneId !== undefined) payload['standalone_id'] = options.standaloneId;
    const reply = (await this.post('new_session', payload)) as { session_uid?: string } | null;
    const uid = reply?.session_uid;
    if (!uid) throw new Error('new_session did not return a session_uid');
    return this.loadSession(uid, options.timeoutMs);
  }

  /** Open an existing session package by its uid (see `/workspace/sessions`). */
  async open(sessionPackageUid: string, timeoutMs?: number): Promise<Session> {
    const reply = (await this.post('open_session', { session_package_uid: sessionPackageUid.replaceAll('-', '') })) as { session_uid?: string } | null;
    const uid = reply?.session_uid;
    if (!uid) throw new Error('open_session did not return a session_uid');
    return this.loadSession(uid, timeoutMs);
  }

  /**
   * Create a session copied from a session template (see `workspace.templates()`), load it
   * and wait until the engine reports it loaded. The new session is its own package; the
   * template is never changed.
   *
   * @example
   * const [template] = await luna.workspace.templates();
   * const session = await luna.sessions.createFromTemplate({ templatePackageUid: template.uid, name: 'My Song' });
   * session.sessionPackageUid.value;   // the copy's own package, to reopen later with sessions.open()
   */
  async createFromTemplate(options: CreateFromTemplateOptions): Promise<Session> {
    const templateUid = options.templatePackageUid.replaceAll('-', '');
    if (!templateUid) throw new Error('createFromTemplate needs a templatePackageUid');
    const payload: Record<string, unknown> = { name: options.name, session_uid: newSessionUid(), session_package_uid: templateUid, read_only: false };
    // The command names the destination folder `path`, not new_session's `directory_path`.
    if (options.directoryPath !== undefined) payload['path'] = options.directoryPath;
    const reply = (await this.post('new_session_from_template', payload)) as { session_uid?: string } | null;
    return this.loadSession(reply?.session_uid || (payload['session_uid'] as string), options.timeoutMs);
  }

  /** Close a session by uid. */
  close(uid: string): Promise<unknown> {
    return this.post('close_session', { session_uid: uid });
  }

  /** `load_session` then wait for `/sessions/<uid>/loaded` to become true (fact 15). */
  async loadSession(uid: string, timeoutMs = 15_000): Promise<Session> {
    await this.post('load_session', { session_uid: uid });
    await this.ready();
    // Re-read the list so the collection owns the Session instance we hand back.
    await this.client.store.load('/sessions', { flatvalue: true, commands: false });
    const session = this.items.byId(uid) ?? new Session(this.client, uid);
    await session.ready();
    if (session.loaded.value !== true) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          unsub();
          reject(new RequestTimeout('load_session', session.path, timeoutMs));
        }, timeoutMs);
        const unsub = session.loaded.onChange(() => {
          if (session.loaded.value === true) {
            clearTimeout(timer);
            unsub();
            resolve();
          }
        });
        // The push can be missed; poll once as a fallback.
        void this.client.store.load(`${session.path}/loaded`).catch(() => undefined);
      });
    }
    return session;
  }
}
