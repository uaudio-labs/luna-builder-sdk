/**
 * Live lane for `/plugins/query` (fact 127): the plugins LUNA offers a slot, through
 * `luna.plugins.query()` and `effect.validPlugins()`.
 *
 * Needs LUNA on 4718, a build with the query, and a session open that has a track. It only
 * reads; nothing in the session changes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: plugin query', () => {
  let luna: Luna.Client;
  let track: Luna.Track;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    const session = await luna.session();
    await session.ready();
    const found = session.visibleTracks[0];
    if (!found) throw new Error('the open session needs a track');
    track = found;
    await track.effects.load();
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('lists installed plugins sorted by name, each with its categories', async () => {
    const all = await luna.plugins.query();
    expect(all.length).toBeGreaterThan(0);
    const names = all.map((p) => p.name.toLowerCase());
    expect(names).toEqual([...names].sort());
    expect(all.every((p) => p.pluginId && Array.isArray(p.categories) && typeof p.favorite === 'boolean')).toBe(true);
  });

  it('keeps instruments out of effect slots and effects out of the instrument slot', async () => {
    const effects = await track.effects.byId('effect_0')!.validPlugins();
    const instruments = await luna.plugins.query({ insertType: 'instrument' });
    expect(effects.length).toBeGreaterThan(0);
    const effectIds = new Set(effects.map((p) => p.pluginId));
    expect(instruments.some((p) => effectIds.has(p.pluginId))).toBe(false);
    expect(await luna.plugins.query({ insertType: 'reserved_0' })).toEqual([]);
  });

  it('narrows by search, category and favorites, and refuses an unknown slot', async () => {
    const all = await luna.plugins.query();
    const category = all.find((p) => p.categories.length)?.categories[0];
    if (category) {
      const inCategory = await luna.plugins.query({ categories: [category] });
      expect(inCategory.length).toBeGreaterThan(0);
      expect(inCategory.every((p) => p.categories.includes(category))).toBe(true);
    }
    const word = all[0]!.name.slice(0, 3);
    const found = await luna.plugins.query({ search: word });
    expect(found.every((p) => `${p.name} ${p.manufacturer}`.toLowerCase().includes(word.toLowerCase()))).toBe(true);
    expect((await luna.plugins.query({ favoritesOnly: true })).every((p) => p.favorite)).toBe(true);
    await expect(luna.plugins.query({ insertType: 'nonsense' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });
});
