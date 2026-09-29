/**
 * Musical time units (EVIDENCE fact 16).
 *
 * Every timeline position the engine exposes (`location.tick`, clip `start`/`stop`, loop points)
 * is in engine ticks. Display code usually wants display ticks (960 per beat).
 *
 * @example
 * const beats = location.tick / Luna.TICKS_PER_BEAT;
 * const displayTick = Math.floor((location.tick % Luna.TICKS_PER_BEAT) / Luna.TICKS_PER_DISPLAY_TICK);
 */
export const DISPLAY_TICKS_PER_BEAT = 960;
export const TICKS_PER_DISPLAY_TICK = 100_000_000;
export const TICKS_PER_BEAT = DISPLAY_TICKS_PER_BEAT * TICKS_PER_DISPLAY_TICK; // 96e9

export const WHOLE_NOTE = TICKS_PER_BEAT * 4;
export const HALF_NOTE = TICKS_PER_BEAT * 2;
export const QUARTER_NOTE = TICKS_PER_BEAT;
export const EIGHTH_NOTE = TICKS_PER_BEAT / 2;
export const SIXTEENTH_NOTE = TICKS_PER_BEAT / 4;

/** Bar, beat and display tick as the engine reports them in `location.bar_beat`. */
export interface BarBeat {
  bar: number;
  beat: number;
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

/** Format a `bar_beat` as `1|1|000` with the display tick zero-padded. */
export function formatBarBeat(bb: BarBeat | undefined): string {
  if (!bb) return '-|-|---';
  return `${bb.bar}|${bb.beat}|${String(Math.floor(bb.tick / TICKS_PER_DISPLAY_TICK)).padStart(3, '0')}`;
}
