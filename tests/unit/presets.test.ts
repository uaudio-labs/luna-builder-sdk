import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const AMP = 'uaudio_paradise_guitar_studio';

/** A plugin with tagged presets and two tag groups, shaped like Paradise's (fact 120). */
async function connected(options: { assistant?: boolean } = {}) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Guitar'], name: 'Demo' });
  engine.addPlugin(AMP, { name: 'Paradise', manufacturer: 'Universal Audio' });
  engine.addPresetTagGroup(AMP, 'TYPE', ['Clean', 'Lead', 'Crunch']);
  engine.addPresetTagGroup(AMP, 'GENRE', ['Jazz', 'Rock', 'Blues']);
  engine.addPreset(AMP, 'Warm Jazz', { uid: 'p_warm_jazz', factory: true, tags: ['Clean', 'Jazz'] });
  engine.addPreset(AMP, 'Warm Stack Lead', { uid: 'p_warm_lead', factory: true, tags: ['Lead', 'Rock'] });
  engine.addPreset(AMP, 'Gritty Lion', { uid: 'p_lion', factory: true, tags: ['Crunch', 'Rock'] });
  engine.addPreset(AMP, 'Dead Clean Blues', { uid: 'p_blues', tags: ['Clean', 'Lead', 'Blues'] });
  if (options.assistant) engine.setAssistantEnabled(true);
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  return { engine, luna };
}

const names = (rows: readonly { name: string }[]) => rows.map((r) => r.name);

describe('Luna.Presets: search, tags and recommendations', () => {
  it('filters by tags (all, or any) and by search together, and returns tags on request (fact 120)', async () => {
    const { engine, luna } = await connected();
    expect(names(await luna.presets.query({ pluginId: AMP, tags: 'Clean' }))).toEqual(['Warm Jazz', 'Dead Clean Blues']);
    expect(names(await luna.presets.query({ pluginId: AMP, tags: ['Clean', 'Lead'] }))).toEqual(['Dead Clean Blues']);
    expect(names(await luna.presets.query({ pluginId: AMP, tags: ['Clean', 'Lead'], matchAnyTag: true }))).toEqual(['Warm Jazz', 'Warm Stack Lead', 'Dead Clean Blues']);
    expect(names(await luna.presets.query({ pluginId: AMP, tags: ['Rock'], search: 'WARM' }))).toEqual(['Warm Stack Lead']);
    const [row] = await luna.presets.query({ pluginId: AMP, search: 'jazz', withTags: true });
    expect(row?.tags).toEqual(['Clean', 'Jazz']);
    expect((await luna.presets.query({ pluginId: AMP, search: 'jazz' }))[0]).not.toHaveProperty('tags');
    expect(engine.requests.find((r) => r.path === '/presets/query' && Array.isArray((r.data as { tag?: unknown }).tag))).toMatchObject({ data: { plugin_id: AMP, tag: ['Clean', 'Lead'] } });
  });

  it('reads the tag groups out of the categories tree, in order (fact 120)', async () => {
    const { luna } = await connected();
    const groups = await luna.presets.tagGroups(AMP);
    expect(groups.map((g) => [g.category, g.name, g.tags])).toEqual([
      ['Default', 'TYPE', ['Clean', 'Lead', 'Crunch']],
      ['Default', 'GENRE', ['Jazz', 'Rock', 'Blues']],
    ]);
    expect(await luna.presets.tagGroups('com.nope')).toEqual([]);
  });

  it('asks UA Assistant for recommendations and maps them to uid, name and score (fact 121)', async () => {
    const { engine, luna } = await connected({ assistant: true });
    engine.setPresetRecommendations(AMP, () => [
      { preset_name: 'Gritty Lion', preset_uuid: 'p_lion', rrf_score: 0.03 },
      { preset_name: 'Unmatched', preset_uuid: '', rrf_score: 0.02 },
    ]);
    expect(await luna.presets.recommend(AMP, 'something with bite')).toEqual([{ uid: 'p_lion', name: 'Gritty Lion', score: 0.03 }]);
    expect(engine.requests.at(-1)).toMatchObject({ path: '/presets/preset_recommendations', data: { plugin_id: AMP, query: 'something with bite' } });
    const before = engine.requests.length;
    expect(await luna.presets.recommend(AMP, '   ')).toEqual([]);
    expect(engine.requests.length).toBe(before);
  });

  it('rejects with ua.unknown while UA Assistant is not connected, and luna.assistant says so (fact 121)', async () => {
    const { engine, luna } = await connected();
    const { ready, release } = luna.assistant.watch();
    await ready;
    expect(luna.assistant.enabled.value).toBe(false);
    await expect(luna.presets.recommend(AMP, 'warm')).rejects.toMatchObject({ code: 'ua.unknown' });
    engine.setAssistantEnabled(true);
    await engine.settled();
    await luna.settled();
    expect(luna.assistant.enabled.value).toBe(true);
    release();
  });
});

describe('Luna.PresetSelection', () => {
  it('keeps the list on the search text and tags, and recommendations on the text within the tags', async () => {
    const { luna } = await connected({ assistant: true });
    const sel = luna.presets.selection(AMP, { queryDelayMs: 0, recommendDelayMs: 0 });
    await sel.ready();
    expect(sel.groups.value?.map((g) => g.name)).toEqual(['TYPE', 'GENRE']);
    expect(names(sel.presets.items)).toEqual(['Warm Jazz', 'Warm Stack Lead', 'Gritty Lion', 'Dead Clean Blues']);
    expect(sel.recommendations.items).toEqual([]);
    expect(sel.recommendationsAvailable.value).toBe(true);

    await sel.search.set('warm');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Warm Jazz', 'Warm Stack Lead']);
    expect(names(sel.recommendations.items)).toEqual(['Warm Jazz', 'Warm Stack Lead']);

    // Recommendations keep only presets carrying the selected tags.
    await sel.toggleTag('Clean');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Warm Jazz']);
    expect(names(sel.recommendations.items)).toEqual(['Warm Jazz']);
    expect(sel.presets.items[0]?.tags).toEqual(['Clean', 'Jazz']);

    await sel.toggleTag('Clean');
    await sel.clear();
    await sel.settled();
    expect(sel.tags.value).toEqual([]);
    expect(sel.presets.items).toHaveLength(4);
    expect(sel.recommendations.items).toEqual([]);
    sel.dispose();
  });

  it('recommends within any selected tag when matchAnyTag is on', async () => {
    const { engine, luna } = await connected({ assistant: true });
    engine.setPresetRecommendations(AMP, () => [
      { preset_name: 'Gritty Lion', preset_uuid: 'p_lion', rrf_score: 0.05 },
      { preset_name: 'Warm Jazz', preset_uuid: 'p_warm_jazz', rrf_score: 0.04 },
      { preset_name: 'Dead Clean Blues', preset_uuid: 'p_blues', rrf_score: 0.03 },
    ]);
    const sel = luna.presets.selection(AMP, { queryDelayMs: 0, recommendDelayMs: 0 });
    await sel.ready();
    await sel.tags.set(['Jazz', 'Blues']);
    await sel.matchAnyTag.set(true);
    await sel.search.set('anything');
    await sel.settled();
    expect(names(sel.recommendations.items)).toEqual(['Warm Jazz', 'Dead Clean Blues']);
    sel.dispose();
  });

  it('drops a reply that a newer request overtook, so the lists match the latest inputs', async () => {
    const { engine, luna } = await connected({ assistant: true });
    const sel = luna.presets.selection(AMP, { queryDelayMs: 0, recommendDelayMs: 0 });
    await sel.ready();
    // The "warm" query answers late, after the "lion" one.
    const query = luna.presets.query.bind(luna.presets);
    luna.presets.query = (o) => (o?.search === 'warm' ? new Promise((r) => setTimeout(r, 50)).then(() => query(o)) : query(o));
    await sel.search.set('warm');
    await new Promise((r) => setTimeout(r, 5));
    await sel.search.set('lion');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Gritty Lion']);
    expect(names(sel.recommendations.items)).toEqual(['Gritty Lion']);
    sel.dispose();
  });

  it('stays without recommendations while UA Assistant is not connected, and fills them when it connects', async () => {
    const { engine, luna } = await connected();
    const sel = luna.presets.selection(AMP, { queryDelayMs: 0, recommendDelayMs: 0 });
    await sel.ready();
    await sel.search.set('lion');
    await sel.settled();
    expect(sel.recommendationsAvailable.value).toBe(false);
    expect(sel.recommendations.items).toEqual([]);
    expect(sel.recommendationError.value).toBe(null);
    expect(engine.requests.some((r) => r.path === '/presets/preset_recommendations')).toBe(false);

    engine.setAssistantEnabled(true);
    await engine.settled();
    await luna.settled();
    await sel.settled();
    expect(names(sel.recommendations.items)).toEqual(['Gritty Lion']);
    sel.dispose();
  });

  it('reports a failed recommendation without failing the list', async () => {
    const { engine, luna } = await connected({ assistant: true });
    engine.setPresetRecommendations(AMP, () => {
      throw new Luna.Error('assistant.no_index', 'no index');
    });
    const sel = luna.presets.selection(AMP, { queryDelayMs: 0, recommendDelayMs: 0 });
    await sel.ready();
    await sel.search.set('lion');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Gritty Lion']);
    expect(sel.recommendationError.value?.code).toBe('assistant.no_index');
    expect(sel.error.value).toBe(null);
    sel.dispose();
  });

  it('debounces typing into one query and one recommendation request', async () => {
    const { engine, luna } = await connected({ assistant: true });
    const sel = luna.presets.selection(AMP, { queryDelayMs: 20, recommendDelayMs: 40 });
    await sel.ready();
    const from = engine.requests.length;
    for (const text of ['w', 'wa', 'war', 'warm']) await sel.search.set(text);
    expect(sel.loading.value).toBe(true);
    await sel.settled();
    const sent = engine.requests.slice(from).map((r) => r.path);
    expect(sent.filter((p) => p === '/presets/query')).toHaveLength(1);
    expect(sent.filter((p) => p === '/presets/preset_recommendations')).toHaveLength(1);
    expect(sel.loading.value).toBe(false);
    sel.dispose();
  });
});

describe('Luna.Effect.loadPreset', () => {
  it("loads a preset onto the slot's plugin through /presets/plugins/<id>/load (fact 122)", async () => {
    const { engine, luna } = await connected();
    const session = await luna.session();
    const track = session.tracks.byId('Guitar')!;
    await track.effects.load();
    const slot = (await track.insert(AMP))!;
    await slot.loadPreset('p_lion');
    await engine.settled();
    await luna.settled();
    expect(slot.presetUid.value).toBe('p_lion');
    expect(slot.presetName.value).toBe('Gritty Lion');
    expect(engine.requests.at(-1)).toMatchObject({ path: `/presets/plugins/${AMP}/load`, data: { session_uid: 'abc', uid: slot.uid.value, preset_uid: 'p_lion' } });
    await expect(track.effects.byId('effect_3')!.loadPreset('p_lion')).rejects.toMatchObject({ code: 'unavailable' });
  });
});
