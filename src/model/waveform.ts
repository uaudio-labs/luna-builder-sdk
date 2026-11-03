/**
 * Waveform placement: which audio a clip actually plays, which overview pairs cover a range
 * of it, where a timeline tick lands inside that audio, and a bounded cache of overview
 * pages so scrolling a timeline does not re-read LUNA.
 *
 * Nothing here subscribes, writes, or invents samples. Where LUNA has no analysis the
 * answer is `undefined` and the caller draws an outline, never silence.
 *
 * Measured on LUNA 2.0.6.4543 (facts 72-73):
 *   - Overview pairs are time-based, 2.604 ms fine and 31.25 ms coarse, contiguous and
 *     non-overlapping, channels in file order, minima and maxima separate.
 *   - A clip plays its source directly only when its tick span equals its source span in
 *     time at the session tempo. Otherwise LUNA renders a time-stretched 48 kHz source,
 *     names it in `render_source_uid` with `render_state: current`, and announces it in the
 *     workspace audio folder a few seconds later. That render's length is the clip's span in
 *     seconds, so its overview maps onto the clip linearly; the original's pairs would be at
 *     the wrong scale. {@link clipAudio} picks the right one and says which.
 *
 * @example
 * const cache = new Luna.Waveforms();
 * const audio = Luna.clipAudio(clip, session.sources!);
 * if (audio) {
 *   const kind = Luna.kindForScale(nsPerPixel);
 *   const range = await cache.range(audio.source, audio.startNs, audio.stopNs, kind);
 *   const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, clip, audio, tickAtPx(i)));
 *   draw(cols.channels, Luna.waveformLanes(cols.channels.length, top, height));
 * }
 */
import { UAError } from '../wire/errors';
import { AudioSource, COARSE_PAIR_NS, pairNs, type OverviewKind } from './audio-source';
import type { Clip } from './clip';
import type { Timeline } from './musical';

export { COARSE_PAIRS_PER_FINE, COARSE_PAIR_NS, OVERVIEW_PAIR_NS, pairNs } from './audio-source';

/** Pairs per cached page; four pages cover a minute of fine pairs. */
export const WAVEFORM_PAGE = 1024;

/**
 * The analysis to draw at a zoom level: `coarse` once a pixel spans at least one coarse pair
 * (31.25 ms), `fine` when zoomed closer. Below one fine pair per pixel the same pair repeats;
 * neither analysis is PCM.
 */
export function kindForScale(nsPerPixel: number): OverviewKind {
  if (!Number.isFinite(nsPerPixel) || nsPerPixel <= 0) throw new UAError('out_of_range', 'kindForScale(): nsPerPixel must be a positive number');
  return nsPerPixel >= COARSE_PAIR_NS ? 'coarse' : 'fine';
}

export interface PairRange {
  /** First pair whose span touches `startNs`. */
  readonly index: number;
  /** Pairs up to the one containing `stopNs`; 0 when the range is empty. */
  readonly count: number;
}

/** The overview pairs covering `[startNs, stopNs)` of a source. Both are file offsets, never timeline ticks. */
export function pairRange(startNs: number, stopNs: number, kind: OverviewKind = 'fine'): PairRange {
  if (!Number.isFinite(startNs) || !Number.isFinite(stopNs) || startNs < 0) {
    throw new UAError('out_of_range', 'pairRange(): source offsets must be finite nanoseconds with start >= 0');
  }
  const p = pairNs(kind);
  const index = Math.floor(startNs / p);
  if (stopNs <= startNs) return Object.freeze({ index, count: 0 });
  return Object.freeze({ index, count: Math.ceil(stopNs / p) - index });
}

/** The clip fields placement needs. A {@link Clip} satisfies it, as does a plain snapshot. */
export interface ClipLike {
  readonly sourceUid: string | undefined;
  readonly sourceStartNs: number | undefined;
  readonly sourceStopNs: number | undefined;
  readonly renderSourceUid?: string | undefined;
  readonly renderState?: string | undefined;
}

export interface ClipAudio {
  /** The source whose overview matches what the engine plays. */
  readonly source: AudioSource;
  /** File range in nanoseconds: the clip's source range, or the whole render. */
  readonly startNs: number;
  readonly stopNs: number;
  /** True when `source` is LUNA's time-stretched render rather than the original file. */
  readonly stretched: boolean;
}

/** Anything that can resolve a source uid: `session.sources`, or a plain array. */
export type SourceLookup = { byId(uid: string): AudioSource | undefined } | readonly AudioSource[];

/** A `Clip` carries Props; a plain snapshot carries the values. Tell them apart by that. */
function snapshotOf(clip: ClipLike | Clip): ClipLike {
  const uid = (clip as ClipLike | Clip).sourceUid;
  if (typeof uid !== 'object' || uid === null) return clip as ClipLike;
  const c = clip as Clip;
  return {
    sourceUid: c.sourceUid.value,
    sourceStartNs: c.sourceStart.value,
    sourceStopNs: c.sourceStop.value,
    renderSourceUid: c.renderSourceUid.value,
    renderState: c.renderState.value,
  };
}

/**
 * Which audio a clip plays, or `undefined` when there is nothing safe to draw: no source, or
 * a render LUNA has named but not yet announced. In that second case draw the clip's outline
 * rather than the unstretched original at the wrong scale.
 *
 * @example
 * const audio = Luna.clipAudio(clip, session.sources!);
 */
function lookup(sources: SourceLookup, uid: string): AudioSource | undefined {
  return Array.isArray(sources) ? (sources as readonly AudioSource[]).find((s) => s.id === uid) : (sources as { byId(uid: string): AudioSource | undefined }).byId(uid);
}

export function clipAudio(clip: ClipLike | Clip, sources: SourceLookup): ClipAudio | undefined {
  const find = (uid: string): AudioSource | undefined => lookup(sources, uid);
  const snap = snapshotOf(clip);
  if (snap.renderState === 'current' && snap.renderSourceUid) {
    const render = find(snap.renderSourceUid);
    const length = render?.length.value;
    if (!render || length === undefined) return undefined;
    return Object.freeze({ source: render, startNs: 0, stopNs: length, stretched: true });
  }
  if (!snap.sourceUid || snap.sourceStartNs === undefined || snap.sourceStopNs === undefined) return undefined;
  const source = find(snap.sourceUid);
  if (!source) return undefined;
  return Object.freeze({ source, startNs: snap.sourceStartNs, stopNs: snap.sourceStopNs, stretched: false });
}

/** The compiled-clip fields placement needs. A {@link CompiledClip} satisfies it, as does its snapshot. */
type Value<T> = T | undefined | { readonly value: T | undefined };

export interface CompiledClipLike {
  readonly start: number | undefined | { readonly value: number | undefined };
  readonly stop: number | undefined | { readonly value: number | undefined };
  readonly sourceStart: number | undefined | { readonly value: number | undefined };
  readonly sourceStop: number | undefined | { readonly value: number | undefined };
  /** The segment's own rendering: a uid, `null` for none, `undefined` when LUNA does not say. */
  readonly renderSourceUid?: string | null | undefined | { readonly value: string | null | undefined };
  readonly renderSourceStart?: number | null | undefined | { readonly value: number | null | undefined };
  readonly renderSourceStop?: number | null | undefined | { readonly value: number | null | undefined };
  /** True when the segment plays a rendering, made or still being made. */
  readonly needsRender?: boolean | undefined | { readonly value: boolean | undefined };
}

function valueOf<T>(v: Value<T>): T | undefined {
  return typeof v === 'object' && v !== null && 'value' in (v as object) ? (v as { readonly value: T | undefined }).value : (v as T | undefined);
}

/**
 * Which audio one compiled segment plays, over the segment only, or `undefined` when there is
 * nothing safe to draw (see {@link clipAudio}). `clip` is the raw clip the segment is cut from
 * (`playlist.clips.byId(segment.clipUid.value)`): it names the source. Map ticks with
 * {@link audioNsAtTick} anchored at the segment, which also reaches into a crossfade's
 * `fullStart`..`fullStop`.
 *
 * A time-stretched clip plays LUNA's renders, one per compiled piece (fact 116), so a segment
 * draws its own `renderSourceUid` over `renderSourceStart`..`renderSourceStop`. On a LUNA that
 * does not report those, only the clip's first piece can be placed, by cutting the clip's own
 * render by time; a later piece is `undefined`, an outline rather than the wrong audio. While
 * LUNA makes a segment's rendering (after an edit that changes it, such as a crossfade) the
 * answer is `undefined` too, not the original file at the wrong scale.
 *
 * @example
 * for (const seg of lane.compiledClips.inOrder()) {
 *   const clip = lane.clips.byId(seg.clipUid.value);
 *   const audio = clip && Luna.compiledClipAudio(timeline, seg, clip, session.sources);
 *   if (!audio) continue;
 *   const range = await cache.range(audio.source, audio.startNs, audio.stopNs, kind);
 *   const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, seg, audio, tickAtPx(i)));
 * }
 */
export function compiledClipAudio(
  timeline: Timeline,
  segment: CompiledClipLike,
  clip: (ClipLike & { readonly startTicks: number | undefined }) | Clip,
  sources: SourceLookup,
): ClipAudio | undefined {
  const start = valueOf(segment.start);
  const stop = valueOf(segment.stop);
  if (start === undefined || stop === undefined) return undefined;
  const render = valueOf(segment.renderSourceUid);
  if (typeof render === 'string' && render) {
    const source = lookup(sources, render);
    const from = valueOf(segment.renderSourceStart);
    const to = valueOf(segment.renderSourceStop);
    const length = source?.length.value;
    if (!source || typeof from !== 'number' || typeof to !== 'number') return undefined;
    return Object.freeze({ source, startNs: Math.max(0, from), stopNs: length === undefined ? to : Math.min(length, to), stretched: true });
  }
  // A segment that plays a rendering LUNA has not made yet: nothing safe to draw (fact 116).
  if (valueOf(segment.needsRender) === true) return undefined;
  const whole = clipAudio(clip, sources);
  const stretchedClip = snapshotOf(clip).renderState === 'current';
  // LUNA reports per-segment renders and this one has none yet: a stretched clip's original
  // source would be at the wrong scale, so draw an outline until the render arrives.
  if (render === null && stretchedClip) return undefined;
  if (!whole) return undefined;
  if (whole.stretched) {
    // An older LUNA: the clip's render is its first piece's, starting at the clip start.
    const clipStart = 'startTicks' in clip ? clip.startTicks : clip.start.value;
    // Without a loaded tempo map the stretched range is unknown: an outline, not a guess.
    if (clipStart === undefined || start !== clipStart || !timeline.tempoLoaded) return undefined;
    const at = (tick: number) => Math.max(0, (timeline.seconds(tick) - timeline.seconds(clipStart)) * 1e9);
    return Object.freeze({ source: whole.source, startNs: at(start), stopNs: Math.min(whole.stopNs, at(stop)), stretched: true });
  }
  // LUNA rewrites a segment's source range to cover only that segment (fact 116).
  const startNs = valueOf(segment.sourceStart);
  const stopNs = valueOf(segment.sourceStop);
  if (startNs === undefined || stopNs === undefined) return undefined;
  return Object.freeze({ source: whole.source, startNs, stopNs, stretched: false });
}

/**
 * The file offset (ns) that plays at a timeline tick inside a clip: the clip's audio start
 * plus the tempo-map seconds between the clip start and the tick. Linear in seconds, not in
 * ticks, so a tempo change inside the clip bends the mapping exactly as the engine does.
 *
 * The result can lie outside `[audio.startNs, audio.stopNs)` for ticks outside the clip;
 * clamp before drawing there. Throws `unavailable` while the tempo map is not loaded.
 *
 * @example
 * const ns = Luna.audioNsAtTick(session.musical.timeline, clip, audio, playheadTick);
 */
export function audioNsAtTick(timeline: Timeline, clip: { start: { value: number | undefined } } | { startTicks: number | undefined }, audio: ClipAudio, tick: number): number {
  const startTicks = 'startTicks' in clip ? clip.startTicks : clip.start.value;
  if (startTicks === undefined) throw new UAError('out_of_range', 'audioNsAtTick(): the clip has no start tick');
  const offset = timeline.seconds(tick) - timeline.seconds(startTicks);
  return audio.startNs + offset * 1e9;
}

export interface WaveformChannel {
  readonly min: Float32Array;
  readonly max: Float32Array;
}

export interface WaveformRange {
  readonly kind: OverviewKind;
  readonly pairNs: number;
  /** The first pair returned; `channels[c].min[i]` covers `[(index + i) * pairNs, (index + i + 1) * pairNs)`. */
  readonly index: number;
  /** Pairs actually returned per channel. */
  readonly count: number;
  readonly channels: readonly WaveformChannel[];
  /** False when the analysis ended (or is still growing) before the requested range. */
  readonly complete: boolean;
}

/**
 * A bounded cache of overview pages, keyed by source, analysis and page index. A short page
 * (the end of the analysis, or growth in progress) is never cached, so a recording still
 * being written is re-read until it settles.
 *
 * The cache does not watch LUNA: call `invalidate(uid)` when a source is removed or its
 * `overviewInfo().md5` changes.
 *
 * @example
 * const cache = new Luna.Waveforms({ maxPages: 512 });
 * const range = await cache.range(audio.source, audio.startNs, audio.stopNs, 'coarse');
 */
export class Waveforms {
  private readonly pages = new Map<string, Awaited<ReturnType<AudioSource['overview']>>>();
  private readonly inFlight = new Map<string, Promise<Awaited<ReturnType<AudioSource['overview']>>>>();
  private readonly max: number;

  constructor(options: { maxPages?: number } = {}) {
    this.max = Math.max(1, options.maxPages ?? 256);
  }

  /** Pages held right now. */
  get size(): number {
    return this.pages.size;
  }

  /** Drop one source's pages, or everything. */
  invalidate(uid?: string): void {
    if (uid === undefined) {
      this.pages.clear();
      return;
    }
    for (const key of [...this.pages.keys()]) if (key.startsWith(`${uid}:`)) this.pages.delete(key);
  }

  /** The pairs covering `[startNs, stopNs)` of `source`, assembled from cached and fresh pages. */
  async range(source: AudioSource, startNs: number, stopNs: number, kind: OverviewKind = 'fine'): Promise<WaveformRange> {
    const { index, count } = pairRange(startNs, stopNs, kind);
    const p = pairNs(kind);
    if (count === 0) return Object.freeze({ kind, pairNs: p, index, count: 0, channels: Object.freeze([]), complete: true });
    const first = Math.floor(index / WAVEFORM_PAGE);
    const last = Math.floor((index + count - 1) / WAVEFORM_PAGE);
    const pages: NonNullable<Awaited<ReturnType<AudioSource['overview']>>>[] = [];
    for (let n = first; n <= last; n++) {
      const page = await this.page(source, kind, n);
      if (!page) break;
      pages.push(page);
      if (page.count < WAVEFORM_PAGE) break; // the analysis ends inside this page
    }
    const channelCount = Math.max(0, ...pages.map((pg) => pg.channels.length));
    const channels: WaveformChannel[] = [];
    for (let c = 0; c < channelCount; c++) {
      const min: number[] = [];
      const max: number[] = [];
      for (const page of pages) {
        const ch = page.channels[c];
        if (!ch) continue;
        const from = Math.max(index, page.index) - page.index;
        const to = Math.min(index + count, page.index + page.count) - page.index;
        if (to <= from) continue;
        for (let i = from; i < to; i++) {
          min.push(ch.min[i]!);
          max.push(ch.max[i]!);
        }
      }
      channels.push(Object.freeze({ min: Float32Array.from(min), max: Float32Array.from(max) }));
    }
    const returned = channels[0]?.min.length ?? 0;
    return Object.freeze({ kind, pairNs: p, index, count: returned, channels: Object.freeze(channels), complete: returned === count });
  }

  private page(source: AudioSource, kind: OverviewKind, n: number): Promise<Awaited<ReturnType<AudioSource['overview']>>> {
    const key = `${source.id}:${kind}:${n}`;
    const hit = this.pages.get(key);
    if (hit) {
      this.pages.delete(key); // move to the most-recent end
      this.pages.set(key, hit);
      return Promise.resolve(hit);
    }
    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = source.overview({ index: n * WAVEFORM_PAGE, count: WAVEFORM_PAGE, kind }).then((page) => {
        if (page && page.count === WAVEFORM_PAGE) {
          this.pages.set(key, page);
          while (this.pages.size > this.max) this.pages.delete(this.pages.keys().next().value as string);
        }
        return page;
      });
      this.inFlight.set(key, pending);
      void pending.catch(() => {}).finally(() => this.inFlight.delete(key));
    }
    return pending;
  }
}

/** Options for {@link waveformColumns}. */
export interface WaveformScale {
  /**
   * Linear multiplier on every value, clipped to -1..1; default 1. Must be finite and > 0.
   * LUNA multiplies by its waveform zoom and the clip's gain:
   * `session.context.waveformZoom.value * 10 ** (clip.gain.value / 20)`.
   */
  readonly gain?: number;
}

/**
 * The loudest absolute value in a range, across every channel, in 0..1; 0 when the range is
 * empty. To normalize a clip, pass `gain: 1 / peak` to {@link waveformColumns}, taking the
 * peak from the clip's whole range, not the visible columns, so the scale holds while
 * scrolling.
 *
 * @example
 * const peak = Luna.waveformPeak(range);   // 0.25 for a clip peaking at -12 dBFS
 */
export function waveformPeak(range: WaveformRange): number {
  let peak = 0;
  for (const ch of range.channels) {
    for (let p = 0; p < ch.min.length; p++) peak = Math.max(peak, Math.abs(ch.min[p]!), Math.abs(ch.max[p]!));
  }
  return peak;
}

export interface WaveformColumns {
  /** Columns returned; `channels[c].min[i]` is column `i`. */
  readonly width: number;
  /**
   * One entry per source channel, in file order (left then right for stereo), never folded
   * together. A column with no pair under it is `NaN` in both arrays: draw nothing there.
   */
  readonly channels: readonly WaveformChannel[];
}

/** Column states while reducing: outside the range, holding its own pairs, or between pairs. */
const OUTSIDE = 0;
const OWN = 1;
const BETWEEN = 2;

/**
 * Reduce a {@link WaveformRange} to one min/max per drawn column, per channel, the way LUNA's
 * own timeline does:
 *
 * - a column holds the loudest of the pairs that end inside it, so peaks survive zooming out;
 * - its minimum is never above zero and its maximum never below, so the shape always touches
 *   the zero line;
 * - zoomed in past one pair per column, the columns between two pairs are interpolated
 *   linearly between them rather than repeating a pair as a step;
 * - values are linear, times `gain` ({@link WaveformScale}), clipped to -1..1. LUNA draws no
 *   decibel curve; its gain is the window's waveform zoom times the clip gain.
 *
 * `nsAt(i)` is the file offset (ns) at the left edge of column `i`, for `i` in `0..width`,
 * and must not decrease; column `i` covers `[nsAt(i), nsAt(i + 1))`. For a timeline that is
 * {@link audioNsAtTick} of the tick at that edge, so a tempo change bends the mapping as the
 * engine does. Columns outside the range are `NaN`. For a sharp shape on a high-density
 * display, use one column per device pixel.
 *
 * Draw each channel in its own lane ({@link waveformLanes}) with {@link traceWaveform};
 * folding a stereo range into one shape makes it look mono.
 *
 * @example
 * const cols = Luna.waveformColumns(range, width, (i) => Luna.audioNsAtTick(timeline, clip, audio, tickAtPx(x0 + i)),
 *   { gain: session.context.waveformZoom.value * 10 ** ((clip.gain.value ?? 0) / 20) });
 * const lanes = Luna.waveformLanes(cols.channels.length, top, height);
 * ctx.beginPath();
 * cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0));
 * ctx.fill();
 */
export function waveformColumns(range: WaveformRange, width: number, nsAt: (column: number) => number, options: WaveformScale = {}): WaveformColumns {
  if (!Number.isInteger(width) || width < 0) throw new UAError('out_of_range', 'waveformColumns(): width must be a whole number of columns >= 0');
  const gain = options.gain ?? 1;
  if (!Number.isFinite(gain) || gain <= 0) throw new UAError('out_of_range', 'waveformColumns(): gain must be a finite number > 0');
  const out = range.channels.map(() => ({ min: new Float32Array(width).fill(Number.NaN), max: new Float32Array(width).fill(Number.NaN) }));
  const pairAt = (ns: number): number => Math.floor(ns / range.pairNs) - range.index;
  const inside = (p: number): boolean => p >= 0 && p < range.count;
  /** Min and max of pairs [a, b) of every channel, each widened to include zero. */
  const reduce = (i: number, a: number, b: number): void => {
    range.channels.forEach((ch, c) => {
      let lo = 0;
      let hi = 0;
      for (let p = a; p < b; p++) {
        if (ch.min[p]! < lo) lo = ch.min[p]!;
        if (ch.max[p]! > hi) hi = ch.max[p]!;
      }
      out[c]!.min[i] = lo;
      out[c]!.max[i] = hi;
    });
  };

  // Each column's own pairs: those from the one under its left edge up to the one under its
  // right edge. A column inside the range whose edges share a pair has none of its own.
  const state = new Uint8Array(width);
  const lefts = new Float64Array(width);
  let next = pairAt(nsAt(0));
  for (let i = 0; i < width; i++) {
    const first = next;
    next = pairAt(nsAt(i + 1));
    lefts[i] = first;
    if (!Number.isFinite(first) || !Number.isFinite(next)) continue;
    const a = Math.max(0, first);
    const b = Math.min(range.count, next);
    if (b > a) {
      reduce(i, a, b);
      state[i] = OWN;
    } else if (inside(first)) {
      state[i] = BETWEEN;
    }
  }

  // Interpolate each run of in-between columns from the column before it to the one after,
  // falling back to the pair under the run's own edge where the run starts or ends the view.
  const scratch = { min: new Float32Array(range.channels.length), max: new Float32Array(range.channels.length) };
  const pairValue = (p: number, into: { min: Float32Array; max: Float32Array }): void => {
    range.channels.forEach((ch, c) => {
      into.min[c] = Math.min(0, ch.min[p]!);
      into.max[c] = Math.max(0, ch.max[p]!);
    });
  };
  for (let s = 0; s < width; s++) {
    if (state[s] !== BETWEEN) continue;
    let e = s;
    while (e < width && state[e] === BETWEEN) e++;
    const prev = { min: new Float32Array(range.channels.length), max: new Float32Array(range.channels.length) };
    if (s > 0 && state[s - 1] === OWN) out.forEach((ch, c) => { prev.min[c] = ch.min[s - 1]!; prev.max[c] = ch.max[s - 1]!; });
    else pairValue(lefts[s]!, prev);
    if (e < width && state[e] === OWN) out.forEach((ch, c) => { scratch.min[c] = ch.min[e]!; scratch.max[c] = ch.max[e]!; });
    else pairValue(lefts[e - 1]!, scratch);
    const span = e - s + 1;
    for (let i = s; i < e; i++) {
      const t = (i - s + 1) / span;
      out.forEach((ch, c) => {
        ch.min[i] = prev.min[c]! + (scratch.min[c]! - prev.min[c]!) * t;
        ch.max[i] = prev.max[c]! + (scratch.max[c]! - prev.max[c]!) * t;
      });
    }
    s = e - 1;
  }

  if (gain !== 1) {
    for (const ch of out) {
      for (let i = 0; i < width; i++) {
        ch.min[i] = Math.max(-1, ch.min[i]! * gain);
        ch.max[i] = Math.min(1, ch.max[i]! * gain);
      }
    }
  }
  return Object.freeze({ width, channels: Object.freeze(out.map((ch) => Object.freeze(ch))) });
}

export interface WaveformLane {
  /** The lane's zero line. */
  readonly mid: number;
  /** Pixels from `mid` to full scale; `mid - max * half` is where a pair's maximum lands. */
  readonly half: number;
}

/**
 * Split `height` pixels from `top` into one equal lane per channel, stacked in file order
 * (left above right for stereo), each with a zero line and a full-scale half-height.
 * `gap` pixels are kept clear at the top and bottom of every lane; LUNA keeps none.
 *
 * @example
 * const [left, right] = Luna.waveformLanes(2, 20, 80, 0);   // left.mid 40, right.mid 80, half 20
 */
export function waveformLanes(channels: number, top: number, height: number, gap = 1): readonly WaveformLane[] {
  if (!Number.isInteger(channels) || channels < 0) throw new UAError('out_of_range', 'waveformLanes(): channels must be a whole number >= 0');
  const lane = channels ? height / channels : 0;
  const half = Math.max(0, lane / 2 - gap);
  return Object.freeze(Array.from({ length: channels }, (_, c) => Object.freeze({ mid: top + lane * (c + 0.5), half })));
}

/** The part of a canvas 2D context {@link traceWaveform} draws with; `CanvasRenderingContext2D` and `Path2D` both fit. */
export interface WaveformPathTarget {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
}

export interface TraceWaveformOptions {
  /** Width of one column in the target's units; default 1. Use `1 / devicePixelRatio` for device-pixel columns. */
  readonly columnWidth?: number;
  /**
   * Distance each outline sits beyond the zero line, so silence draws a thin axis line rather
   * than vanishing; default 0.5, as LUNA draws it.
   */
  readonly axis?: number;
}

/**
 * Add one channel's waveform to a path as LUNA fills it: for every run of drawable columns,
 * one closed shape through the column centres, the top outline (`mid - axis - max * half`)
 * left to right and the bottom outline (`mid + axis - min * half`) back, squared off at the
 * run's outer edges. `NaN` columns break the shape. It only adds subpaths; call
 * `beginPath()` before and `fill()` after, so several channels or clips fill in one go.
 *
 * @example
 * ctx.beginPath();
 * cols.channels.forEach((ch, c) => Luna.traceWaveform(ctx, ch, lanes[c], x0, { columnWidth: 1 / devicePixelRatio }));
 * ctx.fillStyle = '#000000a0';
 * ctx.fill();
 */
export function traceWaveform(target: WaveformPathTarget, channel: WaveformChannel, lane: WaveformLane, x0: number, options: TraceWaveformOptions = {}): void {
  const { columnWidth = 1, axis = 0.5 } = options;
  if (!Number.isFinite(columnWidth) || columnWidth <= 0) throw new UAError('out_of_range', 'traceWaveform(): columnWidth must be a finite number > 0');
  const { mid, half } = lane;
  const width = Math.min(channel.min.length, channel.max.length);
  const top = (i: number): number => mid - axis - channel.max[i]! * half;
  const bottom = (i: number): number => mid + axis - channel.min[i]! * half;
  const centre = (i: number): number => x0 + (i + 0.5) * columnWidth;
  for (let s = 0; s < width; s++) {
    if (Number.isNaN(channel.max[s]!) || Number.isNaN(channel.min[s]!)) continue;
    let e = s;
    while (e < width && !Number.isNaN(channel.max[e]!) && !Number.isNaN(channel.min[e]!)) e++;
    target.moveTo(x0 + s * columnWidth, top(s));
    for (let i = s; i < e; i++) target.lineTo(centre(i), top(i));
    target.lineTo(x0 + e * columnWidth, top(e - 1));
    target.lineTo(x0 + e * columnWidth, bottom(e - 1));
    for (let i = e - 1; i >= s; i--) target.lineTo(centre(i), bottom(i));
    target.lineTo(x0 + s * columnWidth, bottom(s));
    target.closePath();
    s = e;
  }
}
