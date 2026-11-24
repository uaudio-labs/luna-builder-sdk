/**
 * A source audio file in the session's workspace package:
 * `/workspace/sessions/<package uid>/audio/<file uid>`. Clips reference these by `sourceUid`.
 *
 * The overview is not PCM: each pair is the
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
import { derived, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import { Node } from './node';
import { SourceAnalysis } from './analysis';

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
  /**
   * The name to show: `name`, or `undefined` when the file has none. LUNA names some sources
   * with their own uid (fact 238); a blank name, or one that is the uid (with or without dashes
   * or an extension), counts as none. Show your own label then, such as the clip's name.
   *
   * @example
   * row.textContent = source.displayName.value ?? `Untitled (${source.seconds?.toFixed(1)} s)`;
   */
  readonly displayName: Prop<string | undefined>;
  /**
   * Where the file came from, LUNA's number for it (fact 239): see {@link SourceOrigin}.
   * `undefined` on a LUNA that does not publish it.
   */
  readonly origin: Prop<number | undefined>;
  /** LUNA's audio file format name, e.g. `wav` (fact 239). */
  readonly format: Prop<string | undefined>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.name = this.prop<string>('name');
    this.stemFormat = this.prop<string>('stem_format');
    this.length = this.prop<number>('length');
    this.sampleRate = this.prop<number>('sample_rate');
    this.created = this.prop<unknown>('created');
    this.displayName = derived([this.name], () => sourceDisplayName(this.name.value, this.id), { distinct: true });
    this.origin = this.prop<number | undefined>('origin');
    this.format = this.prop<string | undefined>('format');
  }

  /** True when LUNA named the file (see {@link displayName}). */
  get hasName(): boolean {
    return this.displayName.value !== undefined;
  }

  /**
   * True for a clip rendering (LUNA's own pass of a clip through its clip effects, time
   * stretch or sample-rate conversion), which LUNA keeps under `renders/clips/` and remakes as
   * needed, rather than a recording, import or bounce (fact 239).
   *
   * @example const files = sources.items.filter((s) => !s.isRender);
   */
  get isRender(): boolean {
    const o = this.origin.value;
    return o === SourceOrigin.ClipRendering || o === SourceOrigin.ClipRenderingIntermediate;
  }

  /** The session package uid this file belongs to, from its path. */
  get packageUid(): string {
    return this.path.split('/')[3] ?? '';
  }

  /**
   * The file's absolute path on disk (fact 239): `<package>/audio/<uid>.wav`, or
   * `<package>/renders/clips/<uid>.wav` for a rendering. Reads the package's folder from the
   * workspace once and keeps it. `undefined` when the package is unknown.
   *
   * Inside a session, `session.sourcePath(source)` answers the same without a read, which a
   * drag needs (see `Luna.startSourceDrag`).
   *
   * @example
   * const path = await source.filePath();
   */
  async filePath(): Promise<string | undefined> {
    if (this.origin.value === undefined) await this.load({ children: false, commands: false, flatvalue: true }).catch(() => undefined);
    const pkg = await packagePath(this.client, this.packageUid);
    return pkg === undefined ? undefined : sourceFilePath(pkg, this.id, this.isRender);
  }

  /**
   * Show the file in Finder or Explorer (`luna.gui.revealPath`). Rejects with `unavailable`
   * when the path is unknown.
   *
   * @example revealButton.onclick = () => void source.reveal();
   */
  async reveal(): Promise<void> {
    const path = await this.filePath();
    if (!path) throw new UAError('unavailable', 'reveal(): the file path of this source is not known', { path: this.path });
    await this.client.gui.revealPath(path);
  }

  /**
   * Every analysis LUNA keeps for this file (key, tempo, instrument, transients, chord and the
   * overviews), with live `count` and `md5` props (fact 205). Created on first use.
   *
   * @example
   * const w = source.analysis.watch();
   * await w.ready;
   * source.analysis.overview.count.onChange(() => redraw(source.analysis.overview.count.value));
   */
  get analysis(): SourceAnalysis {
    this.analyses ??= new SourceAnalysis(this.client, this.path);
    return this.analyses;
  }

  private analyses: SourceAnalysis | undefined;

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

/**
 * Where a source file came from: LUNA's `origin` numbers (fact 239). Only the renderings are
 * kept outside the package's `audio/` folder.
 */
export const SourceOrigin = {
  Unknown: 0,
  Recording: 1,
  Import: 2,
  Consolidate: 3,
  TrackFreeze: 4,
  Bounce: 5,
  Sync: 6,
  Staging: 7,
  ClipRendering: 8,
  ClipRenderingIntermediate: 9,
} as const;

/**
 * `name` unless it is blank or the file's own uid (fact 238), else `undefined`.
 *
 * @example Luna.sourceDisplayName('Vocal.wav', 'f87c…') // 'Vocal.wav'
 */
export function sourceDisplayName(name: string | undefined | null, uid: string): string | undefined {
  if (typeof name !== 'string') return undefined;
  const trimmed = name.trim();
  if (trimmed === '') return undefined;
  const bare = (s: string) => s.replace(/\.[a-z0-9]{1,5}$/i, '').replaceAll('-', '').toLowerCase();
  return bare(trimmed) === bare(uid) ? undefined : name;
}

/**
 * The path of a source file inside its session package (fact 239).
 *
 * @example Luna.sourceFilePath('/Music/Song/Song.luna', uid, false) // '/Music/Song/Song.luna/audio/<uid>.wav'
 */
export function sourceFilePath(packagePath: string, uid: string, isRender: boolean): string {
  const sep = packagePath.includes('\\') && !packagePath.includes('/') ? '\\' : '/';
  const root = packagePath.replace(/[\\/]+$/, '');
  const file = `${uid.replaceAll('-', '').toLowerCase()}.wav`;
  return isRender ? [root, 'renders', 'clips', file].join(sep) : [root, 'audio', file].join(sep);
}

const packagePaths = new WeakMap<Client, Map<string, Promise<string | undefined>>>();

/** A package's folder (`directory_path` + `file_name`), read once per client. */
function packagePath(client: Client, packageUid: string): Promise<string | undefined> {
  let byUid = packagePaths.get(client);
  if (!byUid) packagePaths.set(client, (byUid = new Map()));
  let found = byUid.get(packageUid);
  if (!found) {
    found = client.raw
      .get(`/workspace/sessions/${packageUid}`, { children: false, commands: false, flatvalue: true, propfilter: ['directory_path', 'file_name'] })
      .then((reply) => {
        const dir = readProperty(reply, 'directory_path');
        const file = readProperty(reply, 'file_name');
        if (typeof dir !== 'string' || typeof file !== 'string' || !dir || !file) return undefined;
        const sep = dir.includes('\\') && !dir.includes('/') ? '\\' : '/';
        return `${dir.replace(/[\\/]+$/, '')}${sep}${file}`;
      })
      .catch(() => undefined);
    found.then((p) => { if (p === undefined) byUid!.delete(packageUid); });
    byUid.set(packageUid, found);
  }
  return found;
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
