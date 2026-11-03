import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

// newTrack and insertClip resolve to what they made, by the uid LUNA answers (fact 135).

async function connected(tracks: string[] = ['Vocal']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo', packageUid: 'pkg_abc' });
  engine.addSource('pkg_abc', 'src1', { name: 'take.wav', stemFormat: 'stereo', lengthNs: 2_000_000_000 });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

const posts = (engine: Luna.MockEngine, command: string) => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith(`/${command}`));

describe('Session.newTrack', () => {
  it('resolves to the new track, listed and loaded', async () => {
    const { session } = await connected();
    const tracks = await session.newTrack({ name: 'Bass', stemFormat: 'mono' });
    expect(tracks).toHaveLength(1);
    const [bass] = tracks;
    expect(bass).toBeInstanceOf(Luna.Track);
    expect(session.tracks.byId(bass!.id)).toBe(bass);
    expect(bass!.name.value).toBe('Bass');
    expect(bass!.stemFormat.value).toBe('mono');
  });

  it('resolves to every track `count` makes, in order', async () => {
    const { session } = await connected();
    const tracks = await session.newTrack({ name: 'Pad', count: 3 });
    expect(tracks.map((t) => t.name.value)).toEqual(['Pad', 'Pad', 'Pad']);
    expect(new Set(tracks.map((t) => t.id)).size).toBe(3);
    for (const t of tracks) expect(session.tracks.byId(t.id)).toBe(t);
  });

  it('rejects with invalid_response when LUNA answers no uid', async () => {
    const { engine, session } = await connected();
    engine.overrideCommand('/sessions/abc/new_track', () => null);
    await expect(session.newTrack({ name: 'X' })).rejects.toMatchObject({ code: 'invalid_response' });
  });
});

describe('Session.insertClip', () => {
  it('resolves to the new clip, listed and loaded', async () => {
    const { session } = await connected();
    const lane = session.playlistFor(session.tracks.byId('Vocal')!)!;
    const clip = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, sourceStopNs: 2_000_000_000, name: 'Take' });
    expect(clip).toBeInstanceOf(Luna.Clip);
    expect(lane.clips.byId(clip.id)).toBe(clip);
    expect(clip.name.value).toBe('Take');
    expect(clip.stop.value).toBe(Luna.WHOLE_NOTE);
  });

  it('passes layer, lengthFollows and algType through verbatim', async () => {
    const { engine, session } = await connected();
    const clip = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, layer: 3, lengthFollows: 'time', algType: 'varispeed' });
    expect(posts(engine, 'insert_clip').at(-1)?.data).toMatchObject({ layer: 3, length_follows: 'time', alg_type: 'varispeed' });
    expect(clip.layer.value).toBe(3);
  });

  it('puts a clip above the ones it overlaps when no layer is given', async () => {
    const { session } = await connected();
    const first = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE });
    const second = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: Luna.WHOLE_NOTE / 2, stopTick: 2 * Luna.WHOLE_NOTE });
    expect(second.layer.value).toBe((first.layer.value ?? 0) + 1);
  });

  it('copies a clip with copyOf, taking its source, offsets and name unless given', async () => {
    const { engine, session } = await connected();
    const slice = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, sourceStartNs: 250_000_000, sourceStopNs: 1_250_000_000, name: 'Slice' });
    await slice.gain.set(-6);
    await engine.settled();
    const again = await session.insertClip({ trackUid: 'Vocal', copyOf: slice, startTick: 4 * Luna.WHOLE_NOTE, stopTick: 5 * Luna.WHOLE_NOTE });
    expect(posts(engine, 'insert_clip').at(-1)?.data).toMatchObject({ clip_uid: slice.id, source_uid: 'src1', source_start: 250_000_000, source_stop: 1_250_000_000, name: 'Slice' });
    expect(again.id).not.toBe(slice.id);
    expect(again.start.value).toBe(4 * Luna.WHOLE_NOTE);
    expect(again.name.value).toBe('Slice');
    expect(again.gain.value).toBe(-6);
    expect(again.sourceStart.value).toBe(250_000_000);

    const renamed = await session.insertClip({ trackUid: 'Vocal', copyOf: slice, startTick: 8 * Luna.WHOLE_NOTE, stopTick: 9 * Luna.WHOLE_NOTE, name: 'Fill' });
    expect(renamed.name.value).toBe('Fill');
  });

  it('still refuses a clip with no source (fact 112)', async () => {
    const { session } = await connected();
    await expect(session.insertClip({ trackUid: 'Vocal', startTick: 0, stopTick: Luna.WHOLE_NOTE })).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
  });
});

describe('creation inside a batch transaction', () => {
  it('hands back the track and clip without waiting, the same objects the session lists after the commit', async () => {
    const { engine, luna, session } = await connected();
    let track: Luna.Track | undefined;
    let clip: Luna.Clip | undefined;
    await session.transaction('Add loop', async () => {
      const before = engine.requests.length;
      [track] = await session.newTrack({ name: 'Loop', stemFormat: 'stereo' });
      clip = await session.insertClip({ trackUid: track!.id, sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, name: 'Loop' });
      // No settle on the edits showing: LUNA holds the pushes until the commit (fact 74).
      // The new track's playlist comes from get_clip_info, which reads the session database.
      const sent = engine.requests.slice(before).filter((r) => r.verb === 'post').map((r) => `${r.verb} ${r.path.split('/').at(-1)}`);
      expect(sent).toEqual(['post new_track', 'post insert_clip', 'post get_clip_info']);
      expect(track!.id).toBeTruthy();
      expect(clip!.id).toBeTruthy();
    });
    expect(engine.transactions).toEqual(['begin', 'commit']);
    await engine.settled();
    await luna.settled();
    await session.tracks.membersReady();
    expect(session.tracks.byId(track!.id)).toBe(track);
    expect(track!.name.value).toBe('Loop');
    const lane = session.playlistFor(track!)!;
    await lane.clips.load();
    await lane.clips.membersReady();
    expect(lane.clips.byId(clip!.id)).toBe(clip);
    expect(clip!.name.value).toBe('Loop');
  });
});
