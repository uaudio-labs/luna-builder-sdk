import { execFileSync } from 'node:child_process';
import { connect } from 'node:net';
import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { resolveEngineDir } from './serve';
import { addOnsFolder, bundlePath, ensureExecutable, sdkVersion, type Args } from './util';

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
    npm = execFileSync('npm', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim();
  } catch {
    /* not on PATH */
  }
  // npm 10 (Node 22's) crashes in arborist on a scaffold's file: dependency; Node 24 ships npm 11.
  rows.push(['npm', npm ? npm + (Number(npm.split('.')[0]) >= 11 ? '' : '  (need >= 11 to npm install a scaffold; comes with Node.js 24)') : 'not found']);
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
  const engineDir = resolveEngineDir(undefined);
  rows.push(['wasm engine build', engineDir ?? 'not found (set UA_WASM_ENGINE or pass --engine to serve)']);
  const [luna, wasmBridge] = await Promise.all([probe(4718), probe(4749)]);
  rows.push(['LUNA engine :4718', luna ? 'listening' : 'not listening (is LUNA running?)']);
  rows.push(['wasm bridge :4749', wasmBridge ? 'listening' : 'not listening (only with the luna_connects_to_wasm feature key)']);
  try {
    const folder = addOnsFolder();
    let note = '';
    if (!existsSync(folder)) {
      try {
        mkdirSync(folder, { recursive: true });
        note = ' (created)';
      } catch {
        note = process.platform === 'darwin' ? ` (could not create it; run: sudo mkdir -p "${folder}")` : ' (could not create it)';
      }
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
