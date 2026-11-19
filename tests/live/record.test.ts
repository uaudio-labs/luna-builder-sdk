/**
 * Live lane for `session.record()` (fact 75) and the take in progress, `session.recordTakes`
 * (fact 149).
 *
 * **This rolls the transport in record on the first device input.** It is skipped unless
 * `UA_LIVE_RECORD=1` is set as well as `UA_LIVE=1`, because the other live tests never
 * make a sound. It creates a scratch audio track, records two seconds, checks the take and
 * its source, then deletes the track and trashes the source. The undo entries remain.
 *
 *   UA_LIVE=1 UA_LIVE_RECORD=1 npx vitest run tests/live/record.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1' && process.env['UA_LIVE_RECORD'] === '1';
const B = Luna.TICKS_PER_BEAT;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe.skipIf(!live)('live: record', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let track: Luna.Track | undefined;
  const sourceUids: string[] = [];

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    for (const p of session.playlists.items) await p.clips.load();
    await session.sources?.load();
  });

  afterAll(async () => {
    if (track) await session.deleteTracks([track.id]).catch(() => undefined);
    if (sourceUids.length) {
      await luna.raw
        .post('/workspace/delete_audio_files', { session_package_uid: session.sessionPackageUid.value, files: sourceUids, move_to_trash: true })
        .catch(() => undefined);
    }
    await luna?.close();
  });

  it('records a pass and resolves to the finalized take, with its source listed', async () => {
    const inputs = await luna.audioInputs();
    expect(inputs.length).toBeGreaterThan(0);
    const input = inputs[0]!;

    await session.newTrack({ name: 'SDK live record', trackType: 'audio', stemFormat: input.stemFormat === 'stereo' ? 'stereo' : 'mono' });
    await Luna.settle(() => session.tracks.items.some((t) => t.name.value === 'SDK live record'), 'new track', { refresh: () => session.tracks.reload() });
    track = session.tracks.items.find((t) => t.name.value === 'SDK live record');
    expect(track).toBeDefined();
    await Luna.settle(() => session.playlistFor(track!) !== undefined, 'active playlist', { refresh: () => session.playlists.reload() });
    const lane = session.playlistFor(track!)!;
    await lane.clips.load();

    const take = await session.record({ track: track!, inputUid: input.uid, startTick: 8 * B, seconds: 2 });
    const sourceUid = take.sourceUid.value;
    if (sourceUid) sourceUids.push(sourceUid);

    expect(lane.clips.byId(take.id)).toBe(take);
    expect(take.clipType.value).toBe('audio');
    expect(take.start.value).toBe(8 * B);
    expect(take.stop.value!).toBeGreaterThan(take.start.value!);
    expect(take.sourceStop.value!).toBeGreaterThan(take.sourceStart.value!);

    // The source has migrated out of `<session>/record/audio` and is drawable.
    const source = session.sources?.byId(sourceUid!);
    expect(source).toBeDefined();
    expect(source!.length.value!).toBeGreaterThan(0);
    const audio = Luna.clipAudio(take, session.sources!);
    expect(audio?.source.id).toBe(sourceUid);
    expect(audio?.stretched).toBe(false);
  }, 60_000);

  it('lists the take while it records, with a growing stop and a waveform that fills in', async () => {
    expect(track).toBeDefined();
    const inputs = await luna.audioInputs();
    const waves = new Luna.Waveforms();
    let seen: Luna.RecordTake | undefined;
    let firstStop: number | undefined;
    let lastStop: number | undefined;
    let pairs = 0;
    const pass = session.record({ track: track!, inputUid: inputs[0]!.uid, startTick: 16 * B, seconds: 3 });
    const deadline = Date.now() + 20_000;
    let done = false;
    void pass.finally(() => (done = true)).catch(() => undefined);
    while (!done && Date.now() < deadline) {
      const take = session.recordTakes.forTrack(track!)[0];
      if (take) {
        seen ??= take;
        const stop = take.stop.value;
        if (stop !== undefined) {
          firstStop ??= stop;
          lastStop = stop;
        }
        const audio = take.audio;
        if (audio && audio.stopNs > audio.startNs) {
          const range = await waves.range(audio.source, audio.startNs, audio.stopNs, 'coarse').catch(() => undefined);
          pairs = Math.max(pairs, range?.count ?? 0);
        }
      }
      await sleep(100);
    }
    const take = await pass;
    if (take.sourceUid.value) sourceUids.push(take.sourceUid.value);

    expect(seen).toBeDefined();
    expect(seen!.trackUid.value).toBe(track!.id);
    expect(seen!.start.value).toBe(16 * B);
    expect(seen!.isMidi).toBe(false);
    expect(lastStop!).toBeGreaterThan(firstStop!);
    expect(pairs).toBeGreaterThan(0);
    // Once it is a clip the take in progress is gone.
    await Luna.settle(() => session.recordTakes.forTrack(track!).length === 0, 'take gone');
    expect(seen!.disposed).toBe(true);
  }, 60_000);

  it('left nothing armed or rolling', async () => {
    await sleep(200);
    const state = (await luna.raw.get(session.path, { children: false, commands: false, flatvalue: true, propfilter: ['playing', 'record_enabled', 'punched_in'] })) as {
      properties?: Record<string, unknown>;
    };
    expect(state.properties?.['playing']).toBe(false);
    expect(state.properties?.['record_enabled']).toBeFalsy();
    expect(state.properties?.['punched_in']).toBeFalsy();
    const armed = (await luna.raw.get(track!.path, { children: false, commands: false, flatvalue: true, propfilter: ['record_enabled'] })) as {
      properties?: Record<string, unknown>;
    };
    expect(armed.properties?.['record_enabled']).toBeFalsy();
  });
});
