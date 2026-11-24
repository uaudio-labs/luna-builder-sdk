/**
 * The workspace: every session package LUNA knows about, on disk or not.
 * `/workspace/sessions/<package uid>` plus the `query` command.
 *
 * @example
 * const recent = await luna.workspace.recent(10);
 * recent[0].name; recent[0].lastOpened; recent[0].online;
 * const session = await luna.sessions.open(recent[0].uid);
 */
import type { Client } from '../client/client';
import type { List, Prop, WritableProp } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';

export interface SessionPackageRow {
  uid: string;
  name: string;
  path: string;
  online: boolean;
  sessionType: number | string;
  factory: boolean;
  favorite: boolean;
  /** Milliseconds since the epoch. */
  created: number;
  /** Seconds since the epoch, as the engine reports it. */
  modified: number;
  /** Milliseconds since the epoch. */
  lastOpened: number;
  tags: string[];
}

export interface QueryOptions {
  table?: 'sessions' | 'versions' | 'tutorials';
  /**
   * The package whose versions or tutorials to list. LUNA ignores it for the `'sessions'`
   * table, which always answers every package: find one there by its row's `uid` (fact 237).
   */
  sessionPackageUid?: string;
  factory?: boolean;
  favorite?: boolean;
  tags?: string[];
  /** Match any tag rather than all. */
  anyTag?: boolean;
  search?: string;
  orderBy?: 'created' | 'last_opened' | 'modified' | 'name' | (string & {});
  orderAs?: 'asc' | 'desc';
  lastOpenedMin?: number;
  limit?: number;
}

/** Filters for {@link Workspace.templates}. */
export interface TemplateQueryOptions {
  /** Only templates carrying this tag. */
  tag?: string;
  /** `true` for LUNA's own templates only, `false` for the user's only. */
  factory?: boolean;
}

/** One session package as a live node. */
export class SessionPackage extends Node {
  readonly uid: Prop<string>;
  readonly fileName: Prop<string>;
  readonly directoryPath: Prop<string>;
  readonly sessionType: Prop<string>;
  readonly factory: Prop<boolean>;
  readonly favorite: WritableProp<boolean>;
  readonly comments: WritableProp<string>;
  readonly created: Prop<number>;
  readonly modified: Prop<number>;
  readonly lastOpened: Prop<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.fileName = this.prop<string>('file_name');
    this.directoryPath = this.prop<string>('directory_path');
    this.sessionType = this.prop<string>('session_type');
    this.factory = this.prop<boolean>('factory');
    this.favorite = this.writableProp<boolean>('favorite');
    this.comments = this.writableProp<string>('comments');
    this.created = this.prop<number>('created');
    this.modified = this.prop<number>('modified');
    this.lastOpened = this.prop<number>('last_opened');
  }

  /** Display name without the `.luna` or `.lunatemplate` extension. */
  get name(): string {
    return (this.fileName.value ?? this.id).replace(/\.luna(template)?$/, '');
  }
}

export class Workspace extends Node {
  /** All packages. Large; prefer {@link query} or {@link recent} unless you need live updates. */
  readonly packages: Collection<SessionPackage>;

  /** @internal */
  constructor(client: Client) {
    super(client, '/workspace');
    this.packages = new Collection<SessionPackage>(client, '/workspace/sessions', (p) => new SessionPackage(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /** Query the workspace database. Columnar on the wire; rows here. */
  async query(options: QueryOptions = {}): Promise<SessionPackageRow[]> {
    const payload: Record<string, unknown> = { table_id: options.table ?? 'sessions', tags: true, include_online: true };
    if (options.sessionPackageUid !== undefined) payload['session_package_uid'] = options.sessionPackageUid;
    if (options.factory !== undefined) payload['factory'] = options.factory;
    if (options.favorite !== undefined) payload['favorite'] = options.favorite;
    if (options.tags !== undefined) payload['tag'] = options.tags;
    if (options.anyTag !== undefined) payload['union'] = options.anyTag;
    if (options.search !== undefined) payload['search'] = options.search;
    if (options.orderBy !== undefined) payload['order_by'] = options.orderBy;
    if (options.orderAs !== undefined) payload['order_as'] = options.orderAs;
    if (options.lastOpenedMin !== undefined) payload['last_opened_min'] = options.lastOpenedMin;
    if (options.limit !== undefined) payload['limit'] = options.limit;
    const reply = (await this.post('query', payload)) as { results?: Record<string, unknown[]> & { num_rows?: number } } | null;
    return rowsFrom(reply?.results);
  }

  /** Most recently opened packages, newest first. */
  recent(limit = 20): Promise<SessionPackageRow[]> {
    return this.query({ orderBy: 'last_opened', orderAs: 'desc', limit });
  }

  /**
   * The session templates (`.lunatemplate` packages) on disk, for
   * `sessions.createFromTemplate()`. A template's `uid` is stored inside the package, so it is
   * the same on every machine and survives a rename.
   *
   * `tag` keeps the templates carrying that tag, and `factory` the ones LUNA ships (`true`)
   * or the user's (`false`); LUNA filters both itself (fact 162). LUNA restamps its factory
   * templates' uids when it is built, so a tag is the steadier way to find one of those.
   *
   * @example
   * const template = (await luna.workspace.templates()).find((t) => t.uid === MY_TEMPLATE_UID);
   * if (template) await luna.sessions.createFromTemplate({ templatePackageUid: template.uid, name: 'My Song' });
   * const [brochure] = await luna.workspace.templates({ tag: 'brochure', factory: true });
   */
  async templates(options: TemplateQueryOptions = {}): Promise<SessionPackageRow[]> {
    // LUNA ignores session_type in the query and include_online only adds the file_online
    // column, so both are checked on every row.
    const payload: Record<string, unknown> = { table_id: 'sessions', session_type: 'session_template', tags: true, include_online: true };
    if (options.tag !== undefined) {
      if (typeof options.tag !== 'string' || options.tag.trim() === '') throw new UAError('out_of_range', 'templates(): tag must be a non-empty string');
      payload['tag'] = options.tag;
    }
    if (options.factory !== undefined) payload['factory'] = options.factory;
    const reply = (await this.post('query', payload)) as { results?: Record<string, unknown[]> & { num_rows?: number } } | null;
    // LUNA honours `factory: true` but answers every template for `factory: false` (fact 162).
    return rowsFrom(reply?.results).filter((row) => row.online && isSessionTemplate(row.sessionType) && (options.factory === undefined || row.factory === options.factory));
  }

  /**
   * Tag a session package, as a template or session is tagged for {@link templates} and
   * {@link query} to find (fact 161). LUNA writes the tag into the package's metadata, so it
   * travels with it. Rejects with `uasrv.read_only_property` for a factory package and
   * `device.database_error` for an unknown one.
   *
   * @example await luna.workspace.addTag(session.sessionPackageUid.value!, 'brochure');
   */
  async addTag(packageUid: string, tag: string): Promise<void> {
    if (typeof packageUid !== 'string' || packageUid === '') throw new UAError('out_of_range', 'addTag(): packageUid must be a session package uid');
    if (typeof tag !== 'string' || tag.trim() === '') throw new UAError('out_of_range', 'addTag(): tag must be a non-empty string');
    await this.post('add_tag', { tag, session_package_uid: packageUid });
  }

  /**
   * The most recently opened packages as a live list, newest first, with `openSessionUid` on
   * the rows that are open now. It queries again whenever a session is opened, closed or
   * switched to (LUNA moves `last_opened` then), and on `refresh()`. Call `dispose()` when
   * done.
   *
   * @example
   * const recent = await luna.workspace.recentList(10);
   * const draw = () => list.replaceChildren(...recent.items.map((r) => row(r.name, r.openSessionUid !== undefined)));
   * recent.onChange(draw);
   * draw();
   */
  async recentList(limit = 20): Promise<RecentSessions> {
    const list = new RecentSessions(this, limit);
    await list.start();
    return list;
  }

  /**
   * What `deleteUnusedMedia` would remove from a package, without removing anything (LUNA's
   * pre-flight, fact 240). `unusedUids` and `kept` need a LUNA that lists files; an older one
   * answers the counts only and leaves both `undefined`.
   *
   * LUNA keeps a file that the session uses now, that undo or a saved version could bring
   * back, or that only an auto-backup uses; `kept` gives the reason for each.
   *
   * @example
   * const plan = await luna.workspace.unusedMedia(session.sessionPackageUid.value!);
   * plan.unusedCount;                                  // files that would go
   * plan.unusedUids?.map((uid) => sources.byId(uid)?.displayName.value);
   * plan.kept?.filter((k) => k.reason === 'undo');     // freed by clearing undo
   */
  async unusedMedia(packageUid: string, options: { clearUndo?: boolean } = {}): Promise<UnusedMedia> {
    const pkg = requirePackageUid(packageUid, 'unusedMedia');
    const payload: Record<string, unknown> = { session_package_uid: pkg, pre_flight: true };
    if (options.clearUndo) payload['clear_undo'] = true;
    return unusedMediaFrom(await this.post('delete_unused_media', payload));
  }

  /**
   * Remove a package's unused audio files (LUNA's Delete Unused Media, fact 240). By default
   * they go to the trash, in a "<session> (Unused Media)" folder; `toTrash: false` deletes them
   * for good. `clearUndo` first clears the session's undo history, so files only undo kept go
   * too; `deleteAutoBackups` also removes the auto-backups that are all that uses a file,
   * where LUNA allows it. Answers what was removed.
   *
   * @example
   * const done = await luna.workspace.deleteUnusedMedia(pkgUid, { toTrash: true });
   * console.log(`${done.unusedCount} files moved to the trash`);
   */
  async deleteUnusedMedia(packageUid: string, options: { toTrash?: boolean; clearUndo?: boolean; deleteAutoBackups?: boolean } = {}): Promise<UnusedMedia> {
    const pkg = requirePackageUid(packageUid, 'deleteUnusedMedia');
    const payload: Record<string, unknown> = { session_package_uid: pkg, permanently_delete: options.toTrash === false };
    if (options.clearUndo) payload['clear_undo'] = true;
    if (options.deleteAutoBackups) payload['delete_auto_backups'] = true;
    return unusedMediaFrom(await this.post('delete_unused_media', payload));
  }

  /** Full-text search over session metadata. */
  async search(text: string): Promise<unknown> {
    return this.post('full_text_search', { search_text: text });
  }

  protected override release(): void {
    this.packages.dispose();
  }
}

/** Why LUNA keeps a file that {@link Workspace.unusedMedia} does not offer to remove. */
export type KeptReason = 'session' | 'undo' | 'version' | 'backup' | 'origin' | 'move_failed' | (string & {});

/** The answer of {@link Workspace.unusedMedia} and {@link Workspace.deleteUnusedMedia}. */
export interface UnusedMedia {
  /** Audio files in the package's folder. */
  readonly totalFiles: number;
  /** Files removed, or that would be in a pre-flight. */
  readonly unusedCount: number;
  /** Files only auto-backups use. */
  readonly onlyInBackupsCount: number;
  /** The uids counted by `unusedCount`; `undefined` on a LUNA that does not list them. */
  readonly unusedUids: readonly string[] | undefined;
  /** Every other file and why it stays; `undefined` on a LUNA that does not list them. */
  readonly kept: readonly { readonly uid: string; readonly reason: KeptReason }[] | undefined;
}

function requirePackageUid(packageUid: string, what: string): string {
  if (typeof packageUid !== 'string' || packageUid.trim() === '') throw new UAError('out_of_range', `${what}(): packageUid must be a session package uid`);
  return packageUid.replaceAll('-', '');
}

function unusedMediaFrom(reply: unknown): UnusedMedia {
  const r = (reply ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
  const unused = Array.isArray(r['unused_files']) ? (r['unused_files'] as unknown[]).filter((u): u is string => typeof u === 'string') : undefined;
  const kept = Array.isArray(r['kept_files'])
    ? (r['kept_files'] as unknown[]).flatMap((k) => {
        const e = k as { uid?: unknown; reason?: unknown } | null;
        return e && typeof e.uid === 'string' ? [Object.freeze({ uid: e.uid, reason: typeof e.reason === 'string' ? e.reason : 'unknown' })] : [];
      })
    : undefined;
  return Object.freeze({
    totalFiles: num(r['total_files']),
    unusedCount: num(r['total_unused_files']),
    onlyInBackupsCount: num(r['files_only_in_backups']),
    unusedUids: unused && Object.freeze(unused),
    kept: kept && Object.freeze(kept),
  });
}

/** A {@link Workspace.recentList} row: the package, and the open session showing it, if any. */
export interface RecentSessionRow extends SessionPackageRow {
  /** The uid of the open session of this package, or `undefined` when it is not open. */
  readonly openSessionUid: string | undefined;
}

/**
 * The live list {@link Workspace.recentList} answers. `byId` takes a package uid with or
 * without dashes.
 *
 * @example
 * const recent = await luna.workspace.recentList(10);
 * recent.items[0]?.name;
 * await recent.refresh();
 * recent.dispose();
 */
export class RecentSessions implements List<RecentSessionRow> {
  private rows: readonly RecentSessionRow[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly releases: Unsubscribe[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private disposed = false;

  /** @internal */
  constructor(
    private readonly workspace: Workspace,
    readonly limit: number,
  ) {}

  /** @internal */
  async start(): Promise<void> {
    const sessions = this.workspace.client.sessions;
    await sessions.ready();
    const again = (): void => this.schedule();
    this.releases.push(sessions.items.onChange(again), sessions.focusedUid.onChange(again));
    await this.refresh();
  }

  get items(): readonly RecentSessionRow[] {
    return this.rows;
  }

  get value(): readonly RecentSessionRow[] {
    return this.rows;
  }

  byId(packageUid: string): RecentSessionRow | undefined {
    const want = packageUid.replaceAll('-', '').toLowerCase();
    return this.rows.find((r) => r.uid.replaceAll('-', '').toLowerCase() === want);
  }

  onChange(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Query again now. */
  async refresh(): Promise<void> {
    const generation = ++this.generation;
    const rows = await this.workspace.recent(this.limit);
    if (this.disposed || generation !== this.generation) return;
    const sessions = this.workspace.client.sessions;
    await Promise.all(sessions.items.items.map((s) => (s.sessionPackageUid.value === undefined ? this.workspace.client.store.load(s.path, { children: false, commands: false, flatvalue: true }).catch(() => undefined) : undefined)));
    if (this.disposed || generation !== this.generation) return;
    const next = rows.map((r) => Object.freeze({ ...r, openSessionUid: sessions.byPackageUid(r.uid)?.uid }));
    if (JSON.stringify(next) === JSON.stringify(this.rows)) return;
    this.rows = Object.freeze(next);
    for (const l of [...this.listeners]) l();
  }

  /** Stop following. */
  dispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
    for (const r of this.releases.splice(0)) r();
    this.listeners.clear();
  }

  /** LUNA writes `last_opened` as a session opens; query a moment after the change, once. */
  private schedule(): void {
    if (this.disposed) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.refresh().catch(() => undefined);
    }, 150);
  }
}

/**
 * `session_type` 3. Query rows carry the number; a package node publishes LUNA's name for it,
 * `template` (fact 181). The name `session_template`, which some clients use, is accepted too.
 */
function isSessionTemplate(sessionType: number | string): boolean {
  return sessionType === 3 || sessionType === 'template' || sessionType === 'session_template';
}

function rowsFrom(results: (Record<string, unknown[]> & { num_rows?: number }) | undefined): SessionPackageRow[] {
  if (!results) return [];
  const n = typeof results.num_rows === 'number' ? results.num_rows : (results['uid']?.length ?? 0);
  const col = <T>(name: string, i: number, fallback: T): T => {
    const arr = results[name];
    return Array.isArray(arr) && arr[i] !== undefined ? (arr[i] as T) : fallback;
  };
  const rows: SessionPackageRow[] = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      uid: col('uid', i, ''),
      name: col<string>('name', i, '').replace(/\.luna(template)?$/, ''),
      path: col('path', i, ''),
      online: col('file_online', i, true),
      sessionType: col<number | string>('session_type', i, 0),
      factory: col('factory', i, false),
      favorite: col('favorite', i, false),
      created: col('created', i, 0),
      modified: col('modified', i, 0),
      lastOpened: col('last_opened', i, 0),
      tags: col<string[]>('tags', i, []),
    });
  }
  return rows;
}
