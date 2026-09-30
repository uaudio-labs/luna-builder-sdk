import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected(tracks: string[] = ['Vocal', 'Bass', 'Keys']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo', packageUid: 'pkg_abc' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

describe('Session.focusedTrack', () => {
  it('is the last selected track, else the first selected, else the first visible', async () => {
    const { engine, luna, session } = await connected();
    const main = '/sessions/abc/contexts/main';
    expect(session.focusedTrack.value?.id).toBe('Vocal');

    engine.setValue(main, 'selection_tracks', ['nope', 'Keys', 'Bass']);
    await engine.settled();
    expect(session.focusedTrack.value?.id).toBe('Keys');

    engine.setValue(main, 'last_selected_track', 'Bass');
    await engine.settled();
    expect(session.focusedTrack.value?.id).toBe('Bass');

    // A uid that is not a track (a bus, say) falls through to the selection.
    engine.setValue(main, 'last_selected_track', 'master_abc');
    await engine.settled();
    expect(session.focusedTrack.value?.id).toBe('Keys');
    await luna.close();
  });

  it('notifies when the focus moves to another track, and not for a write that keeps it', async () => {
    const { engine, luna, session } = await connected();
    const main = '/sessions/abc/contexts/main';
    const seen: (string | undefined)[] = [];
    session.focusedTrack.onChange(() => seen.push(session.focusedTrack.value?.id));

    engine.setValue(main, 'last_selected_track', 'Keys');
    await engine.settled();
    await luna.settled();
    engine.setValue(main, 'selection_tracks', ['Bass']);
    await engine.settled();
    await luna.settled();
    engine.setValue(main, 'last_selected_track', 'Vocal');
    await engine.settled();
    await luna.settled();
    expect(seen).toEqual(['Keys', 'Vocal']);
    await luna.close();
  });

  it('moves off a focused track that is deleted, and is undefined with no tracks', async () => {
    const { engine, luna, session } = await connected(['Only']);
    engine.setValue('/sessions/abc/contexts/main', 'last_selected_track', 'Only');
    await engine.settled();
    expect(session.focusedTrack.value?.id).toBe('Only');
    await session.deleteTracks(['Only']);
    await luna.settled();
    expect(session.focusedTrack.value).toBeUndefined();
    await luna.close();
  });
});

describe('Collection: a member the engine adds', () => {
  async function withLane() {
    const ctx = await connected(['Vocal']);
    ctx.engine.addSource('pkg_abc', 'src1', { name: 'take.wav', lengthNs: 2_000_000_000 });
    const lane = ctx.session.playlistFor(ctx.session.tracks.byId('Vocal')!)!;
    await lane.clips.load();
    // A second client makes the edit, so this page learns of the clip only from the push (fact 7).
    const other = await Luna.connect({ port_: ctx.engine.port() });
    const otherSession = await other.session();
    const insert = () => otherSession.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, name: 'Take 1' });
    return { ...ctx, lane, other, insert };
  }

  it('fires onChange only once its properties are loaded', async () => {
    const { engine, luna, lane, other, insert } = await withLane();
    const seen: unknown[] = [];
    lane.clips.onChange(() => seen.push(lane.clips.items.map((c) => [c.name.value, c.start.value, c.stop.value])));
    await insert();
    await engine.settled();
    await luna.settled();
    expect(seen).toEqual([[['Take 1', 0, Luna.WHOLE_NOTE]]]);
    await other.close();
    await luna.close();
  });

  it('has its values after engine.settled() and luna.settled()', async () => {
    const { engine, luna, lane, other, insert } = await withLane();
    await insert();
    await engine.settled();
    await luna.settled();
    const clip = lane.clips.items[0]!;
    expect([clip.name.value, clip.start.value, clip.stop.value]).toEqual(['Take 1', 0, Luna.WHOLE_NOTE]);
    await other.close();
    await luna.close();
  });

  it('membersReady() waits for the fetch', async () => {
    const { engine, luna, lane, other, insert } = await withLane();
    await insert();
    await engine.settled();
    expect(lane.clips.items).toHaveLength(1);
    await lane.clips.membersReady();
    expect(lane.clips.items[0]!.stop.value).toBe(Luna.WHOLE_NOTE);
    await other.close();
    await luna.close();
  });

  it('still notifies a removal at once', async () => {
    const { engine, luna, lane, other, insert } = await withLane();
    await insert();
    await engine.settled();
    await luna.settled();
    let calls = 0;
    lane.clips.onChange(() => calls++);
    await lane.clips.items[0]!.delete();
    await engine.settled();
    await luna.settled();
    expect(lane.clips.items).toEqual([]);
    expect(calls).toBe(1);
    await other.close();
    await luna.close();
  });
});
