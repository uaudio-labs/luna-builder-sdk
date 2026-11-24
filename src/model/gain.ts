/**
 * Linear gain and decibels: the amplitude ratio a signal is multiplied by, and the same ratio
 * in dB (`20 * log10(gain)`). Use them for meter levels, a plug-in parameter that takes a
 * linear gain, or arithmetic on dB values (adding two gains, for example).
 *
 * They are **not** fader positions. A fader's 0..1 position maps to dB through LUNA's taper
 * tables, which are not logarithmic; that is {@link Taper} (`taper.toDb(normalized)`,
 * `taper.toNormalized(db)`), or simply a gain control's `real` view.
 */

/**
 * A linear gain as decibels: `20 * log10(gain)`. Silence (0, or anything not above it) is
 * `-Infinity`.
 *
 * @example
 * Luna.gainToDb(1);     // 0
 * Luna.gainToDb(0.5);   // -6.02
 * Luna.gainToDb(0);     // -Infinity
 * // not a fader position: for that use the control's taper
 * track.gain.taper.value?.toDb(track.gain.normalized.value ?? 0);
 */
export function gainToDb(gain: number): number {
  if (!(gain > 0)) return -Infinity;
  return 20 * Math.log10(gain);
}

/** LUNA's "-infinity" gain in dB: at or below it, {@link dbToGain} answers exactly 0 (fact 228). */
export const NEG_INFINITY_DB = -144;

/**
 * Decibels as a linear gain: `10 ** (db / 20)`, with LUNA's hard zero at or below
 * {@link NEG_INFINITY_DB} (fact 228). `-Infinity` is 0.
 *
 * @example
 * Luna.dbToGain(0);           // 1
 * Luna.dbToGain(-6);          // 0.501
 * Luna.dbToGain(-144);        // 0
 */
export function dbToGain(db: number): number {
  return db <= NEG_INFINITY_DB ? 0 : Math.pow(10, db / 20);
}
