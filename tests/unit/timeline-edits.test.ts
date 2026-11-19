/**
 * Timeline cut, copy, paste, clear and duplicate (fact 150): `session.selectTimeline` points
 * LUNA's edit selection at tracks and a range, and the edit context's commands act on it.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const W = Luna.WHOLE_NOTE;

async function withClips() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal', 'Bass'], name: 'Demo', packageUid: 'pkg1' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const vocal = session.tracks.byId('Vocal')!;
  const bass = session.tracks.byId('Bass')!;
  engine.addSource('pkg1', 'src1', { lengthNs: 60e9 });
  await engine.settled();
  await session.insertClip({ trackUid: vocal.id, sourceUid: 'src1', startTick: 0, stopTick: 4 * W });
  const lane = (t: Luna.Track) => session.playlistFor(t)!;
  await Promise.all([lane(vocal).clips.load(), lane(bass).clips.load()]);
  const spans = async (t: Luna.Track) => {
    await engine.settled();
    await luna.settled();
    await lane(t).clips.reload();
    return lane(t).clips.items.map((c) => [c.start.value, c.stop.value]).sort((a, b) => a[0]! - b[0]!);
  };
  return { engine, luna, session, vocal, bass, spans };
}

describe('session.selectTimeline', () => {
  it('selects the tracks, their active playlists and the timeline focus, keeping the range unless given', async () => {
    const { engine, luna, session, vocal } = await withClips();
    await session.selectTimeline({ tracks: [vocal], startTick: W, stopTick: 2 * W });
    const ctx = '/sessions/abc/contexts/main';
    expect(engine.value(ctx, 'focus')).toBe('timeline');
    expect(engine.value(ctx, 'selection_tracks')).toEqual(['Vocal']);
    expect(engine.value(ctx, 'selection_playlists')).toEqual([vocal.playlistUid.value]);
    expect([engine.value(ctx, 'selection_start'), engine.value(ctx, 'selection_stop')]).toEqual([W, 2 * W]);
    await session.selectTimeline({ tracks: ['Bass'] });
    expect(engine.value(ctx, 'selection_tracks')).toEqual(['Bass']);
    expect([engine.value(ctx, 'selection_start'), engine.value(ctx, 'selection_stop')]).toEqual([W, 2 * W]);
    await luna.close();
  });
});

describe('timeline edits on the selection', () => {
  it('copies a range and pastes it at the selection start on another track', async () => {
    const { luna, session, vocal, bass, spans } = await withClips();
    await session.selectTimeline({ tracks: [vocal], startTick: W, stopTick: 2 * W });
    await session.context.copy();
    expect(await spans(vocal)).toEqual([[0, 4 * W]]);
    await session.selectTimeline({ tracks: [bass], startTick: 8 * W, stopTick: 8 * W });
    await session.context.paste();
    expect(await spans(bass)).toEqual([[8 * W, 9 * W]]);
    expect([session.context.selectionStart.value, session.context.selectionStop.value]).toEqual([8 * W, 9 * W]);
    await luna.close();
  });

  it('clears the range out of a clip, splitting it, and cut does the same after copying', async () => {
    const { luna, session, vocal, spans } = await withClips();
    await session.selectTimeline({ tracks: [vocal], startTick: W, stopTick: 2 * W });
    await session.context.cut();
    expect(await spans(vocal)).toEqual([
      [0, W],
      [2 * W, 4 * W],
    ]);
    expect(session.context.selectionStop.value).toBe(W); // collapsed to the start
    await session.context.paste();
    expect(await spans(vocal)).toEqual([
      [0, W],
      [W, 2 * W],
      [2 * W, 4 * W],
    ]);
    await luna.close();
  });

  it('duplicates the range right after itself and selects the copy', async () => {
    const { luna, session, vocal, spans } = await withClips();
    await session.selectTimeline({ tracks: [vocal], startTick: 0, stopTick: 4 * W });
    await session.context.duplicate();
    expect(await spans(vocal)).toEqual([
      [0, 4 * W],
      [4 * W, 8 * W],
    ]);
    expect([session.context.selectionStart.value, session.context.selectionStop.value]).toEqual([4 * W, 8 * W]);
    await luna.close();
  });

  it('selects all of the selected tracks\' clips, keeping the tracks', async () => {
    const { engine, luna, session, vocal, bass, spans } = await withClips();
    await session.insertClip({ trackUid: bass.id, sourceUid: 'src1', startTick: 6 * W, stopTick: 9 * W });
    await spans(bass);
    await session.selectTimeline({ tracks: [vocal], startTick: W, stopTick: W });
    await session.context.selectAll();
    await engine.settled();
    expect([session.context.selectionStart.value, session.context.selectionStop.value]).toEqual([0, 4 * W]);
    expect(session.context.selectionTracks.value).toEqual(['Vocal']);
    await session.selectTimeline({ tracks: [vocal, bass] });
    await session.context.selectAll();
    await engine.settled();
    expect([session.context.selectionStart.value, session.context.selectionStop.value]).toEqual([0, 9 * W]);
    await luna.close();
  });

  it('does nothing without a range, or with another focus', async () => {
    const { luna, session, vocal, spans } = await withClips();
    await session.selectTimeline({ tracks: [vocal], startTick: W, stopTick: W });
    await session.context.clear();
    expect(await spans(vocal)).toEqual([[0, 4 * W]]);
    await session.context.select({ startTick: W, stopTick: 2 * W, focus: 'tracks' });
    await session.context.cut();
    expect(await spans(vocal)).toEqual([[0, 4 * W]]);
    await luna.close();
  });
});
