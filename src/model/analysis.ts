/**
 * What LUNA has analysed about one source audio file: `<source>/analysis/<kind>` (fact 205).
 * Each analysis node carries `count`, `md5`, `version` and `version_minor`, and a `file/data`
 * child holding the result. Reached as `source.analysis`.
 *
 * The props follow LUNA only while something subscribes (fact 34): a recording's file under
 * a ready session already is; a workspace source needs `source.analysis.watch()`.
 *
 * @example
 * const src = session.sources!.byId(clip.sourceUid.value!)!;
 * const w = src.analysis.watch();
 * await w.ready;
 * src.analysis.overview.count.onChange(redrawWaveform);   // grows while LUNA writes it
 * const key = await src.analysis.key.read();              // { candidates: [{ key, confidence }] }
 * w.release();
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { UAError } from '../wire/errors';
import type { Unsubscribe } from '../wire/port';
import { Node } from './node';

/** The analysis node names LUNA uses (fact 205). */
export type AnalysisKind = 'overview' | 'overview_coarse' | 'key' | 'tempo' | 'instrument' | 'transients' | 'chord';

/**
 * One analysis of a source. `count` and `md5` change when the analysis does: a recording's
 * overview `count` grows as LUNA writes it (its `md5` stays `null` until the take is stored),
 * and a finished analysis gets its digest (facts 205, 206).
 *
 * @example
 * await source.analysis.tempo.load();
 * if (source.analysis.tempo.count.value) console.log(await source.analysis.tempo.read());
 */
export class AnalysisNode extends Node {
  /** Which analysis this is. */
  readonly kind: AnalysisKind;
  /** How many entries the result holds (overview pairs, transients, chord segments, guesses). */
  readonly count: Prop<number>;
  /** Digest of the stored result; `null` while a recording still writes it. Key a cache on it. */
  readonly md5: Prop<string | null>;
  readonly version: Prop<number>;
  readonly versionMinor: Prop<number>;

  /** @internal */
  constructor(client: Client, sourcePath: string, kind: AnalysisKind) {
    super(client, `${sourcePath}/analysis/${kind}`);
    this.kind = kind;
    this.count = this.prop<number>('count');
    this.md5 = this.prop<string | null>('md5');
    this.version = this.prop<number>('version');
    this.versionMinor = this.prop<number>('version_minor');
  }

  /**
   * The stored result as LUNA sends it (`{ version, version_minor, index, count, data, ... }`),
   * or `undefined` when there is none. LUNA answers nothing unless a count is asked for, so
   * this asks for all of it unless `count` is given (fact 205).
   *
   * @example
   * const raw = await source.analysis.chord.readRaw();
   */
  async readRaw(options: { index?: number; count?: number } = {}): Promise<Record<string, unknown> | undefined> {
    const { index = 0, count = -1 } = options;
    if (!Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(count) || count === 0 || count < -1) {
      throw new UAError('out_of_range', 'readRaw(): index must be >= 0 and count -1 or positive', { path: this.path });
    }
    const query = `count=${count}${index > 0 ? `&index=${index}` : ''}`;
    const reply = (await this.wire.get(`${this.path}/file/data?${query}`, { properties: true }).catch(() => undefined)) as unknown;
    const value = reply && typeof reply === 'object' && 'value' in (reply as object) ? (reply as { value?: unknown }).value : reply;
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) return undefined;
    return value as Record<string, unknown>;
  }
}

/** A key guess, best first. */
export interface KeyCandidate {
  /** The key as the detector names it, e.g. `C major`. */
  key: string;
  confidence: number;
}

/** `analysis/key`: the detector's key guesses (fact 207). */
export interface KeyAnalysisResult {
  candidates: KeyCandidate[];
  /** The whole stored result, for fields the SDK does not name. */
  raw: Record<string, unknown>;
}

/** A tempo guess, best first. */
export interface TempoCandidate {
  bpm: number;
  /** The detector's `tickPerBeat`, verbatim. */
  ticksPerBeat: number | undefined;
  /** The detector's `clamped` flag: the tempo was held inside its range. */
  clamped: boolean | undefined;
  /** The guess as stored, including its per-beat arrays. */
  raw: Record<string, unknown>;
}

/** `analysis/tempo` (fact 207). */
export interface TempoAnalysisResult {
  candidates: TempoCandidate[];
  /** Seconds per unit of the integer timestamps in the guesses; absent before minor version 2. */
  timeUnitS: number | undefined;
  sampleRate: number | undefined;
  tempoIsConstant: boolean | undefined;
  raw: Record<string, unknown>;
}

/** `analysis/instrument` (fact 207). */
export interface InstrumentAnalysisResult {
  /** The class the detector chose, e.g. `vocals`; `''` when it had none. */
  instrument: string;
  confidence: number;
  /** Every class the detector could answer; absent before minor version 2. */
  classes: string[] | undefined;
  /** Index of {@link instrument} in {@link classes}. */
  classIdIndex: number | undefined;
  raw: Record<string, unknown>;
}

/** One page of `analysis/transients` (fact 207). */
export interface TransientAnalysisResult {
  /** The first transient in this page. */
  index: number;
  /** Transients in this page. */
  count: number;
  /** Positions from the source's start, in {@link timeUnitS} units (nanoseconds when that is absent). */
  locations: number[];
  /** Level of each transient. */
  levels: number[];
  timeUnitS: number | undefined;
  sampleRate: number | undefined;
  raw: Record<string, unknown>;
}

/** One detected chord over a stretch of the source. */
export interface ChordSegment {
  /** The detector's chord label, verbatim (`N` is its "no chord"). */
  name: string;
  /** Seconds from the source's start. */
  start: number;
  end: number;
}

/** `analysis/chord`: what chord detection found in the source (fact 207). */
export interface ChordAnalysisResult {
  /** The key the detector settled on, when it reports one. */
  key: string | undefined;
  segments: ChordSegment[];
  raw: Record<string, unknown>;
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
/** Binary arrays reach a JSON client as arrays; accept a typed array too. */
const nums = (v: unknown): number[] => (Array.isArray(v) || ArrayBuffer.isView(v) ? Array.from(v as ArrayLike<unknown>, (x) => Number(x)) : []);
const flag = (v: unknown): boolean | undefined => (v === undefined || v === null ? undefined : v === true || v === 1);

/**
 * `analysis/key`.
 *
 * @example
 * const best = (await source.analysis.key.read())?.candidates[0]?.key;
 */
export class KeyAnalysis extends AnalysisNode {
  /** @internal */
  constructor(client: Client, sourcePath: string) {
    super(client, sourcePath, 'key');
  }

  /** @example const r = await source.analysis.key.read(); */
  async read(): Promise<KeyAnalysisResult | undefined> {
    const raw = await this.readRaw();
    if (!raw) return undefined;
    const list = obj(raw['data'])['keyData'];
    const candidates = (Array.isArray(list) ? list : []).flatMap((c) => {
      const o = obj(c);
      const key = str(o['key']);
      return key === undefined ? [] : [{ key, confidence: num(o['confidence']) ?? 0 }];
    });
    return { candidates, raw };
  }
}

/**
 * `analysis/tempo`.
 *
 * @example
 * const bpm = (await source.analysis.tempo.read())?.candidates[0]?.bpm;
 */
export class TempoAnalysis extends AnalysisNode {
  /** @internal */
  constructor(client: Client, sourcePath: string) {
    super(client, sourcePath, 'tempo');
  }

  /** @example const r = await source.analysis.tempo.read(); */
  async read(): Promise<TempoAnalysisResult | undefined> {
    const raw = await this.readRaw();
    if (!raw) return undefined;
    const data = obj(raw['data']);
    const list = data['tempoData'];
    const candidates = (Array.isArray(list) ? list : []).flatMap((c) => {
      const o = obj(c);
      const bpm = num(o['bpm']);
      return bpm === undefined ? [] : [{ bpm, ticksPerBeat: num(o['tickPerBeat']), clamped: flag(o['clamped']), raw: o }];
    });
    return { candidates, timeUnitS: num(data['timeUnit_s']), sampleRate: num(data['sampleRate']), tempoIsConstant: flag(data['tempoIsConstant']), raw };
  }
}

/**
 * `analysis/instrument`.
 *
 * @example
 * const what = (await source.analysis.instrument.read())?.instrument;
 */
export class InstrumentAnalysis extends AnalysisNode {
  /** @internal */
  constructor(client: Client, sourcePath: string) {
    super(client, sourcePath, 'instrument');
  }

  /** @example const r = await source.analysis.instrument.read(); */
  async read(): Promise<InstrumentAnalysisResult | undefined> {
    const raw = await this.readRaw();
    if (!raw) return undefined;
    const classes = raw['classes'];
    return {
      instrument: str(raw['instrument']) ?? '',
      confidence: num(raw['confidence']) ?? 0,
      classes: Array.isArray(classes) ? classes.map(String) : undefined,
      classIdIndex: num(raw['classIDIndex']),
      raw,
    };
  }
}

/**
 * `analysis/transients`, read a page at a time like the overview.
 *
 * @example
 * const page = await source.analysis.transients.read({ index: 0, count: 512 });
 */
export class TransientAnalysis extends AnalysisNode {
  /** @internal */
  constructor(client: Client, sourcePath: string) {
    super(client, sourcePath, 'transients');
  }

  /**
   * One page; without `count`, all of them.
   *
   * @example const all = await source.analysis.transients.read();
   */
  async read(options: { index?: number; count?: number } = {}): Promise<TransientAnalysisResult | undefined> {
    const raw = await this.readRaw(options);
    if (!raw) return undefined;
    const data = obj(raw['data']);
    const locations = nums(data['location']);
    const levels = nums(data['level']);
    return { index: num(raw['index']) ?? options.index ?? 0, count: locations.length, locations, levels, timeUnitS: num(data['timeUnit_s']), sampleRate: num(data['sampleRate']), raw };
  }
}

/**
 * `analysis/chord`: written by chord detection (`session.musical.chords.detect()`), next to
 * the chords it puts on the ruler.
 *
 * @example
 * const segs = (await source.analysis.chord.read())?.segments ?? [];
 */
export class ChordAnalysis extends AnalysisNode {
  /** @internal */
  constructor(client: Client, sourcePath: string) {
    super(client, sourcePath, 'chord');
  }

  /** @example const r = await source.analysis.chord.read(); */
  async read(): Promise<ChordAnalysisResult | undefined> {
    const raw = await this.readRaw();
    if (!raw) return undefined;
    const list = raw['data'];
    const segments = (Array.isArray(list) ? list : []).flatMap((s) => {
      const o = obj(s);
      const name = str(o['chord_complex_pop']);
      const start = num(o['start']);
      const end = num(o['end']);
      return name === undefined || start === undefined || end === undefined ? [] : [{ name, start, end }];
    });
    return { key: str(raw['key']), segments, raw };
  }
}

/**
 * `source.analysis`: every analysis LUNA keeps for one source.
 *
 * @example
 * await source.analysis.load();
 * source.analysis.kinds.value;                 // e.g. ['overview', 'overview_coarse', 'key']
 */
export class SourceAnalysis {
  readonly overview: AnalysisNode;
  readonly overviewCoarse: AnalysisNode;
  readonly key: KeyAnalysis;
  readonly tempo: TempoAnalysis;
  readonly instrument: InstrumentAnalysis;
  readonly transients: TransientAnalysis;
  readonly chord: ChordAnalysis;
  /** The analyses LUNA has for this source, by node name. Includes kinds the SDK does not name. */
  readonly kinds: Prop<string[]>;
  /** `<source>/analysis`. */
  readonly path: string;

  /** @internal */
  constructor(
    private readonly client: Client,
    sourcePath: string,
  ) {
    this.path = `${sourcePath}/analysis`;
    this.overview = new AnalysisNode(client, sourcePath, 'overview');
    this.overviewCoarse = new AnalysisNode(client, sourcePath, 'overview_coarse');
    this.key = new KeyAnalysis(client, sourcePath);
    this.tempo = new TempoAnalysis(client, sourcePath);
    this.instrument = new InstrumentAnalysis(client, sourcePath);
    this.transients = new TransientAnalysis(client, sourcePath);
    this.chord = new ChordAnalysis(client, sourcePath);
    const names = client.store.children(this.path);
    this.kinds = derived([names], () => names.value ?? []);
  }

  /**
   * Read every analysis node's `count`, `md5` and versions once.
   *
   * @example await source.analysis.load();
   */
  async load(): Promise<void> {
    await this.client.store.load(this.path, { levels: 2, commands: false, flatvalue: true });
  }

  /**
   * Subscribe so the analysis props follow LUNA: a new analysis appearing, a count growing, a
   * digest changing. Call `release` when done.
   *
   * @example
   * const w = source.analysis.watch();
   * await w.ready;
   * source.analysis.overview.count.onChange(() => redraw());
   * // later: w.release();
   */
  watch(): { ready: Promise<void>; release: Unsubscribe } {
    return this.client.store.watch(this.path, { recursive: true, load: { levels: 2, commands: false, flatvalue: true } });
  }
}
