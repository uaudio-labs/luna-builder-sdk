import { connect } from 'node:net';
import { existsSync } from 'node:fs';
import { resolveEngineDir } from './serve';
import { addOnsFolder, bundlePath, sdkVersion, type Args } from './util';

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

/** Report what an Add On can reach from this machine. */
export async function doctor(_args: Args): Promise<number> {
  const rows: [string, string][] = [];
  rows.push(['ua-builder', sdkVersion()]);
  rows.push(['node', process.version + (Number(process.versions.node.split('.')[0]) >= 22 ? '' : '  (need >= 22)')]);
  rows.push(['SDK bundle', bundlePath() ?? 'missing: run npm run build']);
  const engineDir = resolveEngineDir(undefined);
  rows.push(['wasm engine build', engineDir ?? 'not found (set UA_WASM_ENGINE or pass --engine to serve)']);
  const [luna, wasmBridge] = await Promise.all([probe(4718), probe(4749)]);
  rows.push(['LUNA engine :4718', luna ? 'listening' : 'not listening (is LUNA running?)']);
  rows.push(['wasm bridge :4749', wasmBridge ? 'listening' : 'not listening (only with the luna_connects_to_wasm feature key)']);
  try {
    const folder = addOnsFolder();
    rows.push(['Add Ons folder', `${folder} ${existsSync(folder) ? '' : '(does not exist yet)'}`]);
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
