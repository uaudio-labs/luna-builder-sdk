import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected(tracks: string[] = ['Vocal']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo' });
  engine.addPlugin('com.uaudio.uadx.1176', { name: 'UA 1176', manufacturer: 'Universal Audio', categories: ['Compressor'] });
  engine.addPlugin('com.appl.au.aufx_bpas', { name: 'AUBandpass', manufacturer: 'Apple', categories: ['Equalization'] });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  return { engine, luna, session };
}

describe('Luna.Effect and Luna.Plugins', () => {
  it('lists slots, loads and clears a plugin through set_inserts', async () => {
    const { engine, luna, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    expect(track.effects.items.map((e) => e.id)).toContain('console');
    expect(track.effectSlots.map((e) => e.id)).toEqual(Array.from({ length: 8 }, (_, i) => `effect_${i}`)); // fact 86
    expect(track.loadedEffects).toEqual([]);

    await luna.plugins.load();
    expect(luna.plugins.items).toHaveLength(2);
    expect(luna.plugins.find('1176')[0]?.manufacturer).toBe('Universal Audio');
    expect(luna.plugins.byCategory('Equalization').map((p) => p.id)).toEqual(['com.appl.au.aufx_bpas']);
    expect(luna.plugins.categories).toEqual(['Compressor', 'Equalization']);

    const slot = await track.insert('com.uaudio.uadx.1176');
    expect(slot?.id).toBe('effect_0');
    await engine.settled();
    expect(slot!.pluginId.value).toBe('com.uaudio.uadx.1176');
    // Loaded is the instance id; plugin_name can stay null, the catalog has the name (fact 86).
    expect(slot!.loaded.value).toBe(true);
    expect(slot!.pluginName.value).toBe(null);
    expect(luna.plugins.byId('com.uaudio.uadx.1176')?.name.value).toBe('UA 1176');
    expect(slot!.isEmpty).toBe(false);
    expect(track.loadedEffects.map((e) => e.id)).toEqual(['effect_0']);
    expect(engine.requests.find((r) => r.path === '/sessions/abc/set_inserts')).toMatchObject({ data: { session_uid: 'abc', channel_uid: 'Vocal', inserts: [{ insert_type: 'effect_0', plugin_id: 'com.uaudio.uadx.1176' }] } });

    const second = await track.insert('com.appl.au.aufx_bpas');
    expect(second?.id).toBe('effect_1');

    // Bypass is the control named by bypass_control, written through the context command.
    await slot!.controls.load();
    expect(slot!.bypassControl.value).toBe('bypass');
    expect(slot!.in.value).toBe(true);
    await slot!.setIn(false);
    await engine.settled();
    expect(engine.requests.at(-1)).toMatchObject({ path: '/sessions/abc/contexts/main/commands/set_inserts_in_out', data: { session_uid: 'abc', channel_uid: 'Vocal', inserts: ['effect_0'], value: false } });
    expect(slot!.in.value).toBe(false);
    await slot!.waitForPlugin();
    await slot!.clear();
    await engine.settled();
    expect(slot!.isEmpty).toBe(true);
    await slot!.nextPreset();
    expect(engine.requests.at(-1)?.path).toBe(`${slot!.path}/commands/preset_browser_increment`);
  });

  it('reads and writes IN/OUT with LUNA\'s polarity: zero is IN unless the control is active low (fact 29)', async () => {
    const { engine, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    await slot.controls.load();
    const raw = () => engine.value(`${slot.path}/controls/bypass`, 'value');
    const reads = async (activeLow: boolean | null, value: number) => {
      engine.setValue(slot.path, 'bypass_control_active_low', activeLow);
      engine.setValue(`${slot.path}/controls/bypass`, 'value', value);
      await engine.settled();
      return slot.in.value;
    };

    // The truth table of MxClnt_EffectData::GetEffectInOut.
    expect(await reads(false, 0)).toBe(true);
    expect(await reads(false, 1)).toBe(false);
    expect(await reads(true, 1)).toBe(true);
    expect(await reads(true, 0)).toBe(false);
    expect(await reads(null, 0)).toBe(true); // unreported polarity defaults to false, as in LUNA
    expect(await reads(null, 1)).toBe(false);

    // A plugin starts IN, and set_inserts_in_out writes the raw value the polarity calls for.
    for (const activeLow of [false, true]) {
      engine.setValue(slot.path, 'bypass_control_active_low', activeLow);
      await slot.setIn(true);
      await engine.settled();
      expect([raw(), slot.in.value]).toEqual([activeLow ? 1 : 0, true]);
      await slot.setIn(false);
      await engine.settled();
      expect([raw(), slot.in.value]).toEqual([activeLow ? 0 : 1, false]);
    }
  });

  it('starts a newly loaded plugin IN', async () => {
    const { session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    await slot.controls.load();
    expect(slot.in.value).toBe(true);
  });

  it('lists live parameters only: a cleared slot keeps its old ones as ghosts (fact 86)', async () => {
    const { engine, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    await slot.controls.load();
    expect(slot.params.map((p) => p.id)).toEqual(['bypass', 'input']);
    await slot.clear();
    await engine.settled();
    await slot.controls.reload();
    expect(slot.controls.items.map((c) => c.id)).toEqual(['bypass', 'input']); // still there
    expect(slot.params).toEqual([]);
    expect(slot.loaded.value).toBe(false);
  });

  it('reloads a cleared plugin powered on and without the old preset (fact 146)', async () => {
    const { engine, session } = await connected();
    engine.addPreset('com.uaudio.uadx.1176', 'All Buttons In', { uid: 'p_abi' });
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = track.effects.byId('effect_0')!;
    await slot.setPlugin('com.uaudio.uadx.1176', { presetUid: 'p_abi' });
    await slot.property<boolean>('plugin_power').set(false);
    await engine.settled();
    expect(slot.pluginPower.value).toBe(false);
    await slot.clear();
    await slot.setPlugin('com.uaudio.uadx.1176');
    await engine.settled();
    expect(slot.pluginPower.value).toBe(true);
    expect(slot.presetUid.value).toBeNull();
    expect(slot.presetName.value).toBeNull();
  });

  it('rejects an unknown plugin with the slot error, because set_inserts answers null either way', async () => {
    const { session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = track.effects.byId('effect_2')!;
    await expect(slot.setPlugin('com.nope.nothing')).rejects.toMatchObject({ code: 'mixer.missing_plug-in' });
    expect(slot.pluginId.value).toBe('com.nope.nothing');
    expect(slot.loaded.value).toBe(false);
    await expect(track.insert('com.nope.nothing')).rejects.toMatchObject({ code: 'mixer.missing_plug-in' });
  });

  it('queries the preset library and finds a preset uid by exact name (fact 98)', async () => {
    const { engine, luna } = await connected();
    engine.addPreset('com.uaudio.uadx.1176', 'All Buttons In', { uid: 'p_abi', factory: true });
    engine.addPreset('com.uaudio.uadx.1176', 'Vocal Smash', { uid: 'p_smash', favorite: true });
    const rows = await luna.presets.query({ pluginId: 'com.uaudio.uadx.1176' });
    expect(rows).toEqual([
      { uid: 'p_abi', name: 'All Buttons In', version: 1, favorite: false, factory: true, path: '/Mock/factory_presets/com.uaudio.uadx.1176' },
      { uid: 'p_smash', name: 'Vocal Smash', version: 1, favorite: true, factory: false, path: '/Mock/Presets/Plug-Ins/com.uaudio.uadx.1176' },
    ]);
    expect(await luna.presets.query({ pluginId: 'com.uaudio.uadx.1176', search: 'smash' })).toHaveLength(1);
    expect((await luna.presets.find('com.uaudio.uadx.1176', 'vocal smash'))?.uid).toBe('p_smash');
    expect(await luna.presets.find('com.uaudio.uadx.1176', 'Vocal')).toBeUndefined(); // exact name only
    await expect(luna.presets.query()).rejects.toMatchObject({ code: 'uasrv.invalid_type' });
  });

  it('prefers a user preset over a factory preset of the same name', async () => {
    const { engine, luna } = await connected();
    engine.addPreset('com.uaudio.uadx.1176', 'Default', { uid: 'p_factory', factory: true });
    engine.addPreset('com.uaudio.uadx.1176', 'Default', { uid: 'p_user' });
    expect((await luna.presets.find('com.uaudio.uadx.1176', 'Default'))?.uid).toBe('p_user');
  });

  it('carries a preset name and uid through setPlugin onto the slot (fact 99)', async () => {
    const { engine, session } = await connected();
    engine.addPreset('com.uaudio.uadx.1176', 'All Buttons In', { uid: 'p_abi' });
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = track.effects.byId('effect_0')!;
    await slot.setPlugin('com.uaudio.uadx.1176', { presetName: 'All Buttons In', presetUid: 'p_abi' });
    await engine.settled();
    expect(slot.presetName.value).toBe('All Buttons In');
    expect(slot.presetUid.value).toBe('p_abi');
    expect(engine.requests.find((r) => r.path === '/sessions/abc/set_inserts')).toMatchObject({
      data: { inserts: [{ insert_type: 'effect_0', plugin_id: 'com.uaudio.uadx.1176', preset_name: 'All Buttons In', preset_uid: 'p_abi' }] },
    });
  });

  it('touch-brackets a one-shot parameter write, which is what makes it undoable (fact 85)', async () => {
    const { engine, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    await slot.controls.load();
    const input = slot.params.find((p) => p.id === 'input')!;
    const from = engine.requests.length;
    await input.normalized.set(0.25);
    expect(engine.requests.slice(from).map((r) => `${r.verb} ${r.path.slice(slot.path.length)}`)).toEqual(['post /controls/input/set_touch', 'set /controls/input/normalized_value', 'post /controls/input/set_touch']);
  });

  it('sends whole numbers to a continuous parameter as float literals, and leaves discrete ones alone (fact 142)', async () => {
    const { engine, luna, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    await slot.controls.load();
    const input = slot.params.find((p) => p.id === 'input')!; // continuous
    const bypass = slot.params.find((p) => p.id === 'bypass')!; // discrete
    // LUNA refuses a bare whole number for a plugin parameter's real_value.
    await expect(luna.raw.set(`${input.path}/real_value`, -3)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });

    const from = engine.requests.length;
    await input.real.set(-3);
    expect(input.real.value).toBe(-3); // the model holds the number, not the literal
    expect(engine.value(input.path, 'real_value')).toBe(-3);
    await input.normalized.set(1);
    await bypass.real.set(true);
    const sets = engine.requests.slice(from).filter((r) => r.verb === 'set');
    expect(sets.map((r) => [r.path.slice(slot.path.length), r.data instanceof Luna.FloatLiteral ? `float ${r.data.value}` : r.data])).toEqual([
      ['/controls/input/real_value', 'float -3'],
      ['/controls/input/normalized_value', 'float 1'],
      ['/controls/bypass/real_value', true],
    ]);
  });

  it('asks LUNA which plugins a slot takes, with search, categories and favorites (fact 127)', async () => {
    const { engine, luna, session } = await connected();
    engine.addPlugin('uaudio_shape', { name: 'Shape', manufacturer: 'Universal Audio', effectType: 'instrument' });
    engine.addPlugin('uaudio_maximizer', { name: 'Precision Maximizer', manufacturer: 'Universal Audio', categories: ['Compressors & Limiters'], formats: [['stereo', 'stereo']], favorite: true });
    engine.addPlugin('uaudio_expansion', { name: 'Shape Expansion', effectType: 'content_expansion' });
    await engine.settled();

    // No slot: what LUNA's browser lists with nothing focused, sorted by name.
    const all = await luna.plugins.query();
    expect(all.map((p) => p.pluginId)).toEqual(['com.appl.au.aufx_bpas', 'uaudio_maximizer', 'uaudio_shape', 'com.uaudio.uadx.1176']);
    expect(all[1]).toEqual({ pluginId: 'uaudio_maximizer', name: 'Precision Maximizer', manufacturer: 'Universal Audio', categories: ['Compressors & Limiters'], favorite: true });

    const vocal = session.tracks.byId('Vocal')!; // mono
    await vocal.effects.load();
    expect((await luna.plugins.query({ insertType: 'instrument' })).map((p) => p.pluginId)).toEqual(['uaudio_shape']);
    expect(await luna.plugins.query({ insertType: 'reserved_0' })).toEqual([]);
    const effects = await vocal.effects.byId('effect_0')!.validPlugins();
    expect(effects.map((p) => p.pluginId)).toEqual(['com.appl.au.aufx_bpas', 'com.uaudio.uadx.1176']); // the stereo-only maximizer is left out
    expect(engine.requests.at(-1)).toMatchObject({ path: '/plugins/query', data: { insert_type: 'effect_0', session_uid: 'abc', channel_uid: 'Vocal' } });

    const stereo = await luna.plugins.query({ insertType: 'effect_0', sessionUid: 'abc', channelUid: 'master_abc' });
    expect(stereo.map((p) => p.pluginId)).toContain('uaudio_maximizer');

    expect((await luna.plugins.query({ search: 'universal' })).map((p) => p.pluginId)).toEqual(['uaudio_maximizer', 'uaudio_shape', 'com.uaudio.uadx.1176']);
    expect((await luna.plugins.query({ categories: ['Equalization'] })).map((p) => p.pluginId)).toEqual(['com.appl.au.aufx_bpas']);
    expect((await luna.plugins.query({ favoritesOnly: true })).map((p) => p.pluginId)).toEqual(['uaudio_maximizer']);
    expect(engine.requests.at(-1)).toMatchObject({ data: { favorite: true } });
    await expect(luna.plugins.query({ insertType: 'nonsense' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });

  it('reports a LUNA without /plugins/query as Luna.Unsupported', async () => {
    const { engine, luna } = await connected();
    engine.fail('/plugins/query', 'uasrv.invalid_object');
    await expect(luna.plugins.query()).rejects.toBeInstanceOf(Luna.Unsupported);
  });
});

describe('Plugin requirements (fact 148)', () => {
  it('compares plugin versions part by part, as LUNA does', () => {
    expect(Luna.pluginVersionMeets('0.4.3', '0.4.3')).toBe(true);
    expect(Luna.pluginVersionMeets('0.4.10', '0.4.3')).toBe(true);
    expect(Luna.pluginVersionMeets('1.0', '0.4.3')).toBe(true);
    expect(Luna.pluginVersionMeets('0.4.3.1', '0.4.3')).toBe(true);
    expect(Luna.pluginVersionMeets('0.4.2', '0.4.3')).toBe(false);
    expect(Luna.pluginVersionMeets('0.4.3', '0.4.3.1')).toBe(false);
    expect(Luna.pluginVersionMeets('', '0.4.3')).toBe(false);
    expect(Luna.pluginVersionMeets(undefined, '0.4.3')).toBe(false);
    expect(Luna.pluginVersionMeets('beta', '0.4.3')).toBe(false);
    expect(Luna.pluginVersionMeets(undefined, '')).toBe(true);
  });

  it('reports an Add On\'s requires_plugins and which the catalog does not meet', async () => {
    const { engine, luna } = await connected();
    engine.addPlugin('com.evfd.vst3.clex', { name: 'Clingy Ex', version: '0.4.10' });
    engine.addPlugin('com.evfd.vst3.old', { name: 'Old One', version: '2.0.1' });
    const requirements: Luna.PluginRequirement[] = [
      { name: 'Clingy Ex', plugin_id: ['com.evfd.au.aufx_clex', 'com.evfd.vst3.clex'], min_version: '0.4.3', optional: false },
      { name: 'Old One', plugin_id: ['com.evfd.vst3.old'], min_version: '2.1', optional: false },
      { name: 'Missing', plugin_id: ['com.evfd.vst3.missing'], min_version: '', optional: true },
    ];
    engine.setValue('/gui/add_ons/com.example.demo', 'requires_plugins', requirements);
    await engine.settled();
    await Promise.all([luna.gui.addOns.load(), luna.plugins.load()]);
    const demo = luna.gui.addOns.byId('com.example.demo')!;
    expect(demo.requiresPlugins.value).toEqual(requirements);
    expect(luna.plugins.byId('com.evfd.vst3.clex')!.isAtLeast('0.4.3')).toBe(true);
    expect(luna.plugins.byId('com.evfd.vst3.old')!.isAtLeast('2.1')).toBe(false);
    expect(luna.plugins.unmetRequirements(demo.requiresPlugins.value!).map((r) => r.name)).toEqual(['Old One', 'Missing']);
    expect(luna.plugins.unmetRequirements(demo.requiresPlugins.value!, { blockingOnly: true }).map((r) => r.name)).toEqual(['Old One']);
    expect(luna.plugins.unmetRequirements([])).toEqual([]);
  });
});

describe('Luna.Musical', () => {
  it('loads tempo and time signatures and converts ticks', async () => {
    const { engine, session } = await connected();
    const m = session.musical;
    expect(m.tempoMap.items.map((t) => t.tempo.value)).toEqual([120]);
    expect(m.timeSignatures.items[0]?.ticksPerBar).toBe(Luna.TICKS_PER_BEAT * 4);
    expect(m.tempoAt(0)).toBe(120);
    expect(m.timeline.seconds(Luna.TICKS_PER_BEAT * 2)).toBeCloseTo(1);
    expect(m.timeline.barBeat(Luna.TICKS_PER_BEAT * 5 + 7)).toEqual({ bar: 2, beat: 2, tick: 7 });
    expect(m.timeline.tickAtBar(3)).toBe(Luna.TICKS_PER_BEAT * 8);

    await m.setTempo(60, Luna.TICKS_PER_BEAT * 4);
    await engine.settled();
    expect(m.tempoMap.items.map((t) => t.tempo.value)).toEqual([120, undefined]);
    await m.tempoMap.items[1]!.load();
    expect(m.tempoAt(Luna.TICKS_PER_BEAT * 4)).toBe(60);
    // 4 beats at 120 (2 s) + 2 beats at 60 (2 s)
    expect(m.timeline.seconds(Luna.TICKS_PER_BEAT * 6)).toBeCloseTo(4);

    await m.setTimeSignature(3, 4, 5);
    await m.setKeySignature(-2, true);
    await m.setBarOne(0);
    const posts = engine.requests.filter((r) => r.verb === 'post').map((r) => r.path.split('/').pop());
    expect(posts).toEqual(expect.arrayContaining(['set_tempo', 'set_time_signature', 'set_key_signature', 'set_bar_one']));
  });

  it('sets a key signature, replacing the one at its tick, and reads the key in effect (fact 113)', async () => {
    const { engine, session } = await connected();
    const m = session.musical;
    await m.ready();
    const bar = Luna.WHOLE_NOTE;

    const cMinor = await m.setKeySignature(-3, true);
    expect([cMinor.tick.value, cMinor.sharpsAndFlats.value, cMinor.isMinor.value]).toEqual([0, -3, true]);
    const dMajor = await m.setKeySignature(2, false, 4 * bar);
    const eMinor = await m.setKeySignature(1, true, 4 * bar);
    await engine.settled();
    expect(eMinor).toBe(dMajor);   // the same row, rewritten

    expect(m.keySignatures.items.map((k) => [k.tick.value, k.sharpsAndFlats.value, k.isMinor.value]).sort((a, b) => (a[0] as number) - (b[0] as number))).toEqual([
      [0, -3, true],
      [4 * bar, 1, true],
    ]);
    expect(m.keySignatureAt(0)).toBe(cMinor);
    expect(m.keySignatureAt(4 * bar - 1)).toBe(cMinor);
    expect(m.keySignatureAt(9 * bar)).toBe(eMinor);
  });

  it('keySignatureAt is undefined before the first key signature', async () => {
    const { engine, session } = await connected();
    const m = session.musical;
    await m.ready();
    expect(m.keySignatureAt(0)).toBeUndefined();
    await m.setKeySignature(1, false, Luna.WHOLE_NOTE);
    await engine.settled();
    expect(m.keySignatureAt(0)).toBeUndefined();
    expect(m.keySignatureAt(Luna.WHOLE_NOTE)?.sharpsAndFlats.value).toBe(1);
  });

  it('refuses a key signature out of range before the wire', async () => {
    const { engine, session } = await connected();
    const before = engine.requests.length;
    await expect(session.musical.setKeySignature(8, false)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.setKeySignature(-8, true)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.setKeySignature(1.5, false)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.setKeySignature(1, 'minor' as unknown as boolean)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.setKeySignature(1, false, 0.5)).rejects.toMatchObject({ code: 'out_of_range' });
    expect(engine.requests.length).toBe(before);
  });

  it('changes the tempo in effect at a tick by writing that event (fact 95)', async () => {
    const { engine, session } = await connected();
    const m = session.musical;
    engine.addNode('/sessions/abc/tempo_map/2', { properties: { tick: Luna.TICKS_PER_BEAT * 8, time: 4, tempo: 90 } });
    await engine.settled();
    await m.tempoMap.reload();
    const [first, second] = [m.tempoMap.byId('1')!, m.tempoMap.byId('2')!];
    expect(m.tempoEventAt(0)).toBe(first);
    expect(m.tempoEventAt(-Luna.TICKS_PER_BEAT)).toBe(first);   // before every event: the first
    expect(m.tempoEventAt(Luna.TICKS_PER_BEAT * 9)).toBe(second);
    await m.setTempoInEffectAt(100, Luna.TICKS_PER_BEAT * 2);
    await m.setTempoInEffectAt(72.5, Luna.TICKS_PER_BEAT * 12);
    await engine.settled();
    expect(engine.value('/sessions/abc/tempo_map/1', 'tempo')).toBe(100);
    expect(engine.value('/sessions/abc/tempo_map/2', 'tempo')).toBe(72.5);
    expect(engine.requests.filter((r) => r.path.endsWith('/set_tempo'))).toHaveLength(0);
    await expect(m.setTempoInEffectAt(0, 0)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(m.setTempoInEffectAt(Number.NaN, 0)).rejects.toMatchObject({ code: 'out_of_range' });
  });
});

describe('Luna.Track input monitor', () => {
  it('writes the switch, and the live state follows it (fact 88)', async () => {
    const { engine, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    expect(track.inputMonitor.value).toBe(false);
    expect(track.inputMonitoring.value).toBe(false);

    await track.inputMonitor.set(true);
    await engine.settled();
    expect(engine.value(track.path, 'input_monitor')).toBe(true);
    expect(track.inputMonitor.value).toBe(true);
    expect(track.inputMonitoring.value).toBe(true);

    await track.inputMonitor.set(false);
    await engine.settled();
    expect(track.inputMonitoring.value).toBe(false);
  });

  it('updates both props from a push, and refuses a write to the live state', async () => {
    const { engine, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    engine.setValue(track.path, 'input_monitor', true);
    engine.setValue(track.path, 'input_monitor_state', true);
    await engine.settled();
    expect(track.inputMonitor.value).toBe(true);
    expect(track.inputMonitoring.value).toBe(true);
    await expect(track.property<boolean>('input_monitor_state').set(false)).rejects.toMatchObject({ code: 'uasrv.read_only' });
  });

  it('refuses turning the switch on while record mute is on (fact 88)', async () => {
    const { engine, luna, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    await luna.preferences.property<boolean>('record_mute').set(true);
    await expect(track.inputMonitor.set(true)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await engine.settled();
    expect(track.inputMonitor.value).toBe(false); // the optimistic write rolled back
    expect(engine.value(track.path, 'input_monitor_state')).toBe(false);
    await track.inputMonitor.set(false); // turning it off is always allowed
  });

  it('reports monitoring while the switch is off, as for an auto-monitored armed track', async () => {
    const { engine, session } = await connected();
    const track = session.tracks.byId('Vocal')!;
    engine.setValue(track.path, 'input_monitor_state', true);
    await engine.settled();
    expect(track.inputMonitor.value).toBe(false);
    expect(track.inputMonitoring.value).toBe(true);
  });
});

describe('Luna.Workspace and system nodes', () => {
  it('queries recent packages as rows and exposes the live package list', async () => {
    const { engine, luna } = await connected();
    engine.addPackage('old', { name: 'Old Song', lastOpened: 1000 });
    engine.addPackage('fav', { name: 'Fav Song', lastOpened: 5000, favorite: true });
    const rows = await luna.workspace.recent(2);
    expect(rows.map((r) => r.name)).toEqual(['Demo', 'Fav Song']);
    expect(rows[1]).toMatchObject({ uid: 'fav', favorite: true, online: true, tags: [] });
    const found = await luna.workspace.query({ search: 'old' });
    expect(found.map((r) => r.uid)).toEqual(['old']);
    await luna.workspace.packages.load();
    expect(luna.workspace.packages.byId('fav')?.name).toBe('Fav Song');
  });

  it('lists only the session templates whose files are there (fact 151)', async () => {
    const { engine, luna } = await connected();
    engine.addPackage('song', { name: 'Song' });
    engine.addPackage('tpl', { name: 'Maris Brochure', template: true, factory: true });
    engine.addPackage('gone', { name: 'Deleted Template', template: true, online: false });
    const templates = await luna.workspace.templates();
    expect(templates.map((t) => t.uid)).toEqual(['tpl']);
    expect(templates[0]).toMatchObject({ name: 'Maris Brochure', sessionType: 3, factory: true, online: true });
  });

  it('creates a loaded session from a template, as a new package, under the uid it sends (fact 151)', async () => {
    const { engine } = await connected();
    engine.addPackage('4b9090e269604898922de73746070db0', { name: 'Maris Brochure', template: true, tracks: ['Maris Lead', 'Backing Track'] });
    const sent: unknown[] = [];
    const port = engine.port();
    const post = port.post.bind(port);
    port.post = (path, data) => { if (path === '/sessions/new_session_from_template') sent.push(data); return post(path, data); };
    const client = await Luna.connect({ port_: port });

    const session = await client.sessions.createFromTemplate({ templatePackageUid: '4b9090e2-6960-4898-922d-e73746070db0', name: 'Maris Brochure Copy' });
    expect(sent).toEqual([{ name: 'Maris Brochure Copy', session_uid: session.id, session_package_uid: '4b9090e269604898922de73746070db0', read_only: false }]);
    expect(session.id).toMatch(/^[0-9a-f]{32}$/);
    expect(session.loaded.value).toBe(true);
    expect(session.name.value).toBe('Maris Brochure Copy');
    expect(session.sessionPackageUid.value).not.toBe('4b9090e269604898922de73746070db0');
    await session.tracks.load();
    expect(session.tracks.items.map((t) => t.name.value)).toEqual(['Maris Lead', 'Backing Track']);
    expect(engine.has('/workspace/sessions/4b9090e269604898922de73746070db0')).toBe(true);
  });

  it('sends a destination folder as path, and refuses a missing template', async () => {
    const { engine, luna } = await connected();
    engine.addPackage('tpl', { template: true });
    engine.addPackage('song', { name: 'Song' });
    const sent: Record<string, unknown>[] = [];
    const port = engine.port();
    const post = port.post.bind(port);
    port.post = (path, data) => { if (path === '/sessions/new_session_from_template') sent.push(data as Record<string, unknown>); return post(path, data); };
    const client = await Luna.connect({ port_: port });

    await client.sessions.createFromTemplate({ templatePackageUid: 'tpl', name: 'Copy', directoryPath: '/Users/me/Sessions' });
    expect(sent[0]).toMatchObject({ path: '/Users/me/Sessions' });
    expect(sent[0]).not.toHaveProperty('directory_path');
    await expect(luna.sessions.createFromTemplate({ templatePackageUid: 'song', name: 'X' })).rejects.toMatchObject({ code: 'device.database_error' });
    await expect(luna.sessions.createFromTemplate({ templatePackageUid: 'nope', name: 'X' })).rejects.toMatchObject({ code: 'device.filesystem_error' });
    await expect(luna.sessions.createFromTemplate({ templatePackageUid: '', name: 'X' })).rejects.toThrow('needs a templatePackageUid');
  });

  it('creates a session under a fixed package uid, type and standalone folder (fact 237)', async () => {
    const { engine } = await connected();
    const sent: Record<string, unknown>[] = [];
    const port = engine.port();
    const post = port.post.bind(port);
    port.post = (path, data) => { if (path === '/sessions/new_session') sent.push(data as Record<string, unknown>); return post(path, data); };
    const client = await Luna.connect({ port_: port });

    const session = await client.sessions.create({ name: 'Practice', sessionPackageUid: '7d3c0f9e-2b8a-4c61-a5e4-f0b9c2d1e3a7', sessionType: 'standalone', standaloneId: 'com.example.practice' });
    expect(sent).toEqual([{ name: 'Practice', session_package_uid: '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7', session_type: 'standalone', standalone_id: 'com.example.practice' }]);
    expect(session.sessionPackageUid.value).toBe('7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7');
    const row = (await client.workspace.query()).find((r) => r.uid === '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7');
    expect(row).toMatchObject({ uid: '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7', name: 'Practice', online: true, sessionType: 0 });
    expect(engine.value('/workspace/sessions/7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7', 'directory_path')).toBe('/tmp/standalone/com.example.practice/Practice');

    await client.sessions.create({ name: 'Plain' });
    expect(sent[1]).toEqual({ name: 'Plain' });
  });

  it('reopens an Add On\'s own session by its package uid, named from the workspace row', async () => {
    const { engine } = await connected();
    engine.addPackage('other', { name: 'Someone Else' });
    const posted: string[] = [];
    const port = engine.port();
    const post = port.post.bind(port);
    port.post = (path, data) => { posted.push(path); return post(path, data); };
    const luna = await Luna.connect({ port_: port });
    const sessionPackageUid = '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7';
    const ownSession = async () => {
      const row = (await luna.workspace.query()).find((r) => r.uid === sessionPackageUid);
      return row?.online ? luna.sessions.open(sessionPackageUid) : luna.sessions.create({ name: 'My Add On', sessionPackageUid });
    };
    const first = await ownSession();
    await luna.sessions.close(first.id);
    const again = await ownSession();
    expect(posted.filter((p) => p.endsWith('_session') && !p.endsWith('load_session'))).toEqual(['/sessions/new_session', '/sessions/close_session', '/sessions/open_session']);
    expect(again.sessionPackageUid.value).toBe(sessionPackageUid);
    expect(again.name.value).toBe('My Add On');
  });

  it('reads a session’s lyrics, ruler and transcribed, with their words (fact 152)', async () => {
    const { engine, session } = await connected();
    const source = 'c42b76fba5944509b178af83706c52ec';
    engine.addLyric('abc', { location: 5_190_000_000, length: 13_930_000_000, text: 'Uh, is this thing on?', sourceUid: source, words: [{ word: 'Uh,', offset: 0, length: 59_999_999 }, { word: 'is', offset: 1_670_000_000, length: 139_999_999 }] });
    engine.addLyric('abc', { location: 2_540_000_000, text: 'Na-na-na', sourceUid: source });
    engine.addLyric('abc', { location: Luna.WHOLE_NOTE * 4, text: 'typed on the ruler' });
    await engine.settled();

    await session.lyrics.load();
    const [first, second, ruler] = [...session.lyrics.sorted.filter((l) => l.transcribed), ...session.lyrics.sorted.filter((l) => !l.transcribed)];
    expect(first?.text.value).toBe('Na-na-na');
    expect(second?.text.value).toBe('Uh, is this thing on?');
    expect(second?.sourceUid.value).toBe(source);
    expect(second?.length.value).toBe(13_930_000_000);
    expect(second?.words.value).toEqual([{ word: 'Uh,', offset: 0, length: 59_999_999 }, { word: 'is', offset: 1_670_000_000, length: 139_999_999 }]);
    expect(ruler?.transcribed).toBe(false);
    expect(ruler?.location.value).toBe(Luna.WHOLE_NOTE * 4);
    expect(ruler?.words.value).toEqual([]);
  });

  it('follows lines LUNA adds and removes after loading (fact 152)', async () => {
    const { engine, session } = await connected();
    await session.lyrics.load();
    let changes = 0;
    session.lyrics.onChange(() => changes++);
    const rowid = engine.addLyric('abc', { location: 0, text: 'first line' });
    await engine.settled();
    // An added line arrives without its properties on native LUNA (fact 7); they follow.
    await session.lyrics.membersReady();
    expect(session.lyrics.items.map((l) => l.text.value)).toEqual(['first line']);
    engine.removeNode(`/sessions/abc/lyrics/${rowid}`);
    await engine.settled();
    expect(session.lyrics.items).toHaveLength(0);
    expect(changes).toBeGreaterThan(0);
  });

  it('reads drivers and preferences and writes a preference', async () => {
    const { engine, luna } = await connected();
    await Promise.all([luna.drivers.load(), luna.preferences.load()]);
    expect(luna.drivers.connected.value?.[0]?.name).toBe('Mock Device');
    expect(luna.drivers.sampleRates.value).toEqual([44100, 48000]);
    expect(luna.preferences.ioBufferSize.value).toBe(256);
    await luna.preferences.property<number>('io_buffer_size').set(512);
    expect(engine.value('/preferences', 'io_buffer_size')).toBe(512);
    expect(await luna.preferences.property<string>('metronome_sound').value).toBe('click');
  });
});

describe('Luna.Markers, Luna.Context, Luna.Automation, MIDI, Luna.Gui, Luna.Jobs', () => {
  it('adds, edits, sorts and deletes markers (location is the tick field)', async () => {
    const { engine, session } = await connected();
    session.markers.onChange(() => undefined);
    await session.addMarker(Luna.WHOLE_NOTE * 4, 'Verse');
    await session.addMarker(Luna.WHOLE_NOTE, 'Intro', { color: 0xff00ff00 });
    await engine.settled();
    expect(session.markers.items).toHaveLength(2);
    await Promise.all(session.markers.items.map((m) => m.load()));
    expect(session.markers.sorted.map((m) => m.name.value)).toEqual(['Intro', 'Verse']);
    expect(session.markers.at(Luna.WHOLE_NOTE * 2)?.name.value).toBe('Intro');
    const verse = session.markers.sorted[1]!;
    await verse.rename('Chorus');
    await verse.moveTo(Luna.WHOLE_NOTE * 8);
    await engine.settled();
    expect(verse.name.value).toBe('Chorus');
    expect(verse.location.value).toBe(Luna.WHOLE_NOTE * 8);
    await verse.delete();
    await engine.settled();
    expect(session.markers.items.map((m) => m.name.value)).toEqual(['Intro']);
  });

  it('drives selection and context commands', async () => {
    const { engine, session } = await connected(['Vocal']);
    const ctx = session.context;
    expect(session.contexts.byId('main')?.contextType.value).toBe('main');
    await ctx.select({ startTick: 0, stopTick: Luna.WHOLE_NOTE, trackUids: ['Vocal'] });
    expect(engine.value(ctx.path, 'selection_stop')).toBe(Luna.WHOLE_NOTE);
    expect(engine.value(ctx.path, 'selection_tracks')).toEqual(['Vocal']);
    await ctx.duplicate();
    await ctx.nudge(-Luna.SIXTEENTH_NOTE);
    const posts = engine.requests.filter((r) => r.verb === 'post').map((r) => [r.path, r.data]);
    expect(posts).toEqual(
      expect.arrayContaining([
        ['/sessions/abc/contexts/main/commands/duplicate', { session_uid: 'abc' }],
        ['/sessions/abc/contexts/main/commands/nudge', { session_uid: 'abc', ticks: -Luna.SIXTEENTH_NOTE }],
      ]),
    );
  });

  it('reads the waveform zoom from the context settings, 1 when unset or unreadable', async () => {
    const { engine, session } = await connected(['Vocal']);
    const ctx = session.context;
    ctx.waveformZoom.onChange(() => undefined);
    await ctx.load();
    expect(ctx.waveformZoom.value).toBe(1);
    // LUNA's own key, spelling included (fact 94).
    engine.setValue(ctx.path, 'settings', JSON.stringify({ grid: '1_4', auido_waveform_zoom: 4 }));
    await engine.settled();
    await session.client.store.scheduler.settled();
    expect(ctx.waveformZoom.value).toBe(4);
    engine.setValue(ctx.path, 'settings', 'not json');
    await engine.settled();
    await session.client.store.scheduler.settled();
    expect(ctx.waveformZoom.value).toBe(1);
  });

  it('edits automation breakpoints and automation mode', async () => {
    const { engine, session } = await connected(['Vocal']);
    const track = session.tracks.byId('Vocal')!;
    await track.loadStrip();
    const auto = track.gain.automation;
    auto.onChange(() => undefined);
    await auto.load();
    expect(auto.breakpoints).toEqual([]);
    // insert resolves once the lane shows every point (fact 71), so no extra waiting here.
    await auto.insert([{ tick: Luna.WHOLE_NOTE, value: -6 }, { tick: 0, value: 0 }]);
    expect(auto.breakpoints).toEqual([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
    // Values go out as float literals (fact 82). Find the request rather than index from the end.
    expect(engine.requests.find((r) => r.path === '/sessions/abc/insert_bp')).toMatchObject({ data: { session_uid: 'abc', control_uid: track.gain.uid.value, values: [{ location: Luna.WHOLE_NOTE, value: Luna.float(-6) }, { location: 0, value: Luna.float(0) }] } });
    await auto.setValue(Luna.WHOLE_NOTE, -3);
    expect(auto.breakpoints.at(-1)).toEqual({ tick: Luna.WHOLE_NOTE, value: -3 });
    await auto.move(Luna.WHOLE_NOTE, Luna.WHOLE_NOTE * 2);
    expect(auto.breakpoints.map((b) => b.tick)).toEqual([0, Luna.WHOLE_NOTE * 2]);
    await auto.clear(0, Luna.WHOLE_NOTE * 2);
    expect(auto.breakpoints).toEqual([]);
    await track.setAutomationMode('touch');
    await engine.settled();
    expect(track.automationMode.value).toBe('touch');
    expect(engine.requests.at(-1)).toMatchObject({ path: '/sessions/abc/set_automode_on_tracks', data: { uid: 'abc', tracks: ['Vocal'], automation_mode: 3 } });
  });

  it('stores a bare whole-number breakpoint as 0, the way LUNA does (fact 82)', async () => {
    const { engine, session, luna } = await connected(['Vocal']);
    const track = session.tracks.byId('Vocal')!;
    await track.loadStrip();
    const auto = track.gain.automation;
    await auto.load();
    await luna.raw.post('/sessions/abc/insert_bp', { session_uid: 'abc', control_uid: track.gain.uid.value, values: [{ location: 0, value: -6 }] });
    await engine.settled();
    await auto.reload();
    await Promise.all(auto.items.map((b) => b.load()));
    expect(auto.breakpoints).toEqual([{ tick: 0, value: 0 }]);
  });

  it('refuses a fractional breakpoint tick before the wire', async () => {
    const { session } = await connected(['Vocal']);
    const track = session.tracks.byId('Vocal')!;
    await track.loadStrip();
    await expect(track.gain.automation.insert([{ tick: 0.5, value: -6 }])).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('refuses a MIDI insertClip with no source, as LUNA does (fact 112)', async () => {
    const { engine, session } = await connected(['Keys']);
    await expect(session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: Luna.WHOLE_NOTE, clipType: 'midi' })).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await engine.settled();
    expect(engine.children(`/sessions/abc/playlists/${session.playlistFor(session.tracks.byId('Keys')!)!.id}/clips`)).toEqual([]);
  });

  it('adds MIDI notes to a clip', async () => {
    const { engine, session } = await connected(['Keys']);
    const track = session.tracks.byId('Keys')!;
    const pl = session.playlistFor(track)!;
    pl.clips.onChange(() => undefined);
    const reply = { uid: engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE }) };
    await engine.settled();
    const clip = pl.clips.byId(reply.uid)!;
    await clip.addNote(60, 0, Luna.QUARTER_NOTE, 90);
    expect(engine.requests.at(-1)).toMatchObject({
      path: '/sessions/abc/add_midi',
      data: { session_uid: 'abc', midi: [{ clip_uid: reply.uid, tick: 0, byte_0: 0x90, byte_1: 60, byte_2: 90 }, { clip_uid: reply.uid, tick: Luna.QUARTER_NOTE, byte_0: 0x80, byte_1: 60, byte_2: 0 }] },
    });
  });

  it('adds several MIDI notes to a clip in one post', async () => {
    const { engine, session } = await connected(['Keys']);
    const track = session.tracks.byId('Keys')!;
    const pl = session.playlistFor(track)!;
    pl.clips.onChange(() => undefined);
    const reply = { uid: engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE }) };
    await engine.settled();
    const clip = pl.clips.byId(reply.uid)!;
    const before = engine.requests.length;
    await clip.addNotes([
      { pitch: 60, tick: 0, lengthTicks: Luna.QUARTER_NOTE },
      { pitch: 64, tick: Luna.QUARTER_NOTE, lengthTicks: Luna.QUARTER_NOTE, velocity: 80, channel: 2 },
    ]);
    expect(engine.requests.length).toBe(before + 1);
    expect(engine.requests.at(-1)).toMatchObject({
      path: '/sessions/abc/add_midi',
      data: {
        session_uid: 'abc',
        midi: [
          { clip_uid: reply.uid, tick: 0, byte_0: 0x90, byte_1: 60, byte_2: 100 },
          { clip_uid: reply.uid, tick: Luna.QUARTER_NOTE, byte_0: 0x80, byte_1: 60, byte_2: 0 },
          { clip_uid: reply.uid, tick: Luna.QUARTER_NOTE, byte_0: 0x92, byte_1: 64, byte_2: 80 },
          { clip_uid: reply.uid, tick: Luna.HALF_NOTE, byte_0: 0x82, byte_1: 64, byte_2: 0 },
        ],
      },
    });
  });

  it('refuses bad notes in addNotes before the wire', async () => {
    const { engine, session } = await connected(['Keys']);
    const track = session.tracks.byId('Keys')!;
    const pl = session.playlistFor(track)!;
    pl.clips.onChange(() => undefined);
    const reply = { uid: engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: Luna.WHOLE_NOTE }) };
    await engine.settled();
    const clip = pl.clips.byId(reply.uid)!;
    const before = engine.requests.length;
    const q = Luna.QUARTER_NOTE;
    await expect(clip.addNotes([])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(clip.addNotes([{ pitch: 128, tick: 0, lengthTicks: q }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(clip.addNotes([{ pitch: 60, tick: 0.5, lengthTicks: q }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(clip.addNotes([{ pitch: 60, tick: 0, lengthTicks: 0 }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(clip.addNotes([{ pitch: 60, tick: 0, lengthTicks: q, velocity: 0 }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(clip.addNotes([{ pitch: 60, tick: 0, lengthTicks: q, channel: 16 }])).rejects.toMatchObject({ code: 'out_of_range' });
    expect(engine.requests.length).toBe(before);
  });

  it('talks to the LUNA host surface: pages, add-ons, dialogs, tasks', async () => {
    const { engine, luna } = await connected();
    await Promise.all([luna.gui.addOns.load(), luna.gui.windows.load()]);
    expect(luna.gui.addOns.items.map((a) => a.name.value)).toEqual(['Demo']);
    expect(luna.gui.addOns.items[0]!.targets.value).toEqual(['window']);
    expect('target' in luna.gui.addOns.items[0]!).toBe(false);
    expect(luna.gui.addOns.items[0]!.floating.value).toBe(true);
    expect(luna.gui.addOns.items[0]!.showWithSession.value).toBe(false);
    expect(luna.gui.addOns.items[0]!.fixedSize.value).toBe(false);
    expect(luna.gui.addOns.items[0]!.runHidden.value).toBe(false);
    expect(luna.gui.addOns.items[0]!.unloadOnClose.value).toBe(false);
    expect(luna.gui.addOns.items[0]!.manufacturer.value).toBe('Example Co');
    expect(luna.gui.addOns.items[0]!.description.value).toBe('A demo Add On.');
    expect(luna.gui.addOns.items[0]!.categories.value).toEqual(['Utility']);
    expect(luna.gui.addOns.items[0]!.network.value).toEqual([]);
    expect(luna.gui.addOns.items[0]!.networkAllowed.value).toEqual([]);
    expect(luna.gui.addOns.items[0]!.version.value).toBe('1.0.0');
    expect(luna.gui.addOns.items[0]!.installedFrom.value).toBe('folder');
    expect(luna.gui.addOns.items[0]!.requiresPlugins.value).toEqual([]);
    expect(luna.gui.main.page.value).toBe('timeline');
    const w = luna.gui.main.watch(); // outside a session: subscribe explicitly to follow pushes
    await w.ready;
    await luna.gui.setPage('mixer');
    await engine.settled();
    expect(luna.gui.main.page.value).toBe('mixer');
    w.release();
    await luna.gui.main.reload();
    await luna.gui.openUrl('https://uaudio.com');
    await luna.gui.addOns.items[0]!.show();
    expect(engine.requests.at(-1)).toMatchObject({ path: '/gui/show_add_on', data: { id: 'com.example.demo' } });

    engine.nextDialogFiles = ['/tmp/a.wav', '/tmp/b.wav'];
    expect(await luna.gui.chooseFiles({ filters: ['*.wav'], allowMultiple: true })).toEqual(['/tmp/a.wav', '/tmp/b.wav']);
    engine.nextDialogFiles = [];
    expect(await luna.gui.chooseFiles()).toEqual([]);
    expect(engine.requests.some((r) => r.path === '/gui/release_file_chooser')).toBe(true);
    engine.nextDialogFiles = ['/tmp/out.wav'];
    expect(await luna.gui.chooseSavePath({ extensions: ['wav'] })).toBe('/tmp/out.wav');

    const task = await luna.gui.startTask('Render');
    await task.progress(50);
    await task.done();
    const taskPosts = engine.requests.filter((r) => r.path.startsWith('/gui/') && r.path.endsWith('_task')).map((r) => r.path);
    expect(taskPosts).toEqual(['/gui/add_task', '/gui/update_task', '/gui/remove_task']);
  });

  it('finds its own Add On instance and resizes a window within the manifest limits (fact 143)', async () => {
    const { engine, luna } = await connected();
    const addOnPath = '/gui/add_ons/com.example.demo';
    engine.setValue(addOnPath, 'min_width', 300);
    engine.setValue(addOnPath, 'max_height', 700);
    const inst = engine.openAddOnInstance('com.example.demo', { instanceId: 'inst-a', width: 400, height: 300 });
    await engine.settled();

    await luna.gui.addOns.load();
    const addOn = luna.gui.addOns.byId('com.example.demo')!;
    expect(addOn.minWidth.value).toBe(300);
    expect(addOn.maxWidth.value).toBeNull();
    await addOn.instances.load();
    expect(addOn.instances.items.map((i) => i.instanceId)).toEqual([inst]);

    expect(await luna.gui.thisInstance('missing')).toBeUndefined();
    expect(await luna.gui.thisInstance(undefined)).toBeUndefined();
    const me = (await luna.gui.thisInstance(inst))!;
    expect(me.addOnId).toBe('com.example.demo');
    expect(me.target.value).toBe('window');
    expect([me.width.value, me.height.value]).toEqual([400, 300]);

    await me.resize(100, 2000);     // clamped to min_width and max_height
    expect([me.width.value, me.height.value]).toEqual([300, 700]);
    await me.resize(640);
    expect([me.width.value, me.height.value]).toEqual([640, 700]);
    await expect(me.resize(0)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });

    // A user resize in LUNA reaches the watched instance.
    engine.setValue(me.path, 'height', 480);
    await engine.settled();
    await luna.settled();
    expect(me.height.value).toBe(480);
  });

  it('refuses to resize an Add On page that is not a window (fact 143)', async () => {
    const { engine, luna } = await connected();
    engine.setValue('/gui/add_ons/com.example.demo', 'targets', ['browser']);
    const inst = engine.openAddOnInstance('com.example.demo', { width: 250, height: 600 });
    await engine.settled();
    const me = (await luna.gui.thisInstance(inst))!;
    expect(me.target.value).toBe('browser');
    await expect(me.resize(300)).rejects.toMatchObject({ code: 'uasrv.read_only' });
  });

  it("reads every host an Add On lists, default first, and a page's own host from its instance", async () => {
    const { engine, luna } = await connected();
    engine.setValue('/gui/add_ons/com.example.demo', 'targets', ['window', 'browser']);
    await luna.gui.addOns.load();
    const demo = luna.gui.addOns.items[0]!;
    expect(demo.targets.value).toEqual(['window', 'browser']);
    // Opened where the user swapped it to: the instance reports that host.
    const inst = engine.openAddOnInstance('com.example.demo', { target: 'browser', width: 250, height: 600 });
    await engine.settled();
    expect((await luna.gui.thisInstance(inst))!.target.value).toBe('browser');
    // Without a target it opens in the default, the first.
    const other = engine.openAddOnInstance('com.example.demo', { width: 400, height: 300 });
    await engine.settled();
    expect((await luna.gui.thisInstance(other))!.target.value).toBe('window');
    expect(() => engine.openAddOnInstance('com.example.demo', { target: 'editor' })).toThrow(/does not list target editor/);
  });

  it('reads add_on_inst from the page URL (fact 143)', async () => {
    const { engine, luna } = await connected();
    const inst = engine.openAddOnInstance('com.example.demo', { instanceId: 'from-url', width: 400, height: 300 });
    await engine.settled();
    const g = globalThis as { location?: unknown };
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { value: { search: `?port=4718&add_on_inst=${inst}` }, configurable: true });
    try {
      expect((await luna.gui.thisInstance())?.instanceId).toBe('from-url');
    } finally {
      if (saved) Object.defineProperty(globalThis, 'location', saved);
      else delete g.location;
    }
  });

  it('chooses folders through show_folder_dialog and releases the request (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.nextDialogFiles = ['/Samples/Kicks', '/Samples/Snares'];
    expect(await luna.gui.chooseFolders({ title: 'Pick', allowMultiple: true, defaultPath: '/Samples' })).toEqual(['/Samples/Kicks', '/Samples/Snares']);
    expect(engine.requests.find((r) => r.path === '/gui/show_folder_dialog')?.data).toEqual({ title: 'Pick', allow_multiple: true, default_path: '/Samples' });
    expect(engine.requests.at(-1)?.path).toBe('/gui/release_file_chooser');
    engine.nextDialogFiles = [];
    expect(await luna.gui.chooseFolders()).toEqual([]);
  });

  it('lists a folder: hidden entries left out, in natural order (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Samples'] = ['zeta.wav', '.DS_Store', 'Ünïcode/', 'take10.wav', 'b.wav', 'A.wav', 'take2.wav', 'Loops/', '_tmp.txt', 'take02.wav'];
    engine.grantFolder('/Samples');
    const entries = await luna.gui.listFiles('/Samples');
    // Digit runs by value (take2 before take10), case ignored, punctuation and non-ASCII first.
    expect(entries.map((e) => e.name)).toEqual(['_tmp.txt', 'Ünïcode', 'A.wav', 'b.wav', 'Loops', 'take02.wav', 'take2.wav', 'take10.wav', 'zeta.wav']);
    expect(entries.find((e) => e.name === 'Loops')).toEqual({ name: 'Loops', path: '/Samples/Loops', isDirectory: true });
    expect(entries.find((e) => e.name === 'A.wav')).toEqual({ name: 'A.wav', path: '/Samples/A.wav', isDirectory: false });
    engine.folders['/Samples/Loops'] = [];
    expect(await luna.gui.listFiles('/Samples/Loops/')).toEqual([]);
  });

  it('rejects listFiles with the engine codes LUNA answers (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Samples'] = ['kick.wav'];
    engine.grantFolder('/Samples');
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.listFiles('/Samples/Nope'))).toBe('uasrv.filesystem_error');
    expect(await code(luna.gui.listFiles('/Samples/kick.wav'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.listFiles('Samples'))).toBe('uasrv.invalid_value');
  });

  it('lists only folders the user granted, and the folders inside them (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Users/me'] = ['Samples/', 'Samples Old/', 'secret.txt'];
    engine.folders['/Users/me/Samples'] = ['Loops/', 'kick.wav'];
    engine.folders['/Users/me/Samples/Loops'] = ['loop.wav'];
    engine.folders['/Users/me/Samples Old'] = ['old.wav'];
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    // Nothing yet, and a missing path is refused the same way, so a refusal tells nothing.
    expect(await code(luna.gui.listFiles('/Users/me/Samples'))).toBe('uasrv.not_permitted');
    expect(await code(luna.gui.listFiles('/Users/me/Nope'))).toBe('uasrv.not_permitted');
    // Picking the folder grants it.
    engine.nextDialogFiles = ['/Users/me/Samples'];
    expect(await luna.gui.chooseFolders()).toEqual(['/Users/me/Samples']);
    expect((await luna.gui.listFiles('/Users/me/Samples')).map((e) => e.name)).toEqual(['kick.wav', 'Loops']);
    expect((await luna.gui.listFiles('/Users/me/Samples/Loops/')).map((e) => e.name)).toEqual(['loop.wav']);
    // Not the folder above, a sibling sharing its name as a prefix, or '..' out of it.
    expect(await code(luna.gui.listFiles('/Users/me'))).toBe('uasrv.not_permitted');
    expect(await code(luna.gui.listFiles('/Users/me/Samples Old'))).toBe('uasrv.not_permitted');
    expect(await code(luna.gui.listFiles('/Users/me/Samples/..'))).toBe('uasrv.not_permitted');
    // Clearing them, as removing them in Settings does, withdraws access.
    engine.grantedFolders = [];
    expect(await code(luna.gui.listFiles('/Users/me/Samples'))).toBe('uasrv.not_permitted');
  });

  it('serves a media file to an Add On as a URL on its own origin (fact 114)', async () => {
    const { engine, luna } = await connected();
    engine.installTokens['com.example.demo'] = '0123456789abcdef0123456789abcdef';
    engine.mediaFiles['/Movies/My Cut #1.mov'] = true;
    engine.mediaFiles['/Movies/latest.mov'] = '/Movies/My Cut #1.mov';
    expect(await luna.gui.serveMediaFile('com.example.demo', '/Movies/My Cut #1.mov')).toBe('ua-content://com.example.demo_t0123456789abcdef0123456789abcdef/Movies/My%20Cut%20%231.mov');
    // A link is served under the file it leads to; the id is matched without case.
    expect(await luna.gui.serveMediaFile('COM.Example.Demo', '/Movies/latest.mov')).toBe('ua-content://com.example.demo_t0123456789abcdef0123456789abcdef/Movies/My%20Cut%20%231.mov');
    expect(engine.mediaServed).toEqual([
      { addOnId: 'com.example.demo', path: '/Movies/My Cut #1.mov' },
      { addOnId: 'com.example.demo', path: '/Movies/My Cut #1.mov' },
    ]);
  });

  it('rejects serveMediaFile with the engine codes LUNA answers (fact 114)', async () => {
    const { engine, luna } = await connected();
    engine.mediaFiles['/Movies/cut.mov'] = true;
    engine.mediaFiles['/Movies/notes.mp4'] = null;
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.serveMediaFile('com.example.demo', '/Movies/notes.mp4'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.serveMediaFile('com.example.demo', 'Movies/cut.mov'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.serveMediaFile('com.example.demo', '/Movies/gone.mov'))).toBe('uasrv.filesystem_error');
    expect(await code(luna.gui.serveMediaFile('com.example.not-installed', '/Movies/cut.mov'))).toBe('uasrv.not_installed');
    expect(engine.mediaServed).toEqual([]);
  });

  it('lists everything below a blessed folder, each folder followed by its contents (fact 133)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Samples'] = ['take10.wav', 'Loops/', '.git/', 'take2.wav'];
    engine.folders['/Samples/Loops'] = ['b.wav', 'a.wav', '.DS_Store'];
    engine.folders['/Samples/.git'] = ['config'];
    engine.grantFolder('/Samples');
    const { files, truncated } = await luna.gui.listAllFiles('/Samples');
    expect(files.map((f) => f.relativePath)).toEqual(['Loops', 'Loops/a.wav', 'Loops/b.wav', 'take2.wav', 'take10.wav']);
    expect(files[1]).toEqual({ name: 'a.wav', path: '/Samples/Loops/a.wav', isDirectory: false, relativePath: 'Loops/a.wav' });
    expect(truncated).toBe(false);
    engine.listLimit = 2;
    expect(await luna.gui.listAllFiles('/Samples')).toEqual({ files: files.slice(0, 2), truncated: true });
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.listAllFiles('/Elsewhere'))).toBe('uasrv.not_permitted');
  });

  it('reports a LUNA that cannot list recursively as Luna.Unsupported', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Samples'] = ['kick.wav'];
    engine.grantFolder('/Samples');
    // An older LUNA ignores `recursive` and answers one level without `truncated`.
    engine.overrideCommand('/gui/list_files', () => ({ files: [{ name: 'kick.wav', path: '/Samples/kick.wav', is_directory: false }] }));
    await expect(luna.gui.listAllFiles('/Samples')).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('follows the blessed folders, adding one only when the user allows it (fact 133)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Users/me/Samples'] = ['Loops/'];
    engine.folders['/Users/me/Samples/Loops'] = [];
    engine.folders['/Users/me/Video'] = ['notes.txt'];
    await luna.gui.watchBlessedFolders();
    expect(luna.gui.blessedFolders.value).toEqual([]);
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.addBlessedFolder('Samples'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.addBlessedFolder('/Users/me/Video/notes.txt'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.addBlessedFolder('/Users/me/Nope'))).toBe('uasrv.filesystem_error');
    engine.blessAnswer = 'dont_allow';
    await luna.gui.addBlessedFolder('/Users/me/Samples');
    await engine.settled();
    expect(luna.gui.blessedFolders.value).toEqual([]);
    engine.blessAnswer = 'allow';
    await luna.gui.addBlessedFolder('/Users/me/Samples');
    await Luna.settle(() => luna.gui.blessedFolders.value?.length === 1, 'blessed');
    expect(luna.gui.blessedFolders.value).toEqual(['/Users/me/Samples']);
    // Inside a blessed folder: no prompt.
    await luna.gui.addBlessedFolder('/Users/me/Samples/Loops');
    expect(engine.blessRequests).toEqual(['/Users/me/Samples', '/Users/me/Samples']);
    expect(await code(luna.gui.removeBlessedFolder('/Users/me/Samples/Loops'))).toBe('uasrv.invalid_value');
    await luna.gui.removeBlessedFolder('/Users/me/Samples');
    await Luna.settle(() => luna.gui.blessedFolders.value?.length === 0, 'removed');
    expect(await code(luna.gui.listFiles('/Users/me/Samples'))).toBe('uasrv.not_permitted');
    engine.fail('/gui/add_blessed_folder', 'uasrv.invalid_object');
    await expect(luna.gui.addBlessedFolder('/x')).rejects.toBeInstanceOf(Luna.Unsupported);
    engine.fail('/gui/remove_blessed_folder', 'uasrv.invalid_object');
    await expect(luna.gui.removeBlessedFolder('/x')).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('asks before a folder picked in the dialog is blessed; refused, the path still comes back (fact 133)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Users/me/Samples'] = ['kick.wav'];
    engine.folders['/Users/me/Video'] = [];
    engine.blessAnswer = 'dont_allow';
    engine.nextDialogFiles = ['/Users/me/Samples'];
    expect(await luna.gui.chooseFolders()).toEqual(['/Users/me/Samples']);
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.listFiles('/Users/me/Samples'))).toBe('uasrv.not_permitted');
    engine.blessAnswer = 'allow';
    engine.nextDialogFiles = ['/Users/me/Samples', '/Users/me/Video'];
    expect(await luna.gui.chooseFolders({ allowMultiple: true })).toEqual(['/Users/me/Samples', '/Users/me/Video']);
    expect((await luna.gui.listFiles('/Users/me/Samples')).map((e) => e.name)).toEqual(['kick.wav']);
    // Once blessed, picking it again asks nothing.
    engine.nextDialogFiles = ['/Users/me/Samples'];
    await luna.gui.chooseFolders();
    expect(engine.blessRequests).toEqual(['/Users/me/Samples', '/Users/me/Samples', '/Users/me/Video']);
  });

  it('serves any file in a blessed folder but hidden ones (fact 133)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Project'] = ['data.json', '.env', 'img/', '.git/'];
    engine.folders['/Project/img'] = ['cover.png'];
    engine.folders['/Project/.git'] = ['config'];
    engine.folders['/Other'] = ['notes.txt'];
    engine.mediaFiles['/Other/notes.txt'] = null;
    engine.grantFolder('/Project');
    engine.installTokens['com.example.demo'] = '0123456789abcdef0123456789abcdef';
    expect(await luna.gui.serveMediaFile('com.example.demo', '/Project/data.json')).toBe('ua-content://com.example.demo_t0123456789abcdef0123456789abcdef/Project/data.json');
    expect(await luna.gui.serveMediaFile('com.example.demo', '/Project/img/cover.png')).toBe('ua-content://com.example.demo_t0123456789abcdef0123456789abcdef/Project/img/cover.png');
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    // Hidden files below it, and anything outside it that is not media, take the media rule.
    expect(await code(luna.gui.serveMediaFile('com.example.demo', '/Project/.env'))).toBe('uasrv.filesystem_error');
    expect(await code(luna.gui.serveMediaFile('com.example.demo', '/Project/.git/config'))).toBe('uasrv.filesystem_error');
    expect(await code(luna.gui.serveMediaFile('com.example.demo', '/Other/notes.txt'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.serveMediaFile('com.example.not-installed', '/Project/data.json'))).toBe('uasrv.not_installed');
  });

  it('installs Add Ons by showcase id or GitHub repo URL (fact 128)', async () => {
    const { engine, luna } = await connected();
    engine.showcase['uaudio-labs.midi-notation'] = ['com.uaudio.midi-notation', 'com.uaudio.score-view'];
    await luna.gui.installAddOn({ id: 'uaudio-labs.midi-notation' });
    // An Add On's id installs its package, matched without case.
    await luna.gui.installAddOn({ id: 'COM.UAUDIO.Score-View' });
    await luna.gui.installAddOn({ url: 'github.com/uaudio-labs/Video-Window.git' });
    await luna.gui.installAddOn({ url: 'https://www.github.com/uaudio-labs/video-window/releases/tag/0.1.1?x=1' });
    // A Drive share link is downloaded from its direct link, keeping its resourcekey.
    await luna.gui.installAddOn({ url: 'https://drive.google.com/file/d/1QFSOyxrPC6thx3kYgSggBTcyHJCjIaEu/view?usp=sharing' });
    await luna.gui.installAddOn({ url: 'drive.google.com/open?id=1QFSOyxrPC6thx3kYgSggBTcyHJCjIaEu&resourcekey=0-abc' });
    // An iCloud Drive share is named by its short GUID; the name after # is only a label.
    await luna.gui.installAddOn({ url: 'https://www.icloud.com/iclouddrive/076FaevAR0a2KAthHx_Bfv4-A#qwerty-midi-keyboard' });
    // A Dropbox link is downloaded with dl=1, keeping its rlkey and dropping the rest.
    await luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fi/5vs12quvmxdhdm65htp0q/qwerty-midi-keyboard.lunaaddon?rlkey=z045urvstr9rw6exdmduiq0g5&st=zbwjeard&dl=0' });
    expect(engine.addOnInstalls).toEqual([
      { id: 'uaudio-labs.midi-notation' },
      { id: 'uaudio-labs.midi-notation' },
      { url: 'https://github.com/uaudio-labs/Video-Window' },
      { url: 'https://github.com/uaudio-labs/video-window' },
      { url: 'https://drive.usercontent.google.com/download?id=1QFSOyxrPC6thx3kYgSggBTcyHJCjIaEu&export=download&confirm=t' },
      { url: 'https://drive.usercontent.google.com/download?id=1QFSOyxrPC6thx3kYgSggBTcyHJCjIaEu&export=download&confirm=t&resourcekey=0-abc' },
      { url: 'https://www.icloud.com/iclouddrive/076FaevAR0a2KAthHx_Bfv4-A' },
      { url: 'https://www.dropbox.com/scl/fi/5vs12quvmxdhdm65htp0q/qwerty-midi-keyboard.lunaaddon?rlkey=z045urvstr9rw6exdmduiq0g5&dl=1' },
    ]);
  });

  it('rejects installAddOn with the engine codes LUNA answers (fact 128)', async () => {
    const { engine, luna } = await connected();
    engine.showcase['uaudio-labs.video-window'] = ['com.uaudio.video-window'];
    engine.installingPackages = ['uaudio-labs.video-window'];
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.installAddOn({ id: 'com.uaudio.not-listed' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ id: 'com.uaudio.video-window' }))).toBe('uasrv.too_many_requests');
    expect(await code(luna.gui.installAddOn({ url: 'https://example.com/uaudio-labs/video-window' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://github.com.evil.com/a/b' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://github.com/uaudio-labs' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://github.com/uaudio-labs/..' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://drive.google.com/drive/folders/1QFSOyxrPC6thx3kYgSggBTcyHJCjIaEu' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://drive.google.com.evil.com/file/d/abc/view' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://www.icloud.com/photos/076FaevAR0a2KAthHx_Bfv4-A' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://www.icloud.com/iclouddrive/#name' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fo/5vs12quvmxdhdm65htp0q/h?rlkey=z045urvstr9rw6exdmduiq0g5' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fi/5vs12quvmxdhdm65htp0q/a.lunaaddon?dl=0' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ url: 'https://www.dropbox.com/s/abc123/a%2F..%2Fb.lunaaddon' }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({ id: 'uaudio-labs.video-window', url: 'https://github.com/a/b' } as unknown as { id: string }))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.installAddOn({} as { id: string }))).toBe('uasrv.missing_field');
    expect(engine.addOnInstalls).toEqual([]);
  });

  it('removes an imported Add On from the showcase by package or Add On id (fact 128)', async () => {
    const { engine, luna } = await connected();
    engine.showcase['uaudio-labs.video-window'] = ['com.uaudio.video-window'];
    engine.showcase['com.uaudio.qwerty_midi'] = ['com.uaudio.qwerty_midi'];
    engine.showcase['com.example.pair'] = ['com.example.pair', 'com.example.pair-viewer'];
    engine.importedPackages = ['com.uaudio.qwerty_midi', 'com.example.pair'];
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.removeAddOn('uaudio-labs.video-window'))).toBe('uasrv.not_permitted');
    expect(await code(luna.gui.removeAddOn('com.example.nothing'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.removeAddOn(undefined as unknown as string))).toBe('uasrv.missing_field');
    await luna.gui.removeAddOn('COM.UAUDIO.QWERTY_MIDI');
    await luna.gui.removeAddOn('com.example.pair-viewer');
    expect(engine.importedPackages).toEqual([]);
    expect(Object.keys(engine.showcase)).toEqual(['uaudio-labs.video-window']);
    engine.fail('/gui/remove_add_on', 'uasrv.invalid_object');
    await expect(luna.gui.removeAddOn('x')).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('asks to uninstall an Add On by id, refusing one built into LUNA (fact 130)', async () => {
    const { engine, luna } = await connected();
    engine.addNode('/gui/add_ons/com.example.builtin', { properties: { id: 'com.example.builtin', name: 'Built In', targets: ['app'] } });
    engine.builtInAddOns = ['com.example.builtin'];
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.uninstallAddOn('com.example.builtin'))).toBe('uasrv.not_permitted');
    expect(await code(luna.gui.uninstallAddOn('com.example.nothing'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.uninstallAddOn(undefined as unknown as string))).toBe('uasrv.missing_field');
    engine.uninstallAnswer = 'cancel';
    await luna.gui.uninstallAddOn('com.example.demo');
    expect(engine.has('/gui/add_ons/com.example.demo')).toBe(true);
    engine.uninstallAnswer = 'remove';
    await luna.gui.uninstallAddOn('COM.EXAMPLE.DEMO');
    expect(engine.has('/gui/add_ons/com.example.demo')).toBe(false);
    expect(engine.addOnUninstalls).toEqual(['com.example.demo', 'com.example.demo']);
    engine.fail('/gui/uninstall_add_on', 'uasrv.invalid_object');
    await expect(luna.gui.uninstallAddOn('x')).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('reports a LUNA without install_add_on as Luna.Unsupported', async () => {
    const { engine, luna } = await connected();
    engine.fail('/gui/install_add_on', 'uasrv.invalid_object');
    await expect(luna.gui.installAddOn({ url: 'https://github.com/a/b' })).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('reports a LUNA without serve_media_file as Luna.Unsupported', async () => {
    const { engine, luna } = await connected();
    engine.fail('/gui/serve_media_file', 'uasrv.invalid_object');
    await expect(luna.gui.serveMediaFile('com.example.demo', '/Movies/cut.mov')).rejects.toBeInstanceOf(Luna.Unsupported);
    const headless = new Luna.MockEngine({ gui: false });
    const bare = await Luna.connect({ port_: headless.port() });
    await expect(bare.gui.serveMediaFile('com.example.demo', '/Movies/cut.mov')).rejects.toBeInstanceOf(Luna.Unsupported);
    await bare.close();
  });

  it('reports a LUNA without list_files or show_folder_dialog as Luna.Unsupported', async () => {
    const { engine, luna } = await connected();
    engine.fail('/gui/list_files', 'uasrv.invalid_object');
    await expect(luna.gui.listFiles('/Samples')).rejects.toBeInstanceOf(Luna.Unsupported);
    engine.fail('/gui/show_folder_dialog', 'uasrv.invalid_object');
    await expect(luna.gui.chooseFolders()).rejects.toBeInstanceOf(Luna.Unsupported);
    const headless = new Luna.MockEngine({ gui: false });
    const bare = await Luna.connect({ port_: headless.port() });
    await expect(bare.gui.listFiles('/Samples')).rejects.toBeInstanceOf(Luna.Unsupported);
    await bare.close();
  });

  it('opens and closes a plugin editor and follows editors opened in LUNA (fact 126)', async () => {
    const { engine, luna, session } = await connected();
    await session.ready();
    const track = session.tracks.byId('Vocal')!;
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    await engine.settled();
    expect(slot.editorOpen.value).toBe(false);
    expect(luna.gui.pluginWindows.value).toEqual([]);

    await slot.openEditor();
    expect(slot.editorOpen.value).toBe(true);
    expect(engine.requests.find((r) => r.path === '/gui/show_plugin')?.data).toEqual({ session_uid: 'abc', channel_uid: 'Vocal', insert_type: 'effect_0' });
    expect(luna.gui.pluginWindows.value).toEqual([{ sessionUid: 'abc', channelUid: 'Vocal', slot: 'effect_0' }]);
    await slot.openEditor(); // already open: brought to front, still one window
    expect(luna.gui.pluginWindows.value).toHaveLength(1);

    await slot.closeEditor();
    expect(slot.editorOpen.value).toBe(false);
    expect(engine.requests.find((r) => r.path === '/gui/hide_plugin')?.data).toEqual({ session_uid: 'abc', channel_uid: 'Vocal', insert_type: 'effect_0' });

    // The user opens it from LUNA's mixer: the page sees it without asking.
    const seen: (boolean | undefined)[] = [];
    slot.editorOpen.onChange(() => seen.push(slot.editorOpen.value));
    engine.setValue('/gui/plugin_windows', 'open', [{ session_uid: 'abc', channel_uid: 'Vocal', insert_type: 'effect_0' }]);
    await engine.settled();
    await luna.settled();
    expect(slot.editorOpen.value).toBe(true);
    expect(seen).toEqual([true]);
    expect(luna.gui.isPluginOpen('Vocal', 'effect_0')).toBe(true);
    expect(luna.gui.isPluginOpen('Vocal', 'effect_1')).toBe(false);
  });

  it('rejects openEditor on an empty slot and when LUNA opens nothing (fact 126)', async () => {
    const { engine, luna, session } = await connected();
    await session.ready();
    const track = session.tracks.byId('Vocal')!;
    await track.effects.load();
    const empty = track.effects.byId('effect_1')!;
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(empty.openEditor())).toBe('empty_slot');
    expect(engine.requests.some((r) => r.path === '/gui/show_plugin')).toBe(false);

    // LUNA answers show_plugin without opening anything; the page is told, not left waiting.
    const slot = (await track.insert('com.uaudio.uadx.1176'))!;
    engine.overrideCommand('/gui/show_plugin', () => null);
    expect(await code(slot.openEditor({ timeoutMs: 200 }))).toBe('no_effect');
    expect(await code(slot.openEditor({ wait: false }))).toBe('resolved');
    expect(slot.editorOpen.value).toBe(false);
  });

  it('validates show_plugin as LUNA does and reports an older LUNA as Luna.Unsupported (fact 126)', async () => {
    const { engine, luna } = await connected();
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.showPlugin('Vocal', 'clip_effect_0'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.hidePlugin('Vocal', 'nonsense'))).toBe('uasrv.invalid_value');
    engine.fail('/gui/show_plugin', 'uasrv.invalid_object');
    await expect(luna.gui.showPlugin('Vocal', 'effect_0')).rejects.toBeInstanceOf(Luna.Unsupported);

    const headless = new Luna.MockEngine({ gui: false });
    headless.addSession('abc', { tracks: ['Vocal'] });
    await headless.settled();
    const bare = await Luna.connect({ port_: headless.port() });
    const session = await bare.session();
    await session.ready();
    await session.tracks.byId('Vocal')!.effects.load();
    // No /gui: nothing to report, and nothing to open.
    expect(session.tracks.byId('Vocal')!.effects.byId('effect_0')!.editorOpen.value).toBe(undefined);
    await expect(bare.gui.hidePlugin('Vocal', 'effect_0')).rejects.toBeInstanceOf(Luna.Unsupported);
    await bare.close();
  });

  it('exposes jobs with cancel only', async () => {
    const { engine, luna } = await connected();
    engine.addNode('/jobs/j1', { properties: { uid: 'j1', session_uid: 'abc', job_type: 'chord_extraction', status: 'running', stage: 'processing', error: '', warning: '', cancellable: true, percent_complete: 40 }, commands: {} });
    engine.addNode('/jobs/j1/commands', { commands: { cancel_job: (_d, e) => { e.setValue('/jobs/j1', 'status', 'canceled'); return null; } } });
    await luna.jobs.load();
    const job = luna.jobs.byId('j1')!;
    expect(job.percentComplete.value).toBe(40);
    expect(job.isTerminal).toBe(false);
    await job.cancel();
    await engine.settled();
    await job.load();
    expect(engine.value('/jobs/j1', 'status')).toBe('canceled');
  });
});

describe('Clip snapshot, layer and mute; Meter streams and max', () => {
  it('reads a clip as one frozen snapshot with its layer and mute', async () => {
    const { engine, session } = await connected(['Vocal']);
    engine.addSource('pkg_abc', 'src1', { lengthNs: 1_000_000_000 });
    const playlist = session.playlistFor(session.tracks.byId('Vocal')!)!;
    await playlist.clips.load();
    const { id: uid } = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, name: 'Take', clipType: 'audio' });
    await Luna.settle(() => playlist.clips.byId(uid)?.start.value !== undefined, 'insert');
    const clip = playlist.clips.byId(uid)!;
    await clip.load();
    const snap = clip.snapshot();
    expect(snap).toMatchObject({ uid, name: 'Take', clipType: 'audio', start: 0, stop: Luna.WHOLE_NOTE, sourceUid: 'src1', layer: 0, muted: false });
    expect(Object.isFrozen(snap)).toBe(true);
    engine.setValue(clip.path, 'mute', 1);
    await engine.settled();
    expect(clip.muted.value).toBe(true);
  });

  it('reports stream count and the highest level', async () => {
    const { engine, session } = await connected(['Vocal']);
    const master = session.master!;
    const stop = master.meter.onChange(() => undefined);
    await Luna.settle(() => master.meter.numStreams.value !== undefined, 'meter load');
    expect(master.meter.streams).toBe(2);
    engine.setValue(master.meter.path, 'level', [0.25, 0.5]);
    await engine.settled();
    expect(master.meter.max).toBe(0.5);
    stop();
  });
});

describe('Luna.Transport.seconds', () => {
  it('converts the playhead through the tempo map, mirroring tick', async () => {
    const { engine, luna, session } = await connected();
    const t = session.transport;
    expect(t.seconds).toBe(0);
    await t.seek(Luna.WHOLE_NOTE); // stopped: the play start, 4 beats at the default 120 BPM
    expect(t.seconds).toBe(2);
    // playing: the live location, as for `tick`
    engine.setValue('/sessions/abc', 'playing', true);
    engine.setValue('/sessions/abc', 'location', engine.locationAt('/sessions/abc', Luna.TICKS_PER_BEAT * 8));
    await engine.settled();
    await luna.store.scheduler.settled();
    expect(t.seconds).toBe(4);
  });

  it('honours tempo changes: 90.5 beats at 60 BPM is 90.5 s', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Vocal'] });
    engine.setValue('/sessions/abc/tempo_map/1', 'tempo', 60);
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    const t = session.transport;
    await t.seek(Luna.TICKS_PER_BEAT * 90.5);
    expect(t.seconds).toBe(90.5);
    expect(Luna.formatMinSec(t.seconds, { fraction: 2 })).toBe('01:30.50');
  });

  it('integrates a multi-event tempo map', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Vocal'] });
    engine.setValue('/sessions/abc/tempo_map/1', 'tempo', 60);
    engine.addNode('/sessions/abc/tempo_map/2', { properties: { tick: Luna.TICKS_PER_BEAT * 60, time: 60, tempo: 120 } });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    const t = session.transport;
    await t.seek(Luna.TICKS_PER_BEAT * 90.5); // 60 beats at 60 BPM, then 30.5 at 120
    expect(t.seconds).toBe(60 + 15.25);
  });

  it('throws unavailable before the tempo map is loaded, rather than guessing a tempo', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Vocal'] });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    await luna.sessions.ready();
    const session = luna.sessions.items.items[0]!;
    expect(() => session.transport.seconds).toThrowError(/tempo map is not loaded/);
    await session.ready();
    expect(session.transport.seconds).toBe(0);
  });
});
