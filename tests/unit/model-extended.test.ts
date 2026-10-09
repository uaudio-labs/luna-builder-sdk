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
      { uid: 'p_abi', name: 'All Buttons In', version: 1, favorite: false, factory: true, path: '' },
      { uid: 'p_smash', name: 'Vocal Smash', version: 1, favorite: true, factory: false, path: '' },
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

  it('adds MIDI notes to a clip', async () => {
    const { engine, session } = await connected(['Keys']);
    const track = session.tracks.byId('Keys')!;
    const pl = session.playlistFor(track)!;
    pl.clips.onChange(() => undefined);
    const reply = (await session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: Luna.WHOLE_NOTE, clipType: 'midi' })) as { uid: string };
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
    const reply = (await session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: Luna.WHOLE_NOTE, clipType: 'midi' })) as { uid: string };
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
    const reply = (await session.insertClip({ trackUid: 'Keys', sourceUid: '', startTick: 0, stopTick: Luna.WHOLE_NOTE, clipType: 'midi' })) as { uid: string };
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
    expect(luna.gui.addOns.items[0]!.floating.value).toBe(true);
    expect(luna.gui.addOns.items[0]!.showWithSession.value).toBe(false);
    expect(luna.gui.addOns.items[0]!.manufacturer.value).toBe('Example Co');
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

  it('chooses folders through show_folder_dialog and releases the request (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.nextDialogFiles = ['/Samples/Kicks', '/Samples/Snares'];
    expect(await luna.gui.chooseFolders({ title: 'Pick', allowMultiple: true, defaultPath: '/Samples' })).toEqual(['/Samples/Kicks', '/Samples/Snares']);
    expect(engine.requests.find((r) => r.path === '/gui/show_folder_dialog')?.data).toEqual({ title: 'Pick', allow_multiple: true, default_path: '/Samples' });
    expect(engine.requests.at(-1)?.path).toBe('/gui/release_file_chooser');
    engine.nextDialogFiles = [];
    expect(await luna.gui.chooseFolders()).toEqual([]);
  });

  it('lists a folder: hidden entries left out, sorted ignoring case, ASCII before UTF-8 (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Samples'] = ['zeta.wav', '.DS_Store', 'Ünïcode/', 'b.wav', 'A.wav', 'Loops/', '_tmp.txt'];
    const entries = await luna.gui.listFiles('/Samples');
    expect(entries.map((e) => e.name)).toEqual(['_tmp.txt', 'A.wav', 'b.wav', 'Loops', 'zeta.wav', 'Ünïcode']);
    expect(entries.find((e) => e.name === 'Loops')).toEqual({ name: 'Loops', path: '/Samples/Loops', isDirectory: true });
    expect(entries.find((e) => e.name === 'A.wav')).toEqual({ name: 'A.wav', path: '/Samples/A.wav', isDirectory: false });
    engine.folders['/Samples/Loops'] = [];
    expect(await luna.gui.listFiles('/Samples/Loops/')).toEqual([]);
  });

  it('rejects listFiles with the engine codes LUNA answers (fact 106)', async () => {
    const { engine, luna } = await connected();
    engine.folders['/Samples'] = ['kick.wav'];
    const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: Luna.Error) => e.code);
    expect(await code(luna.gui.listFiles('/Nope'))).toBe('uasrv.filesystem_error');
    expect(await code(luna.gui.listFiles('/Samples/kick.wav'))).toBe('uasrv.invalid_value');
    expect(await code(luna.gui.listFiles('Samples'))).toBe('uasrv.invalid_value');
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
    const { uid } = (await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, name: 'Take', clipType: 'audio' })) as { uid: string };
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
