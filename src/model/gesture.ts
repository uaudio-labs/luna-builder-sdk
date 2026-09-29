/**
 * Touch-bracket a DOM control's drag: `begin()` on pointer down, `end()` on pointer up.
 *
 * LUNA turns a `set_touch` on / writes / `set_touch` off sequence into one undo step and one
 * automation pass (fact 26). A fader or knob in an Add On must therefore touch its controls
 * when the pointer goes down, write while it moves, and release when it comes up, and must
 * release exactly once whatever ends the drag: pointer up over another element, a cancelled
 * pointer, lost capture, the window losing focus. {@link bindGesture} owns that part. The Add
 * On keeps writing values from its own `input` or `pointermove` listener; inside the gesture
 * those writes are not bracketed one by one. For a range input or a knob, {@link bindRange}
 * and {@link bindDrag} do the writing and the following too; this is the part they share.
 *
 * Clicks (buttons, toggles, menus) need no gesture: a one-shot `set()` or `toggle()` is
 * bracketed by the control itself.
 *
 * @example
 * // <input type="range">: the browser fires `input` while dragging
 * Luna.bindGesture(fader, track.gain);
 * fader.addEventListener('input', () => track.gain.normalized.set(Number(fader.value)));
 *
 * // a canvas knob: capture the pointer and write from pointermove
 * const g = Luna.bindGesture(canvas, [left.gain, right.gain], { capture: true });
 * canvas.addEventListener('pointermove', (e) => {
 *   if (g.active) for (const c of [left.gain, right.gain]) void c.normalized.set(valueAt(e));
 * });
 */
import type { Bindings } from './bindings';
import type { Control } from './control';

export interface GestureOptions {
  /**
   * Call `setPointerCapture` on pointer down so moves outside the element still reach it.
   * Use it for canvas or div controls that write from `pointermove`; a native range input
   * tracks the pointer by itself. Default false.
   */
  capture?: boolean;
  /** Called after the controls are touched, with the pointer-down event. */
  onBegin?: (event: Event) => void;
  /**
   * Called after the controls are released, with the event that ended the drag (none when
   * {@link Gesture.end} or {@link Gesture.dispose} ended it). A good place to resync the
   * element to the engine's settled value.
   */
  onEnd?: (event?: Event) => void;
  /**
   * Hold this group for the length of each drag, so its {@link Bindings.whenIdle} rebuilds
   * wait for the release, and dispose the gesture with the group. The hold ends after `onEnd`.
   */
  bindings?: Bindings;
}

export interface Gesture {
  /** True between pointer down and release. Gate `pointermove` writes on it. */
  readonly active: boolean;
  /** End the current drag now, if any (for example when the element is re-bound). */
  end(): void;
  /** End any drag and remove every listener. */
  dispose(): void;
}

type PointerLike = Event & { pointerId?: number; button?: number };
type CapturingTarget = EventTarget & {
  setPointerCapture?: (id: number) => void;
  hasPointerCapture?: (id: number) => boolean;
  releasePointerCapture?: (id: number) => void;
  ownerDocument?: { defaultView?: EventTarget | null } | null;
};

/**
 * Bracket every drag on `target` with `begin()`/`end()` on `controls` (one control, or all
 * the controls one element drives).
 *
 * Only the primary button starts a drag, and a second pointer pressed during a drag is
 * ignored. The drag ends on the first of `pointerup` or `pointercancel` (on the element or
 * anywhere in its window), `lostpointercapture`, or the window's `blur`, and each control is
 * released exactly once.
 *
 * @example
 * const gesture = Luna.bindGesture(slider, control, {
 *   onEnd: () => { slider.value = String(control.normalized.value ?? 0); },
 * });
 * slider.addEventListener('input', () => control.normalized.set(Number(slider.value)));
 * // later
 * gesture.dispose();
 */
export function bindGesture(target: EventTarget, controls: Control | readonly Control[], options: GestureOptions = {}): Gesture {
  const list: readonly Control[] = Array.isArray(controls) ? controls : [controls as Control];
  const el = target as CapturingTarget;
  const view: EventTarget | undefined = el.ownerDocument?.defaultView ?? (globalThis as { window?: EventTarget }).window;
  let active = false;
  let pointerId: number | undefined;
  let releaseHold: (() => void) | undefined;

  const samePointer = (e: PointerLike): boolean => pointerId === undefined || e.pointerId === undefined || e.pointerId === pointerId;

  const finish = (event?: Event): void => {
    if (!active) return;
    active = false;
    view?.removeEventListener('pointerup', onRelease);
    view?.removeEventListener('pointercancel', onRelease);
    view?.removeEventListener('blur', onBlur);
    if (pointerId !== undefined && el.hasPointerCapture?.(pointerId)) el.releasePointerCapture?.(pointerId);
    pointerId = undefined;
    for (const c of list) c.end();
    try {
      options.onEnd?.(event);
    } finally {
      // After onEnd, so a rebuild waiting on the group sees the element already resynced.
      const done = releaseHold;
      releaseHold = undefined;
      done?.();
    }
  };

  const onRelease = (e: Event): void => {
    if (samePointer(e as PointerLike)) finish(e);
  };
  const onBlur = (e: Event): void => finish(e);

  const onDown = (e: Event): void => {
    const p = e as PointerLike;
    if (active || (p.button !== undefined && p.button !== 0)) return;
    active = true;
    pointerId = p.pointerId;
    releaseHold = options.bindings?.hold();
    // Touch before any write the press itself causes, so the whole drag is one bracket.
    for (const c of list) c.begin();
    if (options.capture && pointerId !== undefined) {
      try {
        el.setPointerCapture?.(pointerId);
      } catch {
        // The pointer is already gone (a synthetic event); the window listeners still end the drag.
      }
    }
    view?.addEventListener('pointerup', onRelease);
    view?.addEventListener('pointercancel', onRelease);
    view?.addEventListener('blur', onBlur);
    options.onBegin?.(e);
  };

  // Capture phase, so the touch goes out before the page's own pointerdown handlers write.
  target.addEventListener('pointerdown', onDown, true);
  target.addEventListener('pointerup', onRelease);
  target.addEventListener('pointercancel', onRelease);
  target.addEventListener('lostpointercapture', onRelease);

  const gesture: Gesture = {
    get active() {
      return active;
    },
    end: () => finish(),
    dispose: () => {
      finish();
      target.removeEventListener('pointerdown', onDown, true);
      target.removeEventListener('pointerup', onRelease);
      target.removeEventListener('pointercancel', onRelease);
      target.removeEventListener('lostpointercapture', onRelease);
    },
  };
  options.bindings?.add(gesture);
  return gesture;
}
