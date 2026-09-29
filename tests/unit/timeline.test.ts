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
