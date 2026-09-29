// @vitest-environment jsdom
/**
 * Luna.bindGesture: a drag on an element is one touch bracket, released exactly once whatever
 * ends it (fact 78).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function tick(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

async function gainOf(track = 'Vocal') {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal', 'Bass'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  const t = session.tracks.byId(track)!;
  await t.loadStrip();
  return { engine, luna, session, gain: t.gain, pan: t.pan };
}

/** jsdom has no PointerEvent; a MouseEvent with a pointerId is what the helper reads. */
function pointer(type: string, init: { pointerId?: number; button?: number } = {}): Event {
  const e = new MouseEvent(type, { bubbles: true, button: init.button ?? 0 });
  Object.defineProperty(e, 'pointerId', { value: init.pointerId ?? 1 });
  return e;
}

describe('Luna.bindGesture', () => {
  it('touches on pointer down, writes unbracketed while dragging, releases on pointer up', async () => {
    const { engine, gain } = await gainOf();
    const slider = document.createElement('input');
    slider.type = 'range';
    document.body.appendChild(slider);
    const g = Luna.bindGesture(slider, gain);
    slider.addEventListener('input', () => void gain.normalized.set(Number(slider.value) / 100));

    slider.dispatchEvent(pointer('pointerdown'));
    expect(g.active).toBe(true);
    for (const v of [10, 20, 30]) {
      slider.value = String(v);
      slider.dispatchEvent(new Event('input'));
    }
    await tick();
    expect(engine.touches).toEqual([`${gain.path}:on`]);
    slider.dispatchEvent(pointer('pointerup'));
    await tick();
    expect(g.active).toBe(false);
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    expect(engine.value(gain.path, 'normalized_value')).toBe(0.3);
    g.dispose();
    slider.remove();
  });

  it('ends on a pointer up anywhere in the window, and only once', async () => {
    const { engine, gain } = await gainOf();
    const knob = document.createElement('div');
    document.body.appendChild(knob);
    let ended = 0;
    Luna.bindGesture(knob, gain, { onEnd: () => ended++ });
    knob.dispatchEvent(pointer('pointerdown'));
    document.body.dispatchEvent(pointer('pointerup'));
    knob.dispatchEvent(pointer('pointerup'));
    knob.dispatchEvent(pointer('lostpointercapture'));
    await tick();
    expect(ended).toBe(1);
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
    knob.remove();
  });

  it('ends on cancel and on window blur', async () => {
    const { engine, gain } = await gainOf();
    const knob = document.createElement('div');
    const g = Luna.bindGesture(knob, gain);
    knob.dispatchEvent(pointer('pointerdown'));
    knob.dispatchEvent(pointer('pointercancel'));
    knob.dispatchEvent(pointer('pointerdown'));
    window.dispatchEvent(new Event('blur'));
    await tick();
    expect(g.active).toBe(false);
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`, `${gain.path}:on`, `${gain.path}:off`]);
  });

  it('ignores a stray pointer up, a second pointer and a non-primary button', async () => {
    const { engine, gain } = await gainOf();
    const knob = document.createElement('div');
    const g = Luna.bindGesture(knob, gain);
    knob.dispatchEvent(pointer('pointerup'));
    knob.dispatchEvent(pointer('pointerdown', { button: 2 }));
    expect(g.active).toBe(false);
    knob.dispatchEvent(pointer('pointerdown', { pointerId: 1 }));
    knob.dispatchEvent(pointer('pointerdown', { pointerId: 2 }));
    knob.dispatchEvent(pointer('pointerup', { pointerId: 2 }));
    expect(g.active).toBe(true);
    knob.dispatchEvent(pointer('pointerup', { pointerId: 1 }));
    await tick();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
  });

  it('brackets every control one element drives, and touches before the page writes on press', async () => {
    const { engine, gain, pan } = await gainOf();
    const knob = document.createElement('div');
    Luna.bindGesture(knob, [gain, pan]);
    // The page's own pointerdown jumps the value; the gesture's capture-phase listener runs first.
    knob.addEventListener('pointerdown', () => void gain.normalized.set(0.9));
    knob.dispatchEvent(pointer('pointerdown'));
    knob.dispatchEvent(pointer('pointerup'));
    await tick();
    expect(engine.touches).toEqual([`${gain.path}:on`, `${pan.path}:on`, `${gain.path}:off`, `${pan.path}:off`]);
  });

  it('dispose ends a drag in progress and unbinds', async () => {
    const { engine, gain } = await gainOf();
    const knob = document.createElement('div');
    const g = Luna.bindGesture(knob, gain);
    knob.dispatchEvent(pointer('pointerdown'));
    g.dispose();
    knob.dispatchEvent(pointer('pointerdown'));
    await tick();
    expect(g.active).toBe(false);
    expect(engine.touches).toEqual([`${gain.path}:on`, `${gain.path}:off`]);
  });
});
