import { execFileSync } from 'node:child_process';
import { connect } from 'node:net';
import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { addOnsFolder, bundlePath, canWriteFolder, ensureExecutable, isAddOnsFolderReady, sdkVersion, type Args } from './util';

function probe(port: number, host = '127.0.0.1', timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const s = connect(port, host);
    const done = (ok: boolean) => {
      s.destroy();
      resolve(ok);
    };
    s.setTimeout(timeoutMs, () => done(false));
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
  });
}

/** Report what an Add On can reach from this machine, creating LUNA's Add Ons folder if missing. */
export async function doctor(_args: Args): Promise<number> {
  const rows: [string, string][] = [];
  rows.push(['ua-builder', sdkVersion()]);
  rows.push(['node', process.version + (Number(process.versions.node.split('.')[0]) >= 22 ? '' : '  (need >= 22)')]);
  let npm = '';
  try {
    // On Windows npm is npm.cmd, which needs a shell; one command string, because passing
    // arguments with shell: true is deprecated (DEP0190).
    npm = (process.platform === 'win32'
      ? execFileSync('npm --version', { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] })
      : execFileSync('npm', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    ).trim();
  } catch {
    /* not on PATH */
  }
  // npm 10 (Node 22's) crashes in arborist on vitest's peer dependencies unless the Add On's
  // .npmrc sets legacy-peer-deps, which scaffolds from ua-builder new do.
  const npmNote = npm && Number(npm.split('.')[0]) < 11 && !existsSync(join(process.cwd(), '.npmrc'))
    ? '  (npm 10 needs legacy-peer-deps=true in the Add On\'s .npmrc to npm install it; or use Node.js 24)'
    : '';
  rows.push(['npm', npm ? npm + npmNote : 'not found']);
  rows.push(['SDK bundle', bundlePath() ?? 'missing: run npm run build']);
  // A zip-extracted or copied SDK can lose the CLI's executable bit, and then
  // `npx ua-builder` dies with "Permission denied". Heal it here.
  if (process.platform !== 'win32') {
    const bin = join(process.cwd(), 'node_modules', '.bin', 'ua-builder');
    if (existsSync(bin)) {
      const target = realpathSync(bin);
      const state = ensureExecutable(target);
      rows.push(['project CLI', state === 'ok' ? `${target} (executable)` : state === 'fixed' ? `${target} (executable bit restored)` : `${target} is NOT executable and read-only; run: chmod +x "${target}"`]);
    }
  }
  const luna = await probe(4718);
  rows.push(['LUNA engine :4718', luna ? 'listening' : 'not listening (is LUNA running?)']);
  try {
    const folder = addOnsFolder();
    const setup = process.platform === 'win32'
      ? ' `ua-builder install` or LUNA sets it up for every user, asking once for administrator approval'
      : ' `ua-builder install` sets it up for every user, asking once for an administrator password';
    const canSetUp = (process.platform === 'darwin' || process.platform === 'win32') && !process.env['UA_ADDONS_FOLDER'];
    // A Windows folder made here would be this user's alone (see isAddOnsFolderReady()).
    const shared = process.platform === 'win32' && !process.env['UA_ADDONS_FOLDER'];
    let note = '';
    if (!existsSync(folder)) {
      try {
        if (shared) throw new Error('not created without the setup');
        mkdirSync(folder, { recursive: true });
        note = ' (created)';
      } catch {
        note = canSetUp ? ` (missing;${setup})` : ' (could not create it)';
      }
    } else if (!canWriteFolder(folder)) {
      note = canSetUp ? ` (not writable;${setup})` : ' (not writable)';
    } else if (!isAddOnsFolderReady(folder)) {
      note = ` (writable by you only, not set up for every user;${setup})`;
    }
    rows.push(['Add Ons folder', `${folder}${note}`]);
  } catch (e) {
    rows.push(['Add Ons folder', (e as Error).message]);
  }
  const width = Math.max(...rows.map(([k]) => k.length));
  for (const [k, v] of rows) console.log(`${k.padEnd(width)}  ${v}`);
  if (!luna) {
    console.log('\nNo engine on 4718. Start LUNA and open a session, or test against Luna.MockEngine (npm test).');
    return 1;
  }
  return 0;
}
