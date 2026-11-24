/**
 * A clip's warp markers: `<clip>/warps/<rowid>` (facts 229-231). Each pins a clip position
 * (`start`, ticks relative to the clip's start) to a point in the source file (`sourceStart`,
 * nanoseconds); LUNA time-stretches the audio between them. Reached as {@link Clip.warps}.
 *
 * @example
 * const warps = clip.warps;
 * await warps.load();
 * warps.markers.map((w) => [w.start, w.sourceStart, w.type]);
 * const w = await warps.set({ start: Luna.QUARTER_NOTE, sourceStart: 600_000_000 });
 * await warps.delete(Luna.QUARTER_NOTE);
 * await warps.removeTimeStretch();
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { derived } from '../store/prop';
import { Collection } from './collection';
import { Node } from './node';
import { requireTick, settle } from './settle';

/** Who placed a warp marker: the user (0 on the wire) or LUNA's own analysis (1). */
export type WarpType = 'user' | 'engine';

/** One warp marker as plain data, for {@link Warps.markers}. */
export interface WarpMarker {
  /** The marker's row id, which {@link Warps.set} takes to move it. */
  readonly rowid: number;
  /** Clip-relative position, ticks. */
  readonly start: number;
  /** Offset into the source file, nanoseconds. */
  readonly sourceStart: number;
  readonly type: WarpType | undefined;
}

/** Options for {@link Warps.set}. */
export interface SetWarpOptions {
  /** Clip-relative position, ticks. */
  start: number;
  /** Offset into the source file, nanoseconds. */
  sourceStart: number;
  /** Move the marker with this row id instead of adding one. */
  rowid?: number;
  /** Ticks added to `start` before LUNA stores it. */
  move?: number;
  /** Edit context whose edit groups follow the new marker. Default `main`. */
  contextType?: string;
}

/**
 * LUNA's warp transient zone (feature key `warp_transient_zone_size`, 30 ms by default): a new
 * marker whose source point is this close to an existing one's reuses it (fact 230).
 */
export const WARP_TRANSIENT_ZONE_NS = 30_000_000;

/** One warp marker node. */
export class Warp extends Node {
  /** Clip-relative position, ticks. */
  readonly start: Prop<number>;
  /** Offset into the source file, nanoseconds. */
  readonly sourceStart: Prop<number>;
  /** Where LUNA first put the marker, ticks. */
  readonly startOriginal: Prop<number>;
  /** Where in the source LUNA first put the marker, nanoseconds. */
  readonly sourceStartOriginal: Prop<number>;
  /** `user` or `engine`, from the wire's 0 or 1. */
  readonly type: Prop<WarpType | undefined>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.start = this.prop<number>('start');
    this.sourceStart = this.prop<number>('source_start');
    this.startOriginal = this.prop<number>('start_original');
    this.sourceStartOriginal = this.prop<number>('source_start_original');
    const raw = this.prop<unknown>('warp_type');
    this.type = derived([raw], () => (raw.value === 0 ? 'user' : raw.value === 1 ? 'engine' : undefined));
  }

  /** The row id, from the node name. */
  get rowid(): number {
    return Number(this.id);
  }
}

/** The `warps` folder of a clip. */
export class Warps extends Collection<Warp> {
  /** @internal */
  constructor(
    client: Client,
    private readonly clipPath: string,
    private readonly sessionUid: string,
  ) {
    super(client, `${clipPath}/warps`, (p) => new Warp(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  private get clipUid(): string {
    return this.clipPath.slice(this.clipPath.lastIndexOf('/') + 1);
  }

  private get playlistUid(): string {
    return this.clipPath.split('/')[4] ?? '';
  }

  /**
   * The markers as plain data, sorted by `start`; ones whose properties have not loaded are
   * left out.
   *
   * @example
   * for (const w of clip.warps.markers) drawMarker(clip.start.value! + w.start);
   */
  get markers(): WarpMarker[] {
    return this.items
      .filter((w) => typeof w.start.value === 'number' && typeof w.sourceStart.value === 'number')
      .map((w) => ({ rowid: w.rowid, start: w.start.value!, sourceStart: w.sourceStart.value!, type: w.type.value }))
      .sort((a, b) => a.start - b.start);
  }

  private post(command: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.raw.post(`/sessions/${this.sessionUid}/${command}`, { session_uid: this.sessionUid, clip_uid: this.clipUid, ...payload });
  }

  private settled(done: () => boolean, what: string): Promise<void> {
    return settle(done, what, { path: this.path, refresh: () => this.reload() });
  }

  /**
   * Add a marker pinning clip tick `start` to `sourceStart` ns, or with `rowid` move that
   * marker there (`set_warp`, fact 230); the marker becomes a `user` one. Where an existing
   * marker's source point is within {@link WARP_TRANSIENT_ZONE_NS} of `sourceStart`, LUNA
   * keeps that marker and adds none. Two markers at one tick or one source point are refused
   * (`uasrv.invalid_object`). One undo step. Resolves to the marker once the list shows it.
   *
   * @example
   * const w = await clip.warps.set({ start: Luna.QUARTER_NOTE, sourceStart: 600_000_000 });
   * await clip.warps.set({ rowid: w.rowid, start: Luna.QUARTER_NOTE * 2, sourceStart: 600_000_000 });
   */
  async set(options: SetWarpOptions): Promise<WarpMarker> {
    const start = requireTick(options.start, 'start');
    const sourceStart = requireTick(options.sourceStart, 'sourceStart');
    const move = options.move === undefined ? 0 : requireTick(options.move, 'move');
    const payload: Record<string, unknown> = { playlist_uid: this.playlistUid, start, source_start: sourceStart, context_type: options.contextType ?? 'main' };
    if (options.rowid !== undefined) payload['rowid'] = options.rowid;
    if (options.move !== undefined) payload['move'] = move;
    await this.post('set_warp', payload);
    const at = start + move;
    const found = (): WarpMarker | undefined => {
      const ms = this.markers;
      if (options.rowid !== undefined) return ms.find((m) => m.rowid === options.rowid && m.start === at && m.sourceStart === sourceStart);
      return ms.find((m) => m.start === at && m.sourceStart === sourceStart) ?? ms.find((m) => Math.abs(m.sourceStart - sourceStart) <= WARP_TRANSIENT_ZONE_NS);
    };
    await this.settled(() => found() !== undefined, 'set warp');
    return found()!;
  }

  /**
   * Delete the marker at clip tick `start`, or with `stop` every marker strictly between the
   * two: LUNA leaves markers at `start` and at `stop` alone (`delete_warp`, fact 231). One undo
   * step. Resolves once they are gone.
   *
   * @example
   * await clip.warps.delete(Luna.QUARTER_NOTE);
   * await clip.warps.delete(0, Luna.WHOLE_NOTE); // the ones inside, not at 0 or the bar
   */
  async delete(start: number, stop?: number): Promise<void> {
    const payload: Record<string, unknown> = { start: requireTick(start, 'start'), context_type: 'main' };
    if (stop !== undefined) payload['stop'] = requireTick(stop, 'stop');
    await this.post('delete_warp', payload);
    const gone = (m: WarpMarker) => (stop === undefined ? m.start !== start : m.start <= start || m.start >= stop);
    await this.settled(() => this.markers.every(gone), 'delete warp');
  }

  /**
   * Remove the clip's time stretch (`remove_tce`, fact 231): every marker goes and LUNA sets
   * the clip's `stop` so it plays its source span at the session tempo. One undo step. An
   * audio clip only: LUNA refuses others with `uasrv.invalid_object`. Resolves once the
   * markers are gone; the clip's new `stop` arrives by push.
   *
   * @example
   * await clip.warps.removeTimeStretch();
   */
  async removeTimeStretch(): Promise<void> {
    await this.post('remove_tce', { context_type: 'main' });
    await this.settled(() => this.items.length === 0, 'remove time stretch');
  }
}
