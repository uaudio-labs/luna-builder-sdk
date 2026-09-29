import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Args } from './util';

/** Run the Add On's vitest suite; `--live` also runs tests gated on `UA_LIVE=1`. */
export async function test(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  if (!existsSync(join(dir, 'package.json'))) throw new Error(`no package.json in ${dir}; run "npm install" in the Add On folder first`);
  const env = { ...process.env, ...(args.flags['live'] ? { UA_LIVE: '1' } : {}) };
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(npx, ['vitest', 'run', ...(args.flags['watch'] ? [] : [])], { cwd: dir, stdio: 'inherit', env });
  return result.status ?? 1;
}
