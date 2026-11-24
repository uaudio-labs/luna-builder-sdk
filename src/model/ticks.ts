/**
 * Musical time units (EVIDENCE fact 16).
 *
 * Every timeline position the engine exposes (`location.tick`, clip `start`/`stop`, loop points)
 * is in engine ticks. Display code usually wants display ticks (960 per beat).
 *
 * @example
 * const beats = location.tick / Luna.TICKS_PER_BEAT;
 * const displayTick = Math.floor((location.tick % Luna.TICKS_PER_BEAT) / Luna.TICKS_PER_DISPLAY_TICK);
 * const grid = Luna.triplet(Luna.THIRTY_SECOND_NOTE);   // note lengths, in engine ticks
 */
export const DISPLAY_TICKS_PER_BEAT = 960;
export const TICKS_PER_DISPLAY_TICK = 100_000_000;
export const TICKS_PER_BEAT = DISPLAY_TICKS_PER_BEAT * TICKS_PER_DISPLAY_TICK; // 96e9

export const WHOLE_NOTE = TICKS_PER_BEAT * 4;
export const HALF_NOTE = TICKS_PER_BEAT * 2;
export const QUARTER_NOTE = TICKS_PER_BEAT;
export const EIGHTH_NOTE = TICKS_PER_BEAT / 2;
export const SIXTEENTH_NOTE = TICKS_PER_BEAT / 4;
export const THIRTY_SECOND_NOTE = TICKS_PER_BEAT / 8;
export const SIXTY_FOURTH_NOTE = TICKS_PER_BEAT / 16;
export const ONE_TWENTY_EIGHTH_NOTE = TICKS_PER_BEAT / 32;

/**
 * The dotted length of a note: one and a half times it. Takes and gives engine ticks, so it
 * composes with the note constants for a grid or a quantize value.
 *
 * @example
 * Luna.dotted(Luna.QUARTER_NOTE);              // 144e9, a dotted quarter
 * Luna.dotted(Luna.dotted(Luna.EIGHTH_NOTE));  // not double-dotted: 1.5 * 1.5 * an eighth
 */
export function dotted(note: number): number {
  return note + note / 2;
}

/**
 * The triplet length of a note: two thirds of it, so three fill the time of two. Takes and
 * gives engine ticks (whole numbers for every note constant here, 128th included).
 *
 * @example
 * Luna.triplet(Luna.EIGHTH_NOTE);    // 32e9, three of them per beat
 * const grid = Luna.triplet(Luna.SIXTEENTH_NOTE);
 */
export function triplet(note: number): number {
  return (note * 2) / 3;
}

/**
 * A bar|beat position as the engine reports it in `location.bar_beat`, and as
 * `timeline.barBeat()` returns it. `tick` is in **engine** ticks (the remainder within the
 * beat), not display ticks; {@link formatBarBeat} does the conversion.
 */
export interface BarBeat {
  bar: number;
  /** 1-based beat within the bar. */
  beat: number;
  /** Engine ticks into the beat, `0 <= tick < TICKS_PER_BEAT` (for a quarter-note beat). */
  tick: number;
}

/** The `location` property of a session. */
export interface Location {
  tick: number;
  bar_beat?: BarBeat;
}

/** Ticks to beats (floating). */
export function ticksToBeats(ticks: number): number {
  return ticks / TICKS_PER_BEAT;
}

/** Beats to ticks. */
export function beatsToTicks(beats: number): number {
  return Math.round(beats * TICKS_PER_BEAT);
}

/** Ticks to seconds at a constant tempo. */
export function ticksToSeconds(ticks: number, bpm: number): number {
  return (ticks / TICKS_PER_BEAT) * (60 / bpm);
}

/** Seconds to ticks at a constant tempo. */
export function secondsToTicks(seconds: number, bpm: number): number {
  return Math.round((seconds / 60) * bpm * TICKS_PER_BEAT);
}

/**
 * Format a {@link BarBeat} as LUNA's counter shows it, `1|1|000`: it converts the engine-tick
 * remainder to display ticks (960 per beat) and zero-pads them. Pass `location.bar_beat` or
 * `timeline.barBeat(tick)` as they are; do not convert `tick` first. For a bare tick,
 * `timeline.formatBarBeat(tick)` does both steps.
 *
 * @example
 * Luna.formatBarBeat(t.location.value?.bar_beat);                 // "2|2|120"
 * Luna.formatBarBeat(session.musical.timeline.barBeat(tick));     // same as timeline.formatBarBeat(tick)
 */
export function formatBarBeat(bb: BarBeat | undefined): string {
  if (!bb) return '-|-|---';
  return `${bb.bar}|${bb.beat}|${String(Math.floor(bb.tick / TICKS_PER_DISPLAY_TICK)).padStart(3, '0')}`;
}

/**
 * Format a time signature as `4/4`; `undefined` (an unloaded prop) gives a placeholder, like
 * {@link formatBarBeat}. Pairs with `transport.timeSignature`.
 *
 * @example
 * Luna.formatTimeSignature(t.timeSignature.value);   // "4/4"
 * Luna.formatTimeSignature(undefined);               // "-/-"
 */
export function formatTimeSignature(ts: { numerator: number; denominator: number } | undefined): string {
  if (!ts) return '-/-';
  return `${ts.numerator}/${ts.denominator}`;
}

/**
 * Format seconds as a zero-padded `MM:SS` clock, flooring rather than rounding so a
 * counting display never shows a time the playhead has not reached. Negative values clamp
 * to `00:00`; `undefined` (an unloaded prop) gives a placeholder, like {@link formatBarBeat}.
 *
 * @example
 * Luna.formatMinSec(90.56);                    // "01:30"
 * Luna.formatMinSec(90.56, { fraction: 2 });   // "01:30.56"
 * Luna.formatMinSec(t.seconds, { fraction: 1 });
 */
export function formatMinSec(seconds: number | undefined, options: { fraction?: number } = {}): string {
  const fraction = options.fraction ?? 0;
  if (seconds === undefined || !Number.isFinite(seconds)) return `--:--${fraction > 0 ? '.' + '-'.repeat(fraction) : ''}`;
  const total = Math.max(0, seconds);
  const whole = Math.floor(total);
  const clock = `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
  if (fraction <= 0) return clock;
  const frac = Math.floor((total - whole) * 10 ** fraction);
  return `${clock}.${String(frac).padStart(fraction, '0')}`;
}
