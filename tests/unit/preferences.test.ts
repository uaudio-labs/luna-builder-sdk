/**
 * Session preferences (fact 110): add, set and remove under
 * `/sessions/<uid>/preferences/<context>/<preference>/<property>`, each value any JSON.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const CTX = 'com.example.unit-test';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

describe('session preferences (fact 110)', () => {
  it('adds a property, follows a set, and keeps the value on a second add', async () => {
    const { engine, session } = await connected();
    const prefs = session.preferences.context(CTX);
    await prefs.add('layout', 'timeline', { height: 200 });

    const timeline = prefs.value<{ height: number }>('layout', 'timeline');
    expect(timeline.value).toEqual({ height: 200 });
    expect(engine.value(`/sessions/abc/preferences/${CTX}/layout`, 'timeline')).toEqual({ height: 200 });
    expect(prefs.preferences.value).toEqual(['layout']);
    expect(session.preferences.contexts.value).toEqual([CTX]);

    await prefs.add('layout', 'timeline', { height: 999 });
    expect(timeline.value).toEqual({ height: 200 });

    await prefs.set('layout', 'timeline', { height: 320 }, { undoable: true });
    expect(timeline.value).toEqual({ height: 320 });
  });

  it('writes through the value prop', async () => {
    const { engine, session } = await connected();
    const prefs = session.preferences.context(CTX);
    await prefs.add('layout', 'timeline', { height: 200 });
    await prefs.value('layout', 'timeline').set({ height: 240 });
    expect(engine.value(`/sessions/abc/preferences/${CTX}/layout`, 'timeline')).toEqual({ height: 240 });
  });

  it('sends undoable only when asked', async () => {
    const { engine, session } = await connected();
    const sent: unknown[] = [];
    engine.overrideCommand('/sessions/abc/preferences/add_preference', (data) => {
      sent.push(data);
      engine.addNode(`/sessions/abc/preferences/${CTX}/layout`, { properties: { timeline: null } });
      return null;
    });
    const prefs = session.preferences.context(CTX);
    await prefs.add('layout', 'timeline');
    expect(sent).toEqual([{ context: CTX, preference: 'layout', property: 'timeline', undoable: false, value: null }]);
  });

  it('refuses to set a property that was never added', async () => {
    const { session } = await connected();
    await expect(session.preferences.context(CTX).set('layout', 'timeline', 1)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });

  it('removes a property, a preference and a context', async () => {
    const { session } = await connected();
    const prefs = session.preferences.context(CTX);
    await prefs.add('layout', 'timeline', 1);
    await prefs.add('layout', 'mixer', 2);
    await prefs.add('channels', 't1', { color: 'green' });

    await prefs.remove('layout', 'timeline');
    expect(prefs.value('layout', 'timeline').value).toBeUndefined();
    expect(prefs.value('layout', 'mixer').value).toBe(2);

    await prefs.remove('layout');
    expect(prefs.preferences.value).toEqual(['channels']);

    await prefs.clear();
    expect(session.preferences.contexts.value).toEqual([]);
  });

  it('rejects names LUNA cannot put in a path before posting', async () => {
    const { session } = await connected();
    expect(() => session.preferences.context('')).toThrow(Luna.Error);
    const prefs = session.preferences.context(CTX);
    await expect(prefs.add('a/b', 'x')).rejects.toMatchObject({ code: 'invalid_value' });
    await expect(prefs.add('layout', '')).rejects.toMatchObject({ code: 'invalid_value' });
  });

  it('loads what another client stored', async () => {
    const { engine, session } = await connected();
    engine.addNode(`/sessions/abc/preferences/${CTX}/layout`, { properties: { timeline: { height: 120 } } });
    await engine.settled();
    const prefs = session.preferences.context(CTX);
    await prefs.load();
    expect(prefs.value('layout', 'timeline').value).toEqual({ height: 120 });
  });
});
