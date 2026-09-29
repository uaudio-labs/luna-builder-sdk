// @vitest-environment jsdom
/**
 * Luna.bindClock: anchors on each engine `location` push and interpolates with
 * requestAnimationFrame while playing, so a sub-second display moves smoothly between the
 * engine's few pushes per second, with the push staying authoritative.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  // Deliver a push and the change notifications it schedules (real timers stay in charge
  // of those; the fake clock below drives only frames and performance.now).
  const settle = async (): Promise<void> => {
    await engine.settled();
    await luna.store.scheduler.settled();
  };
  return { engine, luna, transport: session.transport, settle };
}

describe('Luna.bindClock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders on bind and follows pushes without frames while stopped', async () => {
    const { engine, transport, settle } = await connected();
    const el = document.createElement('div');
    const release = Luna.bindClock(el, transport);
    expect(el.textContent).toBe('00:00.0');

    engine.setValue('/sessions/abc', 'play_start', Luna.TICKS_PER_BEAT * 8); // 4 s at 120 BPM
    await settle();
    expect(el.textContent).toBe('00:04.0');
    vi.advanceTimersByTime(1000); // stopped: no frame loop, the display holds
    expect(el.textContent).toBe('00:04.0');
    release();
  });

  it('interpolates between pushes while playing, each push re-anchoring', async () => {
    const { engine, transport, settle } = await connected();
    const seen: number[] = [];
    const el = document.createElement('div');
    const release = Luna.bindClock(el, transport, { render: (s) => void seen.push(s) });

    engine.setValue('/sessions/abc', 'playing', true);
    engine.setValue('/sessions/abc', 'location', engine.locationAt('/sessions/abc', Luna.TICKS_PER_BEAT * 2)); // 1 s
    await settle();
    expect(seen.at(-1)).toBe(1);

    vi.advanceTimersByTime(500); // frames advance the estimate by wall-clock time
    expect(seen.at(-1)!).toBeGreaterThan(1.4);
    expect(seen.at(-1)!).toBeLessThanOrEqual(1.5);

    // the next push is authoritative, even backwards (a loop wrap)
    engine.setValue('/sessions/abc', 'location', engine.locationAt('/sessions/abc', Luna.TICKS_PER_BEAT));
    await settle();
    expect(seen.at(-1)).toBe(0.5);

    engine.setValue('/sessions/abc', 'playing', false);
    await settle();
    const rested = seen.length;
    vi.advanceTimersByTime(1000); // stop cancels the frame loop
    expect(seen.length).toBe(rested);
    release();
  });

  it('returns a release function and disposes with a Bindings group', async () => {
    const { engine, transport, settle } = await connected();
    const el = document.createElement('div');
    const bindings = new Luna.Bindings();
    Luna.bindClock(el, transport, { bindings });
    bindings.clear();
    engine.setValue('/sessions/abc', 'play_start', Luna.TICKS_PER_BEAT * 8);
    await settle();
    expect(el.textContent).toBe('00:00.0'); // released: no repaint
  });
});
