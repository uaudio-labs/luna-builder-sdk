/**
 * Takes in progress: what LUNA publishes under `<session>/record` while it records (fact 149),
 * as `session.recordTakes`.
 */
import { describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

const BEAT = Luna.TICKS_PER_BEAT;

async function recordingSession() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Drums'], name: 'Demo', packageUid: 'pkg1' });
  engine.addTrack('abc', 'keys', { name: 'Keys', trackType: 'instrument' });
  engine.setValue('/sessions/abc', 'loop_start', 0);
  engine.setValue('/sessions/abc', 'loop_stop', 16 * BEAT);
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

/** Arm the tracks and roll in record from beat 4, as a client does (the mock records on a client's write). */
async function arm(engine: InstanceType<typeof Luna.MockEngine>, session: Luna.Session, ...tracks: string[]) {
  for (const t of tracks) engine.setValue(`/sessions/abc/tracks/${t}`, 'record_enabled', true);
  engine.setValue('/sessions/abc', 'play_start', 4 * BEAT);
  await engine.settled();
  await session.transport.recordEnabled.set(true);
  await engine.settled();
}

describe('session.recordTakes', () => {
  it('is empty while nothing records', async () => {
    const { luna, session } = await recordingSession();
    expect(session.recordTakes.items).toEqual([]);
    expect(session.recordTakes.forTrack('Drums')).toEqual([]);
    await luna.close();
  });

  it('lists a take per armed track while recording, then drops them when the clips land', async () => {
    const { engine, luna, session } = await recordingSession();
    const changes = vi.fn();
    session.recordTakes.onChange(changes);

    await arm(engine, session, 'Drums', 'keys');
    await luna.settled();
    await vi.waitFor(() => expect(session.recordTakes.items).toHaveLength(2));
    expect(changes).toHaveBeenCalled();
    const [drums] = session.recordTakes.forTrack('Drums');
    const [keys] = session.recordTakes.forTrack(session.tracks.byId('keys')!);
    await vi.waitFor(() => expect(drums?.start.value).toBe(4 * BEAT));
    expect(drums!.trackUid.value).toBe('Drums');
    expect(drums!.isMidi).toBe(false);
    await vi.waitFor(() => expect(keys?.isMidi).toBe(true));
    expect(keys!.audio).toBeUndefined();
    expect(session.recordTakes.byId(drums!.id)).toBe(drums);

    await session.transport.recordEnabled.set(false);
    await engine.settled();
    await luna.settled();
    await vi.waitFor(() => expect(session.recordTakes.items).toEqual([]));
    expect(drums!.disposed).toBe(true);
    // The finished take is a clip on the track's playlist now.
    expect(session.playlistFor(session.tracks.byId('Drums')!)!.clips.items).toHaveLength(1);
    await luna.close();
  });

  it("follows an audio take's growing stop and draws its file's waveform as it is written", async () => {
    const { engine, luna, session } = await recordingSession();
    await arm(engine, session, 'Drums');
    await vi.waitFor(() => expect(session.recordTakes.forTrack('Drums')).toHaveLength(1));
    const [take] = session.recordTakes.forTrack('Drums');
    await vi.waitFor(() => expect(take!.audio).toBeDefined());
    const stops = vi.fn();
    take!.stop.onChange(stops);

    engine.recordProgress('abc', 4 * BEAT + 8 * BEAT); // two bars: 4 s at the mock's 120 BPM
    await engine.settled();
    await luna.settled();
    await vi.waitFor(() => expect(take!.stop.value).toBe(12 * BEAT));
    expect(stops).toHaveBeenCalled();
    const audio = take!.audio!;
    expect(audio.source.path).toBe(`/sessions/abc/record/audio/${take!.sourceUid.value}`);
    expect([audio.startNs, audio.stopNs]).toEqual([0, 4e9]);

    const waves = new Luna.Waveforms();
    const range = await waves.range(audio.source, audio.startNs, audio.stopNs, 'coarse');
    expect(range.count).toBe(Math.floor(4e9 / Luna.COARSE_PAIR_NS));
    expect(range.channels[0]!.max.some((v) => v > 0)).toBe(true);

    // More of the file arrives: the same cache reads past what it held.
    engine.recordProgress('abc', 4 * BEAT + 16 * BEAT);
    await engine.settled();
    await vi.waitFor(() => expect(take!.audio?.stopNs).toBe(8e9));
    const more = await waves.range(take!.audio!.source, 0, 8e9, 'coarse');
    expect(more.count).toBe(Math.floor(8e9 / Luna.COARSE_PAIR_NS));
    expect(Luna.audioNsAtTick(session.musical.timeline, take!, take!.audio!, 4 * BEAT + 8 * BEAT)).toBeCloseTo(4e9, -3);
    await luna.close();
  });

  it("gives a MIDI take's messages and notes as they are played, ticks from the take's start", async () => {
    const { engine, luna, session } = await recordingSession();
    await arm(engine, session, 'keys');
    await vi.waitFor(() => expect(session.recordTakes.forTrack('keys')).toHaveLength(1));
    const [take] = session.recordTakes.forTrack('keys');
    await vi.waitFor(() => expect(take!.isMidi).toBe(true));
    const notes = vi.fn();
    take!.notes.onChange(notes);

    // Session ticks, as LUNA publishes them: the take began at beat 4.
    engine.recordMidi('abc', 'keys', [
      { tick: 4 * BEAT, status: 0x90, data1: 60, data2: 100 },
      { tick: 5 * BEAT, status: 0x80, data1: 60, data2: 0 },
      { tick: 5 * BEAT, status: 0x91, data1: 67, data2: 90 },
    ]);
    engine.recordProgress('abc', 6 * BEAT);
    await engine.settled();
    await luna.settled();
    await vi.waitFor(() => expect(take!.events.items).toHaveLength(3));
    expect(take!.events.items[0]).toMatchObject({ tick: 0, status: 0x90, channel: 0, data1: 60, data2: 100 });
    expect(take!.notes.items.map((n) => [n.pitch, n.channel, n.startTick, n.stopTick, n.velocity])).toEqual([
      [60, 0, 0, BEAT, 100],
      [67, 1, BEAT, undefined, 90], // still held: draw it to take.stop
    ]);
    expect(notes).toHaveBeenCalled();
    expect(take!.stop.value).toBe(6 * BEAT);
    await luna.close();
  });

  it('picks up a take already recording when the session is read', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Drums'], name: 'Demo', packageUid: 'pkg1' });
    engine.setValue('/sessions/abc', 'loop_stop', 16 * BEAT);
    await engine.settled();
    // Another client started recording before this one connected.
    const other = await Luna.connect({ port_: engine.port() });
    await arm(engine, await other.session(), 'Drums');
    engine.recordProgress('abc', 8 * BEAT);
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const [take] = session.recordTakes.forTrack('Drums');
    expect(take?.stop.value).toBe(8 * BEAT);
    expect(take?.audio?.stopNs).toBe(2e9);
    await luna.close();
    await other.close();
  });
});
