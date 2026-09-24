#!/usr/bin/env node
/**
 * MIDI reading against a live LUNA (facts 39-41): a scratch instrument track is created, a
 * MIDI clip is drawn on it, and notes are then created, revalued, muted and deleted
 * **through LUNA's own edit-context commands** — not through the SDK — so the read layer
 * has to follow every delta.
 *
 *   node examples/check-midi.mjs
 *   node examples/check-midi.mjs --slow   # pause 3 s per step so pianoroll.html can be watched
 *
 * The track it creates is deleted at the end. The SDK models MIDI reading, not note
 * editing, so the edit commands here go through `luna.raw` — which is exactly the shape the
 * add-feature skill describes.
 */
import assert from 'node:assert/strict';
import { Luna } from '../dist/index.js';

const B = Luna.TICKS_PER_BEAT;
const slow = process.argv.includes('--slow');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => (slow ? sleep(3000) : Promise.resolve());

const luna = await Luna.connect();
await luna.sessions.ready();
const session = luna.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };
const settle = async (predicate) => { for (let i = 0; i < 80 && !(await predicate()); i++) await sleep(25); };
const post = (command, payload) => luna.raw.post(`${session.path}/${command}`, { session_uid: session.uid, ...payload });

let trackUid;
try {
  // A scratch instrument track, so nothing in the user's session is touched.
  await session.newTrack({ name: `SDK MIDI check ${Date.now() % 10000}`, trackType: 'instrument', stemFormat: 'stereo' });
  await settle(async () => {
    await luna.store.load(session.tracks.path, { levels: 2, commands: false, flatvalue: true });
    return session.tracks.refresh().some((t) => (t.name.value ?? '').startsWith('SDK MIDI check'));
  });
  const track = session.tracks.items.find((t) => (t.name.value ?? '').startsWith('SDK MIDI check'));
  assert.ok(track, 'the scratch instrument track appeared');
  trackUid = track.id;
  await session.playlists.load();
  const lane = session.playlistFor(track);
  assert.ok(lane, 'the scratch track has a playlist');
  step('new_track instrument appeared with its playlist', { trackUid, playlist: lane.id });
  await pause();

  // LUNA's own create_note makes the clip as well as the notes, one note per beat.
  await lane.clips.load();
  const created = await lane.createNotes([60, 62, 64, 65].map((pitch, i) => ({ pitch, startTick: i * B, stopTick: (i + 1) * B })));
  const clip = created.clip;
  assert.ok(clip, 'the MIDI clip appeared');
  assert.equal(clip.clipType.value, 'midi', 'and it is a MIDI clip');
  const midi = clip.midi;
  await midi.ready();

  /** The table, read independently of the model, as clip-relative rows. */
  const wireRows = async () => {
    const node = await luna.raw.get(`${clip.path}/midi/table`, { children: false, commands: false, propfilter: 'row_data', flatvalue: true });
    const table = node?.properties?.row_data ?? { row_ids: [] };
    const origin = clip.midiSourceStart.value ?? 0;
    return (table.row_ids ?? []).map((rowid, i) => {
      const packed = table.midi_data?.[i] ?? 0;
      return { rowid, tick: (table.tick?.[i] ?? 0) - origin, status: (packed >>> 16) & 0xff, data1: (packed >>> 8) & 0x7f, data2: packed & 0x7f, enabled: table.enabled?.[i] !== false };
    }).sort((a, b) => a.tick - b.tick || a.rowid - b.rowid);
  };
  const same = async (what) => {
    const rows = await wireRows();
    const ours = midi.events.items.map((e) => ({ rowid: e.rowid, tick: e.tick, status: e.status, data1: e.data1, data2: e.data2, enabled: e.enabled }));
    assert.deepEqual(ours, rows, `${what}: the model differs from the table`);
    return rows.length;
  };

  await settle(async () => midi.notes.items.length === 4);
  assert.deepEqual(
    midi.notes.items.map((n) => [n.pitch, n.startTick / B, n.stopTick / B]),
    [[60, 0, 1], [62, 1, 2], [64, 2, 3], [65, 3, 4]],
    'four notes paired at one per beat',
  );
  step('create_note: four notes paired, equal to an independent table read', { rows: await same('create') });
  await pause();

  // change_velocity on the first note.
  const first = midi.notes.items[0];
  await post('contexts/main/commands/change_velocity', { velocity_on: true, notes: [{ rowid: first.rowid, velocity: 40 }] });
  await settle(async () => midi.notes.byId(String(first.rowid))?.velocity === 40);
  assert.equal(midi.notes.byId(String(first.rowid)).velocity, 40, 'the velocity change followed');
  step('change_velocity followed', { rows: await same('velocity') });
  await pause();

  // mute_notes is a toggle over the context selection (fact 74). `setMuted` selects exactly
  // the notes whose state must change, posts once, and puts the user's selection back.
  const target = midi.notes.items[1];
  await midi.setMuted([target], true);
  assert.ok(midi.notes.byId(String(target.rowid)).muted, 'the note the SDK asked for is muted');
  assert.equal(midi.notes.items.filter((n) => n.muted).length, 1, 'and only that one');
  step('setMuted followed through mute_notes on a selection it made and restored', {
    muted: midi.notes.items.filter((n) => n.muted).length, rows: await same('mute'),
  });
  await pause();

  // add_midi through the SDK: a controller row, and a note closed by a velocity-0 note-on.
  await clip.addMidi([
    { tick: 0, status: 0xb0, data1: 7, data2: 100 },
    { tick: 4 * B, status: 0x90, data1: 67, data2: 90 },
    { tick: 5 * B, status: 0x90, data1: 67, data2: 0 },
  ]);
  await settle(async () => midi.notes.items.length === 5);
  const controllers = midi.events.items.filter((e) => (e.status & 0xf0) === 0xb0);
  assert.equal(controllers.length, 1, 'the controller row is listed as an event, not a note');
  assert.equal(midi.notes.items.at(-1).stopTick, 5 * B, 'a note-on with velocity 0 closes the note');
  step('add_midi: a controller row and a velocity-0 note-off followed', { rows: await same('add_midi') });
  await pause();

  // A move must not change clip-relative ticks (fact 41).
  const beforeMove = midi.notes.items.map((n) => n.startTick);
  await session.moveClips(2 * B, { startTick: 0, stopTick: 4 * B, trackUids: [trackUid] });
  await settle(async () => (clip.start.value ?? 0) !== 0);
  await settle(async () => midi.notes.items.length === 5);
  assert.deepEqual(midi.notes.items.map((n) => n.startTick), beforeMove, 'ticks stay clip-relative through a move');
  step('move_clips kept clip-relative ticks', { clipStartBeats: (clip.start.value ?? 0) / B });

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.message ?? err);
} finally {
  if (trackUid) await session.deleteTracks([trackUid]).catch(() => undefined);
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
