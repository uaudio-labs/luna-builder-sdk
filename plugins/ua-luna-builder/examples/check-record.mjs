#!/usr/bin/env node
/**
 * A real record pass against LUNA (fact 75).
 *
 * Creates a scratch audio track on the first device input, records `--seconds` (default 2)
 * with `session.record()` — which waits through any count-in for the real punch — and
 * reports the finalized take: an audio clip on the track's active playlist whose source has
 * migrated out of `<session>/record/audio` into the workspace folder and is listed in
 * `session.sources`, so the take can be drawn at once. Everything is verified against
 * independent raw reads, then the track is deleted and the source trashed (`--keep` leaves
 * both in the session).
 *
 * This rolls the transport in record on the first device input. Run it only where that is
 * fine. `driver_status` is printed but is not a gate: the machine this was measured on
 * records with it reading "initializing", and `record_mute` only mutes monitoring.
 *
 *   node examples/check-record.mjs
 *   node examples/check-record.mjs --seconds 4 --keep
 */
import assert from 'node:assert/strict';
import { Luna } from '../sdk/index.js';

const B = Luna.TICKS_PER_BEAT;
const args = process.argv.slice(2);
const keep = args.includes('--keep');
const seconds = args.includes('--seconds') ? Number(args[args.indexOf('--seconds') + 1]) : 2;
assert.ok(Number.isFinite(seconds) && seconds > 0, '--seconds must be a positive number');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const luna = await Luna.connect();
await luna.sessions.ready();
const session = luna.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();
for (const p of session.playlists.items) await p.clips.load();
await session.sources?.load();

const read = async (path, props) => (await luna.raw.get(path, { children: false, commands: false, flatvalue: true, propfilter: props }).catch(() => ({})))?.properties ?? {};
const root = await read('/', ['driver_status']);
const result = { session: session.name.value, driverStatus: root['driver_status'] ?? null, countIn: session.transport.countInEnabled.value ?? false, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };

let trackUid, sourceUid;
try {
  const inputs = await luna.audioInputs();
  assert.ok(inputs.length > 0, 'no device inputs under /devices');
  const input = inputs[0];
  step('luna.audioInputs listed the device inputs', { count: inputs.length, using: input.name, device: input.deviceId, stemFormat: input.stemFormat });

  await session.newTrack({ name: 'SDK record check', trackType: 'audio', stemFormat: input.stemFormat === 'stereo' ? 'stereo' : 'mono' });
  for (let i = 0; i < 80; i++) {
    await session.tracks.reload();
    if (session.tracks.items.some((t) => t.name.value === 'SDK record check')) break;
    await sleep(25);
  }
  const track = session.tracks.items.find((t) => t.name.value === 'SDK record check');
  assert.ok(track, 'the scratch track did not appear');
  trackUid = track.id;
  for (let i = 0; i < 80 && !session.playlistFor(track); i++) { await session.playlists.reload(); await sleep(25); }
  const lane = session.playlistFor(track);
  assert.ok(lane, 'the scratch track has no active playlist');
  await lane.clips.load();

  const started = Date.now();
  console.error(`  recording ${seconds} s from beat 8${session.transport.countInEnabled.value ? ' after the count-in' : ''}…`);
  const take = await session.record({ track, inputUid: input.uid, startTick: 8 * B, seconds });
  const elapsed = (Date.now() - started) / 1000;
  sourceUid = take.sourceUid.value;

  assert.equal(lane.clips.byId(take.id), take, 'the take is on the track\'s active playlist');
  assert.equal(take.clipType.value, 'audio', 'the take is an audio clip');
  assert.equal(take.start.value, 8 * B, 'the take starts at the punch point');
  assert.ok(take.stop.value > take.start.value, 'the take has length');
  assert.ok(take.sourceStop.value > take.sourceStart.value, 'the take has a source span');
  step('session.record returned the finalized take', {
    uid: take.id,
    startBeats: take.start.value / B,
    stopBeats: take.stop.value / B,
    sourceSeconds: (take.sourceStop.value - take.sourceStart.value) / 1e9,
    wallClockSeconds: elapsed,
  });

  const source = session.sources?.byId(sourceUid);
  assert.ok(source, 'the take source is not listed in session.sources');
  assert.ok((source.length.value ?? 0) > 0, 'the take source has no length');
  const workspace = await read(source.path, ['length', 'sample_rate', 'name']);
  assert.ok(Number(workspace['length']) > 0, 'the workspace folder does not hold the take source');
  const recordArea = await read(`${session.path}/record/audio/${sourceUid}`, ['length']);
  // It can be drawn straight away: clipAudio resolves and the overview is there (or arrives).
  const audio = Luna.clipAudio(take, session.sources);
  assert.ok(audio && !audio.stretched && audio.source.id === sourceUid, 'clipAudio picks the take source');
  let info;
  for (let i = 0; i < 60 && !(info = await source.overviewInfo()); i++) await sleep(100);
  step('the take source migrated to the workspace folder and is drawable', {
    uid: sourceUid,
    sourceName: source.name.value,
    seconds: (source.length.value ?? 0) / 1e9,
    sampleRate: source.sampleRate.value,
    recordArea: recordArea['length'] === undefined ? 'released' : 'still present',
    overviewPairs: info?.count ?? null,
  });

  const after = await read(session.path, ['playing', 'record_enabled', 'punched_in']);
  assert.equal(after['playing'], false, 'the transport stopped');
  assert.ok(!after['record_enabled'], 'the session disarmed');
  assert.ok(!after['punched_in'], 'the punch ended');
  const trackAfter = await read(track.path, ['record_enabled']);
  assert.ok(!trackAfter['record_enabled'], 'the track disarmed');
  step('transport stopped and everything disarmed, by independent read');

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.stack ?? err);
} finally {
  if (!keep) {
    if (trackUid) await session.deleteTracks([trackUid]).catch(() => undefined);
    if (sourceUid) {
      await luna.raw
        .post('/workspace/delete_audio_files', { session_package_uid: session.sessionPackageUid.value, files: [sourceUid], move_to_trash: true })
        .catch(() => undefined);
    }
    result.cleanedUp = true;
  } else {
    result.cleanedUp = false;
  }
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
