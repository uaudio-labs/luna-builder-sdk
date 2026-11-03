/** A fader taper name as LUNA writes it in a control's `taper` property. */
export type TaperName = '+18' | '+12' | '+12Neve' | 'API' | '+6' | '+0' | 'preamp' | 'volt_monitor_gain';

/** Options for {@link Taper.marks}. */
export interface TaperMarksOptions {
  /**
   * The short set, for a fader too short for the full one. LUNA switches to it when the
   * 0 dB and −6 dB marks would be 10 px apart or less (20 px for `API`).
   */
  compact?: boolean;
}

/** `[dB, normalized]` breakpoints, from LUNA's `UATaper::InitializeStandardTapers`. */
const TABLES: Record<TaperName, readonly (readonly [number, number])[]> = {
  '+18': [
    [18, 1],
    [6, 0.8153846154],
    [0, 0.7230769231],
    [-6, 0.6307692308],
    [-9, 0.5846153846],
    [-12, 0.5384615385],
    [-18, 0.4461538462],
    [-28, 0.3408906883],
    [-32, 0.2987854251],
    [-40, 0.2503005766],
    [-56, 0.1533308796],
    [-86, 0.05163596439],
    [-144, 0],
  ],
  '+12': [
    [12, 1],
    [6, 0.8909090909],
    [0, 0.7818181818],
    [-6, 0.6727272727],
    [-9, 0.6181818182],
    [-12, 0.5636363636],
    [-18, 0.4713286713],
    [-28, 0.3536816125],
    [-32, 0.306622789],
    [-40, 0.2550098857],
    [-56, 0.1517840793],
    [-86, 0.05008916404],
    [-144, 0],
  ],
  '+12Neve': [
    [12, 1],
    [6, 0.8553345389],
    [0, 0.7106690778],
    [-6, 0.5660036166],
    [-9, 0.4936708861],
    [-11.33, 0.4374924653],
    [-12, 0.4323257023],
    [-18, 0.3860561823],
    [-40, 0.2164012758],
    [-57.025, 0.08511151296],
    [-66, 0.05023154281],
    [-76.35, 0.02229632013],
    [-85.61, 0.008514507365],
    [-96, 0.002065097061],
    [-144, 0],
  ],
  API: [
    [12, 1],
    [11.1722, 0.9367],
    [9.4764, 0.8734],
    [7.4751, 0.8101],
    [4.966, 0.7468],
    [2.6192, 0.6835],
    [0.7171, 0.6203],
    [0, 0.59423],
    [-1.0243, 0.557],
    [-3.1383, 0.4937],
    [-6.3115, 0.4304],
    [-11.4058, 0.3671],
    [-15.9097, 0.3038],
    [-19.9252, 0.2405],
    [-23.3901, 0.1772],
    [-29.3541, 0.1139],
    [-53.8287, 0.0506],
    [-144, 0],
  ],
  '+6': [
    [6, 1],
    [0, 0.88],
    [-6, 0.76],
    [-9, 0.7],
    [-12, 0.64],
    [-18, 0.52],
    [-28, 0.3661538462],
    [-32, 0.3190950226],
    [-40, 0.2674821194],
    [-56, 0.1642563129],
    [-86, 0.06256139769],
    [-144, 0],
  ],
  '+0': [
    [0, 1],
    [-6, 0.8666666667],
    [-9, 0.8],
    [-12, 0.7333333333],
    [-18, 0.6],
    [-28, 0.3777777778],
    [-32, 0.3277777778],
    [-40, 0.2550505051],
    [-56, 0.1750505051],
    [-86, 0.08130050505],
    [-144, 0],
  ],
  preamp: [
    [0, 0],
    [60, 1],
  ],
  volt_monitor_gain: [
    [0, 0],
    [100, 1],
  ],
};

/**
 * Hash-mark dB values, `[full, compact]`. `+12`, `+0`, `API` and `+12Neve` are the sets LUNA's
 * mixer draws (`Rack_FaderMarksPainter`, `_APISumming`, `_Neve8028`); LUNA draws no marks for
 * the others, so theirs follow the `+12` pattern over their own range.
 */
const MARKS: Record<TaperName, readonly [readonly number[], readonly number[]]> = {
  '+18': [
    [18, 12, 6, 0, -6, -12, -20, -32, -56, -144],
    [18, 0, -12, -32, -144],
  ],
  '+12': [
    [12, 6, 0, -6, -12, -20, -32, -56, -144],
    [12, 0, -12, -32, -144],
  ],
  '+12Neve': [
    [10, 5, 0, -5, -10, -20, -30, -40, -144],
    [10, 0, -10, -30, -144],
  ],
  API: [
    [10, 5, 0, -5, -10, -15, -20, -25, -35, -50, -144],
    [10, 0, -10, -30, -144],
  ],
  '+6': [
    [6, 0, -6, -12, -20, -32, -56, -144],
    [6, 0, -12, -32, -144],
  ],
  '+0': [
    [0, -6, -12, -18, -32, -56, -144],
    [0, -12, -32, -144],
  ],
  preamp: [
    [60, 50, 40, 30, 20, 10, 0],
    [60, 30, 0],
  ],
  volt_monitor_gain: [
    [100, 75, 50, 25, 0],
    [100, 50, 0],
  ],
};

/** Control types LUNA gives a fader taper (`DkClnt_Control::UpdateTaper`). */
const TAPERED_CONTROLS = new Set(['gain', 'gain_trim', 'input_trim_left', 'input_trim_right', 'input_trim_mono', 'sidechain_input_trim']);

/** Linear interpolation over `[x, y]` points sorted by `x`, clamped at both ends. */
function interpolate(points: readonly (readonly [number, number])[], x: number): number {
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  let hi = 1;
  while (points[hi]![0] < x) hi++;
  const [x0, y0] = points[hi - 1]!;
  const [x1, y1] = points[hi]!;
  return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

/**
 * Fader tapers: how LUNA maps a fader's 0..1 position to dB (fact 134).
 *
 * A gain-type control names its taper in its `taper` property; {@link Control.taper} resolves
 * it to one of these. Each taper is LUNA's own breakpoint table, interpolated linearly between
 * points as LUNA does, so `toNormalized` and `toDb` agree with the control's
 * `normalized_value` and `real_value`. `marks()` gives the dB values LUNA draws hash marks at.
 *
 * @example
 * const taper = track.gain.taper.value ?? Luna.Taper.named('+12')!;
 * for (const db of taper.marks()) {
 *   const y = height * (1 - taper.toNormalized(db));   // 0 at the top
 *   drawMark(y, db <= taper.minDb ? '∞' : String(Math.abs(db)));
 * }
 */
export class Taper {
  private static readonly cache = new Map<string, Taper>();

  /** The default taper: what LUNA uses for a gain control whose `taper` is empty or unknown. */
  static readonly DEFAULT_NAME: TaperName = '+12';

  /** Every taper name LUNA defines, `none` aside. */
  static readonly NAMES: readonly TaperName[] = Object.keys(TABLES) as TaperName[];

  /** Lowest dB on the taper; for the dB tapers −144, which LUNA shows as −∞. */
  readonly minDb: number;
  /** Highest dB on the taper: the top of the fader. */
  readonly maxDb: number;
  /** LUNA's breakpoints as `[dB, normalized]`, highest dB first, as LUNA lists them. */
  readonly points: readonly (readonly [number, number])[];

  private readonly byDb: readonly (readonly [number, number])[];
  private readonly byNormalized: readonly (readonly [number, number])[];

  private constructor(readonly name: TaperName) {
    this.points = TABLES[name];
    this.byDb = [...this.points].sort((a, b) => a[0] - b[0]);
    this.byNormalized = this.points.map(([db, n]) => [n, db] as const).sort((a, b) => a[0] - b[0]);
    this.minDb = this.byDb[0]![0];
    this.maxDb = this.byDb[this.byDb.length - 1]![0];
  }

  /**
   * The taper LUNA uses for a `taper` property value. Empty, `null` and unknown names give
   * `+12`, as in LUNA; `none` gives `null`. The same name always gives the same object.
   *
   * @example
   * Luna.Taper.named('API')!.toNormalized(0);  // 0.59423
   * Luna.Taper.named('')!.name;                // '+12'
   * Luna.Taper.named('none');                  // null
   */
  static named(name: string | null | undefined): Taper | null {
    if (name === 'none') return null;
    const key: TaperName = name && name in TABLES ? (name as TaperName) : Taper.DEFAULT_NAME;
    let taper = Taper.cache.get(key);
    if (!taper) Taper.cache.set(key, (taper = new Taper(key)));
    return taper;
  }

  /**
   * The taper a control uses, from its `control_type` and `taper` properties: `null` for a
   * control LUNA gives no fader taper (pan, mute, a plugin parameter), `undefined` while the
   * control type has not arrived.
   *
   * @example
   * Luna.Taper.forControl('gain', null)?.name;   // '+12'
   * Luna.Taper.forControl('pan', null);          // null
   */
  static forControl(controlType: string | undefined, taper: string | null | undefined): Taper | null | undefined {
    if (controlType === undefined) return undefined;
    return TAPERED_CONTROLS.has(controlType) ? Taper.named(taper) : null;
  }

  /**
   * The 0..1 fader position for a dB value, clamped to the taper's range.
   *
   * @example
   * Luna.Taper.named('+12')!.toNormalized(-6);   // 0.6727
   */
  toNormalized(db: number): number {
    return interpolate(this.byDb, db);
  }

  /**
   * The dB value at a 0..1 fader position, clamped to the taper's range.
   *
   * @example
   * Luna.Taper.named('+12')!.toDb(1);   // 12
   */
  toDb(normalized: number): number {
    return interpolate(this.byNormalized, normalized);
  }

  /**
   * The dB values to draw fader hash marks at, top first. The last is {@link minDb}, which
   * LUNA labels ∞. Place each with {@link toNormalized}.
   *
   * @example
   * taper.marks();                    // [12, 6, 0, -6, -12, -20, -32, -56, -144] for +12
   * taper.marks({ compact: true });   // [12, 0, -12, -32, -144]
   */
  marks(options: TaperMarksOptions = {}): number[] {
    return [...MARKS[this.name][options.compact ? 1 : 0]];
  }
}
