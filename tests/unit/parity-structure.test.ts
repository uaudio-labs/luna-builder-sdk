/**
 * Client parity, structure slice: session groups (facts 215-218), track MIDI output routing
 * (facts 219-220), video sync (facts 221-222) and `/gui` progress suppression (facts 223-225),
 * against the mock's model of LUNA's code.
 */
import { describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Kick', 'Snare', 'Synth'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const [kick, snare, synth] = ['Kick', 'Snare', 'Synth'].map((id) => session.tracks.byId(id)!) as [Luna.Track, Luna.Track, Luna.Track];
  return { engine, luna, session, kick, snare, synth };
}

const posts = (engine: Luna.MockEngine, suffix: string) => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith(suffix)).map((r) => r.data);

describe('session.groups (facts 215-218)', () => {
  it('creates a group without session_uid in the payload and reads name, attributes, order and members', async () => {
    const { engine, session, kick, snare } = await connected();
    await session.groups.load();
    const g = await session.groups.add({ name: 'Drums', attributes: ['mix', 'edit'], members: [kick, snare.id] });
    expect(posts(engine, '/sessions/abc/new_group')).toEqual([{ group_attributes: 'edit,mix', name: 'Drums', tracks: ['Kick', 'Snare'] }]);
    expect(session.groups.byId(g.id)).toBe(g);
    expect([g.name.value, g.attributes.value, g.order.value, g.members.value]).toEqual(['Drums', ['edit', 'mix'], 1, ['Kick', 'Snare']]);
  });

  it('refuses unknown attributes before posting', async () => {
    const { engine, session } = await connected();
    await expect(session.groups.add({ attributes: ['solo' as Luna.GroupAttribute] })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.groups.add({ attributes: [] })).rejects.toMatchObject({ code: 'out_of_range' });
    expect(posts(engine, '/new_group')).toEqual([]);
  });

  it('numbers a clashing name when asked, as LUNA does', async () => {
    const { session } = await connected();
    await session.groups.load();
    await session.groups.add({ name: 'Bus', attributes: ['mix'] });
    const second = await session.groups.add({ name: 'Bus', attributes: ['mix'], makeNameUnique: true });
    expect(second.name.value).toBe('Bus 2');
    const defaulted = await session.groups.add({ attributes: ['plugin', 'send'] });
    expect([defaulted.name.value, defaulted.attributes.value]).toEqual(['New Group', ['plugin', 'send']]);
  });

  it('adds and removes members, a bus too, reporting a member LUNA holds twice once', async () => {
    const { engine, session, kick, snare, synth } = await connected();
    await session.groups.load();
    const g = await session.groups.add({ attributes: ['mix'], members: [kick] });
    const bus = await session.newBus({ name: 'FX' });
    await g.addMembers([snare, bus, kick]);
    expect(g.members.value).toEqual(['Kick', 'Snare', bus.id]);
    // LUNA's unique index lets the second Kick row in (fact 216).
    const rows = engine.children(`/sessions/abc/groups/${g.id}/members`);
    expect(rows).toHaveLength(4);
    expect(engine.value(`/sessions/abc/groups/${g.id}/members/${rows[2]}`, 'bus_uid')).toBe(bus.id);
    await g.removeMembers([kick, synth]);
    expect(g.members.value).toEqual(['Snare', bus.id]);
    expect(posts(engine, '/remove_group_members').at(-1)).toEqual({ uid: g.id, tracks: ['Kick', 'Synth'] });
  });

  it('follows a group LUNA adds and deletes on its own, and deletes one', async () => {
    const { engine, luna, session } = await connected();
    await session.groups.load();
    await luna.raw.post('/sessions/abc/new_group', { group_attributes: 'all', name: 'From LUNA', tracks: [{ track_uid: 'Synth' }] });
    await engine.settled();
    await luna.settled();
    await session.groups.membersReady();
    const g = session.groups.sorted.at(-1)!;
    await vi.waitFor(() => expect(g.members.value).toEqual(['Synth']));
    expect(g.attributes.value).toEqual(['edit', 'mix', 'plugin', 'send']);
    await g.delete();
    expect(session.groups.items).toEqual([]);
    expect(g.disposed).toBe(true);
  });

  it('moves groups after another, or to the front, with session_uid in the payload (fact 217)', async () => {
    const { engine, session } = await connected();
    await session.groups.load();
    const [a, b, c] = [await session.groups.add({ name: 'A', attributes: ['mix'] }), await session.groups.add({ name: 'B', attributes: ['mix'] }), await session.groups.add({ name: 'C', attributes: ['mix'] })];
    await session.groups.reorder([a], { after: c });
    expect(session.groups.sorted.map((g) => g.name.value)).toEqual(['B', 'C', 'A']);
    expect(posts(engine, '/group_change_order').at(-1)).toEqual({ session_uid: 'abc', dragged_uids: [a.id], before_uid: c.id });
    await session.groups.reorder([c]);
    expect(session.groups.sorted.map((g) => g.name.value)).toEqual(['C', 'B', 'A']);
    expect(posts(engine, '/group_change_order').at(-1)).toEqual({ session_uid: 'abc', dragged_uids: [c.id] });
    expect([a, b, c].map((g) => g.order.value)).toEqual([3, 2, 1]);
  });

  it('rejects with no_effect when LUNA answers but does not move (an unknown group)', async () => {
    const { session } = await connected();
    await session.groups.load();
    await session.groups.add({ name: 'A', attributes: ['mix'] });
    await expect(session.groups.reorder(['nope'])).rejects.toMatchObject({ code: 'no_effect' });
  }, 10_000);

  it('answers the tracks a grouped operation reaches, by attribute (fact 218)', async () => {
    const { engine, session, kick, snare, synth } = await connected();
    await session.groups.load();
    await session.groups.add({ attributes: ['mix'], members: [kick, snare] });
    expect((await session.groups.affectedTracks(kick, 'mix')).sort()).toEqual(['Kick', 'Snare']);
    expect(await session.groups.affectedTracks(kick, 'edit')).toEqual(['Kick']);
    expect(await session.groups.affectedTracks(synth, ['mix', 'edit'])).toEqual(['Synth']);
    expect(posts(engine, '/group_affected_tracks')[0]).toEqual({ track_uid: 'Kick', group_attributes: 'mix' });
    await session.groups.affectedTracks(kick, 'mix', { contextType: 'main' });
    expect(posts(engine, '/group_affected_tracks').at(-1)).toMatchObject({ context_type: 'main' });
    // A selection that holds the track comes along.
    engine.setValue('/sessions/abc/contexts/main', 'selection_tracks', ['Kick', 'Synth']);
    expect((await session.groups.affectedTracks(kick, 'mix')).sort()).toEqual(['Kick', 'Snare', 'Synth']);
  });
});

describe('track.midiOutputs (facts 219-220)', () => {
  it('replaces the routing through the context command and reads each destination back', async () => {
    const { engine, session, kick, synth } = await connected();
    const bus = await session.newBus({ name: 'MIDI Bus' });
    await kick.midiOutputs.set([{ track: synth, channel: 0 }, { device: 'IAC Driver Bus 1', channel: 10 }, { track: bus.id, channel: 3 }]);
    expect(posts(engine, '/sessions/abc/contexts/main/commands/set_midi_output_assignments')).toEqual([
      { session_uid: 'abc', track_uid: 'Kick', devices: [{ value: 'IAC Driver Bus 1', channel: 10 }], tracks: [{ value: 'Synth', channel: 0 }, { value: bus.id, channel: 3 }] },
    ]);
    const got = kick.midiOutputs.items.map((a) => [a.destination.value, a.channel.value]);
    expect(got).toEqual([
      [{ kind: 'device', name: 'IAC Driver Bus 1' }, 10],
      [{ kind: 'track', uid: 'Synth' }, 0],
      [{ kind: 'bus', uid: bus.id }, 3],
    ]);
    await kick.midiOutputs.set([{ device: 'Other', channel: 1 }]);
    expect(kick.midiOutputs.items.map((a) => a.midiDevice.value)).toEqual(['Other']);
    await kick.midiOutputs.set([]);
    expect(kick.midiOutputs.items).toEqual([]);
  });

  it('refuses a channel outside 0-16 and passes LUNA errors through', async () => {
    const { engine, kick } = await connected();
    await expect(kick.midiOutputs.set([{ device: 'X', channel: 17 }])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(kick.midiOutputs.set([{ track: 'nope', channel: 0 }])).rejects.toMatchObject({ code: 'device.database_error' });
    expect(posts(engine, '/set_midi_output_assignments')).toHaveLength(1);
  });

  it('reads an effect destination LUNA wrote itself', async () => {
    const { engine, kick } = await connected();
    await kick.midiOutputs.load();
    engine.addNode('/sessions/abc/tracks/Kick/midi_output_assignments/m1', { properties: { uid: 'm1', destination_track_uid: null, destination_bus_uid: null, effect_uid: 'fx1', midi_device: null, midi_output_channel: 2 } });
    await engine.settled();
    await kick.midiOutputs.membersReady();
    expect(kick.midiOutputs.items[0]!.destination.value).toEqual({ kind: 'effect', uid: 'fx1' });
  });

  it('the mock refuses a payload without devices, as LUNA does', async () => {
    const { luna } = await connected();
    await expect(luna.raw.post('/sessions/abc/contexts/main/commands/set_midi_output_assignments', { track_uid: 'Kick', tracks: [] })).rejects.toMatchObject({ code: 'uasrv.invalid_type' });
  });
});

describe('luna.gui.suppressProgress (facts 223-225)', () => {
  it('holds a suppression with no owner and releases it once', async () => {
    const { engine, luna } = await connected();
    const hold = await luna.gui.suppressProgress();
    expect([...engine.progressSuppressions]).toEqual([[hold.uid, 'legacy']]);
    expect(posts(engine, '/gui/add_progress_suppression')).toEqual([{ suppression_uid: hold.uid }]);
    expect(hold.released).toBe(false);
    await hold.release();
    await hold.release();
    expect(hold.released).toBe(true);
    expect(engine.progressSuppressions.size).toBe(0);
    expect(posts(engine, '/gui/remove_progress_suppression')).toHaveLength(1);
  });

  it('treats a handle LUNA already dropped as released (fact 224)', async () => {
    const { engine, luna } = await connected();
    const hold = await luna.gui.suppressProgress();
    await luna.raw.post('/gui/add_progress_suppression', { suppression_uid: 'abcdef0123456789abcdef0123456789', owner: 'dashboard' });
    engine.resetWebClient('luna_play');
    // LUNA Play's reset drops every legacy handle (an Add On's) but not the dashboard's.
    expect([...engine.progressSuppressions.values()]).toEqual(['dashboard']);
    await expect(hold.release()).resolves.toBeUndefined();
  });

  it('releases on its own after maxMs, and on pagehide', async () => {
    const { engine, luna } = await connected();
    const hold = await luna.gui.suppressProgress({ maxMs: 80 });
    expect(hold.released).toBe(false);
    await vi.waitFor(() => expect(hold.released).toBe(true));
    await vi.waitFor(() => expect(engine.progressSuppressions.size).toBe(0));

    const target = new EventTarget();
    const g = globalThis as { addEventListener?: unknown; removeEventListener?: unknown };
    const saved = [g.addEventListener, g.removeEventListener];
    g.addEventListener = target.addEventListener.bind(target);
    g.removeEventListener = target.removeEventListener.bind(target);
    try {
      const second = await luna.gui.suppressProgress();
      target.dispatchEvent(new Event('pagehide'));
      expect(second.released).toBe(true);
      await vi.waitFor(() => expect(engine.progressSuppressions.size).toBe(0));
    } finally {
      [g.addEventListener, g.removeEventListener] = saved;
    }
  });

  it('refuses a bad maxMs, and says so on a LUNA without the command', async () => {
    const { engine, luna } = await connected();
    await expect(luna.gui.suppressProgress({ maxMs: 0 })).rejects.toMatchObject({ code: 'out_of_range' });
    engine.overrideCommand('/gui/add_progress_suppression', () => {
      throw new Luna.Error('uasrv.invalid_object', 'gone');
    });
    await expect(luna.gui.suppressProgress()).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('the mock refuses an unknown owner and a duplicate handle, as LUNA does', async () => {
    const { luna } = await connected();
    const uid = '0123456789abcdef0123456789abcdef';
    await expect(luna.raw.post('/gui/add_progress_suppression', { suppression_uid: uid, owner: 'my_add_on' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await luna.raw.post('/gui/add_progress_suppression', { suppression_uid: uid });
    await expect(luna.raw.post('/gui/add_progress_suppression', { suppression_uid: uid })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.raw.post('/gui/remove_progress_suppression', {})).rejects.toMatchObject({ code: 'uasrv.missing_field' });
  });
});
