// luna.preferences.context(): a context of LUNA's preferences (fact 232).
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  return { engine, luna };
}

describe('luna.preferences.context (fact 232)', () => {
  it('stores and reads JSON values under the context, writing them through at once', async () => {
    const { engine, luna } = await connected();
    const prefs = luna.preferences.context('com.example.my-add-on');
    expect(prefs.name).toBe('com.example.my-add-on');
    expect(await prefs.get('last')).toBeUndefined();
    await prefs.set('last', { uid: 'abc', at: 3 });
    expect(await prefs.get('last')).toEqual({ uid: 'abc', at: 3 });
    expect(engine.preferenceFiles.get('com.example.my-add-on')).toEqual({ last: { uid: 'abc', at: 3 } });
    await prefs.set('last', null);
    expect(await prefs.get('last')).toBeUndefined();
  });

  it('reads values an earlier run left, which LUNA loads only once a preference is initialised', async () => {
    const { engine, luna } = await connected();
    engine.preferenceFiles.set('com.example.my-add-on', { last: 'from before the restart' });
    // A plain read of the context finds nothing until it is initialised, as on LUNA.
    expect(engine.has('/preferences/com.example.my-add-on')).toBe(false);
    expect(await luna.preferences.context('com.example.my-add-on').get('last')).toBe('from before the restart');
  });

  it('initialises each preference once, before its first read or write', async () => {
    const { luna } = await connected();
    const posted: unknown[] = [];
    const post = luna.raw.post.bind(luna.raw);
    luna.raw.post = (path, data) => { if (path === '/preferences/init_preference') posted.push(data); return post(path, data); };
    const prefs = luna.preferences.context('com.example.my-add-on');
    await prefs.set('a', 1);
    await prefs.get('a');
    await prefs.get('b');
    expect(posted).toEqual([
      { context: 'com.example.my-add-on', preference: 'a' },
      { context: 'com.example.my-add-on', preference: 'b' },
    ]);
  });

  it('refuses an empty name or one with a "/", for the context and the key', async () => {
    const { luna } = await connected();
    for (const name of ['', 'a/b']) {
      expect(() => luna.preferences.context(name)).toThrow(expect.objectContaining({ code: 'out_of_range' }));
    }
    // Any other name is a context, LUNA's own included: they are shared.
    expect(luna.preferences.context('next_gen').name).toBe('next_gen');
    await expect(luna.preferences.context('com.example.x').set('a/b', 1)).rejects.toMatchObject({ code: 'out_of_range' });
  });
});
