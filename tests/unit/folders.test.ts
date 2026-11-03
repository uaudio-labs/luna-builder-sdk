/**
 * Folder tracks (fact 136): `Session.newFolder`, `Session.moveToFolder`,
 * `Session.folderContents`, `Session.folders` and `Bus.setFolderMode`. The mock reproduces
 * what LUNA did live: a folder is an aux bus with a folder mode, children carry its uid in
 * `folder_uid`, and main outputs follow the nearest summing folder, else the master.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Drums', 'Bass'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const drums = session.tracks.byId('Drums')!;
  const bass = session.tracks.byId('Bass')!;
  const master = session.master!;
  return { engine, luna, session, drums, bass, master };
}

/** Where a channel's main output goes, as bus uids. */
const mainTo = async (channel: Luna.Track | Luna.Bus): Promise<string[]> => {
  await channel.outputs.load();
  return (channel.main.destinations.value ?? []).map((d) => d.busUid ?? '');
};

describe('Session.newFolder', () => {
  it('creates a summing folder at the root, routed to the master (fact 136)', async () => {
    const { engine, session, master } = await connected();
    const folder = await session.newFolder({ name: 'Drums' });
    expect(folder).toBeInstanceOf(Luna.Bus);
    expect(session.buses.byId(folder.id)).toBe(folder);
    expect([folder.name.value, folder.busType.value, folder.folderMode.value, folder.isFolder, folder.folderUid.value]).toEqual(['Drums', 'aux', 'summing', true, null]);
    const post = engine.requests.find((r) => r.path.endsWith('/new_track'))!;
    expect(post.data).toEqual({ uid: 'abc', name: 'Drums', track_type: 'bus', stem_format: 'stereo', folder_mode: 'summing' });
    expect(await mainTo(folder)).toEqual([master.id]);
    expect(session.folders).toEqual([folder]);
  });

  it('defaults the name to Folder and takes a container mode and a parent folder', async () => {
    const { engine, session } = await connected();
    const outer = await session.newFolder();
    const inner = await session.newFolder({ mode: 'container', folderUid: outer.id });
    expect([outer.name.value, inner.folderMode.value, inner.folderUid.value]).toEqual(['Folder', 'container', outer.id]);
    expect(engine.requests.filter((r) => r.path.endsWith('/new_track'))[1]!.data).toMatchObject({ folder_mode: 'container', folder_uid: outer.id });
    expect(session.folderContents(outer)).toEqual([inner]);
  });

  it('rejects a parent that is not a folder, as LUNA does', async () => {
    const { session } = await connected();
    const bus = await session.newBus({ name: 'FX' });
    await expect(session.newFolder({ folderUid: bus.id })).rejects.toMatchObject({ code: 'device.database_error' });
  });

  it('rejects an unknown mode before posting', async () => {
    const { engine, session } = await connected();
    await expect(session.newFolder({ mode: 'none' as 'summing' })).rejects.toMatchObject({ code: 'out_of_range' });
    expect(engine.requests.some((r) => r.path.endsWith('/new_track'))).toBe(false);
  });
});

describe('Session.newTrack in a folder', () => {
  it('places the tracks in the folder and routes them through a summing one (fact 136)', async () => {
    const { session } = await connected();
    const folder = await session.newFolder({ name: 'Drums' });
    const [kick, snare] = await session.newTrack({ name: 'Drum', count: 2, folderUid: folder.id });
    expect([kick!.folderUid.value, snare!.folderUid.value]).toEqual([folder.id, folder.id]);
    expect(await mainTo(kick!)).toEqual([folder.id]);
    expect(session.folderContents(folder)).toEqual([kick, snare]);
  });

  it('routes past a container folder to the summing folder above it', async () => {
    const { session } = await connected();
    const outer = await session.newFolder({ name: 'Band' });
    const inner = await session.newFolder({ name: 'Perc', mode: 'container', folderUid: outer.id });
    const [shaker] = await session.newTrack({ name: 'Shaker', folderUid: inner.id });
    expect(await mainTo(shaker!)).toEqual([outer.id]);
    expect(await mainTo(inner)).toEqual([outer.id]);
  });
});

describe('Session.moveToFolder', () => {
  it('moves tracks in and back out, rerouting their main outputs (fact 136)', async () => {
    const { engine, session, drums, bass, master } = await connected();
    const folder = await session.newFolder({ name: 'Rhythm' });
    await session.moveToFolder([drums, 'Bass'], folder);
    expect([drums.folderUid.value, bass.folderUid.value]).toEqual([folder.id, folder.id]);
    expect(await mainTo(drums)).toEqual([folder.id]);
    const post = engine.requests.find((r) => r.path.endsWith('/tracks/move_to_folder'))!;
    expect(post.data).toEqual({ session_uid: 'abc', after_uids: ['Drums', 'Bass'], folder_uid: folder.id });

    await session.moveToFolder([bass], null, { after: drums });
    expect(bass.folderUid.value).toBeNull();
    expect(await mainTo(bass)).toEqual([master.id]);
    const back = engine.requests.filter((r) => r.path.endsWith('/tracks/move_to_folder'))[1]!;
    expect(back.data).toEqual({ session_uid: 'abc', after_uids: ['Bass'], before_uid: 'Drums' });
    expect(session.folderContents(folder)).toEqual([drums]);
  });

  it('moves a folder with everything inside it', async () => {
    const { session, drums } = await connected();
    const outer = await session.newFolder({ name: 'Band' });
    const inner = await session.newFolder({ name: 'Kit' });
    await session.moveToFolder([drums], inner);
    await session.moveToFolder([inner], outer);
    expect([inner.folderUid.value, drums.folderUid.value]).toEqual([outer.id, inner.id]);
    expect(await mainTo(inner)).toEqual([outer.id]);
  });

  it('rejects a destination that is not a folder, or a folder moved into itself', async () => {
    const { session, drums, bass } = await connected();
    const outer = await session.newFolder({ name: 'Band' });
    const inner = await session.newFolder({ name: 'Kit', folderUid: outer.id });
    await expect(session.moveToFolder([drums], 'Bass')).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(session.moveToFolder([outer], inner)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    expect(bass.folderUid.value).toBeNull();
  });

  it('does nothing for no items', async () => {
    const { engine, session } = await connected();
    await session.moveToFolder([], null);
    expect(engine.requests.some((r) => r.path.endsWith('/move_to_folder'))).toBe(false);
  });
});

describe('Bus.setFolderMode', () => {
  it('reroutes the children: past a container, through a summing folder (fact 136)', async () => {
    const { engine, session, drums, master } = await connected();
    const folder = await session.newFolder({ name: 'Kit' });
    await session.moveToFolder([drums], folder);
    await folder.setFolderMode('container');
    expect(folder.folderMode.value).toBe('container');
    expect(await mainTo(drums)).toEqual([master.id]);
    expect(engine.requests.find((r) => r.path.endsWith('/buses/set_folder_mode'))!.data).toEqual({ session_uid: 'abc', bus_uid: folder.id, folder_mode: 'container' });
    await folder.setFolderMode('summing');
    expect(await mainTo(drums)).toEqual([folder.id]);
  });

  it("'none' makes an ordinary bus and moves its direct children to the root", async () => {
    const { session, drums } = await connected();
    const folder = await session.newFolder({ name: 'Kit' });
    const inner = await session.newFolder({ name: 'Toms', folderUid: folder.id });
    const [tom] = await session.newTrack({ name: 'Tom', folderUid: inner.id });
    await session.moveToFolder([drums], folder);
    await folder.setFolderMode('none');
    expect([folder.isFolder, drums.folderUid.value, inner.folderUid.value, tom!.folderUid.value]).toEqual([false, null, null, inner.id]);
    expect(session.folders).toEqual([inner]);
  });

  it('turns an ordinary aux bus into a folder', async () => {
    const { session, bass } = await connected();
    const bus = await session.newBus({ name: 'Group' });
    expect(bus.isFolder).toBe(false);
    await bus.setFolderMode('summing');
    await session.moveToFolder([bass], bus);
    expect(await mainTo(bass)).toEqual([bus.id]);
  });

  it('rejects the master bus, as LUNA does', async () => {
    const { session, master } = await connected();
    await expect(master.setFolderMode('summing')).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    expect(session.folders).toEqual([]);
  });
});

const names = (session: Luna.Session) => session.channelsInOrder.map((c) => c.name.value);

describe('Session.channelsInOrder (fact 137)', () => {
  it('runs one order 1..N across tracks and buses, in creation order', async () => {
    const { session } = await connected();
    expect(names(session)).toEqual(['CUE 1', 'CUE 2', 'CUE 3', 'CUE 4', 'Main Output', 'Drums', 'Bass']);
    expect(session.channelsInOrder.map((c) => c.order.value)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(session.tracksInOrder.map((t) => t.name.value)).toEqual(['Drums', 'Bass']);
  });

  it('puts a new folder last, what is made inside it first in it, and keeps a folder together', async () => {
    const { session, drums } = await connected();
    const folder = await session.newFolder({ name: 'Kit' });
    await session.newTrack({ name: 'Kick', folderUid: folder.id });
    await session.newTrack({ name: 'Snare', folderUid: folder.id });
    await session.newBus({ name: 'FX' });
    expect(names(session).slice(5)).toEqual(['Drums', 'Bass', 'Kit', 'Snare', 'Kick', 'FX']);
    await session.moveToFolder([drums], folder);
    expect(names(session).slice(5)).toEqual(['Bass', 'Kit', 'Drums', 'Snare', 'Kick', 'FX']);
    // To the root with no anchor is the very front, before LUNA's own buses.
    await session.moveToFolder([drums], null);
    expect(names(session)).toEqual(['Drums', 'CUE 1', 'CUE 2', 'CUE 3', 'CUE 4', 'Main Output', 'Bass', 'Kit', 'Snare', 'Kick', 'FX']);
  });

  it('renumbers without gaps after a delete', async () => {
    const { session, drums } = await connected();
    await drums.delete();
    await Luna.settle(() => session.tracks.byId('Drums') === undefined, 'delete');
    await session.tracks.reload();
    expect(session.channelsInOrder.map((c) => c.order.value)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('Session.reorder (fact 137)', () => {
  it('moves items after an anchor, or first, in the order given', async () => {
    const { engine, session, drums, bass } = await connected();
    await session.reorder([bass, drums]);
    expect(names(session)).toEqual(['Bass', 'Drums', 'CUE 1', 'CUE 2', 'CUE 3', 'CUE 4', 'Main Output']);
    expect(engine.requests.find((r) => r.path.endsWith('/tracks/change_order'))!.data).toEqual({ session_uid: 'abc', after_uids: ['Bass', 'Drums'] });
    await session.reorder([bass], { after: session.master! });
    expect(names(session)).toEqual(['Drums', 'CUE 1', 'CUE 2', 'CUE 3', 'CUE 4', 'Main Output', 'Bass']);
    expect(engine.requests.filter((r) => r.path.endsWith('/tracks/change_order'))[1]!.data).toEqual({ session_uid: 'abc', after_uids: ['Bass'], before_uid: session.master!.id });
  });

  it('moves a folder with everything inside it', async () => {
    const { session, drums } = await connected();
    const folder = await session.newFolder({ name: 'Kit' });
    await session.newTrack({ name: 'Kick', folderUid: folder.id });
    await session.reorder([folder], { after: drums });
    expect(names(session).slice(5)).toEqual(['Drums', 'Kit', 'Kick', 'Bass']);
  });

  it('never changes folder: an anchor inside another folder only picks a place among siblings', async () => {
    const { session, bass } = await connected();
    const folder = await session.newFolder({ name: 'Kit' });
    const [kick] = await session.newTrack({ name: 'Kick', folderUid: folder.id });
    await session.reorder([bass], { after: kick! });
    expect(bass.folderUid.value).toBeNull();
    expect(names(session).slice(5)).toEqual(['Drums', 'Kit', 'Kick', 'Bass']);
  });

  it('resolves at once when nothing needs to move', async () => {
    const { session, drums } = await connected();
    await session.reorder([drums], { after: session.master! });
    expect(names(session).slice(5)).toEqual(['Drums', 'Bass']);
  });

  it('rejects an id the session does not list, which LUNA would silently ignore', async () => {
    const { engine, session, drums } = await connected();
    await expect(session.reorder(['nope'])).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.reorder([drums], { after: 'nope' })).rejects.toMatchObject({ code: 'out_of_range' });
    expect(engine.requests.some((r) => r.path.endsWith('/change_order'))).toBe(false);
  });

  it('the mock answers null and changes nothing for an unknown uid, as LUNA does', async () => {
    const { luna, session } = await connected();
    const before = names(session);
    expect(await luna.raw.post('/sessions/abc/tracks/change_order', { session_uid: 'abc', after_uids: ['nope'] })).toBeNull();
    expect(names(session)).toEqual(before);
  });
});

describe('Session.moveToFolder placement (facts 136, 137)', () => {
  it('places the items just after `after`, in or out of a folder, in one command', async () => {
    const { engine, session, drums, bass } = await connected();
    const kit = await session.newFolder({ name: 'Kit' });
    const [kick, snare] = await session.newTrack({ name: 'Drum', count: 2, makeNameUnique: true, folderUid: kit.id });
    await session.moveToFolder([bass, drums], kit, { after: kick! });
    expect(names(session).slice(5)).toEqual(['Kit', kick!.name.value, 'Bass', 'Drums', snare!.name.value]);
    expect(engine.requests.filter((r) => r.path.endsWith('/move_to_folder')).at(-1)!.data).toEqual({ session_uid: 'abc', after_uids: ['Bass', 'Drums'], folder_uid: kit.id, before_uid: kick!.id });
    // Out to the root, just after the folder: after its whole contents.
    await session.moveToFolder([drums], null, { after: kit });
    expect(names(session).slice(5)).toEqual(['Kit', kick!.name.value, 'Bass', snare!.name.value, 'Drums']);
    expect(drums.folderUid.value).toBeNull();
  });

  it('keeps what is inside a moved folder inside it, even when it is moved too', async () => {
    const { session, drums } = await connected();
    const band = await session.newFolder({ name: 'Band' });
    const kit = await session.newFolder({ name: 'Kit' });
    const [kick] = await session.newTrack({ name: 'Kick', folderUid: kit.id });
    await session.moveToFolder([kit, kick!, drums], band);
    expect([kit.folderUid.value, kick!.folderUid.value, drums.folderUid.value]).toEqual([band.id, kit.id, band.id]);
    expect(names(session).slice(5)).toEqual(['Bass', 'Band', 'Kit', 'Kick', 'Drums']);
  });

  it('rejects an unknown `after`, as LUNA does', async () => {
    const { session, drums } = await connected();
    await expect(session.moveToFolder([drums], null, { after: 'nope' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });
});
