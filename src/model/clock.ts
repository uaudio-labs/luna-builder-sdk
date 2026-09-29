/**
 * A smooth playback clock for an element, in the spirit of {@link bindRange}/{@link bindDrag}.
 *
 * The engine pushes `location` only several times a second, so a display with sub-second
 * digits stutters if it repaints only on pushes. {@link bindClock} anchors on each push —
 * the engine stays authoritative — and interpolates between them with requestAnimationFrame
 * while the transport is playing: estimated seconds are the anchored {@link Transport.seconds}
 * plus the wall-clock time since that push. Stopped, it repaints once per change (a seek moves
 * the resting playhead) and runs no frames.
 *
 * @example
 * const release = Luna.bindClock(el, session.transport);   // "01:30.5", tenths
 *
 * // hundredths, custom paint
 * Luna.bindClock(el, session.transport, {
 *   render: (seconds) => { el.textContent = Luna.formatMinSec(seconds, { fraction: 2 }); },
 *   bindings: strips,
 * });
 */
import type { Bindings } from './bindings';
import { formatMinSec } from './ticks';
import type { Transport } from './transport';
import type { Unsubscribe } from '../wire/port';

export interface ClockOptions {
  /**
   * Paint the element for the estimated playhead seconds. Called on bind, on every engine
   * push, and each animation frame while playing. Default: `el.textContent` set to
   * `Luna.formatMinSec(seconds, { fraction: 1 })`.
   */
  render?: (seconds: number) => void;
  /** Release the clock with this group. */
  bindings?: Bindings;
}

/**
 * Bind `el` to the transport's playhead clock. Reads {@link Transport.seconds}, so the
 * session's tempo map must be loaded (`session.ready()` does that). Returns a release
 * function that cancels the frame loop and the listeners.
 */
export function bindClock(el: HTMLElement, transport: Transport, options: ClockOptions = {}): Unsubscribe {
  const render = options.render ?? ((seconds: number): void => void (el.textContent = formatMinSec(seconds, { fraction: 1 })));
  const now = (): number => (globalThis.performance ?? Date).now();
  // A frame loop outside a browser (a unit test in the node realm) falls back to timers.
  const hasRaf = typeof globalThis.requestAnimationFrame === 'function';
  const raf: (fn: () => void) => unknown = hasRaf ? (fn) => requestAnimationFrame(fn) : (fn) => setTimeout(fn, 33);
  const unraf: (handle: unknown) => void = hasRaf ? (h) => cancelAnimationFrame(h as number) : (h) => clearTimeout(h as ReturnType<typeof setTimeout>);

  let anchor = { seconds: transport.seconds, at: now() };
  let frame: unknown;
  let released = false;

  const paint = (): void => render(anchor.seconds + (transport.playing.value === true ? (now() - anchor.at) / 1000 : 0));
  const loop = (): void => {
    frame = undefined;
    if (released || transport.playing.value !== true) return;
    paint();
    frame = raf(loop);
  };
  const stopFrames = (): void => {
    if (frame !== undefined) unraf(frame);
    frame = undefined;
  };
  // Each engine push re-anchors the interpolation, so the push stays authoritative.
  const reanchor = (): void => {
    anchor = { seconds: transport.seconds, at: now() };
    paint();
    if (transport.playing.value === true) {
      if (frame === undefined) frame = raf(loop);
    } else stopFrames();
  };

  const offs = [transport.location.onChange(reanchor), transport.playing.onChange(reanchor), transport.playStart.onChange(reanchor)];
  reanchor();

  const release = (): void => {
    if (released) return;
    released = true;
    stopFrames();
    for (const off of offs) off();
  };
  options.bindings?.add(release);
  return release;
}
