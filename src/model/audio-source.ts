/**
 * A source audio file in the session's workspace package:
 * `/workspace/sessions/<package uid>/audio/<file uid>`. Clips reference these by `sourceUid`.
 *
 * The overview is the only analysis LUNA publishes, and it is not PCM: each pair is the
 * minimum and maximum of a fixed slice of time. Pairs are **time-based**, 125 samples at the
 * engine's 48 kHz whatever the file's own rate (fact 72), so a two-second file has 768 fine
 * pairs at 44.1, 48 or 96 kHz. `overview_coarse` is twelve fine pairs, 31.25 ms.
 *
 * @example
 * const src = session.sources?.byId(clip.sourceUid.value!);
 * const page = await src!.overview({ index: 0, count: 1024 });   // min/max floats -1..1
 * const total = await src!.overviewInfo();                       // { count, md5 }
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Node } from './node';

/** `fine` is `analysis/overview` (2.604 ms per pair), `coarse` is `analysis/overview_coarse` (12 fine pairs, 31.25 ms). Fact 72. */
export type OverviewKind = 'fine' | 'coarse';

export interface OverviewOptions {
  /** Zero-based overview-pair index, not a sample or channel index. Default 0. */
  index?: number;
  /** Maximum pairs per channel, 1-4096. Default 1024; no unbounded reads. */
  count?: number;
  /** Which analysis to page. Default `fine`. */
  kind?: OverviewKind;
}

/** What LUNA reports about one analysis: total pairs, and a digest that changes when the pairs do. */
export interface OverviewInfo {
  readonly count: number;
  /** Stable while the analysis is; a page cache keys on it. */
  readonly md5: string | undefined;
}

export interface Overview {
  /** The first pair returned: `channels[c].min[i]` covers pair `index + i`. */
  index: number;
  /** Pairs actually returned per channel. Short of what was asked means the analysis ended there, or is still growing. */
  count: number;
  /** Which analysis this came from. */
  kind: OverviewKind;
  /** Bins per second of audio: 384 fine, 32 coarse. */
  binsPerSecond: number;
  channels: { min: Float32Array; max: Float32Array }[];
}

const FIXED16_SCALE = 32768;
const MAX_PAGE = 4096;
const MAX_CHANNELS = 64;

const analysisName = (kind: OverviewKind): string => (kind === 'coarse' ? 'overview_coarse' : 'overview');

export class AudioSource extends Node {
  readonly name: Prop<string>;
  /** `mono` or `stereo`. */
  readonly stemFormat: Prop<string>;
  /** Duration in nanoseconds. */
  readonly length: Prop<number>;
  readonly sampleRate: Prop<number>;
  readonly created: Prop<unknown>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.name = this.prop<string>('name');
    this.stemFormat = this.prop<string>('stem_format');
    this.length = this.prop<number>('length');
    this.sampleRate = this.prop<number>('sample_rate');
    this.created = this.prop<unknown>('created');
  }

  get channelCount(): number {
    return this.stemFormat.value === 'stereo' ? 2 : 1;
  }

  /** Duration in seconds. */
  get seconds(): number | undefined {
    const ns = this.length.value;
    return ns === undefined ? undefined : ns / 1e9;
  }

  /**
   * The analysis node's pair count and digest, or `undefined` when there is no analysis yet
   * (a file LUNA has not finished scanning, or a render it has named but not written).
   *
   * @example
   * const info = await source.overviewInfo();
   * if (info) for (let n = 0; n * 1024 < info.count; n++) draw(await source.overview({ index: n * 1024 }));
   */
  async overviewInfo(options: { kind?: OverviewKind } = {}): Promise<OverviewInfo | undefined> {
    const kind = options.kind ?? 'fine';
    const reply = (await this.client.raw
      .get(`${this.path}/analysis/${analysisName(kind)}`, { children: false, commands: false, propfilter: ['count', 'md5'] })
      .catch(() => undefined)) as Record<string, unknown> | undefined;
    const count = readProperty(reply, 'count');
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) return undefined;
    const md5 = readProperty(reply, 'md5');
    return Object.freeze({ count, md5: typeof md5 === 'string' ? md5 : undefined });
  }

  /**
   * Read one bounded page of the waveform overview. Bins are int16 min/max pairs per channel
   * on the wire; here they are floats in -1..1.
   *
   * A bare number is the legacy form and means `{ index }` with the default count.
   *
   * @example
   * const page = await source.overview({ index: 0, count: 512, kind: 'coarse' });
   */
  async overview(options: OverviewOptions | number = {}): Promise<Overview | undefined> {
    const { index = 0, count = 1024, kind = 'fine' } = typeof options === 'number' ? { index: options } : options;
    if (!Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(count) || count < 1 || count > MAX_PAGE) {
      throw new UAError('out_of_range', `overview(): index must be >= 0 and count 1-${MAX_PAGE}`, { path: this.path });
    }
    const path = `${this.path}/analysis/${analysisName(kind)}/file/data`;
    const query = `count=${count}${index > 0 ? `&index=${index}` : ''}`;
    const reply = (await this.client.raw.get(`${path}?${query}`, { properties: true })) as { value?: OverviewWire } | OverviewWire | undefined;
    const value = reply && 'value' in (reply as object) ? (reply as { value?: OverviewWire }).value : (reply as OverviewWire | undefined);
    if (!value || !Array.isArray(value.data)) return undefined;
    if (value.data.length > MAX_CHANNELS) throw new UAError('invalid_response', 'overview(): implausible channel count', { path });
    const channels = value.data.map((ch) => ({ min: toFloats(ch.min, count, path), max: toFloats(ch.max, count, path) }));
    const returned = channels[0]?.min.length ?? 0;
    if (channels.some((ch) => ch.min.length !== returned || ch.max.length !== returned)) {
      throw new UAError('invalid_response', 'overview(): channels disagree on length', { path });
    }
    return { index, count: returned, kind, binsPerSecond: 1e9 / pairNs(kind), channels };
  }
}

/** Nanoseconds per fine overview pair: 125 samples at 48 kHz (fact 72). */
export const OVERVIEW_PAIR_NS = 125e9 / 48000;
/** Fine pairs per coarse pair. */
export const COARSE_PAIRS_PER_FINE = 12;
/** Nanoseconds per coarse overview pair: 31.25 ms. */
export const COARSE_PAIR_NS = OVERVIEW_PAIR_NS * COARSE_PAIRS_PER_FINE;

/** Nanoseconds one pair of this analysis covers. */
export function pairNs(kind: OverviewKind): number {
  return kind === 'coarse' ? COARSE_PAIR_NS : OVERVIEW_PAIR_NS;
}

interface OverviewWire {
  count?: number;
  sample_rate?: number;
  data?: { min?: number[]; max?: number[] }[];
}

/**
 * A `get` of a node answers a bare value map, a `properties` map, or a `properties` array,
 * and each value is either bare or wrapped in `{ value }` depending on `flatvalue`.
 */
function readProperty(reply: unknown, name: string): unknown {
  if (typeof reply !== 'object' || reply === null) return undefined;
  const node = reply as Record<string, unknown>;
  const properties = node['properties'];
  if (Array.isArray(properties)) {
    for (const entry of properties) {
      if (typeof entry === 'object' && entry !== null && (entry as { name?: unknown }).name === name) return unwrap((entry as { value?: unknown }).value);
    }
  } else if (typeof properties === 'object' && properties !== null && name in (properties as Record<string, unknown>)) {
    return unwrap((properties as Record<string, unknown>)[name]);
  }
  if (name in node) return unwrap(node[name]);
  return undefined;
}

/** `{ value: X }` is how a property arrives without `flatvalue`. */
function unwrap(value: unknown): unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'value' in (value as object) ? (value as { value: unknown }).value : value;
}

function toFloats(ints: number[] | undefined, limit: number, path: string): Float32Array {
  if (ints && ints.length > limit) throw new UAError('invalid_response', 'overview(): page longer than requested', { path });
  const out = new Float32Array(ints?.length ?? 0);
  if (ints) for (let i = 0; i < ints.length; i++) out[i] = Number(ints[i]) / FIXED16_SCALE;
  return out;
}
