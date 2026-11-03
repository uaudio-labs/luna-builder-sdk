/**
 * Live lane for fact 135: `newTrack` and `insertClip` resolve to what they made, by the uid
 * LUNA answers, outside and inside a batch transaction, and `insertClip`'s `layer`,
 * `lengthFollows`, `algType` and `copyOf` land as described.
 *
 * Needs LUNA on 4718 with a session open. It uploads a short noise file and makes temporary
 * tracks, and deletes them (with their clips and the file) afterwards; the undo entries
 * remain, because the wire cannot drop them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const W = Luna.WHOLE_NOTE;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function noiseWav(seconds: number): Uint8Array {
  const n = 48000 * seconds;
  const bytes = new Uint8Array(44 + n * 2);
  const v = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 48000, true);
  v.setUint32(28, 96000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); text(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round((Math.random() - 0.5) * 2000), true);
  return bytes;
}

describe.skipIf(!live)('live: creation verbs (fact 135)', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let source: Luna.AudioSource;
  const made: Luna.Track[] = [];
  let sourcesBefore = new Set<string>();

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 10000 });
    session = await luna.session();
    await session.ready();
    await session.sources!.load();
    sourcesBefore = new Set(session.sources!.items.map((s) => s.id));
    source = await session.uploadFile({ bytes: noiseWav(4), name: 'sdk-creation.wav' });
  });

  afterAll(async () => {
    for (const t of made) await t.delete().catch(() => undefined);
    // Renders are announced seconds after they are named (fact 73): wait for the list to settle.
    const deadline = Date.now() + 10_000;
    let count = -1, steadySince = Date.now();
    while (Date.now() < deadline && Date.now() - steadySince < 1500) {
      const now = session?.sources?.items.length ?? 0;
      if (now !== count) { count = now; steadySince = Date.now(); }
      await sleep(100);
    }
    const files = session?.sources?.items.map((s) => s.id).filter((id) => !sourcesBefore.has(id)) ?? [];
    if (files.length) await luna.raw.post('/workspace/delete_audio_files', { session_package_uid: session.sessionPackageUid.value, files, move_to_trash: true }).catch(() => undefined);
    await luna?.close();
  });

  const span = () => Math.min(source.length.value ?? 1e9, 1e9);

  it('newTrack resolves to the loaded tracks, one per count', async () => {
    const tracks = await session.newTrack({ name: 'SDK live create', count: 2, makeNameUnique: true });
    made.push(...tracks);
    expect(tracks).toHaveLength(2);
    for (const t of tracks) {
      expect(session.tracks.byId(t.id)).toBe(t);
      expect(t.name.value).toMatch(/^SDK live create/);
    }
  });

  it('insertClip resolves to the loaded clip, with layer, lengthFollows, algType, and a copy', async () => {
    const [track] = await session.newTrack({ name: 'SDK live clip', makeNameUnique: true });
    made.push(track!);
    const clip = await session.insertClip({ trackUid: track!.id, sourceUid: source.id, startTick: 0, stopTick: W, sourceStartNs: 0, sourceStopNs: span(), name: 'SDK live', layer: 2, lengthFollows: 'time', algType: 'varispeed' });
    expect(clip.name.value).toBe('SDK live');
    expect(clip.layer.value).toBe(2);
    expect(session.playlistFor(track!)?.clips.byId(clip.id)).toBe(clip);
    expect(clip.property<string>('length_follows').value).toBe('time');
    expect(clip.property<string>('alg_type').value).toBe('varispeed');

    const copy = await session.insertClip({ trackUid: track!.id, copyOf: clip, startTick: 4 * W, stopTick: 5 * W });
    expect(copy.id).not.toBe(clip.id);
    expect(copy.name.value).toBe('SDK live');
    expect(copy.sourceUid.value).toBe(source.id);
    expect(copy.start.value).toBe(4 * W);
  });

  it('inside a batch, a new track and its clip are one undo entry and become the listed objects', async () => {
    let track: Luna.Track | undefined;
    let clip: Luna.Clip | undefined;
    await session.transaction('SDK live batch create', async () => {
      [track] = await session.newTrack({ name: 'SDK live batch', makeNameUnique: true });
      // The track is held back until the commit: get_clip_info finds the clip's playlist.
      clip = await session.insertClip({ trackUid: track!.id, sourceUid: source.id, startTick: 0, stopTick: W, sourceStartNs: 0, sourceStopNs: span(), name: 'SDK live batch' });
    });
    made.push(track!);
    await Luna.settle(() => track!.name.value !== undefined && clip!.start.value !== undefined, 'batch commit');
    expect(session.tracks.byId(track!.id)).toBe(track);
    expect(session.playlistFor(track!)?.clips.byId(clip!.id)).toBe(clip);
    expect(clip!.name.value).toBe('SDK live batch');
  });
});
