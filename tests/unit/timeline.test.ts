/**
 * `Timeline.tickAtSeconds`, the inverse of `seconds()`, across a tempo map.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const B = Luna.TICKS_PER_BEAT;

async function timelineWith(tempos: Array<{ tick: number; bpm: number }>) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  for (const t of tempos) await session.musical.setTempo(t.bpm, t.tick);
  await engine.settled();
  await session.musical.tempoMap.load();
  await Promise.all(session.musical.tempoMap.items.map((i) => i.load()));
  return session.musical.timeline;
}

describe('Luna.Timeline.tickAtSeconds', () => {
  it('round-trips seconds() at one tempo', async () => {
    const t = await timelineWith([{ tick: 0, bpm: 120 }]);   // 0.5 s per beat
    expect(t.seconds(4 * B)).toBeCloseTo(2, 6);
    expect(t.tickAtSeconds(2)).toBeCloseTo(4 * B, 0);
    for (const tick of [0, B, 3.5 * B, 17 * B]) {
      expect(t.tickAtSeconds(t.seconds(tick))).toBeCloseTo(tick, 0);
    }
  });

  it('round-trips across a tempo change', async () => {
    const t = await timelineWith([{ tick: 0, bpm: 120 }, { tick: 8 * B, bpm: 60 }]);
    // Eight beats at 120 is 4 s; after that each beat is 1 s.
    expect(t.seconds(8 * B)).toBeCloseTo(4, 6);
    expect(t.seconds(10 * B)).toBeCloseTo(6, 6);
    expect(t.tickAtSeconds(4)).toBeCloseTo(8 * B, 0);
    expect(t.tickAtSeconds(6)).toBeCloseTo(10 * B, 0);
    for (const tick of [0, 2 * B, 8 * B, 9.25 * B, 40 * B]) {
      expect(t.tickAtSeconds(t.seconds(tick))).toBeCloseTo(tick, 0);
    }
  });

  it('treats zero and negative offsets as the start', async () => {
    const t = await timelineWith([{ tick: 0, bpm: 90 }]);
    expect(t.tickAtSeconds(0)).toBe(0);
    expect(t.tickAtSeconds(-5)).toBe(0);
  });
});

describe('Luna.Timeline.tickAt', () => {
  it('round-trips barBeat() at 4/4', async () => {
    const t = await timelineWith([{ tick: 0, bpm: 120 }]);
    expect(t.tickAt({ bar: 1 })).toBe(0);
    expect(t.tickAt({ bar: 9 })).toBe(t.tickAtBar(9));
    expect(t.tickAt({ bar: 2, beat: 3 })).toBe(4 * B + 2 * B);
    for (const at of [{ bar: 1, beat: 1, tick: 0 }, { bar: 3, beat: 2, tick: 0 }, { bar: 17, beat: 4, tick: B / 4 }]) {
      expect(t.barBeat(t.tickAt(at))).toEqual({ bar: at.bar, beat: at.beat, tick: at.tick });
    }
  });

  it('defaults beat to 1 and tick to 0', async () => {
    const t = await timelineWith([{ tick: 0, bpm: 100 }]);
    expect(t.tickAt({ bar: 4 })).toBe(t.tickAt({ bar: 4, beat: 1, tick: 0 }));
  });
});

describe('Luna.formatMinSec', () => {
  it('formats zero-padded MM:SS, flooring rather than rounding', () => {
    expect(Luna.formatMinSec(0)).toBe('00:00');
    expect(Luna.formatMinSec(5.999)).toBe('00:05');
    expect(Luna.formatMinSec(90.56)).toBe('01:30');
    expect(Luna.formatMinSec(3600)).toBe('60:00'); // minutes are not capped
  });

  it('adds fractional digits, floored at that precision', () => {
    expect(Luna.formatMinSec(90.5, { fraction: 1 })).toBe('01:30.5');
    expect(Luna.formatMinSec(90.56, { fraction: 2 })).toBe('01:30.56');
    expect(Luna.formatMinSec(90.999, { fraction: 2 })).toBe('01:30.99');
    expect(Luna.formatMinSec(61, { fraction: 2 })).toBe('01:01.00');
  });

  it('clamps negatives to zero and shows a placeholder for undefined', () => {
    expect(Luna.formatMinSec(-3)).toBe('00:00');
    expect(Luna.formatMinSec(-0.2, { fraction: 1 })).toBe('00:00.0');
    expect(Luna.formatMinSec(undefined)).toBe('--:--');
    expect(Luna.formatMinSec(Number.NaN, { fraction: 2 })).toBe('--:--.--');
  });
});

describe('Luna.Timeline before the tempo map loads', () => {
  async function unloaded() {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    await luna.sessions.ready();
    const session = luna.sessions.current()!;   // listed, but not session.ready(): no tempo map yet
    return { engine, luna, session };
  }

  it('reports unavailable instead of assuming 120 BPM', async () => {
    const { session } = await unloaded();
    const t = session.musical.timeline;
    expect(session.musical.tempoMap.items).toHaveLength(0);
    expect(t.tempoLoaded).toBe(false);
    for (const read of [() => t.tempoAt(0), () => t.seconds(B), () => t.tickAtSeconds(1), () => session.musical.tempoAt(0)]) {
      expect(read).toThrow(Luna.Error);
      try { read(); } catch (e) { expect((e as InstanceType<typeof Luna.Error>).code).toBe('unavailable'); }
    }
    expect(() => session.transport.seconds).toThrow(/not loaded/);
  });

  it('ignores a tempo event whose BPM has not loaded yet rather than reading it as 120', async () => {
    const { engine, luna, session } = await unloaded();
    for (const row of engine.children('/sessions/abc/tempo_map')) engine.removeNode(`/sessions/abc/tempo_map/${row}`);
    await engine.settled();
    await session.ready();
    const t = session.musical.timeline;
    expect(session.musical.tempoMap.items).toHaveLength(0);

    let calls = 0;
    t.onChange(() => calls++);
    // A row LUNA adds is pushed as membership first; its values arrive on a read.
    await session.musical.setTempo(90, 0);
    await engine.settled();
    expect(session.musical.tempoMap.items.map((i) => i.tempo.value)).toEqual([undefined]);
    expect(t.tempoLoaded).toBe(false);
    expect(() => t.tempoAt(0)).toThrow(/not loaded/);

    await Promise.all(session.musical.tempoMap.items.map((i) => i.load()));
    await luna.settled();
    expect(t.tempoLoaded).toBe(true);
    expect(calls).toBeGreaterThan(0);   // the timeline says when it can answer
    expect(t.tempoAt(0)).toBe(90);
    expect(t.seconds(3 * B)).toBeCloseTo(2, 9);
  });

  it('leaves marker.seconds undefined until the tempo map loads, then fills it in', async () => {
    const { engine, luna, session } = await unloaded();
    engine.addNode('/sessions/abc/markers/9', { properties: { rowid: 9, location: 4 * B, name: 'Hook', comments: '', color: 0 } });
    engine.setValue('/sessions/abc/tempo_map/1', 'tempo', 60);
    await engine.settled();
    await session.markers.load();
    await Promise.all(session.markers.items.map((m) => m.load()));
    const marker = session.markers.items.find((m) => m.name.value === 'Hook')!;
    expect(marker.seconds.value).toBeUndefined();

    let calls = 0;
    marker.seconds.onChange(() => calls++);
    await session.musical.ready();
    await Promise.all(session.musical.tempoMap.items.map((i) => i.load()));
    await luna.settled();
    expect(marker.seconds.value).toBeCloseTo(4, 9);
    expect(calls).toBeGreaterThan(0);
  });
});

describe('Luna.Timeline.onChange on a tempo edit', () => {
  it('fires when the tempo in effect is edited, which tempoMap.onChange does not see', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const m = session.musical;
    expect(m.tempoAt(0)).toBe(120);

    let timelineCalls = 0;
    let mapCalls = 0;
    m.timeline.onChange(() => timelineCalls++);
    m.tempoMap.onChange(() => mapCalls++);
    await m.setTempoInEffectAt(90, 0);
    await engine.settled();
    await luna.settled();
    expect(mapCalls).toBe(0);            // the row was edited, not added or removed
    expect(timelineCalls).toBeGreaterThan(0);
    expect(m.tempoAt(0)).toBe(90);
    expect(m.timeline.seconds(3 * B)).toBeCloseTo(2, 9);
  });
});
