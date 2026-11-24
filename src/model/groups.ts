/**
 * Session groups: `/sessions/<uid>/groups/<group uid>`, each with its members under
 * `members/<rowid>` (facts 215-218). A group links tracks and buses so an edit, a mix move,
 * a plugin change or a send change on one reaches the others, by its attributes.
 *
 * @example
 * await session.groups.load();
 * const drums = await session.groups.add({ name: 'Drums', attributes: ['mix', 'edit'], members: [kick, snare] });
 * drums.members.value;                         // ['<kick uid>', '<snare uid>']
 * await drums.addMembers([overheads]);
 * await session.groups.affectedTracks(kick, 'mix'); // kick, snare and overheads
 * await drums.delete();
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { Node } from './node';
import { settle } from './settle';

/** What a group links: timeline edits, mix moves, plugin changes, send changes. */
export type GroupAttribute = 'edit' | 'mix' | 'plugin' | 'send';

/** The attributes in LUNA's own order, which is how it writes `group_attributes` (fact 215). */
export const GROUP_ATTRIBUTES: readonly GroupAttribute[] = ['edit', 'mix', 'plugin', 'send'];

/**
 * A track, a bus, or its uid: anything with an `id`, or the id itself.
 *
 * @example
 * await group.addMembers([vocal, 'bus_7']);
 */
export type ChannelRef = { readonly id: string } | string;

export interface NewGroupOptions {
  /** At least one. */
  attributes: readonly GroupAttribute[];
  /** Default: LUNA's localized `New Group`. */
  name?: string;
  /** Tracks and buses to put in it. */
  members?: readonly ChannelRef[];
  /** Number the name when another group has it, as LUNA's own menu does. Default false. */
  makeNameUnique?: boolean;
}

export interface AffectedTracksOptions {
  /** The edit context whose selection and group switches apply. Default `main`. */
  contextType?: string;
}

const uidOf = (c: ChannelRef): string => (typeof c === 'string' ? c : c.id);

/** Parse LUNA's `group_attributes` CSV, which it always writes with the four names (fact 215); unknown tokens are dropped. */
function parseAttributes(csv: unknown): GroupAttribute[] | undefined {
  if (typeof csv !== 'string') return undefined;
  const seen = new Set(csv.split(/[, ]/));
  return GROUP_ATTRIBUTES.filter((a) => seen.has(a));
}

function attributesCsv(attributes: readonly GroupAttribute[] | GroupAttribute, what: string): string {
  const list = typeof attributes === 'string' ? [attributes] : [...attributes];
  if (!list.length || list.some((a) => !GROUP_ATTRIBUTES.includes(a))) {
    throw new UAError('out_of_range', `${what}: attributes must be one or more of ${GROUP_ATTRIBUTES.join(', ')}`);
  }
  return GROUP_ATTRIBUTES.filter((a) => list.includes(a)).join(',');
}

/** One `members/<rowid>` row: a track's or a bus's uid (fact 216). */
class GroupMemberRow extends Node {
  readonly trackUid: Prop<string | null>;
  readonly busUid: Prop<string | null>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.trackUid = this.prop<string | null>('track_uid');
    this.busUid = this.prop<string | null>('bus_uid');
  }
}

/**
 * One group.
 *
 * @example
 * const g = session.groups.byId(uid)!;
 * g.name.value; g.attributes.value; g.members.value;
 */
export class Group extends Node {
  readonly name: Prop<string>;
  /** Parsed from LUNA's `group_attributes` CSV, in the order `edit, mix, plugin, send`. */
  readonly attributes: Prop<readonly GroupAttribute[]>;
  /** Display order among the session's groups, from 1. */
  readonly order: Prop<number>;
  /**
   * Uids of the tracks and buses in the group, each once, in the order they joined. Loaded
   * with the group; follows `addMembers`, `removeMembers` and LUNA's own edits.
   *
   * @example
   * g.members.onChange(() => render(g.members.value ?? []));
   */
  readonly members: Prop<readonly string[]>;
  private readonly rows: Collection<GroupMemberRow>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly sessionUid: string,
  ) {
    super(client, path);
    this.name = this.prop<string>('name');
    const csv = this.prop<string>('group_attributes');
    this.attributes = derived([csv], () => parseAttributes(csv.value), { distinct: true });
    this.order = this.prop<number>('order');
    this.rows = new Collection<GroupMemberRow>(client, `${path}/members`, (p) => new GroupMemberRow(client, p), { levels: 2, commands: false, flatvalue: true });
    this.members = derived([this.rows], () => {
      const out: string[] = [];
      for (const r of [...this.rows.items].sort((a, b) => Number(a.id) - Number(b.id))) {
        const uid = r.trackUid.value ?? r.busUid.value;
        // LUNA can hold the same member twice (fact 216); report it once.
        if (typeof uid === 'string' && uid && !out.includes(uid)) out.push(uid);
      }
      return out;
    }, { distinct: true });
    // Rows added later are fetched only once the folder has been read (fact 7).
    this.rows.load().catch(() => undefined);
  }

  /** @internal Resolve once the member rows are read. */
  membersLoaded(): Promise<void> {
    return this.rows.load().then(() => this.rows.membersReady());
  }

  private get session(): string {
    return `/sessions/${this.sessionUid}`;
  }

  private waitFor(done: () => boolean, what: string): Promise<void> {
    return settle(done, what, { path: this.path, disposed: () => this.disposed, refresh: () => this.rows.reload(), flush: () => this.client.store.scheduler.flush() });
  }

  /**
   * Add tracks or buses to this group in one undo step, and resolve once they show in
   * {@link members}.
   *
   * @example
   * await group.addMembers([track, bus.id]);
   */
  async addMembers(channels: readonly ChannelRef[]): Promise<void> {
    this.assertLive();
    const uids = channels.map(uidOf);
    await this.wire.post(`${this.session}/add_group_members`, { uid: this.id, tracks: uids });
    await this.waitFor(() => uids.every((u) => (this.members.value ?? []).includes(u)), 'add group members');
  }

  /**
   * Take tracks or buses out of this group in one undo step, and resolve once they have left
   * {@link members}. One that is not in it is ignored.
   *
   * @example
   * await group.removeMembers([track]);
   */
  async removeMembers(channels: readonly ChannelRef[]): Promise<void> {
    this.assertLive();
    const uids = channels.map(uidOf);
    await this.wire.post(`${this.session}/remove_group_members`, { uid: this.id, tracks: uids });
    await this.waitFor(() => !uids.some((u) => (this.members.value ?? []).includes(u)), 'remove group members');
  }

  /**
   * Delete this group (its tracks and buses stay) and resolve once it has left
   * `session.groups`.
   *
   * @example
   * await group.delete();
   */
  async delete(): Promise<void> {
    this.assertLive();
    await this.wire.post(`${this.session}/delete_group`, { uid: this.id });
    const parent = `${this.session}/groups`;
    await settle(() => !(this.client.store.children(parent).value ?? []).includes(this.id), 'delete group', {
      path: this.path,
      refresh: () => this.client.store.load(parent, { levels: 2, commands: false, flatvalue: true }),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  protected override release(): void {
    this.rows.dispose();
  }
}

/**
 * The session's groups. Not loaded by `session.ready()`: call {@link load} first.
 *
 * @example
 * await session.groups.load();
 * session.groups.sorted.map((g) => g.name.value);
 */
export class Groups extends Collection<Group> {
  /** @internal */
  constructor(
    client: Client,
    sessionPath: string,
    private readonly sessionUid: string,
  ) {
    super(client, `${sessionPath}/groups`, (p) => new Group(client, p, sessionUid), { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * Read the groups and each group's members.
   *
   * @example
   * await session.groups.load();
   */
  override async load(): Promise<void> {
    await super.load();
    await Promise.all(this.items.map((g) => g.membersLoaded()));
  }

  /** Groups in LUNA's display order. */
  get sorted(): Group[] {
    return [...this.items].sort((a, b) => (a.order.value ?? 0) - (b.order.value ?? 0));
  }

  /**
   * Make a group in one undo step, enabled in every edit context, and resolve to it once it
   * and its members are in this list (fact 215).
   *
   * @example
   * const g = await session.groups.add({ name: 'Drums', attributes: ['mix', 'edit'], members: [kick, snare] });
   */
  async add(options: NewGroupOptions): Promise<Group> {
    const payload: Record<string, unknown> = { group_attributes: attributesCsv(options.attributes, 'groups.add()') };
    if (options.name !== undefined) payload['name'] = options.name;
    const members = (options.members ?? []).map(uidOf);
    if (members.length) payload['tracks'] = members;
    if (options.makeNameUnique !== undefined) payload['make_name_unique'] = options.makeNameUnique;
    // `new_group` takes its session from the path, not the payload (fact 215).
    const reply = (await this.client.raw.post(`/sessions/${this.sessionUid}/new_group`, payload)) as { uid?: unknown } | null;
    const uid = typeof reply?.uid === 'string' ? reply.uid : undefined;
    if (!uid) throw new UAError('no_effect', 'groups.add(): LUNA did not answer a group uid', { path: this.path });
    await settle(
      () => {
        const g = this.byId(uid);
        return g !== undefined && g.name.value !== undefined && members.every((m) => (g.members.value ?? []).includes(m));
      },
      'create group',
      { path: this.path, refresh: () => this.reload().then(() => this.byId(uid)?.membersLoaded()), flush: () => this.client.store.scheduler.flush() },
    );
    return this.byId(uid)!;
  }

  /**
   * Move `groups` (in the order given) to just after `after`, or to the front when `after`
   * is `null` or left out, and resolve once LUNA shows the new order. LUNA answers the same
   * whether or not it moved anything, so a move it refused rejects with `no_effect`
   * (fact 217).
   *
   * @example
   * await session.groups.reorder([vocals], { after: drums });
   * await session.groups.reorder([drums]);            // to the front
   */
  async reorder(groups: readonly (Group | string)[], options: { after?: Group | string | null } = {}): Promise<void> {
    const dragged = groups.map((g) => (typeof g === 'string' ? g : g.id));
    if (!dragged.length) return;
    const after = options.after == null ? undefined : typeof options.after === 'string' ? options.after : options.after.id;
    const current = this.sorted.map((g) => g.id);
    const rest = current.filter((id) => !dragged.includes(id));
    const at = after === undefined ? 0 : rest.indexOf(after) + 1;
    const expected = [...rest.slice(0, at), ...dragged, ...rest.slice(at)];
    const payload: Record<string, unknown> = { session_uid: this.sessionUid, dragged_uids: dragged };
    if (after !== undefined) payload['before_uid'] = after;
    await this.client.raw.post(`/sessions/${this.sessionUid}/group_change_order`, payload);
    await settle(() => this.sorted.map((g) => g.id).join() === expected.join(), 'reorder groups', {
      path: this.path,
      refresh: () => this.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  /**
   * The tracks and buses an operation on `track` would reach (fact 218): the edit context's
   * selection when it holds `track`, else `track` alone, plus every member of each group that
   * holds `track` and shares an attribute with `attributes`. Reads only; changes nothing. The
   * uids come in no particular order.
   *
   * @example
   * const uids = await session.groups.affectedTracks(track, 'mix');
   */
  async affectedTracks(track: ChannelRef, attributes: GroupAttribute | readonly GroupAttribute[], options: AffectedTracksOptions = {}): Promise<string[]> {
    const payload: Record<string, unknown> = { track_uid: uidOf(track), group_attributes: attributesCsv(attributes, 'affectedTracks()') };
    if (options.contextType !== undefined) payload['context_type'] = options.contextType;
    const reply = (await this.client.raw.post(`/sessions/${this.sessionUid}/group_affected_tracks`, payload)) as { tracks?: unknown } | null;
    return Array.isArray(reply?.tracks) ? reply.tracks.filter((u): u is string => typeof u === 'string') : [];
  }
}
