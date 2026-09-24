#!/usr/bin/env node
/**
 * Create a scratch session with tempo changes, time signature changes and markers, for
 * qualifying musical-time conversion (`node examples/check-musical-time.mjs --require-changes`).
 *
 *   node examples/create-tempo-session.mjs                 # refuses if a session is already open
 *   node examples/create-tempo-session.mjs --replace       # closes the open session first
 *   node examples/create-tempo-session.mjs --replace --save
 *
 * `set_tempo` answers `device.database_error` on the measured build and `import_tempo_map`
 * crashes LUNA, so the tempo map is built with `align_bar`: it scales the tempo before the
 * aligned bar and inserts a row there, so two calls give three rows at two tempos. Neither
 * verb is modelled by the SDK, so this script reaches for `luna.raw` — which is what the
 * add-feature skill is for.
 *
 * The map this makes: about 109 BPM to about 106 BPM at bar 9 with a row at bar 17; 3/4
 * from bar 13 and 6/8 from bar 21; markers "Top", "Faster" (bar 9) and "Fastest" (bar 17).
 */
import { Luna } from '../sdk/index.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const BAR = Luna.TICKS_PER_BEAT * 4;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const luna = await Luna.connect({ requestTimeoutMs: 20_000 });
const status = await luna.raw.get('/status', { propfilter: 'version', children: false, commands: false, flatvalue: true });
console.log(`LUNA ${status?.properties?.version} · engine ${luna.engine}`);

await luna.sessions.ready();
const open = luna.sessions.items.items;
if (open.length && !flag('--replace')) {
  console.error(`A session is open ("${open[0].name.value ?? open[0].uid}"). LUNA is single-session: creating a new one closes it.`);
  console.error('Re-run with --replace to do that anyway. Its state is kept on disk and can be reopened from LUNA.');
  await luna.close();
  process.exit(2);
}

const session = await luna.sessions.create({ name: 'Tempo Test' });
console.log(`created "Tempo Test"  session_uid=${session.uid}  package=${session.sessionPackageUid.value}`);

// align_bar and set_time_signature are not typed by the SDK: raw is the escape hatch.
const post = (command, payload) => luna.raw.post(`${session.path}/${command}`, { session_uid: session.uid, ...payload });
await post('align_bar', { tick: Math.round(BAR * 8 * 1.1), bar: 9 });
await post('align_bar', { tick: Math.round(BAR * 8 * 1.1 + BAR * 8 * 0.8), bar: 17 });
await post('set_time_signature', { numerator: 3, denominator: 4, bar: 13 });
await post('set_time_signature', { numerator: 6, denominator: 8, bar: 21 });
for (const [location, name] of [[0, 'Top'], [BAR * 8, 'Faster'], [BAR * 16, 'Fastest']]) {
  await session.addMarker(location, name);
}
await sleep(300);

// Read the result back through the model, which is what the check script will see.
const musical = session.musical;
await musical.ready();
await session.markers.load();
await Promise.all([
  ...musical.tempoMap.items.map((r) => r.load()),
  ...musical.timeSignatures.items.map((r) => r.load()),
  ...session.markers.items.map((m) => m.load()),
]);

console.log('tempo_map');
for (const r of musical.tempoMap.items) console.log(`  ${r.id}: tick=${r.tick.value} tempo=${r.tempo.value}`);
console.log('time_signatures');
for (const r of musical.timeSignatures.items) console.log(`  ${r.id}: bar=${r.bar.value} ${r.numerator.value}/${r.denominator.value}`);
console.log('markers');
for (const m of session.markers.items) console.log(`  ${m.id}: tick=${m.location.value} name="${m.name.value}"`);

if (flag('--save')) {
  await session.save({ label: 'ua-builder-sdk tempo fixture' });
  console.log('saved');
} else {
  console.log('\nUnsaved. Save it with: await session.save()');
}
console.log('Now run: node examples/check-musical-time.mjs --require-changes');
await luna.close();
