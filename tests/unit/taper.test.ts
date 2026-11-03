/**
 * Fader tapers (fact 134): LUNA's breakpoint tables, the name rules a control's `taper`
 * property follows, hash marks, and `Control.taper` following the engine.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const track = (await luna.session()).tracks.byId('Vocal')!;
  await track.loadStrip();
  return { engine, luna, track };
}

describe('Luna.Taper', () => {
  it('reads LUNA’s table at its breakpoints, both ways', () => {
    const t = Luna.Taper.named('+12')!;
    for (const [db, n] of t.points) {
      expect(t.toNormalized(db)).toBeCloseTo(n, 10);
      expect(t.toDb(n)).toBeCloseTo(db, 10);
    }
    expect([t.minDb, t.maxDb]).toEqual([-144, 12]);
  });

  it('interpolates linearly between breakpoints, as LUNA does', () => {
    const t = Luna.Taper.named('+12')!;
    // Measured on LUNA: a gain at -13.9 dB sits at normalized 0.5344.
    expect(t.toNormalized(-13.9)).toBeCloseTo(0.5344, 4);
    expect(t.toDb(0.5344055891036987)).toBeCloseTo(-13.9, 4);
  });

  it('clamps outside the range', () => {
    const t = Luna.Taper.named('API')!;
    expect([t.toNormalized(40), t.toNormalized(-500), t.toDb(2), t.toDb(-1)]).toEqual([1, 0, 12, -144]);
  });

  it('handles the ascending tapers (preamp, volt monitor)', () => {
    const t = Luna.Taper.named('preamp')!;
    expect([t.minDb, t.maxDb, t.toNormalized(30), t.toDb(0.25)]).toEqual([0, 60, 0.5, 15]);
  });

  it('resolves names as LUNA does: empty, null and unknown are +12, none is no taper', () => {
    expect(Luna.Taper.named('')!.name).toBe('+12');
    expect(Luna.Taper.named(null)!.name).toBe('+12');
    expect(Luna.Taper.named('bogus')!.name).toBe('+12');
    expect(Luna.Taper.named('none')).toBeNull();
    expect(Luna.Taper.named('+12Neve')).toBe(Luna.Taper.named('+12Neve'));
    expect(Luna.Taper.NAMES).toEqual(['+18', '+12', '+12Neve', 'API', '+6', '+0', 'preamp', 'volt_monitor_gain']);
  });

  it('gives tapers to gain-type controls only', () => {
    expect(Luna.Taper.forControl('gain', null)?.name).toBe('+12');
    expect(Luna.Taper.forControl('gain_trim', 'API')?.name).toBe('API');
    expect(Luna.Taper.forControl('input_trim_mono', '')?.name).toBe('+12');
    expect(Luna.Taper.forControl('pan', '+12')).toBeNull();
    expect(Luna.Taper.forControl('parameter', null)).toBeNull();
    expect(Luna.Taper.forControl(undefined, null)).toBeUndefined();
  });

  it('gives LUNA’s hash marks, full and compact, top first, ending at -144', () => {
    const t = Luna.Taper.named('+12')!;
    expect(t.marks()).toEqual([12, 6, 0, -6, -12, -20, -32, -56, -144]);
    expect(t.marks({ compact: true })).toEqual([12, 0, -12, -32, -144]);
    expect(Luna.Taper.named('API')!.marks()).toEqual([10, 5, 0, -5, -10, -15, -20, -25, -35, -50, -144]);
    for (const name of Luna.Taper.NAMES) {
      const taper = Luna.Taper.named(name)!;
      for (const compact of [false, true]) {
        const marks = taper.marks({ compact });
        expect(marks).toEqual([...marks].sort((a, b) => b - a));
        expect(marks.every((db) => db >= taper.minDb && db <= taper.maxDb)).toBe(true);
      }
    }
    // A copy: changing it does not change the taper.
    t.marks().pop();
    expect(t.marks()).toHaveLength(9);
  });
});

describe('Control.taper', () => {
  it('is +12 on a gain whose taper is null, and null on a pan or switch', async () => {
    const { track } = await connected();
    expect(track.gain.taper.value?.name).toBe('+12');
    expect(track.gain.normalized.value).toBeCloseTo(track.gain.taper.value!.toNormalized(0), 10);
    expect(track.main.pans[0]!.taper.value).toBeNull();
    expect(track.mute.taper.value).toBeNull();
  });

  it('follows LUNA swapping the taper, and the mock maps through it', async () => {
    const { engine, luna, track } = await connected();
    const gain = track.gain;
    let changes = 0;
    gain.taper.onChange(() => changes++);

    engine.setValue(gain.path, 'taper', 'API');
    await engine.settled();
    await luna.settled();
    expect(changes).toBeGreaterThan(0);
    expect(gain.taper.value?.name).toBe('API');
    // LUNA keeps the dB and moves the fader.
    expect([gain.real.value, gain.normalized.value]).toEqual([0, 0.59423]);

    await gain.real.set(-6);
    await engine.settled();
    await luna.settled();
    expect(gain.normalized.value).toBeCloseTo(Luna.Taper.named('API')!.toNormalized(-6), 10);
  });
});
