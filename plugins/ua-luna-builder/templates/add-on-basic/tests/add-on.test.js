// Runs against Luna.MockEngine: no LUNA needed. `npm test`.
import { beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '@uaudio/luna-builder-sdk';

globalThis.Luna = Luna; // logic.js is a classic script that reads the Luna global
await import('../logic.js');
const logic = globalThis.AddOnLogic;

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { name: 'Demo', tracks: ['Vocal', 'Bass', 'Drums'] });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await Promise.all(session.tracks.items.map((t) => Promise.all([t.loadStrip(), t.controls.load()])));
  return { engine, luna, session };
}

describe('__TITLE__', () => {
  it('formats the transport location', async () => {
    const { engine, session } = await connected();
    expect(logic.locationText(session.transport)).toBe('1|1|000');
    engine.setValue('/sessions/abc', 'location', { tick: Luna.TICKS_PER_BEAT * 5, bar_beat: { bar: 2, beat: 2, tick: 0 } });
    await engine.settled();
    expect(logic.locationText(session.transport)).toBe('2|2|000');
  });

  it('lists tracks with their state', async () => {
    const { session } = await connected();
    expect(logic.rows(session).map((r) => r.name)).toEqual(['Vocal', 'Bass', 'Drums']);
    expect(logic.rows(session)[0]).toMatchObject({ gain: '0.0', muted: false, soloed: false });
  });

  it('mutes everything but one track in a single undo step', async () => {
    const { engine, session } = await connected();
    await logic.soloByMuting(session, 'Bass');
    await engine.settled();
    expect(logic.rows(session).map((r) => r.muted)).toEqual([true, false, true]);
    expect(engine.transactions).toEqual(['begin', 'commit']);
  });

  it("runs LUNA's standard shortcuts on the focused session", async () => {
    const { engine, luna } = await connected();
    const shortcuts = new Luna.Shortcuts(luna);
    await shortcuts.run('togglePlayback');
    await engine.settled();
    expect(engine.value('/sessions/abc', 'playing')).toBe(true);
    await shortcuts.run('undo');
    expect(engine.requests.some((r) => r.path.endsWith('/undo'))).toBe(true);
  });
});
