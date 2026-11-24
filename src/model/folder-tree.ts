/**
 * Folder tracks as a tree (fact 136): the flat `folderUid` links and `order` keys of a
 * session's tracks and buses turned into rows to draw, with the rules LUNA applies to them.
 *
 * Built from a snapshot: call {@link folderTree} again when `folderUid`, `order`,
 * `folderMode` or the track and bus lists change.
 *
 * Malformed links never cost a row. A session can hold them for a moment (a folder demoted
 * before its children move, an undo landing out of order), so instead of hiding or moving
 * anything silently the tree reports each in {@link FolderTree.anomalies}: a channel whose
 * folder is itself, is missing, or is caught in a loop is drawn at the root; a channel whose
 * folder is a bus that is not (or no longer) a folder stays inside it.
 */
import type { Bus, FolderMode } from './bus';
import type { ChannelRef } from './groups';
import type { Session } from './session';
import type { Track } from './track';

/**
 * What a tree is built from: a {@link Track} or {@link Bus}, or anything shaped like one.
 * Only a channel with a `folderMode` that is `summing` or `container` is a folder.
 */
export interface FolderChannel {
  readonly id: string;
  readonly folderUid: { readonly value: string | null | undefined };
  readonly order: { readonly value: number | undefined };
  readonly folderMode?: { readonly value: FolderMode | undefined };
}

/** One row of a {@link FolderTree}. */
export interface FolderRow<T extends FolderChannel = Track | Bus> {
  /** The track or bus. */
  readonly channel: T;
  /** `channel.id`. */
  readonly id: string;
  /** 0 at the session root, one more per folder level. */
  readonly depth: number;
  /** Whether the channel is a folder (`summing` or `container`). */
  readonly isFolder: boolean;
  /**
   * The folder it is drawn in, `null` at the root. For a channel re-rooted as an anomaly this
   * differs from its `folderUid`, which the anomaly keeps.
   */
  readonly parentId: string | null;
  /** The rows directly inside it, in order; empty for a track or an empty folder. */
  readonly childIds: readonly string[];
}

/** What was wrong with a channel's `folderUid`. */
export type FolderAnomalyKind =
  /** Its `folderUid` is its own id. Drawn at the root. */
  | 'self-parent'
  /** Its `folderUid` names no track or bus in the tree. Drawn at the root. */
  | 'dangling-parent'
  /** Its `folderUid` names a bus that is not a folder, or a track. Kept inside it. */
  | 'non-folder-parent'
  /** Its folder chain loops back on itself. This one, the loop's first by order, is drawn at the root. */
  | 'cycle'
  /** A second channel with an id already in the tree. Left out. */
  | 'duplicate-id';

/** One anomaly in a {@link FolderTree}. */
export interface FolderAnomaly {
  readonly kind: FolderAnomalyKind;
  /** The channel it is about. */
  readonly id: string;
  /** The `folderUid` it claimed, for the parent anomalies. */
  readonly folderUid?: string;
}

/** Options for {@link FolderTree.visibleRows}. */
export interface VisibleRowsOptions<T extends FolderChannel = Track | Bus> {
  /**
   * Ids of collapsed folders: pass the edit context's `collapsedFolders.value` as it is.
   * Everything inside a collapsed folder is hidden; ids of anything else are ignored, since
   * LUNA does not prune that list when a folder is deleted.
   */
  collapsed?: Iterable<string> | null;
  /**
   * Which rows to draw. It hides only the rows it rejects: a folder left out by it still hides
   * its contents when collapsed, and its contents are judged on their own.
   */
  filter?: (row: FolderRow<T>) => boolean;
}

const idOf = (ref: ChannelRef): string => (typeof ref === 'string' ? ref : ref.id);

function isFolderChannel(c: FolderChannel): boolean {
  const mode = c.folderMode?.value;
  return mode === 'summing' || mode === 'container';
}

function compareOrder(a: number | undefined, b: number | undefined): number {
  if (a === undefined || a === null) return b === undefined || b === null ? 0 : 1;
  if (b === undefined || b === null) return -1;
  return a - b;
}

/**
 * Build the folder tree of a session's tracks and buses, or of a list of channels.
 *
 * @example
 * const tree = Luna.folderTree(session);
 * const collapsed = session.context.collapsedFolders.value;
 * for (const row of tree.visibleRows({ collapsed })) {
 *   draw(row.channel.name.value, { indent: row.depth, folder: row.isFolder });
 * }
 */
export function folderTree(source: Session): FolderTree<Track | Bus>;
export function folderTree<T extends FolderChannel>(source: ReadonlyArray<T>): FolderTree<T>;
export function folderTree<T extends FolderChannel>(source: Session | ReadonlyArray<T>): FolderTree<T> | FolderTree<Track | Bus> {
  if (isChannelList(source)) return new FolderTree<T>(source);
  return new FolderTree<Track | Bus>([...source.tracks.items, ...source.buses.items]);
}

function isChannelList<T>(source: Session | ReadonlyArray<T>): source is ReadonlyArray<T> {
  return Array.isArray(source);
}

/**
 * A snapshot of the folder hierarchy: rows in LUNA's order (each folder followed by
 * everything inside it), the rows to draw under collapsed folders, selection expansion, and
 * the folder a channel's main output sums into. Make one with {@link folderTree}.
 *
 * @example
 * const tree = Luna.folderTree(session);
 * tree.rows.map((r) => '  '.repeat(r.depth) + r.channel.name.value).join('\n');
 */
export class FolderTree<T extends FolderChannel = Track | Bus> {
  /** Every row, depth first: a folder comes right before its contents, siblings by `order`. */
  readonly rows: readonly FolderRow<T>[];
  /** The rows at the session root, in order, anomalies drawn there included. */
  readonly roots: readonly FolderRow<T>[];
  /** Everything malformed about the links; empty for a well-formed session. */
  readonly anomalies: readonly FolderAnomaly[];

  private readonly byId = new Map<string, FolderRow<T>>();
  private readonly channels = new Map<string, T>();

  /** @internal Use {@link folderTree}. */
  constructor(channels: ReadonlyArray<T>) {
    const anomalies: FolderAnomaly[] = [];
    const ordered: T[] = [];
    for (const c of channels) {
      if (this.channels.has(c.id)) {
        anomalies.push({ kind: 'duplicate-id', id: c.id });
        continue;
      }
      this.channels.set(c.id, c);
      ordered.push(c);
    }

    // Each channel's claimed folder, resolved.
    const parentOf = new Map<string, string | null>();
    for (const c of ordered) {
      const claimed = c.folderUid.value ?? null;
      let parent: string | null = null;
      if (claimed === c.id) anomalies.push({ kind: 'self-parent', id: c.id, folderUid: claimed });
      else if (claimed !== null && claimed !== '') {
        const folder = this.channels.get(claimed);
        if (!folder) anomalies.push({ kind: 'dangling-parent', id: c.id, folderUid: claimed });
        else {
          parent = claimed;
          if (!isFolderChannel(folder)) anomalies.push({ kind: 'non-folder-parent', id: c.id, folderUid: claimed });
        }
      }
      parentOf.set(c.id, parent);
    }

    // Break loops before grouping: each channel has one parent, so a component has at most one
    // loop. Re-root its lowest-ordered member (the earliest in the input on a tie).
    const inputIndex = new Map(ordered.map((c, i) => [c.id, i] as const));
    const done = new Set<string>();
    for (const c of ordered) {
      const path: string[] = [];
      const at = new Map<string, number>();
      let current: string | null = c.id;
      while (current !== null && !done.has(current)) {
        const seen = at.get(current);
        if (seen !== undefined) {
          const loop = path.slice(seen);
          let entry = loop[0]!;
          for (const id of loop.slice(1)) {
            const cmp = compareOrder(this.channels.get(id)!.order.value, this.channels.get(entry)!.order.value);
            if (cmp < 0 || (cmp === 0 && inputIndex.get(id)! < inputIndex.get(entry)!)) entry = id;
          }
          anomalies.push({ kind: 'cycle', id: entry, folderUid: this.channels.get(entry)!.folderUid.value ?? '' });
          parentOf.set(entry, null);
          break;
        }
        at.set(current, path.length);
        path.push(current);
        current = parentOf.get(current) ?? null;
      }
      for (const id of path) done.add(id);
    }

    // Siblings, sorted by order (stable, so ties keep input order).
    const childrenOf = new Map<string | null, T[]>();
    for (const c of ordered) {
      const parent = parentOf.get(c.id) ?? null;
      const siblings = childrenOf.get(parent);
      if (siblings) siblings.push(c);
      else childrenOf.set(parent, [c]);
    }
    for (const siblings of childrenOf.values()) siblings.sort((a, b) => compareOrder(a.order.value, b.order.value));

    // Depth first, with an explicit stack: corrupt links can nest arbitrarily deep.
    const rows: FolderRow<T>[] = [];
    const roots: FolderRow<T>[] = [];
    const childIds = new Map<string, string[]>();
    const stack: { channel: T; depth: number; parentId: string | null }[] = [];
    const push = (parentId: string | null, depth: number) => {
      const siblings = childrenOf.get(parentId) ?? [];
      for (let i = siblings.length - 1; i >= 0; i--) stack.push({ channel: siblings[i]!, depth, parentId });
    };
    push(null, 0);
    while (stack.length > 0) {
      const { channel, depth, parentId } = stack.pop()!;
      if (this.byId.has(channel.id)) continue;
      const kids: string[] = [];
      childIds.set(channel.id, kids);
      const row: FolderRow<T> = { channel, id: channel.id, depth, isFolder: isFolderChannel(channel), parentId, childIds: kids };
      rows.push(row);
      this.byId.set(row.id, row);
      if (parentId === null) roots.push(row);
      else childIds.get(parentId)?.push(row.id);
      push(channel.id, depth + 1);
    }

    this.rows = rows;
    this.roots = roots;
    this.anomalies = anomalies;
  }

  /**
   * The row of a track or bus, by id or object; `undefined` when it is not in the tree.
   *
   * @example
   * tree.row(track)?.depth;   // 1 inside a top-level folder
   */
  row(channel: ChannelRef): FolderRow<T> | undefined {
    return this.byId.get(idOf(channel));
  }

  /**
   * The rows to draw: {@link rows} without everything inside a collapsed folder, a collapsed
   * folder inside another included, and without what `filter` rejects.
   *
   * @example
   * const ctx = session.context;
   * const rows = tree.visibleRows({
   *   collapsed: ctx.collapsedFolders.value,
   *   filter: (r) => !(r.channel instanceof Luna.Track && ['click', 'count_in'].includes(r.channel.trackType.value ?? '')),
   * });
   */
  visibleRows(options: VisibleRowsOptions<T> = {}): FolderRow<T>[] {
    const collapsed = new Set(options.collapsed ?? []);
    const out: FolderRow<T>[] = [];
    let hideBelow = Infinity;
    for (const row of this.rows) {
      if (row.depth >= hideBelow) continue;
      hideBelow = Infinity;
      if (row.isFolder && collapsed.has(row.id)) hideBelow = row.depth + 1;
      if (options.filter && !options.filter(row)) continue;
      out.push(row);
    }
    return out;
  }

  /**
   * Everything inside a folder, nested folders' contents included, in order; the folder
   * itself is left out. Empty for a track, an empty folder or an unknown id.
   *
   * @example
   * const inside = tree.descendants(drums).map((r) => r.channel);
   */
  descendants(folder: ChannelRef): FolderRow<T>[] {
    const start = this.byId.get(idOf(folder));
    if (!start) return [];
    const out: FolderRow<T>[] = [];
    const stack = [...start.childIds].reverse();
    while (stack.length > 0) {
      const row = this.byId.get(stack.pop()!);
      if (!row) continue;
      out.push(row);
      for (let i = row.childIds.length - 1; i >= 0; i--) stack.push(row.childIds[i]!);
    }
    return out;
  }

  /**
   * A track selection as LUNA widens it (fact 182): a selected folder brings everything inside it, right
   * after it. Order is kept, duplicates are dropped (first place wins), and ids not in the
   * tree are dropped.
   *
   * @example
   * const ctx = session.context;
   * const ids = tree.expandSelection(ctx.selectionTracks.value ?? []);
   */
  expandSelection(ids: ReadonlyArray<ChannelRef>): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const add = (id: string) => {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    };
    for (const ref of ids) {
      const row = this.byId.get(idOf(ref));
      if (!row) continue;
      add(row.id);
      if (row.isFolder) for (const d of this.descendants(row.id)) add(d.id);
    }
    return out;
  }

  /**
   * The summing folder a track or bus's main output goes to, as LUNA routes it (fact 136): the
   * nearest `summing` folder above it, passing through `container` ones; `null` for the master
   * (no summing folder above, or a channel not in the tree). A summing folder gives the one
   * above it, never itself. It follows the channels' own `folderUid` links, as LUNA does, not
   * the re-rooted rows, and stops at a loop.
   *
   * @example
   * const target = tree.summingFolder(track);
   * label.textContent = target ? `→ ${target.name.value}` : '→ Master';
   */
  summingFolder(channel: ChannelRef): T | null {
    const start = this.channels.get(idOf(channel));
    if (!start) return null;
    const seen = new Set<string>([start.id]);
    let current = start.folderUid.value ?? null;
    while (current && !seen.has(current)) {
      seen.add(current);
      const folder = this.channels.get(current);
      if (!folder) return null;
      if (folder.folderMode?.value === 'summing') return folder;
      current = folder.folderUid.value ?? null;
    }
    return null;
  }
}
