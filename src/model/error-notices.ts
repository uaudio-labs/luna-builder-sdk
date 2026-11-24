/**
 * LUNA's error notices: `/errors/<uid>`, the errors, warnings and notes LUNA shows its user
 * (fact 235). Read-only here: an Add On can show them, but not add or dismiss them, which
 * would change what LUNA itself shows.
 *
 * @example
 * const w = luna.errors.watch();
 * await w.ready;
 * luna.errors.onChange(() => render(luna.errors.sorted.filter((e) => e.level.value === 'error')));
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { Collection } from './collection';
import { Node } from './node';

/** How serious a notice is. */
export type ErrorNoticeLevel = 'error' | 'warning' | 'info';

export class ErrorNotice extends Node {
  readonly uid: Prop<string>;
  /** When LUNA raised it, in seconds since the epoch; a repeat of the same notice advances it. */
  readonly timestamp: Prop<number>;
  readonly level: Prop<ErrorNoticeLevel | (string & {})>;
  /** The error code, e.g. `uasrv.launch_failed`. */
  readonly code: Prop<string>;
  /** The title LUNA shows, e.g. "OPEN IN LUNA". */
  readonly title: Prop<string>;
  /** The detail: text, or a JSON object as text (an assert's is `{error, function, file, line}`). */
  readonly payload: Prop<string>;
  /** The label of the notice's button, when it has one. */
  readonly buttonTitle: Prop<string>;
  /** The notice this one belongs to, when it is part of another. */
  readonly parentUid: Prop<string | null>;
  /** The groups it belongs to, parsed from LUNA's JSON text. */
  readonly groups: Prop<string[]>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.timestamp = this.prop<number>('error_timestamp');
    this.level = this.prop<string>('error_level');
    this.code = this.prop<string>('error_code');
    this.title = this.prop<string>('error_title');
    this.payload = this.prop<string>('error_payload');
    this.buttonTitle = this.prop<string>('error_btn_title');
    this.parentUid = this.prop<string | null>('error_parent_uuid');
    const raw = this.prop<unknown>('error_group');
    this.groups = derived([raw], () => parseGroups(raw.value), { distinct: true });
  }
}

export class ErrorNotices extends Collection<ErrorNotice> {
  /** @internal */
  constructor(client: Client) {
    super(client, '/errors', (p) => new ErrorNotice(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * The notices, newest first.
   *
   * @example
   * const latest = luna.errors.sorted[0];
   */
  get sorted(): ErrorNotice[] {
    return [...this.items].sort((a, b) => (b.timestamp.value ?? 0) - (a.timestamp.value ?? 0));
  }
}

function parseGroups(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((g): g is string => typeof g === 'string');
  if (typeof value !== 'string' || value === '') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((g): g is string => typeof g === 'string') : [value];
  } catch {
    return [value];
  }
}
