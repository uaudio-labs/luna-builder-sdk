/**
 * Which tracks and clips use each source file of a session, kept current as clips are added,
 * moved between files, rendered or deleted, and as tracks switch playlists. From
 * `session.sourceUsage()`.
 *
 * A clip uses a file through its `sourceUid` and, once LUNA has rendered it, its
 * `renderSourceUid` too (fact 73). Every playlist counts, not only the active ones: LUNA keeps
 * a file a hidden take uses, so `active` says whether the clip is on its track's playing
 * playlist.
 *
 * @example
 * const usage = await session.sourceUsage();
 * const draw = () => {
 *   for (const src of sources.items) {
 *     const used = usage.byId(src.id);
 *     console.log(src.displayName.value, used ? used.trackUids.length : 0, 'tracks');
 *   }
 * };
 * usage.onChange(draw);
 * draw();
 * usage.dispose();   // when the page no longer shows it
 */
import type { List } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import type { Playlist } from './playlist';
import type { Session } from './session';

/** One clip's use of one file. */
export interface SourceUse {
  readonly sourceUid: string;
  readonly clipUid: string;
  readonly playlistUid: string;
  /** The track the playlist belongs to. */
  readonly trackUid: string | undefined;
  /** True when the file is the clip's rendering (`renderSourceUid`), not its source. */
  readonly asRender: boolean;
  /** True when the playlist is its track's active (playing) one. */
  readonly active: boolean;
}

/** Every use of one file. */
export interface SourceUsageEntry {
  /** The source file's uid. */
  readonly id: string;
  readonly uses: readonly SourceUse[];
  /** The distinct tracks among {@link uses}, in session order of first use. */
  readonly trackUids: readonly string[];
}

export class SourceUsage implements List<SourceUsageEntry> {
  private entries: readonly SourceUsageEntry[] = [];
  private byUid = new Map<string, SourceUsageEntry>();
  private readonly listeners = new Set<() => void>();
  private readonly releases: Unsubscribe[] = [];
  private readonly perPlaylist = new Map<Playlist, Unsubscribe>();
  private queued = false;
  private disposed = false;

  /** @internal */
  constructor(private readonly session: Session) {}

  /** @internal Load every playlist's clips and start following them. */
  async start(): Promise<this> {
    await this.session.ready();
    await Promise.all(this.session.playlists.items.map((p) => p.clips.load()));
    this.followPlaylists();
    this.releases.push(
      this.session.playlists.onAnyChange(() => {
        this.followPlaylists();
        this.schedule();
      }, { props: ['trackUid'] }),
      this.session.tracks.onAnyChange(() => this.schedule(), { props: ['playlistUid'] }),
    );
    this.recompute();
    return this;
  }

  /** Files in use, each with its uses. A file no clip uses is not listed. */
  get items(): readonly SourceUsageEntry[] {
    return this.entries;
  }

  get value(): readonly SourceUsageEntry[] {
    return this.entries;
  }

  /** The uses of one file, or `undefined` when no clip uses it. */
  byId(sourceUid: string): SourceUsageEntry | undefined {
    return this.byUid.get(sourceUid);
  }

  /** True when some clip, on any playlist, uses the file. */
  isUsed(sourceUid: string): boolean {
    return this.byUid.has(sourceUid);
  }

  /** Called whenever the usage changes. */
  onChange(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Stop following the session. */
  dispose(): void {
    this.disposed = true;
    for (const r of this.releases.splice(0)) r();
    for (const r of this.perPlaylist.values()) r();
    this.perPlaylist.clear();
    this.listeners.clear();
  }

  private followPlaylists(): void {
    const now = new Set(this.session.playlists.items);
    for (const [playlist, release] of this.perPlaylist) {
      if (now.has(playlist)) continue;
      release();
      this.perPlaylist.delete(playlist);
    }
    for (const playlist of now) {
      if (this.perPlaylist.has(playlist)) continue;
      // A playlist made later (a new track, a new take lane) has its clips read once.
      void playlist.clips.load().then(() => this.schedule(), () => undefined);
      this.perPlaylist.set(playlist, playlist.clips.onAnyChange(() => this.schedule(), { props: ['sourceUid', 'renderSourceUid'] }));
    }
  }

  private schedule(): void {
    if (this.queued || this.disposed) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (!this.disposed) this.recompute();
    });
  }

  private recompute(): void {
    const uses = new Map<string, SourceUse[]>();
    const add = (use: SourceUse): void => {
      const list = uses.get(use.sourceUid);
      if (list) list.push(use);
      else uses.set(use.sourceUid, [use]);
    };
    for (const playlist of this.session.playlists.items) {
      const trackUid = playlist.trackUid.value;
      const active = trackUid !== undefined && this.session.tracks.byId(trackUid)?.playlistUid.value === playlist.id;
      for (const clip of playlist.clips.items) {
        const source = clip.sourceUid.value;
        const render = clip.renderSourceUid.value;
        const base = { clipUid: clip.id, playlistUid: playlist.id, trackUid, active };
        if (source) add({ ...base, sourceUid: source, asRender: false });
        if (render && render !== source) add({ ...base, sourceUid: render, asRender: true });
      }
    }
    const entries: SourceUsageEntry[] = [];
    for (const [id, list] of uses) {
      const trackUids = [...new Set(list.map((u) => u.trackUid).filter((t): t is string => t !== undefined))];
      entries.push(Object.freeze({ id, uses: Object.freeze(list), trackUids: Object.freeze(trackUids) }));
    }
    if (sameUsage(this.entries, entries)) return;
    this.entries = Object.freeze(entries);
    this.byUid = new Map(entries.map((e) => [e.id, e]));
    for (const l of [...this.listeners]) l();
  }
}

function sameUsage(a: readonly SourceUsageEntry[], b: readonly SourceUsageEntry[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
