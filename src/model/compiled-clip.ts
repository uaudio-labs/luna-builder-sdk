/**
 * What a playlist actually plays: `/sessions/<uid>/playlists/<pl>/compiled_clips/<n>`.
 *
 * Clips on a playlist can overlap; where they do, the higher layer plays. LUNA resolves that
 * into compiled clips, non-overlapping segments each cut from one clip, and publishes them
 * once a client turns on `enable_compiled_clips` on the playlist (fact 116). Draw from these,
 * not from the raw clips, or a covered clip shows through the one on top.
 *
 * Units (fact 16): `start`/`stop` are timeline ticks; `sourceStart`/`sourceStop` are
 * nanoseconds into the clip's source, for this segment only.
 *
 * @example
 * await lane.compiledClips.load();
 * for (const seg of lane.compiledClips.inOrder()) {
 *   const clip = lane.clips.byId(seg.clipUid.value!);
 *   draw(seg.start.value, seg.stop.value, clip?.name.value, seg.fadeIn.value, seg.fadeOut.value);
 * }
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import type { Unsubscribe } from '../wire/port';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { Context } from './context';
import { Node } from './node';
import { requireTick, settle } from './settle';

/** LUNA's fade shapes. Another string is passed through as LUNA sent it. */
export type FadeShape = 'linear' | 'equal_power' | 'log';

/** One fade of a compiled clip, as LUNA applies it (fact 116). Ticks are absolute. */
export interface CompiledFade {
  /** The fade row, for editing it. */
  readonly uid: string;
  readonly start: number;
  readonly stop: number;
  readonly shape: FadeShape | string;
  /** -1 to 1; 0 is the shape's own curve. */
  readonly curvature: number;
  /** True when this fade is one side of a crossfade with {@link contributorClipUid}. */
  readonly crossfade: boolean;
  /** The clip on the other side of a crossfade; `undefined` for a plain fade. */
  readonly contributorClipUid: string | undefined;
}

/** A compiled clip's state at one moment, as plain data: what a view draws from. */
export interface CompiledClipSnapshot {
  readonly id: string;
  readonly clipUid: string | undefined;
  readonly name: string | undefined;
  readonly start: number | undefined;
  readonly stop: number | undefined;
  readonly sourceStart: number | undefined;
  readonly sourceStop: number | undefined;
  readonly fullStart: number | undefined;
  readonly fullStop: number | undefined;
  readonly fadeIn: CompiledFade | undefined;
  readonly fadeOut: CompiledFade | undefined;
  readonly reportsFades: boolean;
  readonly renderSourceUid: string | null | undefined;
  readonly renderSourceStart: number | undefined;
  readonly renderSourceStop: number | undefined;
  readonly needsRender: boolean | undefined;
}

export class CompiledClip extends Node {
  /** The clip this segment is cut from; look it up with `playlist.clips.byId`. */
  readonly clipUid: Prop<string>;
  readonly name: Prop<string>;
  /** Where this segment starts playing, ticks. */
  readonly start: Prop<number>;
  /** Where this segment stops playing, ticks. */
  readonly stop: Prop<number>;
  /** Source offset at `start`, nanoseconds. */
  readonly sourceStart: Prop<number>;
  /** Source offset at `stop`, nanoseconds. */
  readonly sourceStop: Prop<number>;
  /**
   * `start` moved earlier by an incoming crossfade, where this segment's audio already sounds
   * under the one before it. Equal to `start` without one, and on a LUNA that does not report
   * fades.
   */
  readonly fullStart: Prop<number>;
  /** `stop` moved later by an outgoing crossfade. Equal to `stop` without one. */
  readonly fullStop: Prop<number>;
  readonly fadeIn: Prop<CompiledFade | undefined>;
  readonly fadeOut: Prop<CompiledFade | undefined>;
  /**
   * Whether this LUNA reports fades on compiled clips. When false, `fadeIn` and `fadeOut` are
   * always `undefined` because LUNA does not say, not because there are none; draw no fades
   * and offer no fade editing.
   */
  readonly reportsFades: Prop<boolean>;
  /**
   * The rendering this segment plays when its clip is time-stretched: LUNA renders each
   * compiled piece of a clip on its own, so a clip split by one on top has a render per piece
   * and its own `renderSourceUid` names only one of them (fact 116). `null` when this segment
   * is not rendered; `undefined` on a LUNA that does not report it.
   */
  readonly renderSourceUid: Prop<string | null>;
  /** This segment's range in {@link renderSourceUid}, nanoseconds; `null` without a render. */
  readonly renderSourceStart: Prop<number | null>;
  readonly renderSourceStop: Prop<number | null>;
  /**
   * Whether this segment plays a rendering: time-stretched, with clip effects, or at another
   * sample rate than the engine's. While LUNA makes one, `renderSourceUid` is `null` and this
   * stays true, so the original file is not what plays (fact 116). `undefined` on a LUNA that
   * does not report it.
   */
  readonly needsRender: Prop<boolean>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    /** @internal The playlist's compiled clips, to hand back the piece a move lands as. */
    private readonly siblings?: () => CompiledClips,
  ) {
    super(client, path);
    this.clipUid = this.prop<string>('clip_uid');
    this.name = this.prop<string>('name');
    this.start = this.prop<number>('start');
    this.stop = this.prop<number>('stop');
    this.sourceStart = this.prop<number>('source_start');
    this.sourceStop = this.prop<number>('source_stop');
    const fullStart = this.prop<number>('full_start');
    const fullStop = this.prop<number>('full_stop');
    this.fullStart = derived([fullStart, this.start], () => fullStart.value ?? this.start.value);
    this.fullStop = derived([fullStop, this.stop], () => fullStop.value ?? this.stop.value);
    // full_start arrived with the fade properties, so its absence marks a LUNA without them.
    this.reportsFades = derived([fullStart], () => fullStart.value !== undefined && fullStart.value !== null, { distinct: true });
    this.renderSourceUid = this.prop<string | null>('render_source_uid');
    this.renderSourceStart = this.prop<number | null>('render_source_start');
    this.renderSourceStop = this.prop<number | null>('render_source_stop');
    this.needsRender = this.prop<boolean>('needs_render');
    this.fadeIn = this.fade('fade_in');
    this.fadeOut = this.fade('fade_out');
  }

  /**
   * Every field at once, as a frozen plain object, so a view draws one consistent state
   * rather than reading props across a push.
   *
   * @example
   * lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder().map((c) => c.snapshot())));
   */
  snapshot(): CompiledClipSnapshot {
    return Object.freeze({
      id: this.id,
      clipUid: this.clipUid.value,
      name: this.name.value,
      start: this.start.value,
      stop: this.stop.value,
      sourceStart: this.sourceStart.value,
      sourceStop: this.sourceStop.value,
      fullStart: this.fullStart.value,
      fullStop: this.fullStop.value,
      fadeIn: this.fadeIn.value,
      fadeOut: this.fadeOut.value,
      reportsFades: this.reportsFades.value ?? false,
      renderSourceUid: this.renderSourceUid.value,
      renderSourceStart: this.renderSourceStart.value ?? undefined,
      renderSourceStop: this.renderSourceStop.value ?? undefined,
      needsRender: this.needsRender.value,
    });
  }

  /**
   * Move what shows of this clip so it starts at `toTick`, as dragging it in LUNA does: LUNA's
   * `move_clips` over this segment's own range (fact 119). One undo step; resolves to the
   * segment at its new place. Where the clip runs on under another clip:
   *
   * - if it shows again further along (or before), LUNA **splits** it at this segment's edge:
   *   the segment moves as a new clip, and the rest stays where it was;
   * - if the rest is hidden, LUNA **trims** it to this segment's edge and moves it.
   *
   * A clip lying wholly on top of this one is not moved, unlike {@link Clip.move}, which moves
   * everything inside the clip's span. The user's selection is put back afterwards.
   *
   * @example
   * const moved = await seg.move(seg.start.value! + Luna.WHOLE_NOTE);
   * const copy = await seg.move(seg.stop.value!, { copy: true });
   */
  async move(toTick: number, options: { copy?: boolean } = {}): Promise<CompiledClip> {
    if (this.disposed) throw new UAError('disposed', 'the segment is gone', { path: this.path });
    const start = this.start.value;
    const stop = this.stop.value;
    if (start === undefined || stop === undefined) throw new UAError('unavailable', "move(): the segment's bounds are not loaded yet", { path: this.path });
    requireTick(toTick, 'toTick');
    if (toTick < 0) throw new UAError('out_of_range', 'move(): toTick must not be negative', { path: this.path });
    const siblings = this.siblings?.();
    if (!siblings) throw new UAError('unavailable', 'this segment was not reached through a playlist', { path: this.path });
    const [, , sessionUid, , playlistUid] = this.path.split('/');
    const context = new Context(this.client, `/sessions/${sessionUid}/contexts/main`, sessionUid!);
    await context.refreshSelection().catch(() => {});
    const saved = context.snapshot();
    try {
      await this.wire.post(`/sessions/${sessionUid}/contexts/main/commands/move_clips`, {
        session_uid: sessionUid, context_type: 'main', playlist_uid: [playlistUid], start, stop, location: toTick, ...(options.copy ? { copy: true } : {}),
      });
    } finally {
      await context.restore(saved).catch(() => {});
    }
    const length = stop - start;
    const landed = () => siblings.items.find((c) => c.start.value === toTick && c.stop.value === toTick + length);
    await settle(() => landed() !== undefined, options.copy ? 'copy segment' : 'move segment', {
      path: this.path,
      refresh: () => siblings.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
    return landed()!;
  }

  /**
   * Crossfade from this segment into `next`, the segment that starts where this one stops on
   * the same playlist: butted clips, or overlapping ones where a clip on top begins or ends
   * over another (fact 117). `align` puts the fade across the edit (`center`, the default),
   * before it or after it; calling again changes the length. One undo step, or two when
   * `shape` changes an existing crossfade's shape. Resolves once LUNA shows it. Each clip's
   * source must reach past the edit by the part of the fade on the other side; LUNA does not
   * check. Audio clips only.
   *
   * @example
   * const [a, b] = lane.compiledClips.inOrder();
   * await a.crossfade(b, Luna.EIGHTH_NOTE);
   */
  async crossfade(next: CompiledClip, lengthTicks: number, options: { align?: 'center' | 'before' | 'after'; shape?: FadeShape } = {}): Promise<void> {
    const edge = this.edgeWith(next, 'crossfade');
    const length = requireTick(lengthTicks, 'lengthTicks');
    if (length <= 0) throw new UAError('out_of_range', 'crossfade(): lengthTicks must be positive', { path: this.path });
    const shape = options.shape;
    if (shape !== undefined && !['linear', 'equal_power', 'log'].includes(shape)) throw new UAError('out_of_range', 'crossfade(): shape must be one of linear, equal_power, log', { path: this.path });
    const align = options.align ?? 'center';
    const [startOffset, stopOffset] = align === 'before' ? [-length, 0] : align === 'after' ? [0, length] : [-Math.floor(length / 2), length - Math.floor(length / 2)];
    const [, , sessionUid, , playlistUid] = this.path.split('/');
    const commands = `/sessions/${sessionUid}/contexts/main/commands`;
    // Offsets are relative to the edit LUNA hears, not to either clip's own edge (fact 117).
    const reply = (await this.wire.post(`${commands}/set_fade`, {
      session_uid: sessionUid,
      ...(shape ? { fade_shape: shape } : {}),
      clips: [{ playlist_uid: playlistUid, clip_uid: this.clipUid.value, contributor_clip_uid: next.clipUid.value, fade_type: 'cross_fade', start_offset: startOffset, stop_offset: stopOffset, trim_to_edge: false, fade_reference_edge: 'none' }],
    })) as { edit_results?: { changed?: { fades?: { fade_uid?: string }[] } } } | null;
    const changed = (reply?.edit_results?.changed?.fades ?? []).map((f) => f.fade_uid).filter((u): u is string => typeof u === 'string');
    if (shape && changed.length) await this.wire.post(`${commands}/change_fade_curvature`, { session_uid: sessionUid, fades: changed, fade_shape: shape });
    const out = () => this.fadeOut.value;
    await settle(() => out()?.contributorClipUid === next.clipUid.value && out()!.start === edge + startOffset && out()!.stop === edge + stopOffset, 'crossfade', this.settleOptions());
  }

  /**
   * Remove the crossfade between this segment and `next`, both halves. Resolves at once when
   * there is none.
   *
   * @example
   * await a.removeCrossfade(b);
   */
  async removeCrossfade(next: CompiledClip): Promise<void> {
    const edge = this.edgeWith(next, 'removeCrossfade');
    const out = this.fadeOut.value;
    const into = next.fadeIn.value;
    const halves = [out, into].filter((f): f is CompiledFade => f !== undefined && f.crossfade);
    if (!halves.length) return;
    // `delete_fades` takes the fades lying wholly inside a range, looking only at segments that
    // overlap it, so reach one tick past the edit each side (fact 117).
    const [, , sessionUid, , playlistUid] = this.path.split('/');
    await this.wire.post(`/sessions/${sessionUid}/contexts/main/commands/delete_fades`, {
      session_uid: sessionUid, playlist_uid: [playlistUid],
      start: Math.min(edge - 1, ...halves.map((f) => f.start)), stop: Math.max(edge + 1, ...halves.map((f) => f.stop)),
    });
    await settle(() => !this.fadeOut.value?.crossfade && !next.fadeIn.value?.crossfade, 'remove crossfade', this.settleOptions());
  }

  /** The edit between this segment and `next`, checked: adjoining, same lane, both audio. */
  private edgeWith(next: CompiledClip, what: string): number {
    if (this.disposed || next.disposed) throw new UAError('disposed', `${what}(): a segment is gone`, { path: this.path });
    const stop = this.stop.value;
    const lane = (path: string) => path.slice(0, path.indexOf('/compiled_clips/'));
    if (lane(next.path) !== lane(this.path)) throw new UAError('out_of_range', `${what}(): both segments must be on the same playlist`, { path: this.path });
    if (stop === undefined || next.start.value !== stop) throw new UAError('out_of_range', `${what}(): the next segment must start where this one stops`, { path: this.path });
    if (!this.reportsFades.value) throw new UAError('unavailable', `${what}(): this LUNA does not report fades on compiled clips`, { path: this.path });
    for (const seg of [this, next]) {
      const type = this.client.store.cell<unknown>(`${lane(this.path)}/clips/${seg.clipUid.value}`, 'clip_type').value;
      if (type !== undefined && type !== 'audio' && type !== 0) throw new UAError('unavailable', `${what}(): LUNA fades audio clips only`, { path: seg.path });
    }
    return stop;
  }

  private settleOptions() {
    const siblings = this.siblings?.();
    return {
      path: this.path,
      disposed: () => this.disposed,
      ...(siblings ? { refresh: () => siblings.reload() } : {}),
      flush: () => this.client.store.scheduler.flush(),
    };
  }

  /** The seven flat `<prefix>_*` properties as one object, `undefined` when LUNA sends null. */
  private fade(prefix: 'fade_in' | 'fade_out'): Prop<CompiledFade | undefined> {
    const uid = this.prop<string | null>(`${prefix}_uid`);
    const start = this.prop<number | null>(`${prefix}_start`);
    const stop = this.prop<number | null>(`${prefix}_stop`);
    const shape = this.prop<string | null>(`${prefix}_shape`);
    const curvature = this.prop<number | null>(`${prefix}_curvature`);
    const crossfade = this.prop<boolean | null>(`${prefix}_crossfade`);
    const contributor = this.prop<string | null>(`${prefix}_contributor_clip_uid`);
    return derived(
      [uid, start, stop, shape, curvature, crossfade, contributor],
      () => {
        if (typeof uid.value !== 'string' || typeof start.value !== 'number' || typeof stop.value !== 'number') return undefined;
        return Object.freeze({
          uid: uid.value,
          start: start.value,
          stop: stop.value,
          shape: shape.value ?? 'log',
          curvature: curvature.value ?? 0,
          crossfade: crossfade.value === true,
          contributorClipUid: contributor.value ?? undefined,
        });
      },
      { distinct: true },
    );
  }
}

/**
 * A playlist's compiled clips. Loading or watching turns on `enable_compiled_clips` first,
 * since LUNA publishes nothing until a client asks (fact 116). The SDK never turns it off: the
 * switch is shared by every client of the session.
 *
 * Members come in the order LUNA made them, not timeline order; use {@link inOrder} to draw.
 *
 * @example
 * await lane.compiledClips.load();
 * lane.compiledClips.onChange(() => draw(lane.compiledClips.inOrder()));
 */
export class CompiledClips extends Collection<CompiledClip> {
  private enabling: Promise<void> | undefined;
  private readonly enable: () => Promise<unknown>;

  /** @internal */
  constructor(client: Client, path: string, enable: () => Promise<unknown>) {
    // Members reach back to this list (to return where a move lands) only after construction.
    let self: CompiledClips | undefined;
    super(client, path, (p) => new CompiledClip(client, p, () => self!), { levels: 2, commands: false, flatvalue: true });
    self = this;
    this.enable = enable;
  }

  /** Turn on publishing (once), then fetch the members. */
  override load(): Promise<void> {
    return this.enabled().then(() => super.load());
  }

  override async reload(): Promise<void> {
    await this.enabled();
    await super.reload();
  }

  override watch(options: { recursive?: boolean } = {}): { ready: Promise<void>; release: Unsubscribe } {
    const ready = this.enabled();
    const w = super.watch(options);
    return { ready: Promise.all([ready, w.ready]).then(() => undefined), release: w.release };
  }

  /**
   * Segments by timeline position, earliest first.
   *
   * @example
   * const first = lane.compiledClips.inOrder()[0];
   */
  inOrder(): CompiledClip[] {
    return [...this.items].sort((a, b) => (a.start.value ?? 0) - (b.start.value ?? 0));
  }

  /**
   * The segments cut from one clip, earliest first: none when it is fully covered, two or
   * more when a clip on a higher layer splits it.
   *
   * @example
   * const shown = lane.compiledClips.ofClip(clip.id).length > 0;
   */
  ofClip(clipUid: string): CompiledClip[] {
    return this.inOrder().filter((c) => c.clipUid.value === clipUid);
  }

  private enabled(): Promise<void> {
    this.enabling ??= this.enable().then(
      () => undefined,
      (err: unknown) => {
        this.enabling = undefined;
        throw err;
      },
    );
    return this.enabling;
  }
}
