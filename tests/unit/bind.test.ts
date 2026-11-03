// @vitest-environment jsdom
/**
 * Luna.bindRange, Luna.bindDrag and Luna.Bindings: one call binds a fader or knob to a control
 * (one touch bracket per drag, fact 78), and a group of bindings holds rebuilds until the
 * last drag ends.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

/** Where LUNA's +12 taper puts 0 dB: the mock's resting fader (fact 134). */
const ZERO_DB = Luna.Taper.named('+12')!.toNormalized(0);

async function strip() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal', 'Bass'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  const t = session.tracks.byId('Vocal')!;
  await t.loadStrip();
  // A reset is three round trips (touch, reset, release); give each its macrotask.
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 0));
      await engine.settled();
      await luna.store.scheduler.settled();
    }
  };
  return { engine, luna, gain: t.gain, pan: t.pan, settle };
}

/** jsdom has no PointerEvent; a MouseEvent with a pointerId is what the helpers read. */
function pointer(type: string, init: { x?: number; y?: number; button?: number; id?: number } = {}): Event {
  const e = new MouseEvent(type, { bubbles: true, button: init.button ?? 0, clientX: init.x ?? 0, clientY: init.y ?? 0 });
  Object.defineProperty(e, 'pointerId', { value: init.id ?? 1 });
  return e;
}

function range(min = '0', max = '1000'): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = 'any';
  document.body.appendChild(input);
  return input;
}

function drag(input: HTMLInputElement, values: number[]): void {
  input.dispatchEvent(pointer('pointerdown'));
  for (const v of values) {
    input.value = String(v);
    input.dispatchEvent(new Event('input'));
  }
}

describe('Luna.bindRange', () => {
  it('maps the input range onto normalized, and a drag is one touch bracket', async () => {
    const { engine, gain, settle } = await strip();
    await gain.normalized.set(0.25);
    await settle();
    engine.touches.length = 0;
    const fader = range();
    Luna.bindRange(fader, gain);
    expect(fader.value).toBe('250');

    drag(fader, [300, 400, 500]);
    fader.dispatchEvent(pointer('pointerup'));
    await settle();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    expect(engine.value(gain.path, 'normalized_value')).toBe(0.5);
  });

  it("follows LUNA outside a drag, ignores it mid-drag, and settles on LUNA's value on release", async () => {
    const { engine, gain, settle } = await strip();
    const fader = range();
    let ended = 0;
    Luna.bindRange(fader, gain, { onEnd: () => ended++ });

    engine.setValue(gain.path, 'normalized_value', 0.1);
    await settle();
    expect(fader.value).toBe('100');

    drag(fader, [600]);
    engine.setValue(gain.path, 'normalized_value', 0.2);
    await settle();
    expect(fader.value).toBe('600');

    engine.setValue(gain.path, 'normalized_value', 0.7);
    await settle();
    fader.dispatchEvent(pointer('pointerup'));
    expect(fader.value).toBe('700');
    expect(ended).toBe(1);
  });

  it('writes units with view: real', async () => {
    const { engine, gain, settle } = await strip();
    const trim = range('-20', '20');
    Luna.bindRange(trim, gain, { view: 'real' });
    trim.value = '-6';
    trim.dispatchEvent(new Event('input'));
    await settle();
    expect(engine.value(gain.path, 'real_value')).toBe(-6);
    engine.setValue(gain.path, 'real_value', -3);
    await settle();
    expect(trim.value).toBe('-3');
  });

  it("double-click resets to LUNA's default, unless reset is false", async () => {
    const { engine, gain, pan, settle } = await strip();
    await Promise.all([gain.normalized.set(0.1), pan.normalized.set(0.1)]);
    const a = range();
    const b = range();
    Luna.bindRange(a, gain);
    Luna.bindRange(b, pan, { reset: false });
    a.dispatchEvent(new MouseEvent('dblclick'));
    b.dispatchEvent(new MouseEvent('dblclick'));
    await settle();
    expect(engine.value(gain.path, 'normalized_value')).toBe(ZERO_DB);
    expect(engine.value(pan.path, 'normalized_value')).toBe(0.1);
  });

  it('dispose stops writing and following', async () => {
    const { engine, gain, settle } = await strip();
    const fader = range();
    const b = Luna.bindRange(fader, gain);
    b.dispose();
    fader.value = '900';
    fader.dispatchEvent(new Event('input'));
    engine.setValue(gain.path, 'normalized_value', 0.3);
    await settle();
    expect(fader.value).toBe('900');
    expect(engine.value(gain.path, 'normalized_value')).toBe(0.3);
  });
});

describe('Luna.bindDrag', () => {
  it('turns pointer travel into a value, one touch bracket per drag, and renders each write', async () => {
    const { engine, pan, settle } = await strip();
    engine.touches.length = 0;
    const knob = document.createElement('div');
    document.body.appendChild(knob);
    const drawn: number[] = [];
    Luna.bindDrag(knob, pan, { pixelsPerUnit: 100, render: (v) => drawn.push(v) });
    expect(drawn).toEqual([0.5]);

    knob.dispatchEvent(pointer('pointerdown', { y: 50 }));
    knob.dispatchEvent(pointer('pointermove', { y: 40 }));
    knob.dispatchEvent(pointer('pointermove', { y: 30 }));
    engine.setValue(pan.path, 'normalized_value', 0.9); // an echo mid-drag is ignored
    await settle();
    knob.dispatchEvent(pointer('pointermove', { y: -500 })); // clamps
    knob.dispatchEvent(pointer('pointerup'));
    await settle();
    expect(drawn.slice(0, 4)).toEqual([0.5, 0.6, 0.7, 1]);
    expect(engine.touches).toEqual([`${pan.path}:on`, `${pan.path}:off`]);
    expect(engine.value(pan.path, 'normalized_value')).toBe(1);
  });

  it('moves on the chosen axis only', async () => {
    const { engine, pan, settle } = await strip();
    const knob = document.createElement('div');
    Luna.bindDrag(knob, pan, { axis: 'x', pixelsPerUnit: 100 });
    knob.dispatchEvent(pointer('pointerdown', { x: 0, y: 0 }));
    knob.dispatchEvent(pointer('pointermove', { x: 20, y: -80 }));
    knob.dispatchEvent(pointer('pointerup'));
    await settle();
    expect(engine.value(pan.path, 'normalized_value')).toBeCloseTo(0.7);
  });

  it('is a focusable slider whose aria value follows the control, and keys nudge it', async () => {
    const { engine, pan, settle } = await strip();
    const knob = document.createElement('div');
    Luna.bindDrag(knob, pan, { label: 'Pan', step: 0.05 });
    expect([knob.tabIndex, knob.getAttribute('role'), knob.getAttribute('aria-label')]).toEqual([0, 'slider', 'Pan']);
    expect([knob.getAttribute('aria-valuenow'), knob.getAttribute('aria-valuetext')]).toEqual(['0.500', 'C']);
    expect(knob.style.touchAction).toBe('none');

    const key = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    knob.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(true);
    await settle();
    expect(engine.value(pan.path, 'normalized_value')).toBeCloseTo(0.55);
    knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    await settle();
    expect(engine.value(pan.path, 'normalized_value')).toBe(1);
    expect(knob.getAttribute('aria-valuenow')).toBe('1.000');

    engine.setValue(pan.path, 'normalized_value', 0.25);
    await settle();
    expect(knob.getAttribute('aria-valuenow')).toBe('0.250');
  });

  it('keeps an existing role and tabindex', async () => {
    const { pan } = await strip();
    const knob = document.createElement('div');
    knob.setAttribute('role', 'spinbutton');
    knob.tabIndex = 3;
    Luna.bindDrag(knob, pan);
    expect([knob.tabIndex, knob.getAttribute('role')]).toEqual([3, 'spinbutton']);
  });

  it('drives several controls together and resets them all on double-click', async () => {
    const { engine, gain, pan, settle } = await strip();
    engine.touches.length = 0;
    const knob = document.createElement('div');
    Luna.bindDrag(knob, [pan, gain], { pixelsPerUnit: 100 });
    knob.dispatchEvent(pointer('pointerdown', { y: 0 }));
    knob.dispatchEvent(pointer('pointermove', { y: 20 }));
    knob.dispatchEvent(pointer('pointerup'));
    await settle();
    expect(engine.touches).toEqual([`${pan.path}:on`, `${gain.path}:on`, `${pan.path}:off`, `${gain.path}:off`]);
    expect([engine.value(pan.path, 'normalized_value'), engine.value(gain.path, 'normalized_value')]).toEqual([0.3, 0.3]);

    knob.dispatchEvent(new MouseEvent('dblclick'));
    await settle();
    expect([engine.value(pan.path, 'normalized_value'), engine.value(gain.path, 'normalized_value')]).toEqual([0.5, ZERO_DB]);
  });
});

describe('Luna.Bindings', () => {
  it('releases every listener and binding it holds on clear, and stays usable', async () => {
    const { engine, gain, pan, settle } = await strip();
    const group = new Luna.Bindings();
    let names = 0;
    group.on(gain.display, () => names++);
    const fader = range();
    Luna.bindRange(fader, gain, { bindings: group });
    let extra = 0;
    group.add(() => extra++);

    group.clear();
    engine.setValue(gain.path, 'normalized_value', 0.4);
    engine.setValue(gain.path, 'string_value', '-9.0');
    await settle();
    expect([names, extra, fader.value]).toEqual([0, 1, String(ZERO_DB * 1000)]);

    group.on(pan.display, () => names++);
    engine.setValue(pan.path, 'string_value', 'L10');
    await settle();
    expect(names).toBe(1);
  });

  it('holds a rebuild until the last drag ends, and runs only the latest once', async () => {
    const { engine, gain, pan, settle } = await strip();
    const group = new Luna.Bindings();
    const a = range();
    const knob = document.createElement('div');
    Luna.bindRange(a, gain, { bindings: group });
    Luna.bindDrag(knob, pan, { bindings: group });
    const runs: string[] = [];

    a.dispatchEvent(pointer('pointerdown'));
    knob.dispatchEvent(pointer('pointerdown', { id: 2 }));
    expect(group.busy).toBe(true);
    const first = group.whenIdle(() => void runs.push('first'));
    const second = group.whenIdle(() => {
      // The element is already resynced and every touch released when the rebuild runs.
      runs.push(`second:${a.value}:${gain.inGesture}:${pan.inGesture}`);
    });
    a.dispatchEvent(pointer('pointerup'));
    expect(runs).toEqual([]);
    window.dispatchEvent(new Event('blur'));
    await Promise.all([first, second]);
    expect(runs).toEqual([`second:${ZERO_DB * 1000}:false:false`]);
    expect(group.busy).toBe(false);

    await group.whenIdle(() => void runs.push('now'));
    expect(runs).toEqual([`second:${ZERO_DB * 1000}:false:false`, 'now']);
    await settle();
    expect(engine.touches.filter((t) => t.endsWith(':on')).length).toBe(2);
  });

  it('hold() keeps it busy for a non-drag edit; releasing twice is harmless', async () => {
    const group = new Luna.Bindings();
    const runs: number[] = [];
    const done = group.hold();
    const idle = group.whenIdle(() => void runs.push(1));
    expect(runs).toEqual([]);
    done();
    done();
    await idle;
    expect(runs).toEqual([1]);
  });

  it('clear ends a drag and drops holds; a waiting rebuild then runs', async () => {
    const { engine, gain, settle } = await strip();
    engine.touches.length = 0;
    const group = new Luna.Bindings();
    const fader = range();
    Luna.bindRange(fader, gain, { bindings: group });
    fader.dispatchEvent(pointer('pointerdown'));
    group.hold();
    let ran = 0;
    const waiting = group.whenIdle(() => void ran++);
    group.clear();
    await waiting;
    await settle();
    expect([ran, group.busy]).toEqual([1, false]);
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
  });

  it('runs one rebuild at a time: requests during an async one collapse into one more', async () => {
    const group = new Luna.Bindings();
    const log: string[] = [];
    let open!: () => void;
    const first = group.whenIdle(async () => {
      log.push('first:start');
      await new Promise<void>((r) => (open = r));
      log.push('first:end');
    });
    const a = group.whenIdle(() => void log.push('a'));
    const b = group.whenIdle(() => void log.push('b'));
    expect(log).toEqual(['first:start']);
    open();
    await Promise.all([first, a, b]);
    expect(log).toEqual(['first:start', 'first:end', 'b']);
  });

  it('a rebuild that finds the group busy after loading can ask again without deadlock', async () => {
    const group = new Luna.Bindings();
    let release!: () => void;
    let renders = 0;
    const render = async (): Promise<void> => {
      await Promise.resolve();
      if (group.busy) {
        void group.whenIdle(render);
        return;
      }
      renders++;
    };
    const first = group.whenIdle(render);
    release = group.hold(); // a drag begins while the first render loads
    await first;
    expect(renders).toBe(0);
    release();
    await new Promise((r) => setTimeout(r, 0));
    expect(renders).toBe(1);
  });

  it('dispose drops a waiting rebuild and resolves its promise', async () => {
    const group = new Luna.Bindings();
    group.hold();
    let ran = false;
    const waiting = group.whenIdle(() => {
      ran = true;
    });
    group.dispose();
    await waiting;
    expect(ran).toBe(false);
  });

  it('bindGesture takes the group too', async () => {
    const { gain } = await strip();
    const group = new Luna.Bindings();
    const knob = document.createElement('div');
    const g = Luna.bindGesture(knob, gain, { bindings: group });
    knob.dispatchEvent(pointer('pointerdown'));
    expect(group.busy).toBe(true);
    knob.dispatchEvent(pointer('pointerup'));
    expect(group.busy).toBe(false);
    group.dispose();
    knob.dispatchEvent(pointer('pointerdown'));
    expect(g.active).toBe(false);
  });

  it('after dispose, anything added is released at once', () => {
    const group = new Luna.Bindings();
    group.dispose();
    let released = false;
    group.add(() => {
      released = true;
    });
    expect(released).toBe(true);
  });
});
