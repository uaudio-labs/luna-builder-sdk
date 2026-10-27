/**
 * Live lane for track presets (fact 132). Needs LUNA on 4718 with a session open and at least
 * one installed instrument plugin with presets (the instrument checks skip otherwise). The test
 * makes tracks from presets and deletes only the tracks it made; the undo entries remain.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: track presets', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  const made: Luna.Track[] = [];

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 20_000 });
    session = await luna.session();
  }, 60_000);

  afterAll(async () => {
    for (const track of made) await track.delete().catch(() => undefined);
    await luna?.close();
  });

  it('lists instrument presets beside track presets, marked, only when asked', async () => {
    const plain = await luna.presets.query({ deviceTypeId: 'track', withTags: true });
    expect(plain.every((r) => r.isInstrumentPreset === undefined)).toBe(true);
    const merged = await luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true, withTags: true });
    expect(merged.every((r) => typeof r.isInstrumentPreset === 'boolean')).toBe(true);
    expect(merged.filter((r) => !r.isInstrumentPreset).length).toBe(plain.length);
    for (const r of merged.filter((r) => r.isInstrumentPreset)) expect(r.tags).toContain('Instrument');
    // Each names its plugin, found by the preset folder that holds it.
    const instruments = await luna.plugins.query({ insertType: 'instrument' });
    for (const r of merged.filter((r) => r.isInstrumentPreset)) {
      expect(r.pluginId, r.path).toBeDefined();
      expect(instruments.find((p) => p.pluginId === r.pluginId)?.name).toBe(r.pluginName);
    }
    const instrument = await luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true, tags: ['Instrument'] });
    expect(instrument.length).toBeGreaterThanOrEqual(merged.filter((r) => r.isInstrumentPreset).length);
  });

  it('reads the track tag groups without the category tags, without waiting on unaddressable plugins', async () => {
    const started = Date.now();
    const groups = await luna.presets.trackTagGroups();
    expect(Date.now() - started).toBeLessThan(5_000);
    for (const g of groups) for (const c of Luna.TRACK_PRESET_CATEGORIES) expect(g.tags).not.toContain(c);
  });

  it('makes an instrument track from an instrument preset, then replaces its preset', async (ctx) => {
    const rows = await luna.presets.query({ deviceTypeId: 'track', includeInstrumentPresets: true, tags: ['Instrument'] });
    const presets = rows.filter((r) => r.isInstrumentPreset);
    if (presets.length < 2) ctx.skip();
    const [track, ...rest] = await session.newTrackFromPreset(presets[0]!);
    if (track) made.push(track);
    expect(rest).toEqual([]);
    expect(track?.trackType.value).toBe('instrument');
    expect(track?.presetUid.value).toBe(presets[0]!.uid);
    await track!.loadPreset(presets[1]!);
    await Luna.settle(() => track!.presetUid.value === presets[1]!.uid, 'track preset load');
    expect(track!.presetName.value).toBe(presets[1]!.name);
    // A name set through the API does not count as renamed: the next preset replaces it.
    await track!.name.set('Renamed by the API');
    await track!.loadPreset(presets[0]!);
    await Luna.settle(() => track!.presetUid.value === presets[0]!.uid, 'track preset load');
    await luna.settled();
    expect(track!.name.value).toBe(presets[0]!.name);
  }, 60_000);

  it('answers every track a multi-track preset makes', async (ctx) => {
    const [multi] = await luna.presets.query({ deviceTypeId: 'track', tags: ['Multi-Track'], limit: 1 });
    if (!multi) ctx.skip();
    const tracks = await session.newTrackFromPreset(multi!);
    made.push(...tracks);
    expect(tracks.length).toBeGreaterThan(1);
    // They keep the names saved in the preset, and each records the preset.
    expect(new Set(tracks.map((t) => t.name.value)).size).toBe(tracks.length);
    expect(tracks.every((t) => t.presetName.value === multi!.name)).toBe(true);
  }, 60_000);
});
