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
import { CompiledClips, type FadeShape } from './compiled-clip';
import { requireFadeShape } from './clip';
import { Context } from './context';
import type { Note } from './midi';
import { Node } from './node';
import { midiByte, requireTick, settle } from './settle';
import type { TransactionMode } from './session';

/**
 * One note for {@link Playlist.createNotes}. Ticks are absolute (session ticks), as LUNA's
 * verb takes them, unlike the clip-relative ticks of the {@link Note}s it returns. There is no
 * channel: LUNA's `create_note` writes every note on channel 0 (fact 111). For another
 * channel, add the notes to a clip with {@link Clip.addNotes}, which takes one.
 */
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
  /**
   * What the playlist actually plays: the clips with overlaps resolved by layer, and their
   * fades (fact 116). Draw from these rather than from `clips`.
   */
  readonly compiledClips: CompiledClips;

  private readonly sessionUid: string;
  private readonly transactionMode: (() => TransactionMode | undefined) | undefined;
  private contextView: Context | undefined;

  /** @internal */
  constructor(client: Client, path: string, sessionUid: string, transactionMode?: () => TransactionMode | undefined) {

    super(client, path);
    this.uid = this.prop<string>('uid');
    this.name = this.prop<string>('name');
    this.trackUid = this.prop<string>('track_uid');
    this.version = this.prop<number>('version');
    this.stemFormat = this.prop<string>('stem_format');
    this.frozen = this.prop<boolean>('frozen');
    this.clips = new Collection<Clip>(client, `${path}/clips`, (p) => new Clip(client, p, sessionUid, transactionMode, () => this.clips), { levels: 2, commands: false, flatvalue: true });
    this.compiledClips = new CompiledClips(client, `${path}/compiled_clips`, () => this.property<boolean>('enable_compiled_clips').set(true));
    this.sessionUid = sessionUid;
    this.transactionMode = transactionMode;
  }

  /** The session's `main` edit context, which `create_note` both reads and overwrites. */
  private get context(): Context {
    this.contextView ??= new Context(this.client, `/sessions/${this.sessionUid}/contexts/main`, this.sessionUid);
    return this.contextView;
  }

  /**
   * Write notes onto this lane, making the MIDI clip to hold them if there is none there
   * (LUNA's `create_note`). One undo entry for the whole batch. Ticks are absolute, and every
   * note is on channel 0.
   *
   * A note goes into the clip its note-on falls in. When no clip on the lane is under the
   * notes, LUNA makes one MIDI clip spanning the whole bars they cover, named after the track,
   * and kept clear of the clips either side (fact 111). Notes whose note-ons fall in two
   * different clips land in both, and the call then rejects with `no_effect`, since it resolves
   * to a single clip: write to one clip per call.
   *
   * The returned `notes` are read back from the clip, so their ticks are clip-relative
   * (fact 41): subtract `clip.start.value` from what you passed in to match them up.
   *
   * LUNA answers `null` and instead *selects* what it created, so the new row ids are read
   * back out of the selection, and the notes out of the clip. The user's selection is
   * restored afterwards.
   *
   * Inside a continuous `session.transaction()` each call replaces the notes the previous
   * call wrote, which is how an Add On previews a part it regenerates as the user adjusts
   * it: one undo step, holding the last take (fact 115). A batch transaction holds the clip's
   * notes back until its commit, so this refuses inside one; write into an existing clip
   * there with {@link Clip.addNotes}.
   *
   * @example
   * const bar = session.musical.timeline.tickAt({ bar: 1 });
   * const { clip, notes } = await lane.createNotes(
   *   [60, 64, 67].map((pitch, i) => ({ pitch, startTick: bar + i * Luna.TICKS_PER_BEAT, stopTick: bar + (i + 1) * Luna.TICKS_PER_BEAT })),
   * );
   *
   * @example
   * // Try three roots as one gesture: LUNA keeps only the last take, and one undo removes it.
   * const bar = session.musical.timeline.tickAt({ bar: 2 });
   * const take = (pitch) => [{ pitch, startTick: bar, stopTick: bar + Luna.TICKS_PER_BEAT }];
   * await session.transaction('Pick a root', async () => {
   *   for (const pitch of [60, 62, 64]) await lane.createNotes(take(pitch));
   * }, { continuous: true });
   */
  async createNotes(notes: readonly NewNote[]): Promise<{ clip: Clip; notes: Note[] }> {
    if (!notes.length) throw new UAError('out_of_range', 'createNotes(): give at least one note', { path: this.path });
    if (this.transactionMode?.() === 'batch') {
      throw new UAError(
        'busy',
        'createNotes() reads the notes it made back out of the clip, which a batch transaction holds until its commit: write into an existing clip with clip.addNotes() inside the batch, or use a continuous transaction',
        { path: this.path },
      );
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

  /**
   * Cut every clip on this lane at each tick (LUNA's `separate_clips`). One undo step.
   *
   * @example
   * await lane.split([bar(5), bar(9)]);
   */
  async split(at: number | readonly number[]): Promise<void> {
    const ticks = (typeof at === 'number' ? [at] : [...at]).map((t) => requireTick(t, 'at'));
    if (!ticks.length) throw new UAError('out_of_range', 'split(): give at least one tick', { path: this.path });
    await this.contextPost('separate_clips', { location: ticks, playlist_uid: [this.id] });
  }

  /**
   * Join clips that were split apart and still play on from each other in their source
   * (LUNA's `heal_separation`). It acts on clips starting after `startTick` up to and
   * **including** `stopTick`, and on the clip running into `startTick`, so a clip that begins
   * exactly at `stopTick` and continues the same audio is joined too (fact 117). One undo
   * step; the user's selection is put back afterwards.
   *
   * @example
   * await lane.heal(clip.start.value!, clip.stop.value! - 1);
   */
  async heal(startTick: number, stopTick: number): Promise<void> {
    requireTick(startTick, 'startTick');
    requireTick(stopTick, 'stopTick');
    if (stopTick <= startTick) throw new UAError('out_of_range', 'heal(): stopTick must be after startTick', { path: this.path });
    const context = this.context;
    await context.refreshSelection().catch(() => {});
    const saved = context.snapshot();
    try {
      await context.select({ startTick, stopTick, playlistUids: [this.id] });
      await this.contextPost('heal_separation', {});
    } finally {
      await context.restore(saved).catch(() => {});
    }
  }

  /**
   * Fade in and out every clip on the lane between two ticks, `lengthNs` long, the way
   * LUNA's Batch Fades does: butted clips get a crossfade. LUNA picks the lane through its
   * track, so this works only on the track's active playlist (fact 117). One undo step.
   *
   * @example
   * await lane.addFades({ startTick: 0, stopTick: session.transport.maxTick.value!, lengthNs: 10_000_000 });
   */
  async addFades(options: { startTick: number; stopTick: number; lengthNs: number; shape?: FadeShape }): Promise<void> {
    requireTick(options.startTick, 'startTick');
    requireTick(options.stopTick, 'stopTick');
    if (!(options.lengthNs > 0)) throw new UAError('out_of_range', 'addFades(): lengthNs must be positive', { path: this.path });
    const shape = requireFadeShape(options.shape, 'addFades()');
    const track = this.trackUid.value;
    if (!track || this.client.store.cell<string>(`/sessions/${this.sessionUid}/tracks/${track}`, 'playlist_uid').value !== this.id) {
      throw new UAError('unavailable', "addFades(): LUNA fades only a track's active playlist", { path: this.path });
    }
    await this.contextPost('batch_fades', { track_uid: [track], start: options.startTick, stop: options.stopTick, length: Math.round(options.lengthNs), ...(shape ? { fade_shape: shape } : {}) });
  }

  /**
   * Remove every fade, crossfades included, that lies wholly between two ticks on this lane
   * (LUNA's `delete_fades`). One undo step.
   *
   * @example
   * await lane.deleteFades(0, session.transport.maxTick.value!);
   */
  async deleteFades(startTick: number, stopTick: number): Promise<void> {
    requireTick(startTick, 'startTick');
    requireTick(stopTick, 'stopTick');
    await this.contextPost('delete_fades', { playlist_uid: [this.id], start: startTick, stop: stopTick });
  }

  private contextPost(command: string, payload: Record<string, unknown>): Promise<unknown> {
    if (this.disposed) return Promise.reject(new UAError('disposed', 'the playlist is gone', { path: this.path }));
    return this.wire.post(`/sessions/${this.sessionUid}/contexts/main/commands/${command}`, { session_uid: this.sessionUid, ...payload });
  }

  protected override release(): void {
    this.clips.dispose();
    this.compiledClips.dispose();
  }
}
