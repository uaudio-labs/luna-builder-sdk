/**
 * Clip gain as LUNA evaluates it (fact 228). A clip's gain automation lives on its `gain`
 * control (`<clip>/controls/gain`, {@link Clip.gainControl}); its breakpoints are in dB and
 * their ticks are relative to the clip's start. These helpers are pure: they read breakpoints
 * you pass in and talk to nothing.
 *
 * @example
 * const lane = clip.gainControl.automation;
 * await clip.gainControl.load();
 * await lane.load();
 * const db = Luna.clipGainAt(lane.breakpoints, Luna.QUARTER_NOTE) ?? clip.gain.value ?? 0;
 * const amplitude = Luna.dbToGain(db);
 */
import type { Breakpoint } from './automation';


/**
 * The gain in dB at `tick` (clip-relative ticks) from a clip gain lane, the way LUNA's clip
 * compiler evaluates it (fact 228): linear in dB between breakpoints, so 0 dB and -6 dB read
 * -3 dB half way; the first and last values hold outside the end points, with no slope carried
 * past them; two breakpoints at one tick are a step, the later one winning from that tick on.
 * `undefined` for an empty lane: LUNA then plays the clip's static `gain`.
 *
 * Breakpoints are sorted by tick here, so `automation.breakpoints` or any order will do.
 *
 * @example
 * Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 960, value: -6 }], 480); // -3
 * Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 960, value: -6 }], 5000); // -6, held
 * Luna.clipGainAt([], 0);                                                    // undefined
 */
export function clipGainAt(breakpoints: readonly Breakpoint[], tick: number): number | undefined {
  if (breakpoints.length === 0) return undefined;
  const bps = isSorted(breakpoints) ? breakpoints : [...breakpoints].sort((a, b) => a.tick - b.tick);
  const first = bps[0]!;
  if (bps.length === 1 || tick <= first.tick) return first.value;
  const last = bps[bps.length - 1]!;
  if (tick >= last.tick) return last.value;
  // First breakpoint strictly after `tick`; its predecessor starts the segment.
  let lo = 1;
  let hi = bps.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (bps[mid]!.tick > tick) hi = mid;
    else lo = mid + 1;
  }
  const next = bps[lo]!;
  const prev = bps[lo - 1]!;
  const span = next.tick - prev.tick;
  if (span <= 0) return next.value;
  return prev.value + (next.value - prev.value) * ((tick - prev.tick) / span);
}


function isSorted(bps: readonly Breakpoint[]): boolean {
  for (let i = 1; i < bps.length; i++) if (bps[i]!.tick < bps[i - 1]!.tick) return false;
  return true;
}
