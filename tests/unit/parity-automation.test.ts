/**
 * Range automation edits (fact 227), clip gain (fact 228) and warp markers (facts 229-231),
 * against the mock, which follows deviced's Edit_WriteControlValues, Edit_TrimControlValues,
 * Edit_SetWarp, Edit_DeleteWarp and Edit_RemoveTCE.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const W = Luna.WHOLE_NOTE;
const B = Luna.TICKS_PER_BEAT;
const SECOND_NS = 1e9;

async function mixer(tracks = ['Vocal', 'Guitar']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  const strips = [];
  for (const name of tracks) {
    const t = session.tracks.byId(name)!;
    await t.loadStrip();
    await t.gain.automation.load();
    strips.push(t);
  }
  const lane = async (auto: Luna.Automation) => {
    await engine.settled();
    await auto.reload();
    await Promise.all(auto.items.map((b) => b.load()));
    return auto.breakpoints;
  };
  return { engine, luna, session, strips, lane };
}

async function clips() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Gtr', 'Keys'], name: 'Demo', packageUid: 'pkg1' });
  engine.addSource('pkg1', 'src1', { name: 'take.wav', lengthNs: 30 * SECOND_NS });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  const playlist = session.playlistFor(session.tracks.byId('Gtr')!)!;
  await playlist.clips.load();
  /** A clip of `beats` beats playing `seconds` of source (120 bpm: two beats a second). */
  const insert = async (beats: number, seconds = beats / 2) => {
    const { id } = await session.insertClip({ playlistUid: playlist.id, sourceUid: 'src1', startTick: 0, stopTick: beats * B, sourceStartNs: 0, sourceStopNs: seconds * SECOND_NS });
    await engine.settled();
    await playlist.clips.membersReady();
    return playlist.clips.byId(id)!;
  };
  return { engine, luna, session, playlist, insert };
}

describe('writeRange / trimRange (fact 227)', () => {
  it('writes a value over an empty lane with anchors at both edges, sent as a float', async () => {
    const { engine, luna, strips } = await mixer();
    const gain = strips[0]!.gain;
    await gain.automation.writeRange(-12, { start: W, stop: 2 * W });
    expect(gain.automation.breakpoints).toEqual([
      { tick: W - 1, value: 0 },
      { tick: W, value: -12 },
      { tick: 2 * W - 1, value: -12 },
      { tick: 2 * W, value: 0 },
    ]);
    expect(engine.requests.find((r) => r.path === '/sessions/abc/write_control_values')).toMatchObject({
      data: { session_uid: 'abc', context_type: 'main', start: W, stop: 2 * W, controls: [{ control_uid: gain.uid.value, value: Luna.float(-12) }] },
    });
    await luna.close();
  });

  it('keeps the curve outside the range and adds no stop anchor onto an existing point', async () => {
    const { luna, strips, lane } = await mixer();
    const auto = strips[0]!.gain.automation;
    await auto.insert([{ tick: 0, value: -6 }, { tick: W + B, value: -6 }, { tick: 2 * W, value: -3 }]);
    await auto.writeRange(-12, { start: W, stop: 2 * W });
    const bps = await lane(auto);
    // W + B is inside the range and goes; 2W is where the range ends, so stop-1 steps into it.
    expect(bps.map((b) => b.tick)).toEqual([0, W - 1, W, 2 * W - 1, 2 * W]);
    expect(bps.find((b) => b.tick === W)!.value).toBe(-12);
    expect(bps.find((b) => b.tick === 2 * W - 1)!.value).toBe(-12);
    expect(bps.find((b) => b.tick === 2 * W)!.value).toBe(-3);
    await luna.close();
  });

  it('trims an empty lane into a plateau and resets the output gain trim', async () => {
    const { engine, luna, strips } = await mixer();
    const track = strips[0]!;
    const trimPath = `${track.gain.path.slice(0, track.gain.path.lastIndexOf('/'))}/gain_trim`;
    engine.setValue(trimPath, 'value', 2);
    await track.gain.automation.trimRange(3, { start: W, stop: 2 * W });
    expect(track.gain.automation.breakpoints).toEqual([
      { tick: W - 1, value: 0 },
      { tick: W, value: 3 },
      { tick: 2 * W - 1, value: 3 },
      { tick: 2 * W, value: 0 },
    ]);
    expect(engine.value(trimPath, 'value')).toBe(0);
    await luna.close();
  });

  it('trims every point in the range by the delta and anchors the edges', async () => {
    const { luna, strips, lane } = await mixer();
    const auto = strips[0]!.gain.automation;
    await auto.insert([{ tick: 0, value: -6 }, { tick: W + B, value: -9 }, { tick: 4 * W, value: -6 }]);
    await auto.trimRange(3, { start: W, stop: 2 * W });
    const bps = await lane(auto);
    expect(bps.map((b) => b.tick)).toEqual([0, W - 1, W, W + B, 2 * W - 1, 2 * W, 4 * W]);
    expect(bps.find((b) => b.tick === W + B)!.value).toBe(-6);
    expect(bps.find((b) => b.tick === 0)!.value).toBe(-6);
    expect(bps.find((b) => b.tick === 4 * W)!.value).toBe(-6);
    await luna.close();
  });

  it('writes several controls over the context selection in one command', async () => {
    const { engine, luna, session, strips, lane } = await mixer();
    await session.context.load();
    await session.context.select({ startTick: 0, stopTick: W });
    await session.context.writeControlValues(strips.map((t) => ({ control: t.gain, value: -6 })));
    for (const t of strips) expect((await lane(t.gain.automation)).map((b) => [b.tick, b.value])).toEqual([[0, -6], [W - 1, -6], [W, 0]]);
    const posts = engine.requests.filter((r) => r.path === '/sessions/abc/write_control_values');
    expect(posts).toHaveLength(1);
    expect(posts[0]!.data).not.toHaveProperty('start');
    await luna.close();
  });

  it('refuses a one-ended range and reports an unknown control', async () => {
    const { luna, session, strips } = await mixer();
    await expect(session.context.trimControlValues([{ control: strips[0]!.gain, value: 1 }], { start: 0 })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.context.writeControlValues([{ control: 'nope', value: 1 }], { start: 0, stop: W })).rejects.toMatchObject({ code: 'device.database_error' });
    await expect(session.context.writeControlValues([], { start: 0, stop: W })).rejects.toMatchObject({ code: 'out_of_range' });
    await luna.close();
  });
});

describe('clip gain (fact 228)', () => {
  it('evaluates linearly in dB, holds outside the ends and steps on coincident points', () => {
    const bps = [{ tick: 960, value: -6 }, { tick: 0, value: 0 }];
    expect(Luna.clipGainAt(bps, 480)).toBe(-3);
    expect(Luna.clipGainAt(bps, -100)).toBe(0);
    expect(Luna.clipGainAt(bps, 5000)).toBe(-6);
    expect(Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 100, value: -6 }, { tick: 100, value: -12 }, { tick: 200, value: -12 }], 100)).toBe(-12);
    expect(Luna.clipGainAt([], 0)).toBeUndefined();
    expect(Luna.dbToGain(0)).toBe(1);
    expect(Luna.dbToGain(-144)).toBe(0);
    expect(Luna.dbToGain(-6)).toBeCloseTo(0.501, 3);
  });

  it('gives every clip a gain control whose lane takes breakpoints and whose value follows clip gain', async () => {
    const { engine, luna, insert } = await clips();
    const clip = await insert(8);
    await clip.controls.load();
    expect(clip.controls.items.map((c) => c.id)).toEqual(['gain']);
    const gain = clip.gainControl;
    await gain.load();
    expect(gain.controlType.value).toBe('gain');
    expect(gain.automatable.value).toBe(true);
    await gain.automation.load();
    await gain.automation.insert([{ tick: 0, value: 0 }, { tick: 8 * B, value: -144 }]);
    expect(Luna.clipGainAt(gain.automation.breakpoints, 4 * B)).toBe(-72);
    await clip.gain.set(-3);
    await engine.settled();
    await luna.settled();
    expect(gain.value.value).toBe(-3);
    await luna.close();
  });
});

describe('warp markers (facts 229-231)', () => {
  it('adds a user marker with set_warp, sending the playlist LUNA needs', async () => {
    const { engine, luna, playlist, insert } = await clips();
    const clip = await insert(8);
    await clip.warps.load();
    expect(clip.warps.markers).toEqual([]);
    const w = await clip.warps.set({ start: 2 * B, sourceStart: 1.2 * SECOND_NS });
    expect(w).toMatchObject({ start: 2 * B, sourceStart: 1.2 * SECOND_NS, type: 'user' });
    expect(engine.requests.find((r) => r.path === '/sessions/abc/set_warp')).toMatchObject({
      data: { session_uid: 'abc', clip_uid: clip.id, playlist_uid: playlist.id, start: 2 * B, source_start: 1.2 * SECOND_NS, context_type: 'main' },
    });
    // Without the playlist LUNA answers success and adds nothing.
    await luna.raw.post('/sessions/abc/set_warp', { session_uid: 'abc', clip_uid: clip.id, start: 4 * B, source_start: 2.5 * SECOND_NS });
    await engine.settled();
    await clip.warps.reload();
    expect(clip.warps.markers).toHaveLength(1);
    await luna.close();
  });

  it('reuses a marker in the transient zone, refuses a second at one tick, and moves by rowid', async () => {
    const { luna, insert } = await clips();
    const clip = await insert(8);
    await clip.warps.load();
    const first = await clip.warps.set({ start: 2 * B, sourceStart: SECOND_NS });
    const near = await clip.warps.set({ start: 3 * B, sourceStart: SECOND_NS + 20_000_000 });
    expect(near.rowid).toBe(first.rowid);
    expect(clip.warps.markers).toHaveLength(1);
    await expect(clip.warps.set({ start: 2 * B, sourceStart: 2 * SECOND_NS })).rejects.toMatchObject({ code: 'uasrv.invalid_object' });
    const moved = await clip.warps.set({ rowid: first.rowid, start: 3 * B, sourceStart: SECOND_NS });
    expect(moved).toMatchObject({ rowid: first.rowid, start: 3 * B });
    expect(clip.warps.markers).toHaveLength(1);
    await luna.close();
  });

  it('deletes one marker, or the ones strictly inside a range', async () => {
    const { luna, insert } = await clips();
    const clip = await insert(8);
    await clip.warps.load();
    for (const beat of [1, 2, 3, 4]) await clip.warps.set({ start: beat * B, sourceStart: beat * 0.5 * SECOND_NS });
    await clip.warps.delete(4 * B);
    expect(clip.warps.markers.map((m) => m.start)).toEqual([B, 2 * B, 3 * B]);
    await clip.warps.delete(B, 3 * B);
    expect(clip.warps.markers.map((m) => m.start)).toEqual([B, 3 * B]);
    await luna.close();
  });

  it('removes the time stretch: markers go and the clip plays its source span again', async () => {
    const { engine, luna, insert } = await clips();
    // Eight beats holding two seconds of source: stretched to twice its length at 120 bpm.
    const clip = await insert(8, 2);
    await clip.warps.load();
    await clip.warps.set({ start: 4 * B, sourceStart: SECOND_NS });
    await clip.warps.removeTimeStretch();
    await engine.settled();
    await luna.settled();
    expect(clip.warps.items).toHaveLength(0);
    expect(clip.stop.value).toBe(4 * B);
    expect(engine.requests.find((r) => r.path === '/sessions/abc/remove_tce')).toMatchObject({ data: { session_uid: 'abc', clip_uid: clip.id } });
    await luna.close();
  });

  it('refuses remove_tce on a MIDI clip', async () => {
    const { engine, luna, session } = await clips();
    const uid = engine.addMidiClip('abc', 'Keys', { startTick: 0, stopTick: W });
    await engine.settled();
    const keys = session.playlistFor(session.tracks.byId('Keys')!)!;
    await keys.clips.load();
    await expect(keys.clips.byId(uid)!.warps.removeTimeStretch()).rejects.toMatchObject({ code: 'uasrv.invalid_object' });
    await luna.close();
  });
});
