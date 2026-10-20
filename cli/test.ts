import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import type { Args } from './util';

/** Run the Add On's vitest suite; `--live` also runs tests gated on `UA_LIVE=1`. */
export async function test(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  if (!existsSync(join(dir, 'package.json'))) throw new Error(`no package.json in ${dir}; run "npm install" in the Add On folder first`);
  const env = { ...process.env, ...(args.flags['live'] ? { UA_LIVE: '1' } : {}) };
  // The Add On's own vitest, run with this node: no npx, so no npx.cmd on Windows, which
  // Node.js refuses to spawn without a shell (EINVAL since 18.20.2 and 20.12.2).
  let vitest: string;
  try {
    const pkg = createRequire(join(dir, 'package.json')).resolve('vitest/package.json');
    const { bin } = JSON.parse(readFileSync(pkg, 'utf8')) as { bin: string | Record<string, string> };
    vitest = join(dirname(pkg), typeof bin === 'string' ? bin : bin['vitest']!);
  } catch {
    throw new Error(`vitest is not installed in ${dir}; run "npm install" in the Add On folder first`);
  }
  const result = spawnSync(process.execPath, [vitest, 'run'], { cwd: dir, stdio: 'inherit', env });
  return result.status ?? 1;
}
