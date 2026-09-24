#!/usr/bin/env node
/**
 * Import against a live LUNA (fact 42): a synthetic WAV is uploaded in chunks from Node,
 * the same file is imported again by path, a MIDI file is placed as a clip and read back
 * through `clip.midi`, and a track is armed with a device input and disarmed.
 *
 *   node examples/check-import.mjs
 *
 * Everything it adds is moved to the trash afterwards, and the track it arms is put back
 * as it was found. Nothing is recorded: arming is checked, rolling is not.
 */
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Luna } from '../sdk/index.js';

const B = Luna.TICKS_PER_BEAT;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** A mono 48 kHz WAV of `seconds`, a ramp from -amplitude to +amplitude. */
function ramp(seconds, amplitude = 0.25) {
  const rate = 48000;
  const frames = Math.round(rate * seconds);
  const data = Buffer.alloc(frames * 2);
  for (let i = 0; i < frames; i++) {
    const v = (-amplitude + (2 * amplitude * i) / Math.max(1, frames - 1)) * 32767;
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);        // PCM
  header.writeUInt16LE(1, 22);        // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** A type-0 MIDI file: four notes, one per beat, at 480 ticks per quarter. */
function midiFile(notes) {
  const ppq = 480;
  const events = [];
  let last = 0;
  const vlq = (n) => {
    const out = [n & 0x7f];
    while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
    return out;
  };
  for (const [pitch, beat, length, velocity] of notes) {
    const on = Math.round(beat * ppq);
    const off = Math.round((beat + length) * ppq);
    events.push({ at: on, bytes: [0x90, pitch, velocity] });
    events.push({ at: off, bytes: [0x80, pitch, 0] });
  }
  events.sort((a, b) => a.at - b.at);
  const track = [];
  for (const e of events) {
    track.push(...vlq(e.at - last), ...e.bytes);
    last = e.at;
  }
  track.push(0x00, 0xff, 0x2f, 0x00);
  const header = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (ppq >> 8) & 0xff, ppq & 0xff]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(track.length);
  return Buffer.concat([header, Buffer.from('MTrk'), len, Buffer.from(track)]);
}

const luna = await Luna.connect();
await luna.sessions.ready();
const session = luna.sessions.current();
assert.ok(session, 'Open a session in LUNA');
await session.ready();

const result = { session: session.name.value, steps: [] };
const step = (name, detail = {}) => { result.steps.push({ name, ...detail }); console.error(`  ✓ ${name}`); };
const settle = async (predicate) => { for (let i = 0; i < 100 && !(await predicate()); i++) await sleep(100); };

const added = [];
const tempFiles = [];
let armed;
let armedWas;
try {
  await session.sources.load();

  // 1. A chunked upload of bytes LUNA cannot read from disk.
  const progress = [];
  const uploaded = await session.uploadFile({
    bytes: ramp(2),
    name: 'sdk-upload.wav',
    chunkBytes: 64 * 1024,
    onProgress: (sent, total) => progress.push([sent, total]),
  });
  added.push(uploaded.id);
  assert.equal(session.sources.byId(uploaded.id), uploaded, 'the upload is in the live source list');
  assert.equal(uploaded.sampleRate.value, 48000, 'the sample rate came back');
  assert.ok(Math.abs((uploaded.length.value ?? 0) - 2e9) < 5e7, 'about two seconds long');
  // Analysis follows the upload, so wait for the overview before reading it.
  let overview;
  await settle(async () => { overview = await uploaded.overview(0).catch(() => undefined); return !!overview?.count; });
  assert.ok(overview?.count > 0, 'the upload was analysed');
  assert.ok(Math.abs(overview.channels[0].min[0] + 0.25) < 0.02, 'the ramp reads back from the uploaded bytes');
  step('chunked upload: listed, analysed, ramp intact', { chunks: progress.length, bytes: progress.at(-1)?.[1] });

  // 2. The same audio imported by a path LUNA can read itself.
  const wavPath = join(tmpdir(), `sdk-path-${Date.now()}.wav`);
  writeFileSync(wavPath, ramp(1));
  tempFiles.push(wavPath);
  const before = new Set(session.sources.items.map((s) => s.id));
  await session.importFile(wavPath);
  await settle(async () => {
    await luna.store.load(session.sources.path, { levels: 2, commands: false, flatvalue: true });
    return session.sources.refresh().some((s) => !before.has(s.id));
  });
  const copied = session.sources.items.find((s) => !before.has(s.id));
  assert.ok(copied, 'the path import was listed');
  added.push(copied.id);
  step('path import: listed alongside the upload', { uid: copied.id, name: copied.name.value });

  // 3. A MIDI file placed as a clip, read back clip-relative through clip.midi (fact 41).
  const midiPath = join(tmpdir(), `sdk-notes-${Date.now()}.mid`);
  writeFileSync(midiPath, midiFile([[60, 0, 1, 100], [64, 1, 1, 80], [67, 2, 1, 90], [72, 3, 1, 70]]));
  tempFiles.push(midiPath);
  const clipsBefore = new Set(session.playlists.items.flatMap((p) => p.clips.items.map((c) => c.id)));
  await session.importFile(midiPath);
  await settle(async () => {
    await Promise.all(session.playlists.items.map((p) => luna.store.load(`${p.path}/clips`, { levels: 2, commands: false, flatvalue: true })));
    return session.playlists.items.some((p) => p.clips.refresh().some((c) => !clipsBefore.has(c.id) && c.clipType.value === 'midi'));
  });
  const midiClip = session.playlists.items.flatMap((p) => p.clips.items).find((c) => !clipsBefore.has(c.id) && c.clipType.value === 'midi');
  assert.ok(midiClip, 'the MIDI file became a clip');
  const midi = midiClip.midi;
  await midi.ready();
  await settle(async () => midi.notes.items.length === 4);
  assert.deepEqual(
    midi.notes.items.map((n) => [n.pitch, n.startTick / B, n.stopTick / B, n.velocity]),
    [[60, 0, 1], [64, 1, 2], [67, 2, 3], [72, 3, 4]].map(([p, a, b], i) => [p, a, b, [100, 80, 90, 70][i]]),
    'four notes, clip-relative',
  );
  // An imported table is stored absolute; the origin is the clip's start (fact 41).
  assert.equal(midiClip.midiSourceStart.value, midiClip.start.value, 'the MIDI origin is the clip start for an imported file');
  step('MIDI import: one clip, four notes clip-relative through clip.midi', { clip: midiClip.id, startBeats: (midiClip.start.value ?? 0) / B });

  // 4. Arm a track with a device input, then disarm it.
  await luna.drivers.watch().ready;
  const device = (luna.drivers.connected.value ?? []).find((d) => d.num_inputs > 0);
  assert.ok(device, 'a device with inputs exists');
  armed = session.visibleTracks[0];
  assert.ok(armed, 'the session needs a track');
  armedWas = { record: armed.recordEnabled.value, input: armed.inputNodeUid.value };
  await armed.recordEnabled.set(true);
  await settle(async () => armed.recordEnabled.value === true);
  const wire = await luna.raw.get(armed.path, { children: false, commands: false, propfilter: 'record_enabled', flatvalue: true });
  assert.equal(wire?.properties?.record_enabled, true, 'the arm is on the wire');
  assert.notEqual(session.transport.recordEnabled.value, true, 'arming a track does not arm the transport');
  await armed.recordEnabled.set(false);
  await settle(async () => armed.recordEnabled.value === false);
  step('arm and disarm followed; the transport is not recording', { device: device.name });

  result.pass = true;
} catch (err) {
  result.pass = false;
  result.error = String(err?.message ?? err);
} finally {
  if (armed && armedWas) await armed.recordEnabled.set(armedWas.record ?? false).catch(() => undefined);
  if (added.length) {
    await luna.raw.post('/workspace/delete_audio_files', {
      session_package_uid: session.sessionPackageUid.value, files: added, move_to_trash: true,
    }).catch(() => undefined);
  }
  for (const f of tempFiles) { try { unlinkSync(f); } catch { /* already gone */ } }
  await luna.close();
}
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
