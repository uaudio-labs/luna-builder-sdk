/**
 * Recording a pass: the device inputs a track can be routed to (fact 76), and the
 * arm → punch → hold → stop → finalize flow of `session.record()` (fact 75).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const BEAT = Luna.TICKS_PER_BEAT;

async function trackingSession() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Drums', 'Keys'], name: 'Demo', packageUid: 'pkg1' });
  engine.addDevice('Apollo', { inputs: ['Mic 1', 'Mic 2'] });
  engine.addDevice('BuiltIn', { inputs: ['Internal Mic'] });
  // A punch at 0 only captures when the loop marks cover it.
  engine.setValue('/sessions/abc', 'loop_start', 0);
  engine.setValue('/sessions/abc', 'loop_stop', 16 * BEAT);
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

describe('luna.audioInputs', () => {
  it('lists every device input with the uid a track is routed to', async () => {
    const { luna } = await trackingSession();
    const inputs = await luna.audioInputs();
    expect(inputs.map((i) => i.name)).toEqual(['Mic 1', 'Mic 2', 'Internal Mic']);
    expect(inputs[0]).toMatchObject({ uid: 'in_1', deviceId: 'Apollo', stemFormat: 'mono', inUse: false });
    expect(inputs[2]!.deviceId).toBe('BuiltIn');
    await luna.close();
  });

  it('is empty, not an error, when no device has inputs', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Drums'] });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    expect(await luna.audioInputs()).toEqual([]);
    await luna.close();
  });
});

describe('session.record', () => {
  it('arms, punches, captures and disarms, and resolves to the finalized take', async () => {
    const { engine, luna, session } = await trackingSession();
    const drums = session.tracks.byId('Drums')!;

    const take = await session.record({ track: drums, inputUid: 'in_1', seconds: 0.05 });
    await engine.settled();

    expect(take.sourceUid.value).toBeTruthy();
    expect(take.length).toBe(4 * BEAT);
    // The take is on the track's own playlist, and nowhere else.
    expect(session.playlistFor(drums)!.clips.items.map((c) => c.id)).toEqual([take.id]);
    expect(session.playlistFor(session.tracks.byId('Keys')!)!.clips.items).toEqual([]);
    // Its source is listed, so it can be drawn straight away.
    expect(Luna.clipAudio(take, session.sources!)).toBeDefined();
    // Nothing is left armed or rolling.
    expect(drums.recordEnabled.value).toBe(false);
    expect(session.transport.recordEnabled.value).toBe(false);
    expect(session.transport.playing.value).toBe(false);
    expect(drums.inputNodeUid.value).toBe('in_1');
    await luna.close();
  });

  it('widens the loop marks around a punch outside them and puts them back', async () => {
    const { engine, luna, session } = await trackingSession();
    await session.transport.setLoop(0, 4 * BEAT);
    await engine.settled();

    const take = await session.record({ track: 'Drums', startTick: 32 * BEAT, seconds: 0.05 });
    await engine.settled();

    expect(take.start.value).toBe(32 * BEAT); // it captured, so the marks covered the punch
    expect([session.transport.loopStart.value, session.transport.loopStop.value]).toEqual([0, 4 * BEAT]);
    await luna.close();
  });

  it('stops early when its signal aborts', async () => {
    const { engine, luna, session } = await trackingSession();
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 20);
    const started = Date.now();

    await session.record({ track: 'Drums', seconds: 60, signal: controller.signal });
    await engine.settled();

    expect(Date.now() - started).toBeLessThan(5000);
    expect(session.transport.playing.value).toBe(false);
    await luna.close();
  });

  it('refuses a missing track, a non-audio track and a pass with no end', async () => {
    const { engine, luna, session } = await trackingSession();
    await session.newTrack({ name: 'Synth', trackType: 'instrument' });
    await engine.settled();
    await session.tracks.reload();
    await luna.settled();
    const synth = session.tracks.items.find((t) => t.name.value === 'Synth')!;
    expect(synth.trackType.value).toBe('instrument');

    await expect(session.record({ track: 'nope', seconds: 1 })).rejects.toMatchObject({ code: 'not_found' });
    await expect(session.record({ track: synth, seconds: 1 })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.record({ track: 'Drums' })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.record({ track: 'Drums', seconds: 0 })).rejects.toMatchObject({ code: 'out_of_range' });
    // None of those armed anything.
    expect(session.tracks.byId('Drums')!.recordEnabled.value).toBe(false);
    await luna.close();
  });

  it('disarms the track when the pass fails after arming', async () => {
    const { engine, luna, session } = await trackingSession();
    engine.fail('/sessions/abc/record_enabled', 'uasrv.busy');

    await expect(session.record({ track: 'Drums', seconds: 0.05 })).rejects.toMatchObject({ code: 'uasrv.busy' });
    await engine.settled();

    expect(session.tracks.byId('Drums')!.recordEnabled.value).toBe(false);
    expect(session.playlistFor(session.tracks.byId('Drums')!)!.clips.items).toEqual([]);
    await luna.close();
  });
});
