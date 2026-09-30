/**
 * Tempo map, time signatures, key signatures and the Chord ruler of a session, plus a
 * {@link Timeline} that converts between ticks, seconds and bar|beat using them.
 *
 * Nodes: `/sessions/<uid>/tempo_map/<rowid>` (`tick`, `time`, `tempo`),
 * `/sessions/<uid>/time_signatures/<rowid>` (`tick`, `bar`, `numerator`, `denominator`, `partial`),
 * `/sessions/<uid>/key_signatures/<rowid>`, `/sessions/<uid>/chords/<rowid>` (see {@link Chords}).
 *
 * @example
 * await session.musical.ready();
 * session.musical.tempoAt(0);                 // 120
 * session.musical.timeline.barBeat(Luna.TICKS_PER_BEAT * 5);  // { bar: 2, beat: 2, tick: 0 }
 * await session.musical.setTempoInEffectAt(96, session.transport.tick);   // what LUNA's tempo field does
 */
import type { Client } from '../client/client';
import type { Prop, WritableProp } from '../store/prop';
import { UAError } from '../wire/errors';
import { Chord, Chords, checkChordSpecs, normalizeChordName, type ChordSpec } from './chords';
import { Collection } from './collection';
import { Node } from './node';
import { requireTick, settle } from './settle';
import { TICKS_PER_BEAT, type BarBeat } from './ticks';

export class TempoEvent extends Node {
  readonly tick: Prop<number>;
  /** Seconds at this event, as the engine computed it. */
  readonly time: Prop<number>;
  /** BPM from this event on. Writable: LUNA's own tempo field sets it directly (fact 95). */
  readonly tempo: WritableProp<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.tick = this.prop<number>('tick');
    this.time = this.prop<number>('time');
    this.tempo = this.writableProp<number>('tempo');
  }
}

export class TimeSignature extends Node {
  readonly tick: Prop<number>;
  readonly bar: Prop<number>;
  readonly numerator: Prop<number>;
  readonly denominator: Prop<number>;
  readonly partial: Prop<boolean>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.tick = this.prop<number>('tick');
    this.bar = this.prop<number>('bar');
    this.numerator = this.prop<number>('numerator');
    this.denominator = this.prop<number>('denominator');
    this.partial = this.prop<boolean>('partial');
  }

  /** Ticks in one bar of this signature. */
  get ticksPerBar(): number {
    const n = this.numerator.value ?? 4;
    const d = this.denominator.value ?? 4;
    return n * ((TICKS_PER_BEAT * 4) / d);
  }

  /** Ticks in one beat of this signature. */
  get ticksPerBeat(): number {
    const d = this.denominator.value ?? 4;
    return (TICKS_PER_BEAT * 4) / d;
  }
}

export class KeySignature extends Node {
  readonly tick: Prop<number>;
  /** Positive for sharps, negative for flats. */
  readonly sharpsAndFlats: Prop<number>;
  readonly isMinor: Prop<boolean>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.tick = this.prop<number>('tick');
    this.sharpsAndFlats = this.prop<number>('sharps_and_flats');
    this.isMinor = this.prop<boolean>('is_minor');
  }
}

/** Pure tick arithmetic over the current tempo map and time signatures. */
export class Timeline {
  constructor(
    private readonly tempos: () => readonly TempoEvent[],
    private readonly signatures: () => readonly TimeSignature[],
  ) {}

  private sortedTempos(): { tick: number; tempo: number }[] {
    return this.tempos()
      .map((t) => ({ tick: t.tick.value ?? 0, tempo: t.tempo.value ?? 120 }))
      .sort((a, b) => a.tick - b.tick);
  }

  private sortedSignatures(): { tick: number; bar: number; n: number; d: number }[] {
    return this.signatures()
      .map((s) => ({ tick: s.tick.value ?? 0, bar: s.bar.value ?? 1, n: s.numerator.value ?? 4, d: s.denominator.value ?? 4 }))
      .sort((a, b) => a.tick - b.tick);
  }

  tempoAt(tick: number): number {
    let tempo = 120;
    for (const t of this.sortedTempos()) {
      if (t.tick <= tick) tempo = t.tempo;
      else break;
    }
    return tempo;
  }

  /** Ticks to seconds, integrating the tempo map (constant tempo between events). */
  seconds(tick: number): number {
    const tempos = this.sortedTempos();
    if (tempos.length === 0) return (tick / TICKS_PER_BEAT) * 0.5;
    let seconds = 0;
    let at = 0;
    let tempo = tempos[0]!.tempo;
    for (const t of tempos) {
      if (t.tick >= tick) break;
      if (t.tick > at) {
        seconds += ((t.tick - at) / TICKS_PER_BEAT) * (60 / tempo);
        at = t.tick;
      }
      tempo = t.tempo;
    }
    seconds += ((tick - at) / TICKS_PER_BEAT) * (60 / tempo);
    return seconds;
  }

  /** Bar, beat (1-based) and remaining engine ticks at `tick`, honouring time signature changes. */
  /**
   * The inverse of {@link seconds}: the tick a wall-clock offset lands on, walking the same
   * tempo map. Use it to place a clip that must play unstretched — its span in ticks
   * depends on the tempo where it sits.
   *
   * @example
   * const start = 4 * Luna.TICKS_PER_BEAT;
   * const stop = timeline.tickAtSeconds(timeline.seconds(start) + source.length.value / 1e9);
   */
  /**
   * The inverse of {@link barBeat}: the tick a bar|beat|tick position lands on. `beat`
   * defaults to 1 and `tick` to 0, so `tickAt({ bar: 9 })` is the downbeat of bar 9 and
   * matches {@link tickAtBar}.
   *
   * @example
   * const tick = timeline.tickAt({ bar: 5, beat: 3, tick: 0 });
   * timeline.barBeat(tick);   // { bar: 5, beat: 3, tick: 0 }
   */
  tickAt(at: { bar: number; beat?: number; tick?: number }): number {
    const sigs = this.sortedSignatures();
    const applicable = sigs.filter((s) => s.bar <= at.bar);
    const sig = applicable.at(-1) ?? { tick: 0, bar: 1, n: 4, d: 4 };
    const beatTicks = (TICKS_PER_BEAT * 4) / sig.d;
    return sig.tick + (at.bar - sig.bar) * beatTicks * sig.n + ((at.beat ?? 1) - 1) * beatTicks + (at.tick ?? 0);
  }

  tickAtSeconds(seconds: number): number {
    if (!(seconds > 0)) return 0;
    const tempos = this.sortedTempos();
    if (tempos.length === 0) return (seconds / 0.5) * TICKS_PER_BEAT;
    let elapsed = 0;
    let at = 0;
    let tempo = tempos[0]!.tempo;
    for (const t of tempos) {
      if (t.tick <= at) {
        tempo = t.tempo;
        continue;
      }
      const spanSeconds = ((t.tick - at) / TICKS_PER_BEAT) * (60 / tempo);
      if (elapsed + spanSeconds >= seconds) return at + ((seconds - elapsed) / (60 / tempo)) * TICKS_PER_BEAT;
      elapsed += spanSeconds;
      at = t.tick;
      tempo = t.tempo;
    }
    return at + ((seconds - elapsed) / (60 / tempo)) * TICKS_PER_BEAT;
  }

  barBeat(tick: number): BarBeat {
    const sigs = this.sortedSignatures();
    let sig = sigs.find((s) => s.tick <= tick) ? sigs.filter((s) => s.tick <= tick).at(-1)! : { tick: 0, bar: 1, n: 4, d: 4 };
    if (sigs.length === 0) sig = { tick: 0, bar: 1, n: 4, d: 4 };
    const beatTicks = (TICKS_PER_BEAT * 4) / sig.d;
    const barTicks = beatTicks * sig.n;
    const rel = Math.max(0, tick - sig.tick);
    const bar = sig.bar + Math.floor(rel / barTicks);
    const inBar = rel % barTicks;
    const beat = 1 + Math.floor(inBar / beatTicks);
    return { bar, beat, tick: inBar % beatTicks };
  }

  /** Tick at the start of `bar` (1-based). */
  tickAtBar(bar: number): number {
    const sigs = this.sortedSignatures();
    let sig = { tick: 0, bar: 1, n: 4, d: 4 };
    for (const s of sigs) {
      if (s.bar <= bar) sig = s;
      else break;
    }
    const barTicks = ((TICKS_PER_BEAT * 4) / sig.d) * sig.n;
    return sig.tick + (bar - sig.bar) * barTicks;
  }
}

/** The musical structure of one session. */
export class Musical {
  readonly tempoMap: Collection<TempoEvent>;
  readonly timeSignatures: Collection<TimeSignature>;
  readonly keySignatures: Collection<KeySignature>;
  /** LUNA's Chord ruler. */
  readonly chords: Chords;
  readonly timeline: Timeline;
  private readyPromise: Promise<void> | undefined;

  /** @internal */
  constructor(
    private readonly client: Client,
    private readonly sessionPath: string,
    private readonly sessionUid: string,
    private readonly transaction: <T>(name: string, fn: () => Promise<T>) => Promise<T> = (_name, fn) => fn(),
  ) {
    const opts = { levels: 2, commands: false, flatvalue: true };
    this.tempoMap = new Collection<TempoEvent>(client, `${sessionPath}/tempo_map`, (p) => new TempoEvent(client, p), opts);
    this.timeSignatures = new Collection<TimeSignature>(client, `${sessionPath}/time_signatures`, (p) => new TimeSignature(client, p), opts);
    this.keySignatures = new Collection<KeySignature>(client, `${sessionPath}/key_signatures`, (p) => new KeySignature(client, p), opts);
    this.chords = new Chords(client, sessionPath, sessionUid);
    this.timeline = new Timeline(
      () => this.tempoMap.items,
      () => this.timeSignatures.items,
    );
  }

  /** Load the three maps and the Chord ruler. Idempotent. */
  ready(): Promise<void> {
    this.readyPromise ??= Promise.all([this.tempoMap.load(), this.timeSignatures.load(), this.keySignatures.load(), this.chords.load()]).then(() => undefined);
    return this.readyPromise;
  }

  tempoAt(tick: number): number {
    return this.timeline.tempoAt(tick);
  }

  private post(command: string, payload: Record<string, unknown>): Promise<unknown> {
    return this.client.raw.post(`${this.sessionPath}/${command}`, { session_uid: this.sessionUid, ...payload });
  }

  /**
   * The tempo event in effect at `tick`: the last one at or before it, or the first when the
   * tick is before them all. `undefined` only while the map is empty or unloaded.
   *
   * @example
   * const row = session.musical.tempoEventAt(session.transport.tick);
   */
  tempoEventAt(tick: number): TempoEvent | undefined {
    const rows = [...this.tempoMap.items].filter((t) => t.tick.value !== undefined).sort((a, b) => a.tick.value! - b.tick.value!);
    let row = rows[0];
    for (const t of rows) {
      if (t.tick.value! <= tick) row = t;
      else break;
    }
    return row;
  }

  /**
   * Change the tempo in effect at `tick` to `bpm`, as LUNA's own tempo field does: it writes
   * the `tempo` of that tempo event rather than adding one (fact 95). In a single-tempo session
   * that is the session tempo. Rejects with `out_of_range` for a non-positive or non-finite
   * BPM, and `not_found` when the map has no events yet.
   *
   * @example
   * await session.musical.ready();
   * await session.musical.setTempoInEffectAt(96, session.transport.tick);
   */
  async setTempoInEffectAt(bpm: number, tick: number): Promise<void> {
    if (!Number.isFinite(bpm) || bpm <= 0) throw new UAError('out_of_range', 'setTempoInEffectAt(): bpm must be a finite number > 0');
    const row = this.tempoEventAt(tick);
    if (!row) throw new UAError('not_found', 'setTempoInEffectAt(): the tempo map has no events; await musical.ready() first');
    await row.tempo.set(bpm);
  }

  /**
   * Add a tempo event at a tick with `set_tempo` (default: the session start). On the measured
   * build `set_tempo` answered `device.database_error`; to change the tempo in effect, use
   * {@link setTempoInEffectAt}.
   */
  setTempo(bpm: number, tick = 0): Promise<unknown> {
    return this.post('set_tempo', { tempo: bpm, tick });
  }

  deleteTempo(tick: number): Promise<unknown> {
    return this.post('delete_tempo', { tick });
  }

  /** Set the time signature from `bar` (1-based). */
  setTimeSignature(numerator: number, denominator: number, bar = 1): Promise<unknown> {
    return this.post('set_time_signature', { numerator, denominator, bar });
  }

  /** `sharpsAndFlats`: 1..7 sharps, -1..-7 flats, 0 for C / A minor. */
  setKeySignature(sharpsAndFlats: number, isMinor: boolean, tick = 0): Promise<unknown> {
    return this.post('set_key_signature', { tick, sharps_and_flats: sharpsAndFlats, is_minor: isMinor });
  }

  /** Move bar one to `tick`. */
  setBarOne(tick: number): Promise<unknown> {
    return this.post('set_bar_one', { tick });
  }

  private settleChords(done: () => boolean, what: string): Promise<void> {
    return settle(done, what, {
      path: this.chords.path,
      refresh: () => this.chords.reload(),
      flush: () => this.client.store.scheduler.flush(),
    });
  }

  private hasChord(tick: number, name: string, fresh: (c: Chord) => boolean = () => true): boolean {
    const wanted = normalizeChordName(name);
    return this.chords.items.some((c) => c.location.value === tick && c.name.value === wanted && fresh(c));
  }

  /**
   * Add a chord to the Chord ruler at `tick` and resolve to it once it is in {@link chords}.
   * A chord already at `tick` is replaced, as in LUNA (fact 100). One undo entry.
   *
   * @example
   * const chord = await session.musical.addChord(Luna.WHOLE_NOTE * 4, 'Am7');
   */
  async addChord(tick: number, name: string): Promise<Chord> {
    requireTick(tick, 'chord tick');
    if (typeof name !== 'string' || name.trim() === '') throw new UAError('out_of_range', 'chord name must be a non-empty chord name');
    const before = new Set(this.chords.items.map((c) => c.id));
    await this.post('set_chord', { location: tick, name });
    const fresh = (c: Chord): boolean => !before.has(c.id);
    await this.settleChords(() => this.hasChord(tick, name, fresh), 'add chord');
    return this.chords.items.find((c) => c.location.value === tick && fresh(c))!;
  }

  /**
   * Write a chord progression as one undo entry. Each chord replaces any chord at its tick.
   * With `replaceRange: [start, stop]`, every other chord from `start` up to (not including)
   * `stop` is deleted first, so the span holds exactly the progression. Chords already on the
   * ruler as asked are not rewritten, and a call that changes nothing makes no undo entry.
   * Resolves once {@link chords} shows the result.
   *
   * @example
   * const bar = Luna.WHOLE_NOTE;
   * await session.musical.setChords(
   *   ['C', 'Am', 'F', 'G'].map((name, i) => ({ tick: i * bar, name })),
   *   { replaceRange: [0, 4 * bar] },
   * );
   */
  async setChords(chords: readonly ChordSpec[], options: { replaceRange?: [number, number]; undoName?: string } = {}): Promise<void> {
    checkChordSpecs(chords);
    const range = options.replaceRange;
    if (range) {
      requireTick(range[0], 'replaceRange start');
      requireTick(range[1], 'replaceRange stop');
    }
    const ticks = new Set(chords.map((c) => c.tick));
    const inRange = (c: Chord): boolean => range !== undefined && (c.location.value ?? 0) >= range[0] && (c.location.value ?? 0) < range[1];
    const stale = this.chords.items.filter((c) => inRange(c) && !ticks.has(c.location.value ?? 0));
    const staleIds = new Set(stale.map((c) => c.id));
    // A chord already on the ruler as asked is left alone rather than replaced by a copy.
    const writes = chords.filter((c) => !this.hasChord(c.tick, c.name));
    if (stale.length === 0 && writes.length === 0) return;
    await this.transaction(options.undoName ?? 'Set Chords', async () => {
      for (const c of stale) await this.post('delete_chord', { rowid: c.rowid.value ?? Number(c.id) });
      for (const c of writes) await this.post('set_chord', { location: c.tick, name: c.name });
    });
    await this.settleChords(
      () => chords.every((c) => this.hasChord(c.tick, c.name)) && !this.chords.items.some((c) => staleIds.has(c.id)),
      'set chords',
    );
  }

  /**
   * Delete every chord on the ruler as one undo entry ("Clear Chords").
   *
   * @example await session.musical.clearChords();
   */
  async clearChords(): Promise<void> {
    await this.post('delete_chord', { all: true });
    await this.settleChords(() => this.chords.items.length === 0, 'clear chords');
  }

  /** @internal */
  dispose(): void {
    this.chords.dispose();
    this.tempoMap.dispose();
    this.timeSignatures.dispose();
    this.keySignatures.dispose();
  }
}
