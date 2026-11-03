/**
 * Live lane for compiled clips (fact 116): the opt-in, the split an overlap makes, and the
 * fade and crossfade properties as LUNA applies them.
 *
 * Needs LUNA on 4718 with a session open and an audio track with an active playlist. It
 * uploads a short file, edits past the end of the session, and removes the clips, the file and
 * any file LUNA rendered for them afterwards; the undo entries remain. On a LUNA that does not report fades it checks the
 * segments and says it skipped the fade checks.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const B = Luna.TICKS_PER_BEAT;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
async function until(what: string, condition: () => boolean, ms = 8000): Promise<void> {
  const deadline = Date.now() + ms;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

/** A mono 16-bit 48 kHz WAV of low noise, `seconds` long. */
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

describe.skipIf(!live)('live: compiled clips', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let lane: Luna.Playlist;
  let trackUid = '';
  let sourceUid = '';
  let sourcesBefore = new Set<string>();
  const clips: string[] = [];
  let base = 0;
  let t: Luna.Timeline;

  const insert = async (startTick: number, stopTick: number, sourceStartNs: number, name: string): Promise<string> => {
    const sourceStopNs = sourceStartNs + (t.seconds(stopTick) - t.seconds(startTick)) * 1e9;
    const reply = { uid: (await session.insertClip({ playlistUid: lane.id, sourceUid, startTick, stopTick, sourceStartNs, sourceStopNs: Math.round(sourceStopNs), name })).id };
    clips.push(reply.uid);
    await until(`clip ${name}`, () => lane.clips.byId(reply.uid)?.stop.value !== undefined);
    return reply.uid;
  };
  const segmentsOf = (uid: string) => lane.compiledClips.ofClip(uid).map((c) => [c.start.value, c.stop.value]);

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.ready();
    await session.musical.ready();
    t = session.musical.timeline;
    for (const p of session.playlists.items) await p.clips.load();
    const track = session.visibleTracks.find((c) => c.trackType.value === 'audio' && session.playlistFor(c));
    if (!track) throw new Error('the open session needs an audio track with an active playlist');
    trackUid = track.id;
    lane = session.playlistFor(track)!;
    const end = Math.max(session.transport.maxTick.value ?? 0, ...session.playlists.items.flatMap((p) => p.clips.items).map((c) => c.stop.value ?? 0));
    base = Math.ceil(end / B / 4) * 4 * B + 16 * B;
    await session.sources!.load();
    sourcesBefore = new Set(session.sources!.items.map((s) => s.id));
    sourceUid = (await session.uploadFile({ bytes: noiseWav(8), name: 'sdk-compiled-clips.wav' })).id;
    await lane.compiledClips.load();
  });

  afterAll(async () => {
    for (const uid of clips) await lane?.clips.byId(uid)?.delete().catch(() => undefined);
    // The upload and anything LUNA rendered for these clips: every source that was not there
    // before. Renders are announced seconds after they are named (fact 73), so wait for the
    // list to stop growing first.
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

  it('publishes one segment per clip, and an overlap on top splits the clip beneath', async () => {
    const under = await insert(base, base + 8 * B, 0, 'SDK under');
    await until('the under segment', () => segmentsOf(under).length === 1);
    expect(segmentsOf(under)).toEqual([[base, base + 8 * B]]);
    const over = await insert(base + 2 * B, base + 4 * B, 0, 'SDK over');
    await lane.clips.byId(over)!.bringToFront();
    await until('the split', () => segmentsOf(under).length === 2);
    expect(segmentsOf(under)).toEqual([[base, base + 2 * B], [base + 4 * B, base + 8 * B]]);
    expect(segmentsOf(over)).toEqual([[base + 2 * B, base + 4 * B]]);
    // The second piece's source range starts where the clip has played to (fact 116).
    const piece = lane.compiledClips.ofClip(under)[1]!;
    expect(Math.abs(piece.sourceStart.value! - (t.seconds(base + 4 * B) - t.seconds(base)) * 1e9)).toBeLessThan(1e6);
    for (const uid of [over, under]) await lane.clips.byId(uid)!.delete();
    await until('the segments to go', () => segmentsOf(under).length === 0 && segmentsOf(over).length === 0);
  });

  it('reports fades, and a crossfade from both sides', async (ctx) => {
    const left = await insert(base + 16 * B, base + 20 * B, 0, 'SDK left');
    const right = await insert(base + 20 * B, base + 24 * B, 1e9, 'SDK right');
    await until('both segments', () => segmentsOf(left).length === 1 && segmentsOf(right).length === 1);
    const [a] = lane.compiledClips.ofClip(left);
    const [b] = lane.compiledClips.ofClip(right);
    if (!a!.reportsFades.value) {
      console.warn('this LUNA does not report fades on compiled clips: fade checks skipped');
      ctx.skip();
    }
    expect(a!.fadeIn.value).toBeUndefined();
    await luna.raw.post(`${session.path}/contexts/main/commands/batch_fades`, { session_uid: session.uid, context_type: 'main', track_uid: [trackUid], start: base + 16 * B, stop: base + 24 * B, length: 50_000_000 });
    await until('the crossfade', () => a!.fadeOut.value?.crossfade === true && b!.fadeIn.value?.crossfade === true);
    expect(a!.fadeOut.value!.contributorClipUid).toBe(right);
    expect(b!.fadeIn.value!.contributorClipUid).toBe(left);
    expect(a!.fullStop.value!).toBeGreaterThan(a!.stop.value!);
    expect(b!.fullStart.value!).toBeLessThan(b!.start.value!);
    // The outer edges get plain fades.
    expect(a!.fadeIn.value).toMatchObject({ crossfade: false, contributorClipUid: undefined });
    expect(b!.fadeOut.value).toMatchObject({ crossfade: false, contributorClipUid: undefined });
    expect(a!.fadeIn.value!.start).toBe(a!.start.value);
    expect(['linear', 'equal_power', 'log']).toContain(a!.fadeOut.value!.shape);
  });
});
