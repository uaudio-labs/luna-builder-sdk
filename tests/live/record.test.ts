/**
 * Live lane for `session.record()` (fact 75).
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
  let sourceUid: string | undefined;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    for (const p of session.playlists.items) await p.clips.load();
    await session.sources?.load();
  });

  afterAll(async () => {
    if (track) await session.deleteTracks([track.id]).catch(() => undefined);
    if (sourceUid) {
      await luna.raw
        .post('/workspace/delete_audio_files', { session_package_uid: session.sessionPackageUid.value, files: [sourceUid], move_to_trash: true })
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
    sourceUid = take.sourceUid.value;

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
