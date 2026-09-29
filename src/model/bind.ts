/**
 * Bind a fader or knob element to a control in one call.
 *
 * Every continuous control on a page does the same four things: touch the control on press and
 * release it once however the drag ends (fact 78, {@link bindGesture}), write the new value on
 * every move, follow LUNA's value except mid-drag so a late echo never fights the pointer, and
 * settle on LUNA's value on release. {@link bindRange} does them for a native
 * `<input type="range">`; {@link bindDrag} also turns pointer travel into a value for a div or
 * canvas knob, and adds the keyboard, double-click reset and slider semantics a native input
 * has for free.
 *
 * @example
 * Luna.bindRange(fader, track.gain);                                   // <input type="range">
 * Luna.bindDrag(knob, track.pan, { render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`) });
 */
import type { Bindings } from './bindings';
import type { Control } from './control';
import { bindGesture, type Gesture } from './gesture';

/** What {@link bindRange} and {@link bindDrag} return. */
export interface ControlBinding extends Gesture {
  /** Repaint the element from the control's current value now, even mid-drag. */
  sync(): void;
}

interface CommonOptions {
  /** Called after the controls are touched, with the pointer-down event. */
  onBegin?: (event: Event) => void;
  /** Called after the release, once the element shows LUNA's settled value. */
  onEnd?: (event?: Event) => void;
  /** A rejected write or reset. Default: `console.error`. */
  onError?: (error: unknown) => void;
  /**
   * Double-click puts the controls back to LUNA's default (`resetToDefault()`, one undo step).
   * Default true.
   */
  reset?: boolean;
  /** Hold this group for each drag and dispose the binding with it. */
  bindings?: Bindings;
}

export interface RangeOptions extends CommonOptions {
  /**
   * Which view of the control the input's value is. `'normalized'` (default) maps the input's
   * `min`..`max` onto 0..1, so `min="0" max="1000"` gives a finer fader. `'real'` writes the
   * input's value as units (dB, pan position), for an input whose `min`/`max` are in units.
   */
  view?: 'normalized' | 'real';
}

export interface DragOptions extends CommonOptions {
  /** Which pointer travel moves the value: up (`'y'`, default), right (`'x'`), or either (`'both'`). */
  axis?: 'x' | 'y' | 'both';
  /** Pixels of travel for the whole 0..1 range. Default 200. */
  pixelsPerUnit?: number;
  /** Arrow-key step in normalized units; Page Up/Down move ten steps, Home/End go to the ends. Default 0.01. */
  step?: number;
  /**
   * Paint the element for a normalized value. Called on bind, on every write the element
   * makes, and on LUNA's changes outside a drag.
   */
  render?: (normalized: number) => void;
  /** `aria-label`, when the element has none. */
  label?: string;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Bind a native `<input type="range">` to `control`: touch on press, write on `input`, follow
 * LUNA outside a drag, settle on LUNA's value on release, double-click to reset. Keyboard
 * changes the browser makes are one-shot writes, which the control brackets itself.
 *
 * @example
 * const fader = document.createElement('input');
 * fader.type = 'range';
 * fader.min = '0'; fader.max = '1000';
 * Luna.bindRange(fader, track.gain, {
 *   onBegin: () => strip.classList.add('adjusting'),
 *   onEnd: () => strip.classList.remove('adjusting'),
 * });
 *
 * // units instead: a trim input from -20 to +20 dB
 * Luna.bindRange(trim, track.gainTrim, { view: 'real' });
 */
export function bindRange(input: HTMLInputElement, control: Control, options: RangeOptions = {}): ControlBinding {
  const view = options.view ?? 'normalized';
  const fail = options.onError ?? ((e: unknown) => console.error('[Luna] bindRange', e));
  const bounds = (): [number, number] => {
    const min = input.min === '' ? 0 : Number(input.min);
    const max = input.max === '' ? 100 : Number(input.max);
    return [min, max > min ? max : min + 1];
  };

  const sync = (): void => {
    if (view === 'real') {
      const r = control.real.value;
      if (typeof r === 'number') input.value = String(r);
      return;
    }
    const [min, max] = bounds();
    input.value = String(min + (control.normalized.value ?? 0) * (max - min));
  };

  const gesture = bindGesture(input, control, {
    ...(options.onBegin ? { onBegin: options.onBegin } : {}),
    ...(options.bindings ? { bindings: options.bindings } : {}),
    onEnd: (e) => {
      sync();
      options.onEnd?.(e);
    },
  });

  const onInput = (): void => {
    const v = Number(input.value);
    let write: Promise<void>;
    if (view === 'real') write = control.real.set(v);
    else {
      const [min, max] = bounds();
      write = control.normalized.set(clamp01((v - min) / (max - min)));
    }
    write.catch(fail);
  };
  const onDouble = (): void => void control.resetToDefault().catch(fail);
  const off = control[view].onChange(() => {
    if (!gesture.active) sync();
  });

  input.addEventListener('input', onInput);
  if (options.reset !== false) input.addEventListener('dblclick', onDouble);
  sync();

  return withBindings(options.bindings, gesture, sync, () => {
    off();
    input.removeEventListener('input', onInput);
    input.removeEventListener('dblclick', onDouble);
  });
}

/**
 * Bind a div or canvas knob (or fader, or one axis of an XY pad) to one control, or to several
 * that move together. Dragging captures the pointer and moves the value by pointer travel;
 * arrow, Page and Home/End keys nudge it; double-click resets it. The element becomes a
 * focusable `role="slider"` whose `aria-valuenow` and `aria-valuetext` follow the control.
 * Writes go to the controls' `normalized` view, and the first control's value is the one shown.
 *
 * @example
 * const knob = document.createElement('div');
 * Luna.bindDrag(knob, track.pan, {
 *   label: 'Pan',
 *   axis: 'both',
 *   pixelsPerUnit: 160,
 *   render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`),
 * });
 *
 * // a stereo bus's two pans on one knob
 * Luna.bindDrag(knob, bus.main.pans, { render });
 */
export function bindDrag(el: HTMLElement, controls: Control | readonly Control[], options: DragOptions = {}): ControlBinding {
  const list: readonly Control[] = Array.isArray(controls) ? controls : [controls as Control];
  const lead = list[0];
  if (!lead) throw new TypeError('bindDrag needs at least one control');
  const fail = options.onError ?? ((e: unknown) => console.error('[Luna] bindDrag', e));
  const axis = options.axis ?? 'y';
  const perUnit = options.pixelsPerUnit ?? 200;
  const step = options.step ?? 0.01;

  if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.tabIndex = 0;
  if (!el.hasAttribute('role')) el.setAttribute('role', 'slider');
  el.setAttribute('aria-valuemin', '0');
  el.setAttribute('aria-valuemax', '1');
  if (options.label && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', options.label);
  // Touch screens scroll the page instead of sending pointer moves unless told not to.
  if (!el.style.touchAction) el.style.touchAction = 'none';

  let value = 0;
  const paint = (): void => {
    el.setAttribute('aria-valuenow', value.toFixed(3));
    const text = lead.display.value;
    if (text) el.setAttribute('aria-valuetext', text);
    else el.removeAttribute('aria-valuetext');
    options.render?.(value);
  };
  const sync = (): void => {
    value = clamp01(lead.normalized.value ?? value);
    paint();
  };
  const write = (v: number): void => {
    value = clamp01(v);
    paint();
    for (const c of list) c.normalized.set(value).catch(fail);
  };

  let from: { x: number; y: number; value: number } | undefined;
  const gesture = bindGesture(el, list, {
    capture: true,
    ...(options.bindings ? { bindings: options.bindings } : {}),
    onBegin: (e) => {
      const p = e as PointerEvent;
      from = { x: p.clientX, y: p.clientY, value };
      options.onBegin?.(e);
    },
    onEnd: (e) => {
      from = undefined;
      sync();
      options.onEnd?.(e);
    },
  });

  const onMove = (e: PointerEvent): void => {
    if (!gesture.active || !from) return;
    const dx = e.clientX - from.x;
    const dy = from.y - e.clientY;
    const travel = axis === 'x' ? dx : axis === 'y' ? dy : dx + dy;
    write(from.value + travel / perUnit);
  };
  const onKey = (e: KeyboardEvent): void => {
    const next: Record<string, number> = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: 0,
      End: 1,
    };
    const v = next[e.key];
    if (v === undefined || e.defaultPrevented) return;
    e.preventDefault();
    write(v);
  };
  const onDouble = (): void => {
    for (const c of list) c.resetToDefault().catch(fail);
  };
  const offs = [lead.normalized, lead.display].map((p) =>
    p.onChange(() => {
      if (!gesture.active) sync();
    }),
  );

  el.addEventListener('pointermove', onMove);
  el.addEventListener('keydown', onKey);
  if (options.reset !== false) el.addEventListener('dblclick', onDouble);
  sync();

  return withBindings(options.bindings, gesture, sync, () => {
    for (const off of offs) off();
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('keydown', onKey);
    el.removeEventListener('dblclick', onDouble);
  });
}

/** Wrap `gesture` with `sync` and the element's own teardown, and dispose it with `bindings`. */
function withBindings(bindings: Bindings | undefined, gesture: Gesture, sync: () => void, unbind: () => void): ControlBinding {
  let disposed = false;
  const binding: ControlBinding = {
    get active() {
      return gesture.active;
    },
    sync,
    end: () => gesture.end(),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      gesture.dispose();
      unbind();
    },
  };
  bindings?.add(binding);
  return binding;
}
