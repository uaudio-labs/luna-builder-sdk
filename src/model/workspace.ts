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
import type { Prop, WritableProp } from '../store/prop';
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
  sessionPackageUid?: string;
  factory?: boolean;
  favorite?: boolean;
  tags?: string[];
  /** Match any tag rather than all. */
  anyTag?: boolean;
  search?: string;
  orderBy?: 'created' | 'last_opened' | 'modified' | 'name' | string;
  orderAs?: 'asc' | 'desc';
  lastOpenedMin?: number;
  limit?: number;
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

  /** Display name without the `.luna` extension. */
  get name(): string {
    return (this.fileName.value ?? this.id).replace(/\.luna$/, '');
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

  /** Full-text search over session metadata. */
  async search(text: string): Promise<unknown> {
    return this.post('full_text_search', { search_text: text });
  }

  protected override release(): void {
    this.packages.dispose();
  }
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
      name: col<string>('name', i, '').replace(/\.luna$/, ''),
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
