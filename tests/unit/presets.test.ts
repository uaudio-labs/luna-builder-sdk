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

const SYNTH = 'uaudio_moog_minimoog';

/** Track presets of every category, and an installed instrument with tagged presets (fact 132). */
async function withTrackPresets() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Guitar'], name: 'Demo' });
  engine.addPlugin(SYNTH, { name: 'Minimoog', effectType: 'instrument' });
  engine.addPlugin(AMP, { name: 'Paradise' });
  engine.addPresetTagGroup(SYNTH, 'TYPE', ['Bass', 'Lead']);
  engine.addPreset(SYNTH, 'Fat Bass', { uid: 'p_fat_bass', factory: true, tags: ['Bass'] });
  engine.addPreset(SYNTH, 'Screaming Lead', { uid: 'p_lead', tags: ['Lead'] });
  engine.addPreset(AMP, 'Warm Jazz', { uid: 'p_warm_jazz', tags: ['Clean'] });
  engine.addTrackPresetTagGroup('TYPE', ['Bass', 'Vocal', 'Instrument']);
  engine.addTrackPresetTagGroup('GENRE', ['Rock']);
  engine.addTrackPreset('Bass Rig', { uid: 'tp_bass', trackType: 'instrument', tags: ['Bass'] });
  engine.addTrackPreset('Lead Vocal', { uid: 'tp_vocal', trackType: 'audio', tags: ['Vocal', 'Rock'] });
  engine.addTrackPreset('Reverb Bus', { uid: 'tp_bus', trackType: 'bus' });
  engine.addTrackPreset('Drum Kit', { uid: 'tp_drums', trackType: 'audio', trackNames: ['Kick', 'Snare', 'OHs'], tags: ['Rock'] });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  return { engine, luna, session };
}

describe('Luna track presets (fact 132)', () => {
  it('lists track presets, with instrument plugin presets merged in and marked on request', async () => {
    const { engine, luna } = await withTrackPresets();
    expect(names(await luna.presets.query({ deviceTypeId: 'track' }))).toEqual(['Bass Rig', 'Lead Vocal', 'Reverb Bus', 'Drum Kit']);
    const all = await luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true, withTags: true });
    expect(all.map((r) => [r.name, r.isInstrumentPreset])).toEqual([
      ['Bass Rig', false],
      ['Lead Vocal', false],
      ['Reverb Bus', false],
      ['Drum Kit', false],
      ['Fat Bass', true],
      ['Screaming Lead', true],
    ]);
    expect(all.find((r) => r.name === 'Fat Bass')?.tags).toEqual(['Bass', 'Instrument']);
    // Each instrument preset names its plugin, by the factory or user folder that holds it.
    expect(all.filter((r) => r.isInstrumentPreset).map((r) => [r.name, r.pluginId, r.pluginName])).toEqual([
      ['Fat Bass', SYNTH, 'Minimoog'],
      ['Screaming Lead', SYNTH, 'Minimoog'],
    ]);
    expect(all.find((r) => r.name === 'Bass Rig')).not.toHaveProperty('pluginId');
    expect(engine.requests.find((r) => r.path === '/presets/query' && (r.data as { include_instrument_presets?: boolean }).include_instrument_presets)).toMatchObject({ data: { device_type_id: 'track', include_instrument_presets: true } });
    // Instrument matches instrument track presets and every instrument preset; other tags apply to both.
    expect(names(await luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true, tags: ['Instrument'] }))).toEqual(['Bass Rig', 'Fat Bass', 'Screaming Lead']);
    expect(names(await luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true, tags: ['Instrument', 'Bass'] }))).toEqual(['Bass Rig', 'Fat Bass']);
  });

  it('merges the track and instrument tag groups by name, without the category tags', async () => {
    const { luna } = await withTrackPresets();
    const groups = await luna.presets.trackTagGroups();
    expect(groups.map((g) => [g.name, g.tags])).toEqual([
      ['TYPE', ['Bass', 'Vocal', 'Lead']],
      ['GENRE', ['Rock']],
    ]);
    expect(Luna.TRACK_PRESET_CATEGORIES).toEqual(['Audio', 'Instrument', 'Bus', 'Multi-Track']);
  });

  it('trackSelection follows category, tags and search, with instrument presets only for All and Instrument', async () => {
    const { luna } = await withTrackPresets();
    const sel = luna.presets.trackSelection({ queryDelayMs: 0 });
    await sel.ready();
    expect(sel.presets.items).toHaveLength(6);
    expect(sel.groups.value?.map((g) => g.name)).toEqual(['TYPE', 'GENRE']);
    await sel.category.set('Instrument');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Bass Rig', 'Fat Bass', 'Screaming Lead']);
    await sel.toggleTag('Bass');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Bass Rig', 'Fat Bass']);
    await sel.search.set('fat');
    await sel.settled();
    expect(names(sel.presets.items)).toEqual(['Fat Bass']);
    await sel.clear();
    await sel.category.set('Audio');
    await sel.settled();
    expect(sel.includesInstrumentPresets).toBe(false);
    expect(names(sel.presets.items)).toEqual(['Lead Vocal']);
    sel.dispose();
  });

  it('newTrackFromPreset makes an instrument track on an instrument preset, and resolves to it', async () => {
    const { engine, session } = await withTrackPresets();
    const [track, ...rest] = await session.newTrackFromPreset({ uid: 'p_fat_bass', name: 'Fat Bass' });
    expect(rest).toEqual([]);
    expect(track?.name.value).toBe('Fat Bass');
    expect(track?.trackType.value).toBe('instrument');
    expect(track?.presetUid.value).toBe('p_fat_bass');
    expect(engine.value(`${track!.path}/effects/instrument`, 'plugin_id')).toBe(SYNTH);
    expect(engine.value(`${track!.path}/effects/instrument`, 'preset_uid')).toBe('p_fat_bass');
    expect(engine.requests.find((r) => r.path === '/sessions/abc/new_track')).toMatchObject({ data: { uid: 'abc', name: 'Fat Bass', preset_uid: 'p_fat_bass', count: 1, make_name_unique: true } });
  });

  it('newTrackFromPreset resolves to every track a multi-track preset makes, named as it saved them', async () => {
    const { session } = await withTrackPresets();
    const tracks = await session.newTrackFromPreset({ uid: 'tp_drums', name: 'Drum Kit' });
    expect(tracks.map((t) => [t.name.value, t.presetName.value])).toEqual([
      ['Kick', 'Drum Kit'],
      ['Snare', 'Drum Kit'],
      ['OHs', 'Drum Kit'],
    ]);
    await expect(session.newTrackFromPreset({ uid: 'nope', name: 'x' })).rejects.toMatchObject({ code: 'device.database_error' });
  });

  it('loadPreset replaces the preset on a track, and its name unless renamed in LUNA', async () => {
    const { engine, session } = await withTrackPresets();
    const [track] = await session.newTrackFromPreset({ uid: 'tp_bass', name: 'Bass Rig' });
    await track!.loadPreset({ uid: 'p_lead' });
    await engine.settled();
    await expect.poll(() => track!.presetUid.value).toBe('p_lead');
    expect(track!.name.value).toBe('Screaming Lead');
    expect(engine.requests.find((r) => r.path === '/presets/devices/track/load')).toMatchObject({ data: { session_uid: 'abc', uid: track!.id, preset_uid: 'p_lead' } });
    // A name set through the API is replaced; one renamed in LUNA (name_modified) is kept.
    await track!.name.set('My Bass');
    await track!.loadPreset('p_fat_bass');
    await expect.poll(() => track!.name.value).toBe('Fat Bass');
    engine.setValue(track!.path, 'name', 'My Bass');
    engine.setValue(track!.path, 'name_modified', true);
    await track!.loadPreset('p_lead');
    await expect.poll(() => track!.presetName.value).toBe('Screaming Lead');
    expect(track!.name.value).toBe('My Bass');
    // An instrument preset needs an instrument track.
    const guitar = session.tracks.byId('Guitar')!;
    await expect(guitar.loadPreset('p_fat_bass')).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });
});
