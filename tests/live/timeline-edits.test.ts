/**
 * Live lane for timeline cut, copy, paste, clear and duplicate on a selection made with
 * `session.selectTimeline` (fact 150).
 *
 * Needs LUNA on 4718 with a session open and an audio track with an active playlist. It
 * uploads a file, edits past the end of the session, puts the user's selection back, and
 * removes its clips, the file and anything LUNA rendered for them; the undo entries remain.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const B = Luna.TICKS_PER_BEAT;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

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

describe.skipIf(!live)('live: timeline edits on a selection', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let track: Luna.Track;
  let lane: Luna.Playlist;
  let base = 0;
  let saved: Luna.SelectionSnapshot | undefined;
  let sourcesBefore = new Set<string>();

  /** Clips past `base`, as [start, stop] relative to it, in beats. */
  const spans = () =>
    lane.clips.items
      .filter((c) => (c.start.value ?? -1) >= base)
      .map((c) => [(c.start.value! - base) / B, (c.stop.value! - base) / B])
      .sort((a, b) => a[0]! - b[0]!);
  const expectSpans = (want: number[][], what: string) =>
    Luna.settle(() => JSON.stringify(spans()) === JSON.stringify(want), what, { timeoutMs: 5000, refresh: () => lane.clips.reload() }).catch(() => {
      expect(spans()).toEqual(want);
    });

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 10000 });
    session = await luna.session();
    await session.ready();
    for (const p of session.playlists.items) await p.clips.load();
    const found = session.visibleTracks.find((x) => x.trackType.value === 'audio' && session.playlistFor(x));
    if (!found) throw new Error('the open session needs an audio track with an active playlist');
    track = found;
    lane = session.playlistFor(track)!;
    const end = Math.max(session.transport.maxTick.value ?? 0, ...session.playlists.items.flatMap((p) => p.clips.items).map((x) => x.stop.value ?? 0));
    base = Math.ceil(end / B / 4) * 4 * B + 16 * B;
    saved = session.context.snapshot();
    await session.sources!.load();
    sourcesBefore = new Set(session.sources!.items.map((s) => s.id));
    const source = (await session.uploadFile({ bytes: noiseWav(12), name: 'sdk-timeline-edits.wav' })).id;
    const t = session.musical.timeline;
    const clip = await session.insertClip({ playlistUid: lane.id, sourceUid: source, startTick: base, stopTick: base + 8 * B, sourceStartNs: 0, sourceStopNs: Math.round((t.seconds(base + 8 * B) - t.seconds(base)) * 1e9) });
    await Luna.settle(() => lane.clips.byId(clip.id)?.stop.value !== undefined, 'clip');
  });

  afterAll(async () => {
    if (saved) await session.context.restore(saved).catch(() => undefined);
    for (const clip of [...(lane?.clips.items ?? [])]) if (clip.start.value !== undefined && clip.start.value >= base) await clip.delete().catch(() => undefined);
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

  it('selects the track, its playlist and the timeline focus', async () => {
    await session.selectTimeline({ tracks: [track], startTick: base + 2 * B, stopTick: base + 4 * B });
    await session.context.refreshSelection();
    expect(session.context.focus.value).toBe('timeline');
    expect(session.context.selectionTracks.value).toEqual([track.id]);
    expect(session.context.selectionPlaylists.value).toEqual([lane.id]);
  });

  it('cuts the range out, splitting the clip, and collapses the selection to its start', async () => {
    await session.selectTimeline({ tracks: [track], startTick: base + 2 * B, stopTick: base + 4 * B });
    await session.context.cut();
    await expectSpans([[0, 2], [4, 8]], 'cut');
    await session.context.refreshSelection();
    expect(session.context.selectionStart.value).toBe(base + 2 * B);
  });

  it('pastes at the selection start and selects what it pasted', async () => {
    await session.selectTimeline({ tracks: [track], startTick: base + 12 * B, stopTick: base + 12 * B });
    await session.context.paste();
    await expectSpans([[0, 2], [4, 8], [12, 14]], 'paste');
    await session.context.refreshSelection();
    expect([session.context.selectionStart.value, session.context.selectionStop.value]).toEqual([base + 12 * B, base + 14 * B]);
  });

  it('duplicates the range right after itself', async () => {
    await session.selectTimeline({ tracks: [track], startTick: base + 12 * B, stopTick: base + 14 * B });
    await session.context.duplicate();
    await expectSpans([[0, 2], [4, 8], [12, 14], [14, 16]], 'duplicate');
  });

  it('selects all of the track\'s clips', async () => {
    await session.selectTimeline({ tracks: [track], startTick: base + 5 * B, stopTick: base + 5 * B });
    await session.context.selectAll();
    await session.context.refreshSelection();
    // Everything on the track, so from its first clip (before base) to its last (base + 16 beats).
    expect(session.context.selectionStop.value).toBe(base + 16 * B);
    expect(session.context.selectionStart.value!).toBeLessThanOrEqual(base);
    expect(session.context.selectionTracks.value).toEqual([track.id]);
  });

  it('clears the range', async () => {
    await session.selectTimeline({ tracks: [track], startTick: base + 12 * B, stopTick: base + 16 * B });
    await session.context.clear();
    await expectSpans([[0, 2], [4, 8]], 'clear');
  });
});
