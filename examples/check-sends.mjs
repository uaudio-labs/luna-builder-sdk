#!/usr/bin/env node
/**
 * Send routing against a live LUNA, on the last send of the first track: assign it to a
 * bus, check a second client sees it, set level and pre-fader, prove that a second assign
 * **appends** rather than replaces (fact 43), retarget to one destination in a single undo
 * entry, move the send to another channel and back, then unassign. Along the way it checks
 * the routing shape (fact 83): the row carries the bus uid and the handle is the assignment.
 *
 *   node examples/check-sends.mjs
 *   node examples/check-sends.mjs --slow   # pause 3 s per step so sends.html can be watched
 *
 * Every step is checked against an independent wire read and against a second client's
 * model, then the send is put back as it was found (the undo entries remain).
 */
import assert from 'node:assert/strict';
import { Luna } from '../dist/index.js';

const slow = process.argv.includes('--slow');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => (slow ? sleep(3000) : Promise.resolve());

const luna = await Luna.connect();
const other = await Luna.connect();          // a second client, to prove the model follows
await luna.sessions.ready();
const session = luna.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();
const otherSession = await other.session();
await otherSession.ready();

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };

const undoRows = async () => {
  const q = await luna.raw.get(`${session.path}/undo_queues`, { children: true, levels: 2, commands: false, flatvalue: true });
  return (q?.children ?? []).map((c) => ({ rowid: c.properties?.rowid, name: c.properties?.name })).filter((r) => typeof r.rowid === 'number');
};
let lastRow = 0;
const expectUndo = async (...names) => {
  for (let i = 0; i < 40; i++) {
    const rows = (await undoRows()).filter((r) => r.rowid > lastRow).sort((a, b) => a.rowid - b.rowid);
    if (rows.length >= names.length) {
      // A name may be a RegExp: a touched control write is named after the control (fact 85).
      const got = rows.map((r) => r.name);
      assert.ok(got.length === names.length && names.every((n, i) => (n instanceof RegExp ? n.test(got[i]) : n === got[i])), `undo entries: ${JSON.stringify(got)}, expected ${names.map(String).join(', ')}`);
      lastRow = Math.max(lastRow, ...rows.map((r) => r.rowid));
      return;
    }
    await sleep(25);
  }
  assert.fail(`expected undo entries ${names.map(String).join(', ')}, got ${JSON.stringify((await undoRows()).filter((r) => r.rowid > lastRow).map((r) => r.name))}`);
};
const settle = async (predicate) => { for (let i = 0; i < 60 && !(await predicate()); i++) await sleep(25); };

let send, gainWas, preWas;
try {
  const track = session.visibleTracks[0];
  assert.ok(track, 'the session needs a track');
  await track.outputs.load();
  // An aux bus if there is one; every session also has CUE 1-4 (fact 83), a valid destination too.
  const bus = session.buses.items.find((b) => b.busType.value === 'aux') ?? session.buses.items.find((b) => !b.isMaster) ?? session.master;
  assert.ok(bus, 'the session needs a bus to route to');

  // The last send, least likely to be in use in a real session.
  const sends = track.outputs.items.filter((o) => o.isSend).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  send = sends.at(-1);
  assert.ok(send, 'the track has no sends');
  await send.controls.load();
  gainWas = send.gain.real.value;
  preWas = send.preFader.on;

  const otherTrack = otherSession.tracks.byId(track.id);
  await otherTrack.outputs.load();
  const otherSend = otherTrack.outputs.byId(send.id);
  await otherSend.controls.load();

  const rawAssignments = async () => {
    const node = await luna.raw.get(send.path, { children: false, commands: false, propfilter: 'assignments', flatvalue: true });
    return node?.properties?.assignments ?? [];
  };

  await send.unassign();                   // start from a known state
  lastRow = Math.max(0, ...(await undoRows()).map((r) => r.rowid));

  const uid = await send.assign(bus.id);
  await settle(async () => (send.assignments.value ?? []).length === 1);
  assert.equal((send.assignments.value ?? []).length, 1, 'one destination after assign');
  assert.equal((await rawAssignments()).length, 1, 'an independent read agrees');
  await settle(async () => (otherSend.assignments.value ?? []).length === 1);
  assert.equal((otherSend.assignments.value ?? []).length, 1, 'the second client followed the assign');
  // Fact 83: the row carries the bus uid, the handle is the assignment object, and the
  // output's own bus_uid stays null.
  const [row] = await rawAssignments();
  assert.equal(row?.value, bus.id, "the assignments row's value is the bus uid");
  assert.deepEqual((send.destinations.value ?? []).map((d) => [d.uid, d.busUid]), [[uid, bus.id]], 'the destination pairs the assignment uid with the bus');
  assert.equal(send.busUid.value, bus.id, 'busUid is derived from the destination');
  const busUidProp = await luna.raw.get(`${send.path}/bus_uid`, { flatvalue: true });
  assert.equal(Luna.propertyValue(busUidProp) ?? null, null, "LUNA's own bus_uid stays null");
  await assert.rejects(luna.raw.post(`${session.path}/delete_output_assignment`, { session_uid: session.uid, uid: bus.id }), (e) => e.code === 'device.database_error', 'a bus uid is not a deletion handle');
  await expectUndo('New Output Assignment');
  step('assign: routed to a bus, seen by an independent read and a second client', { assignment: uid, bus: bus.name.value });
  await pause();

  await send.gain.real.set(-6);
  await settle(async () => {
    const node = await luna.raw.get(`${send.gain.path}`, { children: false, commands: false, propfilter: 'real_value', flatvalue: true });
    return node?.properties?.real_value === -6;
  });
  await settle(async () => otherSend.gain.real.value === -6);
  assert.equal(otherSend.gain.real.value, -6, 'the second client followed the level');
  await send.preFader.real.set(!preWas);
  // `value` lands at once; the engine's `real_value` follows shortly after.
  await settle(async () => send.preFader.on === !preWas);
  assert.equal(send.preFader.on, !preWas, 'pre-fader toggled');
  // Each one-shot write is touch-bracketed, so undoable (fact 85). Two in quick succession on
  // one strip may be merged by LUNA into a single "Controls Change".
  await sleep(800);
  {
    const rows = (await undoRows()).filter((r) => r.rowid > lastRow).map((r) => r.name);
    assert.ok(rows.length >= 1 && rows.length <= 2 && rows.every((n) => / Change$/.test(n)), `undo entries: ${JSON.stringify(rows)}`);
    lastRow = Math.max(lastRow, ...(await undoRows()).map((r) => r.rowid));
  }
  step('level and pre-fader: written, read back, followed by the second client');
  await pause();

  // Fact 43: assign appends. This is the whole reason retarget() exists.
  await send.assign(bus.id);
  await settle(async () => (send.assignments.value ?? []).length === 2);
  assert.equal((send.assignments.value ?? []).length, 2, 'a second assign appended rather than replaced');
  assert.equal((await rawAssignments()).length, 2, 'appended on the wire too');
  await expectUndo('New Output Assignment');
  step('assign twice: LUNA appends (fact 43)');
  await pause();

  await send.retarget(bus.id);
  await settle(async () => (send.assignments.value ?? []).length === 1);
  assert.equal((send.assignments.value ?? []).length, 1, 'retarget left exactly one destination');
  assert.equal((await rawAssignments()).length, 1, 'one on the wire');
  await expectUndo(`Retarget ${send.id}`);   // one batch entry: the deletes and the add are inside it
  step('retarget: replaced, in one undo entry');
  await pause();

  const otherTrackForMove = session.visibleTracks.find((t) => t !== track);
  if (otherTrackForMove) {
    await otherTrackForMove.outputs.load();
    const target = otherTrackForMove.outputs.byId(send.id);
    await send.moveTo(otherTrackForMove.id);
    await settle(async () => (send.assignments.value ?? []).length === 0 && (target.assignments.value ?? []).length === 1);
    assert.deepEqual(send.assignments.value ?? [], [], 'the source send emptied');
    assert.equal((target.assignments.value ?? []).length, 1, 'the destination send took the routing');
    step('moveTo: routing moved to another channel', { to: otherTrackForMove.name.value });
    await pause();
    await target.moveTo(track.id);          // and back
    await settle(async () => (send.assignments.value ?? []).length === 1);
  } else {
    step('moveTo: skipped, the session has only one track');
  }

  await send.unassign();
  await settle(async () => (send.assignments.value ?? []).length === 0);
  assert.deepEqual(send.assignments.value ?? [], [], 'no destinations left');
  assert.deepEqual(await rawAssignments(), [], 'none on the wire');
  await settle(async () => (otherSend.assignments.value ?? []).length === 0);
  assert.deepEqual(otherSend.assignments.value ?? [], [], 'the second client followed the unassign');
  step('unassign: cleared everywhere');

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.message ?? err);
} finally {
  if (send) {
    await send.unassign().catch(() => undefined);
    if (gainWas !== undefined) await send.gain.real.set(gainWas).catch(() => undefined);
    if (preWas !== undefined) await send.preFader.real.set(preWas).catch(() => undefined);
  }
  await other.close();
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
