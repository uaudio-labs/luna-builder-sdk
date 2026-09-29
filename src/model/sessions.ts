/**
 * The `/sessions` node: open sessions, the focused one, and the commands that open and
 * create sessions.
 *
 * @example
 * await luna.sessions.ready();
 * luna.sessions.items.map((s) => s.name.value);
 * luna.sessions.focused.value?.uid;
 * const s = await luna.sessions.create({ name: 'Demo' });   // created, loaded, ready
 */
import type { Client } from '../client/client';
import { derived, type Prop, type WritableProp } from '../store/prop';
import { RequestTimeout } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { Session } from './session';

export interface CreateSessionOptions {
  name: string;
  /** Folder to create the session package in; the engine default when omitted. */
  directoryPath?: string;
  /** How long to wait for `loaded`. Default 15 000 ms. */
  timeoutMs?: number;
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

  /** Subscribe to `/sessions` and load the list. Idempotent. */
  ready(): Promise<void> {
    if (!this.readyPromise) {
      const watch = this.client.store.watch('/sessions', { load: { flatvalue: true, commands: false } });
      this.readyPromise = watch.ready.then(() => {
        this.items.refresh();
      });
    }
    return this.readyPromise;
  }

  /** The focused session or, failing that, the first open one. Not yet `ready()`. */
  current(): Session | undefined {
    return this.focused.value ?? this.items.items[0];
  }

  /** Create a new session, load it and wait until the engine reports it loaded. */
  async create(options: CreateSessionOptions): Promise<Session> {
    const payload: Record<string, unknown> = { name: options.name };
    if (options.directoryPath !== undefined) payload['directory_path'] = options.directoryPath;
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
