#!/usr/bin/env node
/**
 * Live clip and marker lists against a LUNA edited by a **second client**: the probe
 * client inserts, renames, trims, moves and deletes a clip, and adds, renames and deletes
 * a marker, while the first client's model has to follow every step.
 *
 *   node examples/check-clips.mjs
 *   node examples/check-clips.mjs --slow   # pause 3 s per step so arrangement.html can be watched
 *
 * Everything it creates it removes; the session's own clips are never touched. The clip
 * goes well past the end of the session content, so it cannot overlap anything.
 */
import assert from 'node:assert/strict';
import { Luna } from '../sdk/index.js';

const B = Luna.TICKS_PER_BEAT;
const slow = process.argv.includes('--slow');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => (slow ? sleep(3000) : Promise.resolve());

const watcher = await Luna.connect();      // the model under test
const editor = await Luna.connect();       // the second client, doing the editing
await watcher.sessions.ready();
const session = watcher.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };
const settle = async (predicate) => { for (let i = 0; i < 80 && !(await predicate()); i++) await sleep(25); };
const post = (command, payload) => editor.raw.post(`${session.path}/${command}`, { session_uid: session.uid, ...payload });

let probeUid, markerRowid, lane;
let listChanges = 0;
try {
  const track = session.visibleTracks.find((t) => session.playlistFor(t));
  assert.ok(track, 'the session needs a track with an active playlist');
  lane = session.playlistFor(track);
  await lane.clips.load();
  const clipsBefore = lane.clips.items.length;
  lane.clips.onChange(() => listChanges++);

  await session.sources?.load();
  const source = session.sources?.items[0];
  assert.ok(source, 'the session needs an audio source');

  // Past every existing clip, so nothing overlaps.
  const end = Math.max(0, ...session.playlists.items.flatMap((p) => p.clips.items).map((c) => c.stop.value ?? 0));
  const start = Math.ceil(end / B / 4) * 4 * B + 8 * B;

  const inserted = await post('insert_clip', {
    playlist_uid: lane.id, source_uid: source.id, start, stop: start + 2 * B, source_start: 0, source_stop: 1e9, name: 'SDK probe clip',
  });
  probeUid = inserted?.uid;
  await settle(async () => lane.clips.items.some((c) => c.name.value === 'SDK probe clip'));
  const probe = lane.clips.items.find((c) => c.name.value === 'SDK probe clip');
  assert.ok(probe, 'the inserted clip appeared in the live list');
  probeUid = probe.id;
  const raw = await watcher.raw.get(probe.path, { children: false, commands: false, flatvalue: true });
  assert.equal(probe.name.value, raw?.properties?.name, 'name equals an independent read');
  assert.equal(probe.stop.value, raw?.properties?.stop, 'stop equals an independent read');
  assert.equal(probe.sourceStop.value, raw?.properties?.source_stop, 'source_stop equals an independent read');
  step('insert_clip appeared in the model with values equal to an independent read', { uid: probeUid, listChanges });
  await pause();

  await editor.raw.set(`${probe.path}/name`, 'SDK probe renamed');
  await settle(async () => probe.name.value === 'SDK probe renamed');
  assert.equal(probe.name.value, 'SDK probe renamed', 'the rename followed');
  step('property write to name followed');
  await pause();

  // trim_clip is a command of the edit context, not of the session, and on some builds it is
  // accepted but does nothing (fact 77). Report that rather than failing the whole run.
  const trimmed = await editor.raw
    .post(`${session.path}/contexts/main/commands/trim_clip`, { session_uid: session.uid, clip_uid: probe.id, start, stop: start + B })
    .then(() => true)
    .catch((e) => e.code);
  await settle(async () => probe.stop.value === start + B);
  if (probe.stop.value === start + B) {
    step('trim_clip followed', { stopBeats: (probe.stop.value ?? 0) / B, sourceStopNs: probe.sourceStop.value });
  } else {
    result.trimUnavailable = { reply: trimmed, stopBeats: (probe.stop.value ?? 0) / B };
    console.error(`  – trim_clip had no effect on this build (fact 77); reply: ${String(trimmed)}`);
  }
  await pause();

  // Move the range the clip actually occupies: on a build where the trim above no-ops it is
  // still two beats long, and a range that only partly covers a clip does not move it.
  await post('move_clips', { context_type: 'main', location: start + 4 * B, start: probe.start.value, stop: probe.stop.value, track_uid: [track.id] });
  await settle(async () => (probe.start.value ?? 0) === start + 4 * B);
  assert.equal(probe.start.value, start + 4 * B, 'the move followed');
  assert.equal(lane.clips.byId(probeUid), probe, 'the Clip identity survives a move');
  step('move_clips followed with the same Clip identity', { startBeats: (probe.start.value ?? 0) / B });
  await pause();

  await post('delete_clip', { uid: probe.id });
  await settle(async () => lane.clips.byId(probeUid) === undefined);
  assert.equal(lane.clips.byId(probeUid), undefined, 'the clip left the live list');
  probeUid = undefined;
  await sleep(300);
  const afterDelete = await watcher.raw.get(`${lane.path}/clips`, { children: true, properties: false, commands: false });
  assert.ok(!(afterDelete?.children ?? []).some((c) => c.path === probe.id), 'a delayed read does not resurrect the clip');
  step('delete_clip followed; a delayed read cannot resurrect it', { listChanges });
  await pause();

  // Markers, the same way: added, renamed and deleted by the second client.
  await session.markers.load();
  const markerReply = await post('set_marker', { location: start, name: 'SDK probe marker' });
  markerRowid = markerReply?.rowid !== undefined ? String(markerReply.rowid) : undefined;
  await settle(async () => session.markers.items.some((m) => m.name.value === 'SDK probe marker'));
  const marker = session.markers.items.find((m) => m.name.value === 'SDK probe marker');
  assert.ok(marker, 'the marker appeared in the live list');
  markerRowid = marker.id;
  await post('set_marker', { rowid: Number(marker.id), location: start, name: 'SDK probe marker renamed' });
  await settle(async () => marker.name.value === 'SDK probe marker renamed');
  assert.equal(marker.name.value, 'SDK probe marker renamed', 'the marker rename followed');
  await post('delete_marker', { rowid: Number(marker.id) });
  await settle(async () => session.markers.byId(markerRowid) === undefined);
  assert.equal(session.markers.byId(markerRowid), undefined, 'the marker left the live list');
  markerRowid = undefined;
  step('set_marker, rename and delete_marker followed', { rowid: marker.id });

  await lane.clips.load();
  assert.equal(lane.clips.items.length, clipsBefore, 'the session has as many clips as it started with');
  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.message ?? err);
} finally {
  if (probeUid) await post('delete_clip', { uid: probeUid }).catch(() => undefined);
  if (markerRowid) await post('delete_marker', { rowid: Number(markerRowid) }).catch(() => undefined);
  await editor.close();
  await watcher.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
