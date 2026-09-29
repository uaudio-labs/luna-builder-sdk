/**
 * A playlist (take lane): `/sessions/<uid>/playlists/<pl>`. Playlists belong to the session
 * and point at their track through `trackUid`; a track's active playlist is `track.playlistUid`.
 *
 * @example
 * const pl = session.playlistFor(track);
 * await pl?.clips.load();
 * pl?.clips.onChange(() => render(pl.clips.items));
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Clip } from './clip';
import { Collection } from './collection';
import { Context } from './context';
import type { Note } from './midi';
import { Node } from './node';
import { midiByte, requireTick, settle } from './settle';

/** One note for {@link Playlist.createNotes}. Ticks are absolute, as LUNA's verb takes them. */
export interface NewNote {
  pitch: number;
  startTick: number;
  stopTick: number;
  /** Note-on and note-off velocity, 1-127. Default 100. */
  velocity?: number;
  /** Note-off velocity, when it differs from the note-on. */
  velocityOff?: number;
}

export class Playlist extends Node {
  readonly uid: Prop<string>;
  readonly name: Prop<string>;
  readonly trackUid: Prop<string>;
  /** Take number, 1-based. */
  readonly version: Prop<number>;
  readonly stemFormat: Prop<string>;
  readonly frozen: Prop<boolean>;
  readonly clips: Collection<Clip>;

  private readonly sessionUid: string;
  private readonly batching: (() => boolean) | undefined;
  private contextView: Context | undefined;

  /** @internal */
  constructor(client: Client, path: string, sessionUid: string, batching?: () => boolean) {

    super(client, path);
    this.uid = this.prop<string>('uid');
    this.name = this.prop<string>('name');
    this.trackUid = this.prop<string>('track_uid');
    this.version = this.prop<number>('version');
    this.stemFormat = this.prop<string>('stem_format');
    this.frozen = this.prop<boolean>('frozen');
    this.clips = new Collection<Clip>(client, `${path}/clips`, (p) => new Clip(client, p, sessionUid, batching), { levels: 2, commands: false, flatvalue: true });
    this.sessionUid = sessionUid;
    this.batching = batching;
  }

  /** The session's `main` edit context, which `create_note` both reads and overwrites. */
  private get context(): Context {
    this.contextView ??= new Context(this.client, `/sessions/${this.sessionUid}/contexts/main`, this.sessionUid);
    return this.contextView;
  }

  /**
   * Write notes onto this lane, making the MIDI clip to hold them if there is none there
   * (LUNA's `create_note`). One undo entry for the whole batch. Ticks are absolute.
   *
   * LUNA answers `null` and instead *selects* what it created, so the new row ids are read
   * back out of the selection — which means this cannot run inside a `transaction()` batch,
   * where LUNA holds selection writes until the commit. The user's selection is restored
   * afterwards.
   *
   * @example
   * const bar = session.musical.timeline.tickAt({ bar: 1 });
   * const { clip, notes } = await lane.createNotes(
   *   [60, 64, 67].map((pitch, i) => ({ pitch, startTick: bar + i * Luna.TICKS_PER_BEAT, stopTick: bar + (i + 1) * Luna.TICKS_PER_BEAT })),
   * );
   */
  async createNotes(notes: readonly NewNote[]): Promise<{ clip: Clip; notes: Note[] }> {
    if (!notes.length) throw new UAError('out_of_range', 'createNotes(): give at least one note', { path: this.path });
    if (this.batching?.()) {
      throw new UAError('busy', 'createNotes() reads the new row ids back out of LUNA\'s selection, which a transaction() batch holds until its commit: call it outside the batch', { path: this.path });
    }
    const body = notes.map((n) => {
      const start = requireTick(n.startTick, 'startTick');
      const stop = requireTick(n.stopTick, 'stopTick');
      if (stop <= start) throw new UAError('out_of_range', 'createNotes(): stopTick must be after startTick', { path: this.path });
      const entry: Record<string, number> = { note: midiByte(n.pitch, 'pitch'), start, stop, velocity: midiByte(n.velocity ?? 100, 'velocity', 1) };
      if (n.velocityOff !== undefined) {
        entry['velocity_on'] = entry['velocity']!;
        entry['velocity_off'] = midiByte(n.velocityOff, 'velocityOff');
      }
      return entry;
    });

    const context = this.context;
    await context.refreshSelection().catch(() => {});
    const saved = context.snapshot();
    // New rows get new ids, so anything selected before the post is the user's, not ours.
    const previous = new Set(context.notes.flatMap((s) => s.notes.map((n) => n[3])));
    let rowids: number[] = [];
    let clip: Clip | undefined;
    let found: Note[] = [];
    try {
      await this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/create_note`, { session_uid: this.sessionUid, playlist_uid: this.id, notes: body });
      await settle(
        () => {
          rowids = context.notes.filter((s) => s.playlist_uid === this.id).flatMap((s) => s.notes.map((n) => n[3])).filter((id) => !previous.has(id));
          return rowids.length >= notes.length;
        },
        'create notes (selection)',
        { path: this.path, refresh: () => context.refreshSelection(), flush: () => this.client.store.scheduler.flush() },
      );
      await settle(
        () => {
          for (const candidate of this.clips.items) {
            if (candidate.clipType.value !== 'midi') continue;
            const hits = rowids.map((id) => candidate.midi.notes.byId(String(id))).filter((n): n is Note => n !== undefined);
            if (hits.length === rowids.length) {
              clip = candidate;
              found = hits;
              return true;
            }
          }
          return false;
        },
        'create notes',
        {
          path: this.path,
          refresh: async () => {
            await this.clips.reload();
            for (const candidate of this.clips.items) if (candidate.clipType.value === 'midi') await candidate.midi.ready().then(() => candidate.midi.refresh());
          },
          flush: () => this.client.store.scheduler.flush(),
        },
      );
    } finally {
      await context.restore(saved).catch(() => {});
    }
    return { clip: clip!, notes: found };
  }

  protected override release(): void {
    this.clips.dispose();
  }
}
