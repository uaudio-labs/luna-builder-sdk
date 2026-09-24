#!/usr/bin/env node
/**
 * Does the model layer track a change made by someone else? PASS or FAIL.
 *
 *   node examples/check-sync.mjs              # the first visible track
 *   node examples/check-sync.mjs "Vox 2"      # a track by name
 *
 * Client A watches one track through the model; client B writes its gain over the wire
 * (-6 dB, or -12 dB if it already sits at -6); A must see the new dB, position and display
 * within a second. The gain is put back afterwards. Exit code 0 on PASS, 1 on FAIL.
 */
import { Luna } from '../sdk/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const a = await Luna.connect();
const b = await Luna.connect();
const session = await a.session();
await session.ready();

const wanted = process.argv[2];
const track = wanted ? session.visibleTracks.find((t) => t.name.value === wanted) : session.visibleTracks[0];
if (!track) throw new Error(wanted ? `no track named "${wanted}"` : 'the session needs a track');
await track.loadStrip();
console.log(`touching ${track.name.value}'s gain (now ${track.gain.display.value} dB), restoring it after`);

const before = track.gain.real.value;
const target = before === -6 ? -12 : -6;
const seen = [];
const off = track.gain.real.onChange(() => seen.push(track.gain.real.value));

// B writes over the wire, bypassing A's model entirely.
await b.raw.set(`${track.gain.path}/value`, target);
await sleep(700);

const ok = track.gain.real.value === target && seen.includes(target) && seen.length > 0;
console.log(
  `${ok ? 'PASS' : 'FAIL'}  ${track.name.value}: B wrote ${target} dB; A sees` +
    ` real=${track.gain.real.value} normalized=${(track.gain.normalized.value ?? 0).toFixed(4)}` +
    ` display="${track.gain.display.value}" notifications=${seen.length}`,
);

off();
await b.raw.set(`${track.gain.path}/value`, before);
await sleep(200);
await b.close();
await a.close();
process.exit(ok ? 0 : 1);
