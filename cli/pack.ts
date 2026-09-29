import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { vendorBundle } from './new';
import { flagString, readManifest, type Args } from './util';

/**
 * Validate the manifest, refresh the vendored SDK bundle if the Add On carries one, and zip
 * the folder for distribution. Uses `zip` on macOS/Linux and PowerShell on Windows.
 */
export async function pack(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const { entries } = readManifest(dir);
  if (existsSync(join(dir, 'vendor', 'luna.global.js')) && !args.flags['no-vendor']) {
    vendorBundle(dir);
    console.log('Refreshed vendor/luna.global.js');
  }
  const out = resolve(flagString(args, 'out') ?? `${basename(dir)}.zip`);
  if (existsSync(out)) rmSync(out);
  const excludes = ['node_modules/*', '.git/*', '*.zip', 'tests/*', 'vitest.config.*', 'package-lock.json'];
  let result;
  if (process.platform === 'win32') {
    const cmd = `Compress-Archive -Path '${dir}\\*' -DestinationPath '${out}' -Force`;
    result = spawnSync('powershell', ['-NoProfile', '-Command', cmd], { stdio: 'inherit' });
  } else {
    result = spawnSync('zip', ['-r', '-q', out, basename(dir), ...excludes.flatMap((x) => ['-x', `${basename(dir)}/${x}`])], { cwd: dirname(dir), stdio: 'inherit' });
  }
  if (result.status !== 0) throw new Error('zip failed');
  console.log(`Packed ${entries.length} Add On(s) -> ${out}`);
  console.log(`Install by unzipping into LUNA's Add Ons folder, or run: ua-builder install ${basename(dir)}`);
  return 0;
}
