/**
 * Live lane for clip and fade editing (fact 117), checked through the compiled clips LUNA
 * publishes (fact 116).
 *
 * Needs LUNA on 4718 with a session open and an audio track with an active playlist, on a
 * LUNA that reports fades on compiled clips. It uploads a file, edits past the end of the
 * session, and removes its clips, the file and anything LUNA rendered for them; the undo
 * entries remain.
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

describe.skipIf(!live)('live: clip and fade editing', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let lane: Luna.Playlist;
  let t: Luna.Timeline;
  let source = '';
  let base = 0;
  let sourcesBefore = new Set<string>();
  let a: Luna.Clip;
  let c: Luna.Clip;

  const wait = (what: string, done: () => boolean) => Luna.settle(done, what, { timeoutMs: 5000 });
  const seg = (clip: Luna.Clip) => lane.compiledClips.ofClip(clip.id)[0];
  const insert = async (startTick: number, stopTick: number, sourceStartNs: number, name: string): Promise<Luna.Clip> => {
    const sourceStopNs = sourceStartNs + Math.round((t.seconds(stopTick) - t.seconds(startTick)) * 1e9);
    const reply = (await session.insertClip({ playlistUid: lane.id, sourceUid: source, startTick, stopTick, sourceStartNs, sourceStopNs, name })) as { uid: string };
    await wait(`clip ${name}`, () => lane.clips.byId(reply.uid)?.stop.value !== undefined);
    return lane.clips.byId(reply.uid)!;
  };

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 10000 });
    session = await luna.session();
    await session.ready();
    await session.musical.ready();
    t = session.musical.timeline;
    for (const p of session.playlists.items) await p.clips.load();
    const track = session.visibleTracks.find((x) => x.trackType.value === 'audio' && session.playlistFor(x));
    if (!track) throw new Error('the open session needs an audio track with an active playlist');
    lane = session.playlistFor(track)!;
    await lane.compiledClips.load();
    const end = Math.max(session.transport.maxTick.value ?? 0, ...session.playlists.items.flatMap((p) => p.clips.items).map((x) => x.stop.value ?? 0));
    base = Math.ceil(end / B / 4) * 4 * B + 16 * B;
    await session.sources!.load();
    sourcesBefore = new Set(session.sources!.items.map((s) => s.id));
    source = (await session.uploadFile({ bytes: noiseWav(12), name: 'sdk-clip-editing.wav' })).id;
    a = await insert(base, base + 4 * B, 1e9, 'SDK A');
    c = await insert(base + 4 * B, base + 8 * B, 6e9, 'SDK C');
    await wait('segments', () => seg(a) !== undefined && seg(c) !== undefined);
    if (!seg(a)!.reportsFades.value) throw new Error('this LUNA does not report fades on compiled clips');
  });

  afterAll(async () => {
    for (const clip of [...(lane?.clips.items ?? [])]) if (clip.start.value !== undefined && clip.start.value >= base) await clip.delete().catch(() => undefined);
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

  it('fades in and out, and changes a fade\'s length and shape', async () => {
    await a.setFadeIn(B, { shape: 'linear' });
    await wait('fade in', () => seg(a)?.fadeIn.value?.stop === base + B && seg(a)!.fadeIn.value!.shape === 'linear');
    await a.setFadeIn(B / 2, { shape: 'equal_power' });
    await wait('fade in changed', () => seg(a)?.fadeIn.value?.stop === base + B / 2 && seg(a)!.fadeIn.value!.shape === 'equal_power');
    await c.setFadeOut(B);
    await wait('fade out', () => seg(c)?.fadeOut.value?.start === base + 7 * B && seg(c)!.fadeOut.value!.shape === 'log');
  });

  it('crossfades in each alignment and removes both halves', async () => {
    for (const [align, from, to] of [['center', -B / 2, B / 2], ['before', -B, 0], ['after', 0, B]] as const) {
      await a.crossfade(c, B, { align });
      const edge = base + 4 * B;
      await wait(`crossfade ${align}`, () => seg(a)?.fadeOut.value?.start === edge + from && seg(a)!.fadeOut.value!.stop === edge + to && seg(c)?.fadeIn.value?.contributorClipUid === a.id);
      expect(seg(a)!.fadeOut.value!.crossfade).toBe(true);
      await a.removeCrossfade(c);
      await wait(`no crossfade ${align}`, () => !seg(a)?.fadeOut.value && !seg(c)?.fadeIn.value);
      expect(seg(a)!.fadeIn.value).toBeDefined();
      expect(seg(c)!.fadeOut.value).toBeDefined();
    }
  });

  it('sets fade curves and removes plain fades', async () => {
    await session.setFadeCurve([seg(a)!.fadeIn.value, seg(c)!.fadeOut.value], { shape: 'linear', curvature: 0.4 });
    await wait('curves', () => seg(a)?.fadeIn.value?.shape === 'linear' && Math.abs(seg(a)!.fadeIn.value!.curvature - 0.4) < 1e-6 && Math.abs(seg(c)!.fadeOut.value!.curvature - 0.4) < 1e-6);
    await a.removeFadeIn();
    await c.removeFadeOut();
    await wait('no fades', () => !seg(a)?.fadeIn.value && !seg(c)?.fadeOut.value);
    await a.removeFadeIn();
  });

  it('mutes, splits and heals', async () => {
    await a.setMuted(true);
    const read = (await luna.raw.get(a.path, { flatvalue: true })) as { properties?: { mute?: unknown } };
    expect(read.properties?.mute).toBe(true);
    await a.setMuted(false);
    const pieces = await a.split(base + 2 * B);
    expect(pieces.map((p) => [p.start.value, p.stop.value])).toEqual([[base, base + 2 * B], [base + 2 * B, base + 4 * B]]);
    await lane.heal(base + B, base + 3 * B);
    await wait('healed', () => a.stop.value === base + 4 * B && lane.clips.byId(pieces[1]!.id) === undefined);
  });

  it('moves, copies and duplicates', async () => {
    await c.move(base + 12 * B);
    expect([c.start.value, c.stop.value]).toEqual([base + 12 * B, base + 16 * B]);
    const dup = await c.duplicate();
    expect([dup.start.value, dup.stop.value]).toEqual([base + 16 * B, base + 20 * B]);
    const copy = await a.move(base + 24 * B, { copy: true });
    expect(copy.start.value).toBe(base + 24 * B);
  });

  it('slips the audio both ways', async () => {
    const from = c.sourceStart.value!;
    await c.slip(10_000_000);
    expect(Math.abs(from - c.sourceStart.value! - 10_000_000)).toBeLessThan(100_000);
    await c.slip(-10_000_000);
    expect(Math.abs(c.sourceStart.value! - from)).toBeLessThan(100_000);
  });

  it('fades a range in one go and deletes the fades again', async () => {
    const end = base + 32 * B;
    await lane.addFades({ startTick: base, stopTick: end, lengthNs: 20_000_000, shape: 'linear' });
    const ours = () => lane.compiledClips.inOrder().filter((s) => (s.start.value ?? 0) >= base);
    await wait('batch fades', () => ours().length > 0 && ours().every((s) => s.fadeIn.value && s.fadeOut.value));
    await lane.deleteFades(base, end);
    await wait('fades gone', () => ours().every((s) => !s.fadeIn.value && !s.fadeOut.value));
  });
});
