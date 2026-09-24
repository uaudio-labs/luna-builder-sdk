#!/usr/bin/env node
/**
 * The SDK's own edits, verified from a **second client**: each one must be visible to a
 * client that did not make it, must be one undo entry that a single Undo reverses, and must
 * leave the user's edit selection exactly as it found it (fact 74).
 *
 *   node examples/check-editing.mjs
 *   node examples/check-editing.mjs --slow   # pause 3 s per step so editor.html can be watched
 *
 * It adds a MIDI clip and a marker well past the end of the session's content, edits them,
 * and removes everything it created. The undo entries remain: the wire cannot drop them.
 */
import assert from 'node:assert/strict';
import { Luna } from '../dist/index.js';

const B = Luna.TICKS_PER_BEAT;
const slow = process.argv.includes('--slow');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => (slow ? sleep(3000) : Promise.resolve());

const client = await Luna.connect(); // the one doing the editing, through the SDK
const witness = await Luna.connect(); // an independent reader
await client.sessions.ready();
const session = client.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };
const settle = async (predicate) => { for (let i = 0; i < 120 && !(await predicate()); i++) await sleep(25); };
/** What the witness sees at a path, with no model layer in between. */
const read = async (path, props) => (await witness.raw.get(path, { children: false, commands: false, flatvalue: true, propfilter: props }))?.properties ?? {};

let clipUid, markerRowid, lane;
try {
  await session.musical.ready();
  for (const p of session.playlists.items) await p.clips.load();
  await session.markers.load();

  const track = session.visibleTracks.find((t) => t.trackType.value === 'instrument' && session.playlistFor(t)) ?? session.visibleTracks.find((t) => session.playlistFor(t));
  assert.ok(track, 'the session needs a track with an active playlist');
  lane = session.playlistFor(track);

  const end = Math.max(0, ...session.playlists.items.flatMap((p) => p.clips.items).map((c) => c.stop.value ?? 0));
  const start = Math.ceil(end / B / 4) * 4 * B + 8 * B;

  // ── a MIDI clip with three notes ──────────────────────────────────────────────────────
  const created = await lane.createNotes([60, 64, 67].map((pitch, i) => ({ pitch, startTick: start + i * B, stopTick: start + (i + 1) * B })));
  const clip = created.clip;
  clipUid = clip.id;
  const midi = clip.midi;
  const seen = await read(clip.path, ['clip_type', 'start']);
  assert.ok(seen['clip_type'] !== undefined, 'the witness sees the clip the SDK made');
  assert.equal(created.notes.length, 3, 'createNotes handed back the three notes it made');
  assert.deepEqual(created.notes.map((n) => n.pitch).sort((a, b) => a - b), [60, 64, 67], 'at the pitches asked for');
  step('createNotes made the MIDI clip and its notes, visible to a second client', { uid: clipUid, startBeats: start / B });
  await pause();

  // ── velocity: one post, one undo entry, selection untouched ───────────────────────────
  await session.context.refreshSelection();
  const selectionBefore = JSON.stringify(session.context.snapshot());
  const undoBefore = session.changeCount.value;

  const originalVelocities = midi.notes.items.map((n) => n.velocity);
  await midi.setVelocities(midi.notes.items.map((n) => ({ note: n, velocity: 55 })));
  assert.deepEqual(midi.notes.items.map((n) => n.velocity), originalVelocities.map(() => 55), 'every velocity changed');
  await session.context.refreshSelection();
  assert.equal(JSON.stringify(session.context.snapshot()), selectionBefore, 'setVelocities put the selection back');
  step('setVelocities: whole clip in one post, selection restored', { changeCount: session.changeCount.value });
  await pause();

  await session.undo();
  await settle(async () => { await midi.refresh(); return midi.notes.items.every((n) => n.velocity !== 55); });
  assert.deepEqual(midi.notes.items.map((n) => n.velocity), originalVelocities, 'one Undo reversed the whole batch');
  step('one Undo reverses setVelocities entirely', { undoBefore });
  await pause();

  // ── mute: a toggle over the selection, so only the notes that must change are selected ─
  const target = midi.notes.items[1];
  await midi.setMuted([target], true);
  assert.equal(midi.notes.items.filter((n) => n.muted).length, 1, 'exactly one note is muted');
  assert.ok(midi.notes.byId(String(target.rowid)).muted, 'and it is the one asked for');
  await session.context.refreshSelection();
  assert.equal(JSON.stringify(session.context.snapshot()), selectionBefore, 'setMuted put the selection back');
  await session.undo();
  await settle(async () => { await midi.refresh(); return midi.notes.items.every((n) => !n.muted); });
  assert.ok(midi.notes.items.every((n) => !n.muted), 'one Undo unmuted it');
  step('setMuted: one note, selection restored, one Undo reverses it');
  await pause();

  // ── delete notes ──────────────────────────────────────────────────────────────────────
  const doomed = midi.notes.items.at(-1);
  const wasCount = midi.notes.items.length;
  await midi.deleteNotes([doomed]);
  assert.equal(midi.notes.items.length, wasCount - 1, 'the note is gone from the live table');
  assert.equal(midi.notes.byId(String(doomed.rowid)), undefined, 'and gone by row id');
  await session.context.refreshSelection();
  assert.equal(JSON.stringify(session.context.snapshot()), selectionBefore, 'deleteNotes put the selection back');
  await session.undo();
  await settle(async () => { await midi.refresh(); return midi.notes.items.length === wasCount; });
  assert.equal(midi.notes.items.length, wasCount, 'one Undo brought it back');
  step('deleteNotes: one note, selection restored, one Undo reverses it');
  await pause();

  // ── markers ───────────────────────────────────────────────────────────────────────────
  const markersBefore = new Set(session.markers.items.map((m) => m.id));
  await session.addMarker(start, 'SDK edit marker');
  await settle(async () => { await session.markers.reload(); return session.markers.items.some((m) => !markersBefore.has(m.id)); });
  const marker = session.markers.items.find((m) => !markersBefore.has(m.id));
  assert.ok(marker, 'the marker appeared');
  markerRowid = marker.id;

  await marker.rename('SDK edit marker renamed');
  await settle(async () => marker.name.value === 'SDK edit marker renamed');
  const witnessed = await read(marker.path, ['name', 'location']);
  assert.equal(witnessed['name'], 'SDK edit marker renamed', 'the witness sees the rename');

  await marker.moveTo(start + 4 * B);
  await settle(async () => marker.location.value === start + 4 * B);
  assert.equal(marker.location.value, start + 4 * B, 'the nudge landed');
  step('marker: add, rename and move, each visible to a second client', { rowid: markerRowid });
  await pause();

  // ── a batch is one entry ──────────────────────────────────────────────────────────────
  const batchMarkers = new Set(session.markers.items.map((m) => m.id));
  await session.transaction('SDK batch', async () => {
    await session.addMarker(start + 8 * B, 'SDK batch A');
    await session.addMarker(start + 12 * B, 'SDK batch B');
  });
  await settle(async () => { await session.markers.reload(); return session.markers.items.filter((m) => !batchMarkers.has(m.id)).length === 2; });
  assert.equal(session.markers.items.filter((m) => !batchMarkers.has(m.id)).length, 2, 'both markers landed');
  await session.undo();
  await settle(async () => { await session.markers.reload(); return session.markers.items.filter((m) => !batchMarkers.has(m.id)).length === 0; });
  assert.equal(session.markers.items.filter((m) => !batchMarkers.has(m.id)).length, 0, 'one Undo removed both: the batch is one entry');
  step('transaction(): two markers, one undo entry');

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.stack ?? err);
} finally {
  if (markerRowid) await session.markers.byId(markerRowid)?.delete().catch(() => undefined);
  if (clipUid) await lane?.clips.byId(clipUid)?.delete().catch(() => undefined);
  await witness.close();
  await client.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
