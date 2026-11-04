#!/usr/bin/env node
/**
 * Automation against a live LUNA: insert three breakpoints on the first track's main gain,
 * past the end of the session, then move, revalue and delete the middle one, clear the
 * range, and drive the track's automation mode. Every step is checked against an
 * independent wire read and against the undo queue.
 *
 *   node examples/check-automation.mjs
 *   node examples/check-automation.mjs --slow   # pause 3 s per step so automation.html can be watched
 *
 * Leaves the lane empty and the mode and fader as it found them (the undo entries remain).
 * Creates no tracks.
 *
 * It does NOT check that the fader follows the lane during playback: only ticks, values,
 * structure and undo. The SDK's lane is addressed by tick, not by breakpoint object, so
 * `move`, `setValue` and `clear` all take ticks.
 */
import assert from 'node:assert/strict';
import { Luna } from '../sdk/index.js';

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

/** The undo queue, newest last. Not modelled by the SDK, so read raw. */
const undoRows = async () => {
  const q = await luna.raw.get(`${session.path}/undo_queues`, { children: true, levels: 2, commands: false, flatvalue: true });
  return (q?.children ?? [])
    .map((c) => ({ rowid: c.properties?.rowid, name: c.properties?.name }))
    .filter((r) => typeof r.rowid === 'number')
    .sort((a, b) => a.rowid - b.rowid);
};
let lastRow = 0;
const fresh = async (want = 1) => {
  for (let i = 0; i < 40; i++) {
    const rows = await undoRows();
    const f = rows.filter((r) => r.rowid > lastRow).map((r) => r.name);
    if (f.length >= want) { lastRow = Math.max(lastRow, ...rows.map((r) => r.rowid)); return f; }
    await sleep(25);
  }
  const rows = await undoRows();
  lastRow = Math.max(lastRow, ...rows.map((r) => r.rowid));
  return [];
};

let track, lane, startMode, startValue;
const base = 400 * B;   // well past the end of any real session content
try {
  track = session.visibleTracks[0];
  assert.ok(track, 'the session needs a track');
  await track.loadStrip();
  lane = track.gain.automation;
  await lane.load();
  startMode = track.automationMode.value ?? 'read';
  startValue = track.gain.real.value;

  // Start from a clean range, and from the current end of the undo queue.
  await lane.clear(base - B, base + 100 * B).catch(() => undefined);
  lastRow = Math.max(0, ...(await undoRows()).map((r) => r.rowid));

  /** The lane's ticks past `base`, read independently of the model. */
  const wireTicks = async () => {
    const node = await luna.raw.get(`${track.gain.path}/automation`, { children: true, levels: 3, commands: false, flatvalue: true });
    return (node?.children ?? []).map((c) => c.properties?.start).filter((t) => typeof t === 'number' && t >= base).sort((a, b) => a - b);
  };
  const laneTicks = () => lane.breakpoints.map((b) => b.tick).filter((t) => t >= base).sort((a, b) => a - b);
  const settle = async (predicate) => { for (let i = 0; i < 40 && !(await predicate()); i++) await sleep(25); };

  await lane.insert([{ tick: base, value: -6 }, { tick: base + 8 * B, value: 0 }, { tick: base + 4 * B, value: -3 }]);
  await settle(async () => laneTicks().length === 3);
  assert.deepEqual(laneTicks(), [base, base + 4 * B, base + 8 * B], 'the live lane lists three breakpoints in tick order');
  assert.deepEqual(await wireTicks(), [base, base + 4 * B, base + 8 * B], 'an independent read agrees');
  assert.deepEqual(await fresh(), ['Edit Automation']);
  step('insert: three breakpoints, live and on an independent read, one "Edit Automation"', { beats: laneTicks().map((t) => t / B) });
  await pause();

  await lane.move(base + 4 * B, base + 6 * B);
  await settle(async () => laneTicks().includes(base + 6 * B));
  assert.deepEqual(laneTicks(), [base, base + 6 * B, base + 8 * B], 'the moved breakpoint sits at its new tick');
  assert.ok((await wireTicks()).includes(base + 6 * B), 'the move is on the wire');
  assert.deepEqual(await fresh(), ['Move Break Point']);
  step('move: one "Move Break Point"');
  await pause();

  await lane.setValue(base + 6 * B, -9);
  await settle(async () => lane.breakpoints.some((b) => b.tick === base + 6 * B));
  const moved = lane.items.find((b) => b.start.value === base + 6 * B);
  assert.ok(moved, 'the revalued breakpoint is still listed');
  const wireValue = await luna.raw.get(moved.path, { children: false, commands: false, propfilter: 'value', flatvalue: true });
  assert.equal(moved.value.value, wireValue?.properties?.value, "the view holds LUNA's stored value");
  assert.deepEqual(await fresh(), ['Trim Break Points']);
  step('setValue: trim_bp honoured (the fader taper re-quantizes the value), one "Trim Break Points"', { stored: moved.value.value });
  await pause();

  await lane.clear(base + 6 * B, base + 6 * B);
  await settle(async () => !laneTicks().includes(base + 6 * B));
  assert.deepEqual(laneTicks(), [base, base + 8 * B], 'gone from the live lane');
  assert.ok(!(await wireTicks()).includes(base + 6 * B), 'gone on an independent read');
  assert.deepEqual(await fresh(), ['Delete Break Point']);
  step('clear at one tick: gone from the lane and the wire, one "Delete Break Point"');
  await pause();

  await lane.clear(1_000 * B, 1_010 * B);   // an empty range: a no-op
  await lane.clear(base - B, base + 100 * B);
  await settle(async () => laneTicks().length === 0);
  assert.deepEqual(laneTicks(), [], 'the range is empty');
  assert.deepEqual(await wireTicks(), [], 'and empty on an independent read');
  assert.deepEqual(await fresh(), ['Delete Break Point']);
  step('clear a range: emptied (an empty range is a no-op), one "Delete Break Point"');
  await pause();

  await track.setAutomationMode('touch');
  await settle(async () => track.automationMode.value === 'touch');
  assert.equal(track.automationMode.value, 'touch');
  const wireMode = await luna.raw.get(track.path, { children: false, commands: false, propfilter: 'automation_mode', flatvalue: true });
  assert.equal(wireMode?.properties?.automation_mode, 'touch', 'the mode is on the wire');
  // The command takes the ordinal; the property is the string form (fact 31).
  assert.deepEqual(await luna.raw.post(`${session.path}/get_automode_on_tracks`, { uid: session.uid, tracks: [track.id] }), [3]);
  await track.setAutomationMode('latch');
  await settle(async () => track.automationMode.value === 'latch');
  assert.deepEqual(await luna.raw.post(`${session.path}/get_automode_on_tracks`, { uid: session.uid, tracks: [track.id] }), [4]);
  step('mode: the property and set/get_automode agree', { restoring: startMode });
  await pause();

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.message ?? err);
} finally {
  if (lane) await lane.clear(base - B, base + 100 * B).catch(() => undefined);
  if (track && startMode) await track.setAutomationMode(startMode).catch(() => undefined);
  if (track && startValue !== undefined) await track.gain.real.set(startValue).catch(() => undefined);
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
