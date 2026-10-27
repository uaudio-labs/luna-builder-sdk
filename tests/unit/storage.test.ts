/**
 * Session storage (fact 129): add, set and remove under
 * `/sessions/<uid>/storage/<context>/<record>/<field>`, each value any JSON.
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

describe('session storage (fact 129)', () => {
  it('adds a field, follows a set, and keeps the value on a second add', async () => {
    const { engine, session } = await connected();
    const store = session.storage.context(CTX);
    await store.add('layout', 'timeline', { height: 200 });

    const timeline = store.value<{ height: number }>('layout', 'timeline');
    expect(timeline.value).toEqual({ height: 200 });
    expect(engine.value(`/sessions/abc/storage/${CTX}/layout`, 'timeline')).toEqual({ height: 200 });
    expect(store.records.value).toEqual(['layout']);
    expect(session.storage.contexts.value).toEqual([CTX]);

    await store.add('layout', 'timeline', { height: 999 });
    expect(timeline.value).toEqual({ height: 200 });

    await store.set('layout', 'timeline', { height: 320 }, { undoable: true });
    expect(timeline.value).toEqual({ height: 320 });
  });

  it('writes through the value prop', async () => {
    const { engine, session } = await connected();
    const store = session.storage.context(CTX);
    await store.add('layout', 'timeline', { height: 200 });
    await store.value('layout', 'timeline').set({ height: 240 });
    expect(engine.value(`/sessions/abc/storage/${CTX}/layout`, 'timeline')).toEqual({ height: 240 });
  });

  it('sends undoable only when asked', async () => {
    const { engine, session } = await connected();
    const sent: unknown[] = [];
    engine.overrideCommand('/sessions/abc/storage/add_field', (data) => {
      sent.push(data);
      engine.addNode(`/sessions/abc/storage/${CTX}/layout`, { properties: { timeline: null } });
      return null;
    });
    const store = session.storage.context(CTX);
    await store.add('layout', 'timeline');
    expect(sent).toEqual([{ context: CTX, record: 'layout', field: 'timeline', undoable: false, value: null }]);
  });

  it('settles a set whose value has undefined keys, which LUNA drops', async () => {
    const { engine, session } = await connected();
    const store = session.storage.context(CTX);
    await store.add('history', 'done', []);
    const entry = { steps: [3], cursorBefore: undefined, cursorAfter: undefined };
    const started = Date.now();
    await store.set('history', 'done', [entry, undefined]);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(engine.value(`/sessions/abc/storage/${CTX}/history`, 'done')).toEqual([{ steps: [3] }, null]);
    expect(store.value('history', 'done').value).toEqual([{ steps: [3] }, null]);
  });

  it('refuses to set a field that was never added', async () => {
    const { session } = await connected();
    await expect(session.storage.context(CTX).set('layout', 'timeline', 1)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });

  it('removes a field, a record and a context', async () => {
    const { session } = await connected();
    const store = session.storage.context(CTX);
    await store.add('layout', 'timeline', 1);
    await store.add('layout', 'mixer', 2);
    await store.add('channels', 't1', { color: 'green' });

    await store.remove('layout', 'timeline');
    expect(store.value('layout', 'timeline').value).toBeUndefined();
    expect(store.value('layout', 'mixer').value).toBe(2);

    await store.remove('layout');
    expect(store.records.value).toEqual(['channels']);

    await store.clear();
    expect(session.storage.contexts.value).toEqual([]);
  });

  it('rejects names LUNA cannot put in a path before posting', async () => {
    const { session } = await connected();
    expect(() => session.storage.context('')).toThrow(Luna.Error);
    const store = session.storage.context(CTX);
    await expect(store.add('a/b', 'x')).rejects.toMatchObject({ code: 'invalid_value' });
    await expect(store.add('layout', '')).rejects.toMatchObject({ code: 'invalid_value' });
  });

  it('loads what another client stored', async () => {
    const { engine, session } = await connected();
    engine.addNode(`/sessions/abc/storage/${CTX}/layout`, { properties: { timeline: { height: 120 } } });
    await engine.settled();
    const store = session.storage.context(CTX);
    await store.load();
    expect(store.value('layout', 'timeline').value).toEqual({ height: 120 });
  });
});
