/**
 * Live lane for preset selection (facts 120-122). Needs LUNA on 4718 with a session open that
 * has a track with an empty insert slot, and UA Paradise Guitar Studio installed (the tests
 * skip otherwise). The test inserts Paradise into that slot, which is also what makes LUNA
 * build Paradise's search index (fact 121), loads a preset onto it, and clears the slot
 * afterwards; the undo entries remain. The recommendation checks skip unless UA Assistant is
 * connected to LUNA.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const AMP = 'uaudio_paradise_guitar_studio';

describe.skipIf(!live)('live: preset selection', () => {
  let luna: Luna.Client;
  let slot: Luna.Effect | undefined;
  let installed = false;
  let assistant = false;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 20_000 });
    await luna.plugins.load();
    installed = luna.plugins.byId(AMP)?.installed.value !== false && luna.plugins.byId(AMP) !== undefined;
    const watch = luna.assistant.watch();
    await watch.ready;
    assistant = luna.assistant.enabled.value === true;
    if (!installed) return;
    const session = await luna.session();
    for (const track of session.visibleTracks) {
      await track.effects.load();
      slot = track.effectSlots.find((s) => s.isEmpty);
      if (slot) break;
    }
    if (!slot) throw new Error('open a session with a track that has an empty insert slot');
    await slot.setPlugin(AMP);
  }, 60_000);

  afterAll(async () => {
    await slot?.clear().catch(() => undefined);
    await luna?.close();
  });

  it('filters by search and tags together; several tags match all unless union (fact 120)', async (ctx) => {
    if (!installed) ctx.skip();
    const all = await luna.presets.query({ pluginId: AMP, withTags: true });
    expect(all.length).toBeGreaterThan(10);
    expect(all.every((r) => Array.isArray(r.tags))).toBe(true);
    const clean = await luna.presets.query({ pluginId: AMP, tags: ['Clean'], withTags: true });
    expect(clean.length).toBeGreaterThan(0);
    expect(clean.every((r) => r.tags?.includes('Clean'))).toBe(true);
    const both = await luna.presets.query({ pluginId: AMP, tags: ['Clean', 'Lead'], withTags: true });
    expect(both.every((r) => r.tags?.includes('Clean') && r.tags.includes('Lead'))).toBe(true);
    const either = await luna.presets.query({ pluginId: AMP, tags: ['Clean', 'Lead'], matchAnyTag: true });
    expect(either.length).toBeGreaterThanOrEqual(clean.length);
    const warmClean = await luna.presets.query({ pluginId: AMP, tags: ['Clean'], search: 'WARM' });
    expect(warmClean.length).toBeGreaterThan(0);
    expect(warmClean.every((r) => r.name.toLowerCase().includes('warm'))).toBe(true);
  });

  it('reads the tag groups out of the categories tree (fact 120)', async (ctx) => {
    if (!installed) ctx.skip();
    const groups = await luna.presets.tagGroups(AMP);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.name !== '' && g.tags.length > 0)).toBe(true);
  });

  it('recommends five presets for text, best first, and refuses gibberish (fact 121)', async (ctx) => {
    if (!installed || !assistant) ctx.skip();
    const recs = await luna.presets.recommend(AMP, 'warm clean jazz');
    expect(recs).toHaveLength(5);
    expect(recs.every((r) => r.uid !== '' && r.name !== '')).toBe(true);
    expect([...recs].sort((a, b) => b.score - a.score)).toEqual(recs);
    await expect(luna.presets.recommend(AMP, 'xqzv')).rejects.toMatchObject({ code: 'assistant.input_classifier_rejected' });
  });

  it('keeps a selection on the search text and tags, with recommendations inside the tags', async (ctx) => {
    if (!installed || !assistant) ctx.skip();
    const sel = luna.presets.selection(AMP, { queryDelayMs: 0, recommendDelayMs: 0 });
    try {
      await sel.ready();
      await sel.search.set('warm');
      await sel.tags.set(['Clean']);
      await sel.settled();
      expect(sel.presets.items.length).toBeGreaterThan(0);
      expect(sel.presets.items.every((r) => r.name.toLowerCase().includes('warm') && r.tags?.includes('Clean'))).toBe(true);
      const clean = new Set((await luna.presets.query({ pluginId: AMP, tags: ['Clean'] })).map((r) => r.uid));
      expect(sel.recommendations.items.every((r) => clean.has(r.uid))).toBe(true);
    } finally {
      sel.dispose();
    }
  });

  it("loads a preset onto the slot; its uid and name follow, not dirty (fact 122)", async (ctx) => {
    const target = slot;
    if (!installed || !target) return ctx.skip();
    const [row] = await luna.presets.query({ pluginId: AMP, search: 'Lion' });
    if (!row) throw new Error('no Paradise preset named like "Lion"');
    await target.loadPreset(row.uid);
    await expect.poll(() => target.presetUid.value, { timeout: 5000 }).toBe(row.uid);
    expect(target.presetName.value).toBe(row.name);
    expect(target.presetDirty.value).toBe(false);
    await expect(target.loadPreset('00000000000000000000000000000000')).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });
});
