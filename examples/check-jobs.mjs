#!/usr/bin/env node
/**
 * Bounce and export against a live LUNA (fact 44): an offline bounce of one track over a
 * bar range, LUNA's own main-bus export, and a real-time bounce aborted part way.
 *
 *   node examples/check-jobs.mjs
 *
 * Cleans up after itself: the renders it started are deleted, the audio it added is moved
 * to the trash, and the timeline selection is put back.
 */
import assert from 'node:assert/strict';
import { statSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Luna } from '../dist/index.js';

const B = Luna.TICKS_PER_BEAT;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const luna = await Luna.connect();
await luna.sessions.ready();
const session = luna.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();
await luna.renders.watch().ready;   // /renders is outside the session watch (fact 34)

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };

const startedRenders = [];
const addedSources = [];
let selection;
try {
  const track = session.visibleTracks[0];
  assert.ok(track, 'the session needs a track');
  await session.contexts.load();
  selection = { start: session.context.selectionStart.value, stop: session.context.selectionStop.value };
  const timeline = session.musical.timeline;
  await session.musical.ready();
  const range = { startTick: timeline.tickAt({ bar: 1 }), stopTick: timeline.tickAt({ bar: 3 }) };
  const playStart = session.transport.playStart.value ?? 0;
  await session.sources?.load();
  const sourcesBefore = new Set((session.sources?.items ?? []).map((s) => s.id));

  // 1. An offline bounce, added to the session as a source.
  const seen = [];
  const bounce = await session.bounce({ channelUids: [track.id], name: 'SDK check bounce', range });
  startedRenders.push(bounce.render.id);
  const offProgress = bounce.render.percentComplete.onChange(() => seen.push(bounce.render.percentComplete.value));
  await bounce.render.done();
  offProgress();
  assert.equal(bounce.render.state.value, 'completed', 'the bounce completed');
  // After a render the engine sits at the range end; put the playhead back so lanes re-read.
  await session.transport.seek(playStart + B);
  await session.transport.seek(playStart);
  // The rendered audio lands in the session's source list shortly after.
  for (let i = 0; i < 100; i++) {
    // Collection.load() is once-only, so re-read the folder itself.
    await luna.store.load(session.sources.path, { levels: 2, commands: false, flatvalue: true });
    session.sources.refresh();
    if (session.sources.items.some((s) => !sourcesBefore.has(s.id))) break;
    await sleep(100);
  }
  const added = (session.sources?.items ?? []).filter((s) => !sourcesBefore.has(s.id));
  addedSources.push(...added.map((s) => s.id));
  assert.ok(added.length >= 1, 'the bounce added a source to the session');
  const seconds = (added[0].length.value ?? 0) / 1e9;
  const expected = timeline.seconds(range.stopTick) - timeline.seconds(range.startTick);
  assert.ok(Math.abs(seconds - expected) < 0.25, `the source is about the range length (${seconds.toFixed(3)} s vs ${expected.toFixed(3)} s)`);
  step('offline bounce: completed, source listed at the range length', {
    render: bounce.render.id, seconds: Number(seconds.toFixed(3)), progressUpdates: seen.length,
  });

  // 2. LUNA's own export of the main bus.
  const exported = await session.exportMain({ name: 'SDK check export', range });
  startedRenders.push(exported.render.id);
  let exportOutcome = 'completed';
  // A short offline export can finish and be dropped before it is observed (fact 44).
  await exported.render.done().catch((e) => { exportOutcome = e.code; });
  assert.ok(exported.file, 'the export reply carried a path');
  let bytes;
  for (let i = 0; i < 50; i++) {
    try { bytes = statSync(exported.file).size; break; } catch { await sleep(100); }
  }
  assert.ok(bytes > 0, `the export wrote ${exported.file}`);
  step("export: LUNA's own export wrote the file", { file: exported.file, bytes, outcome: exportOutcome });

  // 3. A real-time bounce, aborted part way, writing to a path so nothing is added.
  const out = join(tmpdir(), `ua-builder-check-${Date.now()}.wav`);
  const realtime = await session.bounce({
    channelUids: [track.id], name: 'SDK check abort', realTime: true, outputPaths: [out], range: { startTick: 0, stopTick: 16 * B },
  });
  startedRenders.push(realtime.render.id);
  const settled = realtime.render.done();
  let during = realtime.render.state.value;
  await sleep(400);
  during = realtime.render.state.value;
  await realtime.render.abort();
  let rejected;
  await settled.catch((e) => { rejected = e.code; });
  assert.ok(rejected === 'aborted' || rejected === 'removed', `done() rejected with ${rejected}`);
  await realtime.render.delete().catch(() => undefined);
  let partial = true;
  try { statSync(out); } catch { partial = false; }
  if (partial) unlinkSync(out);
  step('real-time bounce aborted, then deleted from the list', { during, rejected, partialFileLeft: partial });

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.message ?? err);
} finally {
  for (const uid of startedRenders) await luna.raw.post('/renders/delete', { uid }).catch(() => undefined);
  if (addedSources.length) {
    await luna.raw.post('/workspace/delete_audio_files', {
      session_package_uid: session.sessionPackageUid.value, files: addedSources, move_to_trash: true,
    }).catch(() => undefined);
  }
  if (selection?.start !== undefined && selection?.start !== null) {
    await session.context.select({ startTick: selection.start, stopTick: selection.stop }).catch(() => undefined);
  }
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
