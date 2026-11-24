/**
 * Client parity, tracks, buses, effects, presets and plugins (facts 165-178): a rename that
 * keeps its name, insert power, moving and copying inserts, deleting buses, folders and
 * playlists, duplicate placement, bus automation modes, tracks from inputs, cross-track clip
 * moves, preset favourites, descriptions and plugin lists, bus presets, plugin formats and
 * plugin windows in another LUNA window.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';
import { WebSocketPort } from '../../src/wire/websocket-port';
import { FakeSocket } from '../helpers/fake-socket';

const COMP = 'com.uaudio.uadx.1176';
const EQ = 'com.uaudio.uadx.pultec';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal', 'Bass'], name: 'Demo' });
  engine.addPlugin(COMP, { name: '1176' });
  engine.addPlugin(EQ, { name: 'Pultec' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const vocal = session.tracks.byId('Vocal')!;
  const bass = session.tracks.byId('Bass')!;
  await Promise.all([vocal.effects.load(), bass.effects.load()]);
  return { engine, luna, session, vocal, bass };
}

const code = (p: Promise<unknown>) => p.then(() => 'resolved', (e: { code?: string }) => e.code);

describe('Port.set request parameters (fact 165)', () => {
  it('WebSocketPort sends them as query parameters beside the reply id', async () => {
    FakeSocket.reset();
    const port = new WebSocketPort({ WebSocket: FakeSocket, heartbeat: false, requestTimeoutMs: 1000 });
    const opening = port.open();
    FakeSocket.latest.open();
    await opening;
    const socket = FakeSocket.latest;
    const done = port.set('/sessions/s1/tracks/t1/name', 'Lead', { name_modified: 'true' });
    expect(socket.sent[0]).toBe('set /sessions/s1/tracks/t1/name?name_modified=true&ua_id=r1 "Lead"');
    socket.reply('set ', { path: '/sessions/s1/tracks/t1/name', parameters: { ua_id: 'r1' } });
    await done;
    await port.close();
  });
});

describe('Track.rename (fact 165)', () => {
  it('sends name_modified=true with the write, so a preset load keeps the name', async () => {
    const { engine, vocal } = await connected();
    engine.addTrackPreset('Lead Vocal', { uid: 'tp_vocal' });
    await vocal.rename('My Vocal');
    expect(engine.requests.find((r) => r.verb === 'set')!.path).toBe('/sessions/abc/tracks/Vocal/name?name_modified=true');
    await engine.settled();
    expect([vocal.name.value, vocal.nameModified.value]).toEqual(['My Vocal', true]);
    await vocal.loadPreset('tp_vocal');
    await engine.settled();
    expect(vocal.name.value).toBe('My Vocal');
  });

  it('name.set leaves the flag alone and the preset renames the track', async () => {
    const { engine, vocal } = await connected();
    engine.addTrackPreset('Lead Vocal', { uid: 'tp_vocal' });
    await vocal.name.set('Scratch');
    expect(engine.requests.find((r) => r.verb === 'set')!.path).toBe('/sessions/abc/tracks/Vocal/name');
    await vocal.loadPreset('tp_vocal');
    await engine.settled();
    expect([vocal.name.value, vocal.nameModified.value]).toEqual(['Lead Vocal', false]);
  });
});

describe('Effect.setPower (fact 171)', () => {
  it('posts set_inserts_power on the edit context and resolves once plugin_power follows', async () => {
    const { engine, vocal } = await connected();
    const slot = vocal.effects.byId('effect_0')!;
    await slot.setPlugin(COMP);
    await slot.setPower(false);
    expect(slot.pluginPower.value).toBe(false);
    const post = engine.requests.find((r) => r.path.endsWith('/set_inserts_power'))!;
    expect(post.path).toBe('/sessions/abc/contexts/main/commands/set_inserts_power');
    expect(post.data).toEqual({ session_uid: 'abc', channel_uid: 'Vocal', inserts: ['effect_0'], value: false });
    await slot.setPower(true);
    expect(engine.value('/sessions/abc/tracks/Vocal/effects/effect_0', 'plugin_power')).toBe(true);
  });

  it('leaves a frozen slot alone and resolves on the reply', async () => {
    const { engine, vocal } = await connected();
    engine.setValue('/sessions/abc/tracks/Vocal/effects/effect_1', 'frozen', true);
    await engine.settled();
    const slot = vocal.effects.byId('effect_1')!;
    await slot.load({ flatvalue: true, commands: false, children: false });
    await slot.setPower(false);
    expect(engine.value('/sessions/abc/tracks/Vocal/effects/effect_1', 'plugin_power')).toBe(true);
  });
});

describe('Effect.moveTo / copyTo (fact 173)', () => {
  it('moves a plugin with its power and preset to another track, clearing the source', async () => {
    const { engine, vocal, bass } = await connected();
    const src = vocal.effects.byId('effect_0')!;
    await src.setPlugin(COMP, { presetName: 'Gentle' });
    await src.setPower(false);
    const dst = bass.effects.byId('effect_2')!;
    await src.moveTo(dst);
    expect([dst.pluginId.value, dst.presetName.value, dst.pluginPower.value]).toEqual([COMP, 'Gentle', false]);
    const post = engine.requests.find((r) => r.path === '/move_insert')!;
    expect(post.data).toEqual({ session_uid: 'abc', source_uid: src.uid.value, destination_uid: dst.uid.value, copy: false });
    await engine.settled();
    expect(src.pluginId.value).toBeNull();
  });

  it('copies, leaving the source as it was', async () => {
    const { vocal, bass, engine } = await connected();
    const src = vocal.effects.byId('effect_0')!;
    await src.setPlugin(EQ);
    await src.copyTo(bass.effects.byId('effect_0')!);
    await engine.settled();
    expect([src.pluginId.value, bass.effects.byId('effect_0')!.pluginId.value]).toEqual([EQ, EQ]);
  });

  it('into an occupied effect slot, shuffles the occupant toward an empty slot', async () => {
    const { vocal, engine } = await connected();
    await vocal.effects.byId('effect_0')!.setPlugin(EQ);
    await vocal.effects.byId('effect_3')!.setPlugin(COMP);
    await vocal.effects.byId('effect_3')!.moveTo(vocal.effects.byId('effect_0')!);
    await engine.settled();
    // The source emptied effect_3; EQ shuffled up from effect_0 into effect_1 (the empty slot above).
    expect(vocal.effectSlots.slice(0, 4).map((e) => e.pluginId.value)).toEqual([COMP, EQ, null, null]);
  });

  it('refuses console <-> effect_N moves and an empty source, sending nothing', async () => {
    const { engine, vocal, bass } = await connected();
    await vocal.effects.byId('effect_0')!.setPlugin(COMP);
    const before = engine.requests.length;
    expect(await code(vocal.effects.byId('effect_0')!.moveTo(bass.effects.byId('console')!))).toBe('invalid_slot');
    expect(await code(vocal.effects.byId('console')!.copyTo(bass.effects.byId('effect_1')!))).toBe('invalid_slot');
    expect(await code(vocal.effects.byId('effect_5')!.moveTo(bass.effects.byId('effect_1')!))).toBe('empty_slot');
    expect(engine.requests.slice(before).some((r) => r.path === '/move_insert')).toBe(false);
  });
});

describe('Bus.delete / deleteWithContents (fact 168)', () => {
  it('deletes an aux bus and refuses the master', async () => {
    const { engine, session } = await connected();
    const fx = await session.newBus({ name: 'FX' });
    await fx.delete();
    expect(session.buses.byId(fx.id)).toBeUndefined();
    expect(engine.requests.find((r) => r.path.endsWith('/delete_bus'))!.data).toEqual({ session_uid: 'abc', bus_uid: fx.id });
    expect(await code(session.master!.delete())).toBe('device.database_error');
  });

  it('deleting a folder bus leaves its contents at the root', async () => {
    const { session, vocal } = await connected();
    const folder = await session.newFolder({ name: 'Group' });
    await session.moveToFolder([vocal], folder);
    await folder.delete();
    expect(session.tracks.byId('Vocal')).toBe(vocal);
    expect(vocal.folderUid.value).toBeNull();
  });

  it('deleteWithContents takes nested folders and tracks with it', async () => {
    const { engine, session, vocal, bass } = await connected();
    const outer = await session.newFolder({ name: 'Outer' });
    const inner = await session.newFolder({ name: 'Inner', folderUid: outer.id });
    await session.moveToFolder([vocal], inner);
    await outer.deleteWithContents();
    expect([session.buses.byId(outer.id), session.buses.byId(inner.id), session.tracks.byId('Vocal')]).toEqual([undefined, undefined, undefined]);
    expect(session.tracks.byId('Bass')).toBe(bass);
    expect(engine.requests.find((r) => r.path.endsWith('/delete_folder_with_contents'))!.path).toBe('/sessions/abc/buses/delete_folder_with_contents');
    expect(await code(session.master!.deleteWithContents())).toBe('uasrv.invalid_value');
  });
});

describe('Session.deletePlaylists / deleteUnusedPlaylists (fact 170)', () => {
  it('deleting the version in use switches the track to the one before', async () => {
    const { session, vocal, engine } = await connected();
    await session.newPlaylists(['Vocal']);
    await engine.settled();
    engine.setValue('/sessions/abc/tracks/Vocal', 'playlist_uid', 'pl_Vocal_2');
    await engine.settled();
    await session.deletePlaylists(['pl_Vocal_2']);
    expect(session.playlists.byId('pl_Vocal_2')).toBeUndefined();
    expect(vocal.playlistUid.value).toBe('pl_Vocal_1');
    expect(await code(session.deletePlaylists(['pl_Vocal_1']))).toBe('uasrv.invalid_value');
  });

  it('deleteUnusedPlaylists keeps each track the version it plays, sending those as the list', async () => {
    const { session, vocal, engine } = await connected();
    await session.newPlaylists(['Vocal']);
    await session.newPlaylists(['Vocal']);
    await engine.settled();
    await session.deleteUnusedPlaylists([vocal]);
    expect(session.playlists.items.filter((p) => p.trackUid.value === 'Vocal').map((p) => p.id)).toEqual(['pl_Vocal_1']);
    expect(engine.requests.find((r) => r.path.endsWith('/delete_playlists'))!.data).toMatchObject({ playlist_uid: ['pl_Vocal_1'], delete_unused: true });
  });
});

describe('Track.duplicate (fact 166)', () => {
  it('names the copy up front, places it right after `after`, and resolves to the Track', async () => {
    const { engine, session, vocal, bass } = await connected();
    const copy = await bass.duplicate({ includeContent: false, after: vocal });
    expect(copy).toBeInstanceOf(Luna.Track);
    expect(session.tracks.byId(copy.id)).toBe(copy);
    const post = engine.requests.find((r) => r.path.endsWith('/duplicate_tracks'))!;
    expect(post.data).toEqual({ session_uid: 'abc', track_uid: ['Bass'], destination_track_uid: [copy.id], include_content: false, before_uid: 'Vocal' });
    expect(copy.id).toMatch(/^[0-9a-f]{32}$/);
    await engine.settled();
    expect(session.tracksInOrder.map((t) => t.id).slice(-3)).toEqual(['Vocal', copy.id, 'Bass']);
  });
});

describe('Channel.setAutomationMode on a bus (fact 167)', () => {
  it('sets a bus automation mode', async () => {
    const { session, engine } = await connected();
    const fx = await session.newBus({ name: 'FX' });
    await fx.setAutomationMode('latch');
    await engine.settled();
    expect(fx.automationMode.value).toBe('latch');
  });
});

describe('Session.newTracksFromInputs (fact 172)', () => {
  it('makes one armed track per input, named after it, with the input assigned', async () => {
    const { engine, session } = await connected();
    engine.addDevice('Apollo', { inputs: ['Mic 1', 'Talkback', 'Mic 2'] });
    const tracks = await session.newTracksFromInputs({ inputUids: ['in_1', 'in_2', 'in_3'], recordEnable: true, stemFormat: 'mono' });
    expect(tracks.map((t) => [t.name.value, t.inputNodeUid.value, t.recordEnabled.value])).toEqual([
      ['Mic 1', 'in_1', true],
      ['Mic 2', 'in_3', true],
    ]);
    expect(engine.requests.find((r) => r.path.endsWith('/new_tracks_from_inputs'))!.data).toEqual({ session_uid: 'abc', input_uids: ['in_1', 'in_2', 'in_3'], record_enable: true, stem_format: 'mono' });
  });

  it('refuses an unknown input and a list LUNA makes no track for, before posting', async () => {
    const { engine, session } = await connected();
    engine.addDevice('Apollo', { inputs: ['Talkback'] });
    expect(await code(session.newTracksFromInputs({ inputUids: ['nope'] }))).toBe('unknown_input');
    expect(await code(session.newTracksFromInputs({ inputUids: ['in_1'] }))).toBe('no_inputs');
    expect(engine.requests.some((r) => r.path.endsWith('/new_tracks_from_inputs'))).toBe(false);
  });
});

describe('Session.moveClips across tracks (fact 174)', () => {
  it('moves a clip to another track by playlist remap, with move_automation', async () => {
    const { engine, session, vocal, bass } = await connected();
    engine.addSource('pkg_abc', 'src1', { name: 'take.wav', lengthNs: 10e9 });
    const B = Luna.TICKS_PER_BEAT;
    const clip = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: 4 * B });
    const from = session.playlistFor(vocal)!;
    const to = session.playlistFor(bass)!;
    await session.moveClips(8 * B, { startTick: 0, stopTick: 4 * B, playlists: [{ from, to: to.id }], moveAutomation: true });
    expect(engine.requests.find((r) => r.path.endsWith('/move_clips'))!.data).toMatchObject({ move_automation: true, playlists: [{ source_playlist: from.id, destination_playlist: to.id }] });
    await engine.settled();
    expect(engine.children(`/sessions/abc/playlists/${from.id}/clips`)).not.toContain(clip.id);
    const moved = engine.children(`/sessions/abc/playlists/${to.id}/clips`);
    expect(moved).toHaveLength(1);
    expect(engine.value(`/sessions/abc/playlists/${to.id}/clips/${moved[0]}`, 'start')).toBe(8 * B);
  });
});

describe('Presets: favourites, descriptions, plugin lists, bus presets (facts 169, 175, 176)', () => {
  it('setFavorite writes under the plugin or the track presets, and the query sees it', async () => {
    const { engine, luna } = await connected();
    engine.addPreset(EQ, 'Air', { uid: 'p_air' });
    engine.addTrackPreset('Bass Rig', { uid: 'tp_bass' });
    const [row] = await luna.presets.query({ pluginId: EQ });
    await luna.presets.setFavorite(row!, true, { pluginId: EQ });
    expect(row!.favorite).toBe(true);
    await luna.presets.setFavorite('tp_bass', true);
    const sets = engine.requests.filter((r) => r.verb === 'set').map((r) => r.path);
    expect(sets).toEqual([`/presets/plugins/${EQ}/presets/p_air/favorite`, '/presets/devices/track/presets/tp_bass/favorite']);
    expect((await luna.presets.query({ pluginId: EQ, favorite: true })).map((r) => r.uid)).toEqual(['p_air']);
    expect((await luna.presets.query({ deviceTypeId: 'track', favorite: true })).map((r) => r.uid)).toEqual(['tp_bass']);
  });

  it('withDescriptions fills each row from its preset node', async () => {
    const { engine, luna } = await connected();
    engine.addPreset(EQ, 'Air', { uid: 'p_air', description: 'Top end' });
    engine.addPreset(EQ, 'Flat', { uid: 'p_flat' });
    const rows = await luna.presets.query({ pluginId: EQ, withDescriptions: true });
    expect(rows.map((r) => [r.uid, r.description])).toEqual([['p_air', 'Top end'], ['p_flat', '']]);
    expect((await luna.presets.query({ pluginId: EQ }))[0]).not.toHaveProperty('description');
  });

  it('trackPresetPlugins reads the preset package, undefined when there is none', async () => {
    const { engine, luna } = await connected();
    engine.addTrackPreset('Vocal Chain', { uid: 'tp_v', plugins: [{ plugin_id: COMP, name: '1176' }, { plugin_id: EQ, name: 'Pultec' }] });
    engine.addTrackPreset('Empty', { uid: 'tp_e' });
    expect(await luna.presets.trackPresetPlugins('tp_v')).toEqual([{ pluginId: COMP, name: '1176' }, { pluginId: EQ, name: 'Pultec' }]);
    expect(await luna.presets.trackPresetPlugins({ uid: 'tp_e' })).toBeUndefined();
  });

  it('Bus.loadPreset sends is_bus and refuses a plugin preset', async () => {
    const { engine, session } = await connected();
    engine.addTrackPreset('Reverb Bus', { uid: 'tp_bus', trackType: 'bus' });
    engine.addPreset(EQ, 'Air', { uid: 'p_air' });
    const fx = await session.newBus({ name: 'FX' });
    await fx.loadPreset('tp_bus');
    expect(engine.requests.find((r) => r.path === '/presets/devices/track/load')!.data).toEqual({ session_uid: 'abc', uid: fx.id, preset_uid: 'tp_bus', is_bus: true });
    await engine.settled();
    expect([fx.presetUid.value, fx.name.value]).toEqual(['tp_bus', 'Reverb Bus']);
    expect(await code(fx.loadPreset('p_air'))).toBe('uasrv.invalid_type');
  });
});

describe('Plugin.sdkType (fact 177)', () => {
  it('reads LUNA\'s format for each plugin', async () => {
    const { engine, luna } = await connected();
    engine.addPlugin('com.vendor.vst3.thing');
    engine.addPlugin('UAD 1176LN', { sdkType: 'uad2' });
    await luna.plugins.load();
    expect([COMP, 'com.vendor.vst3.thing', 'UAD 1176LN'].map((id) => luna.plugins.byId(id)!.sdkType.value)).toEqual(['uadx', 'vst3', 'uad2']);
  });
});

describe('gui.showPlugin / hidePlugin contextType (fact 178)', () => {
  it('sends context_type, refused while that window is not open', async () => {
    const { engine, luna, vocal } = await connected();
    await vocal.effects.byId('effect_0')!.setPlugin(COMP);
    expect(await code(luna.gui.showPlugin('Vocal', 'effect_0', { contextType: 'alt_1' }))).toBe('uasrv.invalid_object');
    engine.addNode('/gui/windows/alt_1', { properties: { page: 'mixer' } });
    await luna.gui.showPlugin('Vocal', 'effect_0', { contextType: 'alt_1' });
    await luna.gui.hidePlugin('Vocal', 'effect_0', { contextType: 'alt_1' });
    const posts = engine.requests.filter((r) => r.path === '/gui/show_plugin' || r.path === '/gui/hide_plugin');
    expect(posts.map((r) => r.data)).toEqual([
      { channel_uid: 'Vocal', insert_type: 'effect_0', context_type: 'alt_1' },
      { channel_uid: 'Vocal', insert_type: 'effect_0', context_type: 'alt_1' },
      { channel_uid: 'Vocal', insert_type: 'effect_0', context_type: 'alt_1' },
    ]);
  });
});
