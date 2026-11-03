/**
 * Clip and fade editing (fact 117): move, copy, split, heal, mute, slip, fades, crossfades
 * and fade curves, each checked through the compiled clips a view draws from.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const B = Luna.TICKS_PER_BEAT;
/** A second of audio at 120 bpm is two beats. */
const SECOND_NS = 1e9;

async function lane() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Gtr'], name: 'Demo', packageUid: 'pkg1' });
  engine.addSource('pkg1', 'src1', { name: 'take.wav', lengthNs: 30 * SECOND_NS });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const playlist = session.playlistFor(session.tracks.byId('Gtr')!)!;
  await playlist.clips.load();
  await playlist.compiledClips.load();
  /** A clip whose source span matches its ticks at 120 bpm, starting `sourceStartS` into the file. */
  const insert = async (startBeat: number, stopBeat: number, sourceStartS = 0) => {
    const reply = { uid: (await session.insertClip({ playlistUid: playlist.id, sourceUid: 'src1', startTick: startBeat * B, stopTick: stopBeat * B, sourceStartNs: sourceStartS * SECOND_NS, sourceStopNs: (sourceStartS + (stopBeat - startBeat) / 2) * SECOND_NS })).id };
    await engine.settled();
    await playlist.clips.membersReady();
    return playlist.clips.byId(reply.uid)!;
  };
  const sync = async () => {
    await engine.settled();
    await luna.settled();
  };
  const seg = (clip: Luna.Clip) => playlist.compiledClips.ofClip(clip.id);
  return { engine, luna, session, playlist, insert, sync, seg };
}

describe('fades', () => {
  it('creates a fade-in and fade-out, then changes length and shape', async () => {
    const { engine, luna, insert, sync, seg } = await lane();
    const clip = await insert(0, 8);
    await clip.setFadeIn(B, { shape: 'linear' });
    await clip.setFadeOut(2 * B);
    await sync();
    expect(seg(clip)[0]!.fadeIn.value).toMatchObject({ start: 0, stop: B, shape: 'linear', crossfade: false, contributorClipUid: undefined });
    expect(seg(clip)[0]!.fadeOut.value).toMatchObject({ start: 6 * B, stop: 8 * B, shape: 'log' });
    // LUNA keeps an existing fade's shape on set_fade, so a new shape takes a second command.
    await clip.setFadeIn(B / 2, { shape: 'equal_power' });
    await sync();
    expect(seg(clip)[0]!.fadeIn.value).toMatchObject({ stop: B / 2, shape: 'equal_power' });
    const posted = engine.requests.filter((r) => r.path.endsWith('/change_fade_curvature'));
    expect(posted).toHaveLength(1);
    await luna.close();
  });

  it('removes one fade and leaves the others, and is a no-op without one', async () => {
    const { luna, insert, sync, seg } = await lane();
    const clip = await insert(0, 8);
    await clip.setFadeIn(B);
    await clip.setFadeOut(B);
    await clip.removeFadeIn();
    await sync();
    expect(seg(clip)[0]!.fadeIn.value).toBeUndefined();
    expect(seg(clip)[0]!.fadeOut.value).toBeDefined();
    await clip.removeFadeIn();
    await clip.removeFadeOut();
    await sync();
    expect(seg(clip)[0]!.fadeOut.value).toBeUndefined();
    await luna.close();
  });

  it('crossfades two butted clips, across, before or after the edit, and removes both halves', async () => {
    const { luna, insert, sync, seg } = await lane();
    const left = await insert(0, 4);
    const right = await insert(4, 8, 10);
    await left.setFadeIn(B);
    await right.setFadeOut(B);
    for (const [align, span] of [['center', [3.5, 4.5]], ['before', [3, 4]], ['after', [4, 5]]] as const) {
      await left.crossfade(right, B, { align });
      await sync();
      const [a] = seg(left);
      const [b] = seg(right);
      expect(a!.fadeOut.value).toMatchObject({ start: span[0] * B, stop: span[1] * B, crossfade: true, contributorClipUid: right.id });
      expect(b!.fadeIn.value).toMatchObject({ start: span[0] * B, stop: span[1] * B, crossfade: true, contributorClipUid: left.id });
      expect(a!.fullStop.value).toBe(Math.max(4, span[1]) * B);
      await left.removeCrossfade(right);
      await sync();
      expect(seg(left)[0]!.fadeOut.value).toBeUndefined();
      expect(seg(right)[0]!.fadeIn.value).toBeUndefined();
      // The plain fades at the outer edges stay.
      expect(seg(left)[0]!.fadeIn.value).toBeDefined();
      expect(seg(right)[0]!.fadeOut.value).toBeDefined();
    }
    await luna.close();
  });

  it('sets fade curves absolutely, for several fades at once', async () => {
    const { luna, session, insert, sync, seg } = await lane();
    const clip = await insert(0, 8);
    await clip.setFadeIn(B);
    await clip.setFadeOut(B);
    await sync();
    const [s] = seg(clip);
    await session.setFadeCurve([s!.fadeIn.value], { curvature: -0.5 });
    await sync();
    await session.setFadeCurve([s!.fadeIn.value, s!.fadeOut.value], { shape: 'equal_power', curvature: 0.25 });
    await sync();
    expect([s!.fadeIn.value!.curvature, s!.fadeOut.value!.curvature]).toEqual([0.25, 0.25]);
    expect(s!.fadeOut.value!.shape).toBe('equal_power');
    await session.setFadeCurve([s!.fadeIn.value], { reset: true });
    await sync();
    expect(s!.fadeIn.value).toMatchObject({ shape: 'log', curvature: 0 });
    await luna.close();
  });

  it('fades every clip in a range, crossfading butted ones, and deletes them again', async () => {
    const { luna, playlist, insert, sync } = await lane();
    await insert(0, 4);
    await insert(4, 8, 10);
    await insert(12, 16, 20);
    await playlist.addFades({ startTick: 0, stopTick: 16 * B, lengthNs: 250_000_000, shape: 'linear' });
    await sync();
    const segs = playlist.compiledClips.inOrder();
    expect(segs.every((s) => s.fadeIn.value && s.fadeOut.value)).toBe(true);
    expect(segs[0]!.fadeOut.value).toMatchObject({ crossfade: true, start: 3.75 * B, stop: 4.25 * B });
    await playlist.deleteFades(0, 16 * B);
    await sync();
    expect(playlist.compiledClips.items.every((s) => !s.fadeIn.value && !s.fadeOut.value)).toBe(true);
    await luna.close();
  });

  it('refuses what LUNA would refuse or get wrong', async () => {
    const { luna, session, playlist, insert } = await lane();
    const a = await insert(0, 4);
    const b = await insert(6, 8);
    await expect(a.setFadeIn(0)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(a.setFadeIn(5 * B)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(a.setFadeOut(B, { shape: 'cosine' as Luna.FadeShape })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(a.crossfade(b, B)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.setFadeCurve([], { curvature: 0 })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.setFadeCurve([{ uid: 'f' }], { curvature: 2 })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(playlist.addFades({ startTick: 0, stopTick: B, lengthNs: 0 })).rejects.toMatchObject({ code: 'out_of_range' });
    await luna.close();
  });
});

describe('clip edits', () => {
  it('moves, copies and duplicates a clip, and puts the selection back', async () => {
    const { engine, luna, session, playlist, insert, sync } = await lane();
    const clip = await insert(0, 4);
    await session.context.select({ startTick: 40 * B, stopTick: 44 * B });
    await clip.move(8 * B);
    expect([clip.start.value, clip.stop.value]).toEqual([8 * B, 12 * B]);
    const copy = await clip.move(20 * B, { copy: true });
    expect(copy.id).not.toBe(clip.id);
    expect([copy.start.value, copy.stop.value]).toEqual([20 * B, 24 * B]);
    const again = await clip.duplicate();
    expect([again.start.value, again.stop.value]).toEqual([12 * B, 16 * B]);
    expect(playlist.clips.items).toHaveLength(3);
    await sync();
    expect([engine.value('/sessions/abc/contexts/main', 'selection_start'), engine.value('/sessions/abc/contexts/main', 'selection_stop')]).toEqual([40 * B, 44 * B]);
    await luna.close();
  });

  it('splits a clip into pieces that carry on through the source', async () => {
    const { luna, insert } = await lane();
    const clip = await insert(0, 8, 1);
    await clip.setFadeOut(B);
    const pieces = await clip.split([2 * B, 6 * B]);
    expect(pieces.map((p) => [p.start.value! / B, p.stop.value! / B])).toEqual([[0, 2], [2, 6], [6, 8]]);
    expect(pieces.map((p) => p.sourceStart.value! / SECOND_NS)).toEqual([1, 2, 4]);
    expect(pieces[0]).toBe(clip);
    await expect(clip.split(9 * B)).rejects.toMatchObject({ code: 'out_of_range' });
    await luna.close();
  });

  it('heals split pieces, including a clip that starts exactly at stopTick', async () => {
    const { luna, playlist, insert, sync } = await lane();
    const clip = await insert(0, 8);
    await clip.split([2 * B, 4 * B]);
    await playlist.heal(B, 3 * B);
    await sync();
    expect(playlist.clips.items.map((c) => [c.start.value! / B, c.stop.value! / B])).toEqual([[0, 4], [4, 8]]);
    // stopTick is inclusive: the piece starting at 4 beats is joined too.
    await playlist.heal(B, 4 * B);
    await sync();
    expect(playlist.clips.items.map((c) => [c.start.value! / B, c.stop.value! / B])).toEqual([[0, 8]]);
    await luna.close();
  });

  it('mutes and unmutes', async () => {
    const { engine, luna, insert } = await lane();
    const clip = await insert(0, 4);
    await clip.setMuted(true);
    await engine.settled();
    expect(engine.value(clip.path, 'mute')).toBe(true);
    expect(clip.muted.value).toBe(true);
    await clip.setMuted(false);
    expect(clip.muted.value).toBe(false);
    await luna.close();
  });

  it('slips the audio, later and earlier, in engine samples', async () => {
    const { engine, luna, insert } = await lane();
    const clip = await insert(0, 4, 5);
    await clip.slip(10_000_000);
    expect(clip.sourceStart.value).toBe(5 * SECOND_NS - 10_000_000);
    await clip.slip(-20_000_000);
    expect(clip.sourceStart.value).toBe(5 * SECOND_NS + 10_000_000);
    expect(JSON.parse(String((engine.requests.filter((r) => r.path.endsWith('/nudge')).at(-1)!.data as { nudge_settings: string }).nudge_settings))).toEqual({ mode: 'samples', samples: 960, operation: 'content_left' });
    await luna.close();
  });

  it('refuses to slip or batch-fade a lane that is not the active playlist', async () => {
    const { engine, luna, session, playlist, insert } = await lane();
    const clip = await insert(0, 4, 5);
    engine.setValue('/sessions/abc/tracks/Gtr', 'playlist_uid', 'elsewhere');
    await engine.settled();
    await expect(clip.slip(1_000_000)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(playlist.addFades({ startTick: 0, stopTick: B, lengthNs: 1 })).rejects.toMatchObject({ code: 'unavailable' });
    expect(session.uid).toBe('abc');
    await luna.close();
  });

  it('splits a whole lane', async () => {
    const { luna, playlist, insert, sync } = await lane();
    await insert(0, 4);
    await insert(4, 8, 10);
    await playlist.split([2 * B, 6 * B]);
    await sync();
    expect(playlist.compiledClips.inOrder().map((c) => [c.start.value! / B, c.stop.value! / B])).toEqual([[0, 2], [2, 4], [4, 6], [6, 8]]);
    await luna.close();
  });
});

describe('moving what shows of a clip', () => {
  /** A lane with `under` and clips on top of it on layer 1. Spans are [beat, beat]. */
  async function overlap(under: [number, number], tops: [number, number][]) {
    const env = await lane();
    const u = await env.insert(under[0], under[1]);
    const t: Luna.Clip[] = [];
    for (const [a, b] of tops) {
      const c = await env.insert(a, b, 20);
      env.engine.setValue(c.path, 'layer', 1);
      t.push(c);
    }
    await env.sync();
    const spans = () => env.playlist.clips.items.map((c) => [c.id === u.id ? 'under' : t.some((x) => x.id === c.id) ? 'top' : 'new', c.start.value! / B, c.stop.value! / B, c.sourceStart.value! / SECOND_NS]).sort((a, b) => (a[1] as number) - (b[1] as number));
    return { ...env, u, t, spans };
  }

  it('splits the clip when it shows again past the clip on top', async () => {
    const { luna, u, seg, spans } = await overlap([0, 8], [[2, 4]]);
    const [first] = seg(u);
    const moved = await first!.move(12 * B);
    expect([moved.start.value! / B, moved.stop.value! / B]).toEqual([12, 14]);
    // The piece left as a new clip; the clip kept the rest, hidden part included; the top clip stayed.
    expect(spans()).toEqual([['under', 2, 8, 1], ['top', 2, 4, 20], ['new', 12, 14, 0]]);
    expect(moved.clipUid.value).not.toBe(u.id);
    await luna.close();
  });

  it('trims the clip when the rest is hidden under the clip on top', async () => {
    const { luna, u, seg, spans } = await overlap([0, 6], [[4, 8]]);
    const moved = await seg(u)[0]!.move(12 * B);
    expect(moved.clipUid.value).toBe(u.id);
    expect(spans()).toEqual([['top', 4, 8, 20], ['under', 12, 16, 0]]);
    await luna.close();
  });

  it('splits at both edges when a middle piece moves', async () => {
    const { luna, u, seg, spans } = await overlap([0, 12], [[2, 4], [8, 10]]);
    const middle = seg(u)[1]!;
    expect([middle.start.value! / B, middle.stop.value! / B]).toEqual([4, 8]);
    await middle.move(20 * B);
    expect(spans()).toEqual([['under', 0, 4, 0], ['top', 2, 4, 20], ['top', 8, 10, 20], ['new', 8, 12, 4], ['new', 20, 24, 2]]);
    await luna.close();
  });

  it('copies what shows and leaves the clip alone', async () => {
    const { luna, u, seg, spans } = await overlap([0, 8], [[2, 4]]);
    const copy = await seg(u)[1]!.move(16 * B, { copy: true });
    expect([copy.start.value! / B, copy.stop.value! / B]).toEqual([16, 20]);
    expect(spans()).toEqual([['under', 0, 8, 0], ['top', 2, 4, 20], ['new', 16, 20, 2]]);
    await luna.close();
  });
});

describe('crossfading segments', () => {
  it('crossfades both edits of a clip on top over the middle of another, from the edits', async () => {
    const { engine, luna, playlist, insert, sync, seg } = await lane();
    const under = await insert(0, 16);
    const top = await insert(6, 10, 15);
    engine.setValue(top.path, 'layer', 1);
    await sync();
    const [a1, a2] = seg(under);
    const [b] = seg(top);
    await a1!.crossfade(b!, B);
    await b!.crossfade(a2!, B, { align: 'before' });
    await sync();
    // The same numbers LUNA gave on the live probe (fact 117).
    expect(a1!.fadeOut.value).toMatchObject({ start: 5.5 * B, stop: 6.5 * B, crossfade: true, contributorClipUid: top.id });
    expect(b!.fadeIn.value).toMatchObject({ start: 5.5 * B, stop: 6.5 * B, crossfade: true, contributorClipUid: under.id });
    expect(b!.fadeOut.value).toMatchObject({ start: 9 * B, stop: 10 * B, crossfade: true, contributorClipUid: under.id });
    expect(a2!.fadeIn.value).toMatchObject({ start: 9 * B, stop: 10 * B, crossfade: true, contributorClipUid: top.id });
    expect([a1!.fullStop.value, b!.fullStart.value, a2!.fullStart.value]).toEqual([6.5 * B, 5.5 * B, 9 * B]);
    // Removing one leaves the other.
    await a1!.removeCrossfade(b!);
    await sync();
    expect([a1!.fadeOut.value, b!.fadeIn.value]).toEqual([undefined, undefined]);
    expect(b!.fadeOut.value?.crossfade).toBe(true);
    await luna.close();
  });

  it('crossfades butted clips the same way, and changes the length', async () => {
    const { luna, insert, sync, seg } = await lane();
    const left = await insert(0, 4);
    const right = await insert(4, 8, 10);
    await sync();
    const [a] = seg(left);
    const [b] = seg(right);
    await a!.crossfade(b!, B, { align: 'after' });
    await a!.crossfade(b!, 2 * B, { align: 'after' });
    await sync();
    expect(b!.fadeIn.value).toMatchObject({ start: 4 * B, stop: 6 * B });
    await luna.close();
  });

  it('refuses segments that do not meet, or are not audio', async () => {
    const { engine, luna, insert, sync, seg, playlist } = await lane();
    const a = await insert(0, 4);
    const b = await insert(6, 8, 10);
    const uid = engine.addMidiClip('abc', 'Gtr', { startTick: 4 * B, stopTick: 6 * B });
    await sync();
    await playlist.clips.membersReady();
    const midi = playlist.compiledClips.ofClip(uid)[0]!;
    await expect(seg(a)[0]!.crossfade(seg(b)[0]!, B)).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(seg(a)[0]!.crossfade(midi, B)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(seg(a)[0]!.crossfade(midi, 0)).rejects.toMatchObject({ code: 'unavailable' });
    await luna.close();
  });
});

describe('fades on MIDI clips', () => {
  it('refuses them, since LUNA fades audio clips only', async () => {
    const { engine, luna, playlist, insert, sync } = await lane();
    const audio = await insert(0, 4);
    const uid = engine.addMidiClip('abc', 'Gtr', { startTick: 4 * B, stopTick: 8 * B });
    await sync();
    await playlist.clips.membersReady();
    const midi = playlist.clips.byId(uid)!;
    expect(midi.clipType.value).toBe('midi');
    await expect(midi.setFadeIn(B)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(midi.setFadeOut(B)).rejects.toMatchObject({ code: 'unavailable' });
    await expect(audio.crossfade(midi, B)).rejects.toMatchObject({ code: 'unavailable' });
    expect(engine.requests.some((r) => r.path.endsWith('/set_fade'))).toBe(false);
    await luna.close();
  });
});

describe('slip limits', () => {
  it('refuses to slip later than the source allows', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Gtr'], name: 'Demo', packageUid: 'pkg1' });
    engine.addSource('pkg1', 'src1', { name: 'take.wav', lengthNs: 10e9 });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const lane = session.playlistFor(session.tracks.byId('Gtr')!)!;
    await lane.clips.load();
    await session.insertClip({ playlistUid: lane.id, sourceUid: 'src1', startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT, sourceStartNs: 5_000_000, sourceStopNs: 2_005_000_000 });
    await engine.settled();
    await lane.clips.membersReady();
    const clip = lane.clips.items[0]!;
    await expect(clip.slip(10_000_000)).rejects.toMatchObject({ code: 'out_of_range' });
    await clip.slip(5_000_000);
    expect(clip.sourceStart.value).toBe(0);
    await luna.close();
  });
});
