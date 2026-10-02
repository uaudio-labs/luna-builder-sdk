/**
 * `timeline.formatBarBeat`, `timeline.onChange`, and the derived `marker.barBeat` /
 * `marker.seconds`, which follow the marker and the tempo map without listeners of their own.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const B = Luna.TICKS_PER_BEAT;
const D = Luna.TICKS_PER_DISPLAY_TICK;

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

/** The session's only time signature row, so a test can edit it in place. */
function signaturePath(engine: InstanceType<typeof Luna.MockEngine>): string {
  const ids = engine.children('/sessions/abc/time_signatures');
  if (ids.length === 0) engine.addNode('/sessions/abc/time_signatures/1', { properties: { tick: 0, bar: 1, partial: false, numerator: 4, denominator: 4 } });
  return `/sessions/abc/time_signatures/${ids[0] ?? '1'}`;
}

describe('Luna.Timeline.formatBarBeat', () => {
  it('formats a bare tick as LUNA shows it, with display ticks', async () => {
    const { session } = await connected();
    const t = session.musical.timeline;
    expect(t.formatBarBeat(0)).toBe('1|1|000');
    expect(t.formatBarBeat(B * 5 + D * 120)).toBe('2|2|120');
    expect(t.formatBarBeat(undefined)).toBe('-|-|---');
  });

  it('agrees with Luna.formatBarBeat over barBeat(), which needs no conversion', async () => {
    const { session } = await connected();
    const t = session.musical.timeline;
    const tick = B * 17 + D * 480;
    expect(t.barBeat(tick)).toEqual({ bar: 5, beat: 2, tick: D * 480 });
    expect(Luna.formatBarBeat(t.barBeat(tick))).toBe(t.formatBarBeat(tick));
    expect(t.formatBarBeat(tick)).toBe('5|2|480');
  });
});

describe('Luna.Marker.barBeat and seconds', () => {
  it('derive from the marker location and follow a move', async () => {
    const { luna, session } = await connected();
    await session.addMarker(Luna.WHOLE_NOTE * 4 + B * 2, 'Chorus');
    const marker = session.markers.items.find((m) => m.name.value === 'Chorus')!;
    expect(marker.barBeat.value).toEqual({ bar: 5, beat: 3, tick: 0 });
    expect(marker.seconds.value).toBeCloseTo(session.musical.timeline.seconds(marker.location.value!), 9);

    let calls = 0;
    marker.barBeat.onChange(() => calls++);
    await marker.moveTo(Luna.WHOLE_NOTE * 8);
    await luna.settled();
    expect(calls).toBeGreaterThan(0);
    expect(Luna.formatBarBeat(marker.barBeat.value)).toBe('9|1|000');
  });

  it('follow a time signature change with no listener on the signatures', async () => {
    const { engine, luna, session } = await connected();
    const path = signaturePath(engine);
    await engine.settled();
    await session.musical.timeSignatures.load();
    await session.addMarker(B * 6, 'Bridge');
    const marker = session.markers.items.find((m) => m.name.value === 'Bridge')!;
    expect(marker.barBeat.value).toEqual({ bar: 2, beat: 3, tick: 0 });

    let calls = 0;
    marker.barBeat.onChange(() => calls++);
    engine.setValue(path, 'numerator', 3);
    await engine.settled();
    await luna.settled();
    expect(calls).toBe(1);
    expect(marker.barBeat.value).toEqual({ bar: 3, beat: 1, tick: 0 });
  });

  it('follow a tempo change, and stay quiet when the answer does not move', async () => {
    const { engine, luna, session } = await connected();
    await session.musical.setTempo(120, 0);
    await engine.settled();
    await session.musical.tempoMap.load();
    await Promise.all(session.musical.tempoMap.items.map((i) => i.load()));
    await session.addMarker(B * 8, 'Outro');
    const marker = session.markers.items.find((m) => m.name.value === 'Outro')!;
    expect(marker.seconds.value).toBeCloseTo(4, 9);

    let seconds = 0;
    let barBeats = 0;
    marker.seconds.onChange(() => seconds++);
    marker.barBeat.onChange(() => barBeats++);
    await session.musical.setTempoInEffectAt(60, 0);
    await luna.settled();
    expect(marker.seconds.value).toBeCloseTo(8, 9);
    expect(seconds).toBe(1);
    expect(barBeats).toBe(0);   // a tempo change moves seconds, not bar|beat
  });

  it('timeline.onChange stops calling once unsubscribed', async () => {
    const { engine, luna, session } = await connected();
    const path = signaturePath(engine);
    await engine.settled();
    await session.musical.timeSignatures.load();
    let calls = 0;
    const off = session.musical.timeline.onChange(() => calls++);
    engine.setValue(path, 'numerator', 3);
    await engine.settled();
    await luna.settled();
    expect(calls).toBeGreaterThan(0);
    off();
    const before = calls;
    engine.setValue(path, 'numerator', 5);
    await engine.settled();
    await luna.settled();
    expect(calls).toBe(before);
  });
});
