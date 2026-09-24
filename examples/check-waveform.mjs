#!/usr/bin/env node
/**
 * Waveform placement against LUNA's own answers (facts 72-73).
 *
 * Writes a 2 s mono 48 kHz ramp (sample i = i/N) to a temp file, uploads it into the open
 * session's package, and on the first audio track's active playlist inserts two clips past
 * the end of the session:
 *   - "direct": 1 s of the ramp (0.5-1.5 s) on a tick span of exactly 1 s at the session
 *     tempo, so LUNA plays the source itself;
 *   - "stretched": the same second on half those ticks, so LUNA renders it time-compressed.
 *
 * Then it checks that `session.sources` saw the upload and the render without a refresh,
 * that `clipAudio` picks the source for one and the render for the other, that the pairs
 * `Waveforms.range` returns follow the ramp (so a pair really is 125 engine samples), that
 * `audioNsAtTick` through the tempo map agrees with `get_clip_info`'s `full_start_time`, and
 * that fine and coarse pairs bracket the ramp at three zoom levels. Both clips and both
 * files are removed afterwards; the undo entries remain.
 *
 *   node examples/check-waveform.mjs
 *   node examples/check-waveform.mjs --slow   # pause 4 s per clip so arrangement.html can be watched
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Luna } from '../dist/index.js';

const B = Luna.TICKS_PER_BEAT;
const slow = process.argv.includes('--slow');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pause = () => (slow ? sleep(4000) : Promise.resolve());
async function until(what, condition, ms = 10000) {
  const deadline = Date.now() + ms;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

/** A mono 16-bit WAV whose samples rise linearly from 0 to full scale. */
function rampWav(path, sampleRate = 48000, seconds = 2) {
  const n = sampleRate * seconds;
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.round((i / n) * 32767), i * 2);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([header, data]));
  return n;
}

const dir = mkdtempSync(join(tmpdir(), 'ua-waveform-'));
const wav = join(dir, 'ramp-48000-mono-2s.wav');
const N = rampWav(wav);

const luna = await Luna.connect(); // the model under test
const other = await Luna.connect(); // a second client, doing the edits
await luna.sessions.ready();
const session = luna.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };
const post = (command, payload) => other.raw.post(`${session.path}/${command}`, { session_uid: session.uid, ...payload });

const files = [];
const clips = [];
try {
  await session.musical.ready();
  for (const p of session.playlists.items) await p.clips.load();
  await session.sources.load();
  const t = session.musical.timeline;
  const track = session.visibleTracks.find((c) => c.trackType.value === 'audio' && session.playlistFor(c));
  assert.ok(track, 'the session needs an audio track with an active playlist');
  const lane = session.playlistFor(track);
  const last = Math.max(session.transport.maxTick.value ?? 0, ...session.playlists.items.flatMap((p) => p.clips.items).map((c) => c.stop.value ?? 0));
  const base = Math.ceil(last / B / 4) * 4 * B + 16 * B;

  // ── upload: the live sources list must see it ─────────────────────────────────────────
  const uploaded = await session.uploadFile({ bytes: new Uint8Array(readFileSync(wav)), name: 'sdk-ramp.wav' });
  files.push(uploaded.id);
  const source = session.sources.byId(uploaded.id);
  assert.ok(source, 'the uploaded source is not in session.sources');
  assert.equal(source.sampleRate.value, 48000, 'the source kept its sample rate');
  assert.equal(source.length.value, 2e9, 'the source is 2 s');
  let info;
  for (let i = 0; i < 40 && !(info = await source.overviewInfo()); i++) await sleep(50);
  assert.ok(info, 'the source has no overview analysis');
  assert.equal(info.count, 768, 'a 2 s file is 768 fine pairs (2.604 ms each), whatever its own rate');
  assert.equal((await source.overviewInfo({ kind: 'coarse' })).count, 64, 'and 64 coarse pairs');
  step('upload appeared in session.sources without a refresh; 2 s = 768 fine / 64 coarse pairs', { uid: uploaded.id, count: info.count });

  // ── direct clip: 1 s of source on exactly 1 s of ticks ────────────────────────────────
  const oneSecondTicks = Math.round(t.tickAtSeconds(t.seconds(base) + 1)) - base;
  const direct = await post('insert_clip', { playlist_uid: lane.id, source_uid: uploaded.id, name: 'SDK direct', start: base, stop: base + oneSecondTicks, source_start: 500_000_000, source_stop: 1_500_000_000 });
  clips.push(direct?.uid);
  await until('the direct clip', () => lane.clips.byId(direct.uid)?.stop.value !== undefined);
  await sleep(300);
  const dClip = lane.clips.byId(direct.uid);
  assert.notEqual(dClip.renderState.value, 'current', 'an exactly matched span plays the source directly');
  const dAudio = Luna.clipAudio(dClip, session.sources);
  assert.ok(dAudio && !dAudio.stretched && dAudio.source.id === uploaded.id, 'clipAudio picks the source, not a render');

  const cache = new Luna.Waveforms();
  const range = await cache.range(dAudio.source, dAudio.startNs, dAudio.stopNs, 'fine');
  assert.deepEqual({ index: range.index, count: range.count, complete: range.complete, channels: range.channels.length }, { index: 192, count: 384, complete: true, channels: 1 });
  let worst = 0;
  for (let i = 0; i < range.count; i++) {
    const pair = range.index + i;
    worst = Math.max(worst, Math.abs(range.channels[0].min[i] - (pair * 125) / N), Math.abs(range.channels[0].max[i] - ((pair + 1) * 125 - 1) / N));
  }
  assert.ok(worst < 2 / 768, `pairs follow the ramp at 125 samples each (worst error ${worst})`);
  step('direct clip: source pairs 192-575 follow the ramp, so a pair is 125 engine samples', { worstError: worst });
  await pause();

  // ── placement oracle: get_clip_info's full_start_time against the timeline ────────────
  const dInfo = await post('get_clip_info', { clip_uid: direct.uid });
  const cc = dInfo.compiled_clips[0];
  const sdkStartNs = t.seconds(base) * 1e9;
  assert.ok(Math.abs(sdkStartNs - cc.full_start_time) <= 1000, `clip start: SDK ${sdkStartNs} ns vs LUNA ${cc.full_start_time} ns`);
  assert.equal(cc.source_start_samples, 24000, 'the source offset is the engine-rate sample count');
  assert.equal(cc.has_tce, false, 'no time compression on an exactly matched span');
  const halfway = Math.round(t.tickAtSeconds(t.seconds(base) + 0.5));
  const nsAtHalf = Luna.audioNsAtTick(t, dClip, dAudio, halfway);
  assert.ok(Math.abs(nsAtHalf - 1_000_000_000) <= 2000, `audioNsAtTick halfway lands at 1.0 s of source, got ${nsAtHalf}`);
  step('tick → seconds agrees with get_clip_info; audioNsAtTick lands 0.5 s in at 1.0 s of source', { sdkStartNs, lunaStartNs: cc.full_start_time });

  // ── three zoom levels: each pixel column must read a pair that brackets the ramp ──────
  const zooms = { session: last + 32 * B, eightBars: 32 * B, oneBar: 4 * B };
  const zoomReport = {};
  for (const [name, spanTicks] of Object.entries(zooms)) {
    const nsPerPixel = (t.seconds(spanTicks) - t.seconds(0)) * 1e9 / 1000;
    const kind = Luna.kindForScale(nsPerPixel);
    const r = await cache.range(dAudio.source, dAudio.startNs, dAudio.stopNs, kind);
    const columns = Math.max(1, Math.round((oneSecondTicks / spanTicks) * 1000));
    let checked = 0, overshoot = 0;
    for (let px = 0; px < columns; px++) {
      const ns = Luna.audioNsAtTick(t, dClip, dAudio, base + (px / columns) * oneSecondTicks);
      const pair = Math.floor(ns / r.pairNs) - r.index;
      if (pair < 0 || pair >= r.count) continue;
      const value = ns / 2e9; // the ramp at that instant
      overshoot = Math.max(overshoot, Math.max(0, r.channels[0].min[pair] - value, value - r.channels[0].max[pair]));
      checked++;
    }
    assert.ok(checked > 0 && overshoot <= 1 / 768, `${name}: ${kind} pairs bracket the ramp (max overshoot ${overshoot})`);
    zoomReport[name] = { kind, columns: checked, pairs: r.count, nsPerPixel, maxOvershoot: overshoot };
  }
  // Which analysis each zoom lands on depends on how long the session is, so assert the rule
  // rather than the outcome: coarse once a pixel spans a coarse pair, fine when closer in.
  for (const [name, z] of Object.entries(zoomReport)) {
    assert.equal(z.kind, z.nsPerPixel >= Luna.COARSE_PAIR_NS ? 'coarse' : 'fine', `${name} picked the analysis its scale calls for`);
  }
  assert.equal(zoomReport.oneBar.kind, 'fine', 'one bar always zooms in to the fine analysis');
  assert.ok(zoomReport.session.nsPerPixel > zoomReport.oneBar.nsPerPixel, 'the whole session is the widest of the three');
  step('three zoom levels: every pixel column reads a pair bracketing the ramp at that instant', zoomReport);

  // ── stretched clip: LUNA renders, and the render is what to draw ──────────────────────
  // Half the ticks the second of source needs, so the span cannot match at any tempo.
  const stretchStart = base + 8 * B;
  const stretchStop = stretchStart + Math.round(oneSecondTicks / 2);
  const stretched = await post('insert_clip', { playlist_uid: lane.id, source_uid: uploaded.id, name: 'SDK stretched', start: stretchStart, stop: stretchStop, source_start: 500_000_000, source_stop: 1_500_000_000 });
  clips.push(stretched?.uid);
  await until('the stretched clip', () => lane.clips.byId(stretched.uid) !== undefined);
  const sClip = lane.clips.byId(stretched.uid);
  await until('render_state current', () => sClip.renderState.value === 'current' && sClip.renderSourceUid.value);
  const renderUid = sClip.renderSourceUid.value;
  files.push(renderUid);
  const named = Date.now();
  // The render is usually announced the instant it is named; clipAudio is undefined only in that gap.
  const pendingAtFirstLook = Luna.clipAudio(sClip, session.sources) === undefined;
  await until('the render in session.sources', () => session.sources.byId(renderUid) !== undefined, 20000);
  const announcedAfterMs = Date.now() - named;
  const sAudio = Luna.clipAudio(sClip, session.sources);
  assert.ok(sAudio?.stretched && sAudio.source.id === renderUid, 'clipAudio picks the render for a stretched clip');
  const sInfo = await post('get_clip_info', { clip_uid: stretched.uid });
  const scc = sInfo.compiled_clips[0];
  assert.equal(scc.has_tce, true, 'LUNA reports time compression on it');
  assert.equal(sAudio.source.length.value, scc.full_length_time, 'the render is exactly the clip span, so its overview maps linearly');
  let renderInfo;
  for (let i = 0; i < 100 && !(renderInfo = await sAudio.source.overviewInfo()); i++) await sleep(100);
  assert.ok(renderInfo, 'the render has no overview');
  assert.ok(Math.abs(renderInfo.count - Luna.pairRange(0, scc.full_length_time).count) <= 1, `render pairs ${renderInfo.count} vs span ${Luna.pairRange(0, scc.full_length_time).count}`);
  const rr = await cache.range(sAudio.source, 0, sAudio.stopNs, 'fine');
  // The stretcher reshapes a DC ramp, so only check that the render is complete and carries
  // signal that rises: its content is the engine's, not the source's.
  const peak = Math.max(...rr.channels[0].max);
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const quarter = Math.max(1, rr.count >> 2);
  assert.ok(rr.complete && rr.count === renderInfo.count, 'the render overview is complete');
  assert.ok(peak > 0.3 && mean(rr.channels[0].max.slice(-quarter)) > mean(rr.channels[0].max.slice(0, quarter)), `the render holds rising signal (peak ${peak})`);
  step('stretched clip: LUNA renders it, session.sources sees the render, its overview spans the clip exactly', {
    renderUid, pendingAtFirstLook, announcedAfterMs, renderPairs: renderInfo.count, spanNs: scc.full_length_time, renderPeak: peak,
  });
  await pause();

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.stack ?? err);
} finally {
  for (const uid of clips) if (uid) await post('delete_clip', { uid }).catch(() => undefined);
  if (files.length) {
    await other.raw.post('/workspace/delete_audio_files', { session_package_uid: session.sessionPackageUid.value, files, move_to_trash: true }).catch(() => undefined);
  }
  try {
    await until('the sources to go', () => files.every((uid) => session.sources?.byId(uid) === undefined), 5000);
    result.cleanedUp = true;
  } catch {
    result.cleanedUp = false;
  }
  rmSync(dir, { recursive: true, force: true });
  await other.close();
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
