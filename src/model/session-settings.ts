/**
 * Helpers for session settings LUNA stores in its own text forms: the pre- and post-roll
 * durations on `session.transport` (fact 156).
 *
 * @example
 * const roll = Luna.parseRollDuration(session.transport.preRoll.value);   // { bars: 1, beats: 0, ticks: 0 }
 * await session.transport.preRoll.set(Luna.formatRollDuration({ beats: 2 }));
 */
import { UAError } from '../wire/errors';

/**
 * A pre- or post-roll length: whole bars, then beats, then engine ticks, counted in the
 * session's time signatures where the roll falls.
 */
export interface RollDuration {
  bars: number;
  beats: number;
  /** Engine ticks (`Luna.TICKS_PER_BEAT` to a beat), as LUNA stores them. */
  ticks: number;
}

/**
 * Read a roll string, `"bars,beats,ticks"`, as LUNA stores `pre_roll` and `post_roll`
 * (fact 156). `undefined` for anything else, which is what a session that never set its
 * roll holds; LUNA then uses no roll.
 *
 * @example Luna.parseRollDuration('1,2,0');   // { bars: 1, beats: 2, ticks: 0 }
 */
export function parseRollDuration(value: string | null | undefined): RollDuration | undefined {
  if (typeof value !== 'string') return undefined;
  const parts = value.split(',');
  if (parts.length !== 3) return undefined;
  const [bars, beats, ticks] = parts.map((p) => Number(p.trim()));
  if (![bars, beats, ticks].every((n) => Number.isInteger(n))) return undefined;
  return { bars: bars!, beats: beats!, ticks: ticks! };
}

/**
 * Write a roll length in LUNA's form for `transport.preRoll.set()` or `postRoll.set()`.
 * Omitted parts are 0. Rejects with `out_of_range` for a negative or non-integer part.
 *
 * @example await session.transport.postRoll.set(Luna.formatRollDuration({ bars: 1 }));   // "1,0,0"
 */
export function formatRollDuration(duration: Partial<RollDuration>): string {
  const parts = [duration.bars ?? 0, duration.beats ?? 0, duration.ticks ?? 0];
  if (!parts.every((n) => Number.isInteger(n) && n >= 0)) throw new UAError('out_of_range', 'formatRollDuration(): bars, beats and ticks must be integers >= 0');
  return parts.join(',');
}
