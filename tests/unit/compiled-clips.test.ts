/**
 * Compiled clips (fact 116): what a playlist plays once overlaps are resolved by layer, the
 * opt-in that makes LUNA publish them, their fades, and placing a segment's audio.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const BEAT = Luna.TICKS_PER_BEAT;
/** A second of audio at 120 bpm is two beats. */
const SECOND_NS = 1e9;

async function lane(options: { compiledClipFades?: boolean } = {}) {
  const engine = new Luna.MockEngine(options);
  engine.addSession('abc', { tracks: ['Gtr'], name: 'Demo', packageUid: 'pkg1' });
  engine.addSource('pkg1', 'src1', { name: 'take.wav', lengthNs: 10 * SECOND_NS });
  engine.addSource('pkg1', 'rend1', { name: 'stretched.wav', lengthNs: 3 * SECOND_NS });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const playlist = session.playlistFor(session.tracks.byId('Gtr')!)!;
  await playlist.clips.load();
  const insert = async (startBeat: number, stopBeat: number, sourceStartNs = 0) => {
    const reply = (await session.insertClip({ trackUid: 'Gtr', sourceUid: 'src1', startTick: startBeat * BEAT, stopTick: stopBeat * BEAT, sourceStartNs, sourceStopNs: sourceStartNs + ((stopBeat - startBeat) / 2) * SECOND_NS })) as { uid: string };
    await engine.settled();
    await playlist.clips.membersReady();
    return reply.uid;
  };
  return { engine, luna, session, playlist, insert };
}

const spans = (playlist: Luna.Playlist) => playlist.compiledClips.inOrder().map((c) => [c.clipUid.value, c.start.value! / BEAT, c.stop.value! / BEAT]);

describe('compiled clips', () => {
  it('turns publishing on when loaded, once, and never off', async () => {
    const { engine, luna, playlist, insert } = await lane();
    await insert(0, 4);
    expect(playlist.compiledClips.items).toHaveLength(0);
    await playlist.compiledClips.load();
    await playlist.compiledClips.load();
    await playlist.compiledClips.reload();
    const writes = engine.requests.filter((r) => r.verb === 'set' && r.path.includes('enable_compiled_clips'));
    expect(writes).toHaveLength(1);
    expect(writes[0]!.data).toBe(true);
    expect(spans(playlist)).toEqual([['clip1', 0, 4]]);
    await luna.close();
  });

  it('resolves an overlap by layer: the clip on top splits the one beneath', async () => {
    const { engine, luna, playlist, insert } = await lane();
    const under = await insert(0, 8);
    const over = await insert(2, 4, 5 * SECOND_NS);
    engine.setValue(playlist.clips.byId(over)!.path, 'layer', 1);
    await playlist.compiledClips.load();
    await engine.settled();
    await luna.settled();
    expect(spans(playlist)).toEqual([[under, 0, 2], [over, 2, 4], [under, 4, 8]]);
    expect(playlist.compiledClips.ofClip(under)).toHaveLength(2);
    // Each segment's source range covers only that segment: the second piece of `under`
    // starts 2 s into it (4 beats at 120 bpm), not at the clip's own source start.
    const [, middle, last] = playlist.compiledClips.inOrder();
    expect([middle!.sourceStart.value, middle!.sourceStop.value]).toEqual([5 * SECOND_NS, 6 * SECOND_NS]);
    expect([last!.sourceStart.value, last!.sourceStop.value]).toEqual([2 * SECOND_NS, 4 * SECOND_NS]);
    await luna.close();
  });

  it('on equal layers the narrower clip plays', async () => {
    const { luna, playlist, insert } = await lane();
    const wide = await insert(0, 8);
    const narrow = await insert(2, 4);
    await playlist.compiledClips.load();
    expect(spans(playlist)).toEqual([[wide, 0, 2], [narrow, 2, 4], [wide, 4, 8]]);
    await luna.close();
  });

  it('follows edits: a move updates the segment, a delete removes it', async () => {
    const { engine, luna, playlist, insert } = await lane();
    const a = await insert(0, 4);
    const b = await insert(4, 8);
    await playlist.compiledClips.load();
    const announced: string[][] = [];
    playlist.compiledClips.onChange(() => announced.push(playlist.compiledClips.items.map((c) => c.clipUid.value!)));
    await playlist.clips.byId(b)!.delete();
    await engine.settled();
    await luna.settled();
    expect(spans(playlist)).toEqual([[a, 0, 4]]);
    expect(announced.at(-1)).toEqual([a]);
    engine.setValue(playlist.clips.byId(a)!.path, 'stop', 2 * BEAT);
    await engine.settled();
    await luna.settled();
    expect(spans(playlist)).toEqual([[a, 0, 2]]);
    await luna.close();
  });

  it('reads fades as objects and no fade as undefined', async () => {
    const { engine, luna, playlist, insert } = await lane();
    await insert(0, 4);
    await playlist.compiledClips.load();
    const seg = playlist.compiledClips.items[0]!;
    expect(seg.reportsFades.value).toBe(true);
    expect(seg.fadeIn.value).toBeUndefined();
    expect([seg.fullStart.value, seg.fullStop.value]).toEqual([0, 4 * BEAT]);
    let seen = 0;
    seg.fadeOut.onChange(() => seen++);
    const set = (k: string, v: unknown) => engine.setValue(seg.path, k, v);
    set('fade_out_uid', 'f1');
    set('fade_out_start', 3 * BEAT);
    set('fade_out_stop', 5 * BEAT);
    set('fade_out_shape', 'equal_power');
    set('fade_out_curvature', 0.25);
    set('fade_out_crossfade', true);
    set('fade_out_contributor_clip_uid', 'clip2');
    set('full_stop', 5 * BEAT);
    await engine.settled();
    await luna.settled();
    expect(seg.fadeOut.value).toEqual({ uid: 'f1', start: 3 * BEAT, stop: 5 * BEAT, shape: 'equal_power', curvature: 0.25, crossfade: true, contributorClipUid: 'clip2' });
    expect(seg.fullStop.value).toBe(5 * BEAT);
    expect(seen).toBeGreaterThan(0);
    expect(seg.snapshot().fadeOut?.uid).toBe('f1');
    await luna.close();
  });

  it('on a LUNA without fade data, says so and falls back to the segment range', async () => {
    const { luna, playlist, insert } = await lane({ compiledClipFades: false });
    await insert(0, 4);
    await playlist.compiledClips.load();
    const seg = playlist.compiledClips.items[0]!;
    expect(seg.reportsFades.value).toBe(false);
    expect([seg.fullStart.value, seg.fullStop.value]).toEqual([0, 4 * BEAT]);
    expect(seg.fadeIn.value).toBeUndefined();
    expect(seg.snapshot().reportsFades).toBe(false);
    await luna.close();
  });
});

describe('compiledClipAudio', () => {
  it('places a segment on its own slice of the source', async () => {
    const { engine, luna, session, playlist, insert } = await lane();
    const under = await insert(0, 8);
    const over = await insert(2, 4);
    engine.setValue(playlist.clips.byId(over)!.path, 'layer', 1);
    await playlist.compiledClips.load();
    await session.sources!.load();
    await engine.settled();
    await luna.settled();
    const t = session.musical.timeline;
    const last = playlist.compiledClips.ofClip(under)[1]!;
    const audio = Luna.compiledClipAudio(t, last, playlist.clips.byId(under)!, session.sources!)!;
    expect(audio.stretched).toBe(false);
    expect([audio.startNs, audio.stopNs]).toEqual([2 * SECOND_NS, 4 * SECOND_NS]);
    // Anchored at the segment, a tick maps to the same file offset as through the whole clip.
    expect(Luna.audioNsAtTick(t, last, audio, 6 * BEAT)).toBe(3 * SECOND_NS);
    await luna.close();
  });

  it('draws each piece of a stretched clip from its own render', async () => {
    const { engine, luna, session, playlist, insert } = await lane();
    engine.addSource('pkg1', 'rend1_1', { name: 'piece two.wav', lengthNs: 2 * SECOND_NS });
    const under = await insert(0, 8);
    const over = await insert(2, 4);
    const clip = playlist.clips.byId(under)!;
    engine.setValue(clip.path, 'render_source_uid', 'rend1');
    engine.setValue(clip.path, 'render_state', 'current');
    engine.setValue(playlist.clips.byId(over)!.path, 'layer', 1);
    await playlist.compiledClips.load();
    await session.sources!.load();
    await engine.settled();
    await luna.settled();
    const t = session.musical.timeline;
    const [first, last] = playlist.compiledClips.ofClip(under);
    expect(last!.renderSourceUid.value).toBe('rend1_1');
    const a = Luna.compiledClipAudio(t, first!, clip, session.sources!)!;
    const b = Luna.compiledClipAudio(t, last!, clip, session.sources!)!;
    expect([a.source.id, a.startNs, a.stopNs, a.stretched]).toEqual(['rend1', 0, 1 * SECOND_NS, true]);
    // The third piece is not in the clip's own render at all: it has one of its own.
    expect([b.source.id, b.startNs, b.stopNs, b.stretched]).toEqual(['rend1_1', 0, 2 * SECOND_NS, true]);
    expect(Luna.audioNsAtTick(t, last!, b, 6 * BEAT)).toBe(1 * SECOND_NS);
    await luna.close();
  });

  it('on a LUNA without per-piece renders, places only the first piece', async () => {
    const { engine, luna, session, playlist, insert } = await lane({ compiledClipFades: false });
    const under = await insert(0, 8);
    const over = await insert(2, 4);
    const clip = playlist.clips.byId(under)!;
    engine.setValue(clip.path, 'render_source_uid', 'rend1');
    engine.setValue(clip.path, 'render_state', 'current');
    engine.setValue(playlist.clips.byId(over)!.path, 'layer', 1);
    await playlist.compiledClips.load();
    await session.sources!.load();
    await engine.settled();
    await luna.settled();
    const t = session.musical.timeline;
    const [first, last] = playlist.compiledClips.ofClip(under);
    expect(last!.renderSourceUid.value).toBeUndefined();
    const a = Luna.compiledClipAudio(t, first!, clip, session.sources!)!;
    expect([a.source.id, a.startNs, a.stopNs]).toEqual(['rend1', 0, 1 * SECOND_NS]);
    // Its render is not the clip's, and LUNA does not say which it is: an outline, not empty audio.
    expect(Luna.compiledClipAudio(t, last!, clip, session.sources!)).toBeUndefined();
    await luna.close();
  });

  it('does not draw the original while LUNA re-renders a piece after an edit', async () => {
    const { engine, luna, session, playlist, insert } = await lane();
    const uid = await insert(0, 4);
    const clip = playlist.clips.byId(uid)!;
    engine.setValue(clip.path, 'render_source_uid', 'rend1');
    engine.setValue(clip.path, 'render_state', 'current');
    await playlist.compiledClips.load();
    await session.sources!.load();
    await engine.settled();
    await luna.settled();
    const seg = playlist.compiledClips.items[0]!;
    expect(seg.needsRender.value).toBe(true);
    // As measured after a crossfade: the clip forgets its render and the piece's is null, but
    // the piece still needs one (fact 116).
    engine.setValue(clip.path, 'render_state', 'none');
    engine.setValue(clip.path, 'render_source_uid', '');
    engine.setValue(seg.path, 'render_source_uid', null);
    engine.setValue(seg.path, 'needs_render', true);
    await engine.settled();
    await luna.settled();
    expect(Luna.compiledClipAudio(session.musical.timeline, seg, clip, session.sources!)).toBeUndefined();
    await luna.close();
  });

  it('draws an outline for a stretched piece whose render LUNA has not made yet', async () => {
    const { engine, luna, session, playlist, insert } = await lane();
    const uid = await insert(0, 8);
    const over = await insert(2, 4);
    const clip = playlist.clips.byId(uid)!;
    engine.setValue(clip.path, 'render_source_uid', 'rend1');
    engine.setValue(clip.path, 'render_state', 'current');
    engine.setValue(playlist.clips.byId(over)!.path, 'layer', 1);
    await playlist.compiledClips.load();
    await session.sources!.load();
    await engine.settled();
    await luna.settled();
    // rend1_1 is named but not a source yet.
    const last = playlist.compiledClips.ofClip(uid)[1]!;
    expect(Luna.compiledClipAudio(session.musical.timeline, last, clip, session.sources!)).toBeUndefined();
    await luna.close();
  });

  it('has nothing to draw before the render is announced', async () => {
    const { engine, luna, session, playlist, insert } = await lane();
    const uid = await insert(0, 4);
    const clip = playlist.clips.byId(uid)!;
    engine.setValue(clip.path, 'render_source_uid', 'not_yet');
    engine.setValue(clip.path, 'render_state', 'current');
    await playlist.compiledClips.load();
    await session.sources!.load();
    await engine.settled();
    await luna.settled();
    expect(Luna.compiledClipAudio(session.musical.timeline, playlist.compiledClips.items[0]!, clip, session.sources!)).toBeUndefined();
    await luna.close();
  });
});
