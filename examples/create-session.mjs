#!/usr/bin/env node
/**
 * Create a session and a few tracks from Node.
 *
 *   node examples/create-session.mjs                      # refuses if a session is already open
 *   node examples/create-session.mjs --replace            # closes the open session first
 *   node examples/create-session.mjs --name "My Song" --tracks "Vocal:mono,Guitar,Keys:instrument"
 *
 * LUNA is single-session: creating one closes whatever is open, without asking, and the
 * closed session keeps its state on disk (reopen it with its package uid). This script
 * therefore refuses to run over an open session unless you pass --replace.
 *
 * `Sessions.create()` does the two steps LUNA's own UI does — `new_session` then
 * `load_session` — and waits until the engine reports the session loaded (fact 15). A
 * session that is open but not loaded reports stale derived values.
 */
import { Luna } from '../dist/index.js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const name = opt('--name', `luna-builder-sdk example ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
// "Name[:mono|stereo|instrument][,…]"
const tracks = opt('--tracks', 'Vocal:mono,Guitar,Bass:mono,Keys:instrument')
  .split(',')
  .map((spec) => {
    const [trackName, kind = 'stereo'] = spec.split(':');
    return kind === 'instrument'
      ? { name: trackName.trim(), trackType: 'instrument', stemFormat: 'stereo' }
      : { name: trackName.trim(), trackType: 'audio', stemFormat: kind.trim() };
  });

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

const session = await luna.sessions.create({ name });
console.log(`created "${name}"  session_uid=${session.uid}  package=${session.sessionPackageUid.value}`);
console.log('loaded into the playback engine');

for (const t of tracks) {
  await session.newTrack(t);
  console.log(`  + ${t.name.padEnd(10)} ${t.trackType}/${t.stemFormat}`);
}
await new Promise((r) => setTimeout(r, 300));

// Read back what LUNA actually holds, system tracks included (fact 28).
await session.tracks.load();
console.log(`session now has ${session.tracks.items.length} tracks:`);
for (const t of session.tracksInOrder) {
  console.log(`  - ${String(t.name.value ?? t.id).padEnd(10)} ${t.trackType.value}`);
}

console.log('\nThe session is open in LUNA and unsaved. Save it there, or:');
console.log(`  await session.save()      # or close it: luna.sessions.close('${session.uid}')`);
await luna.close();
