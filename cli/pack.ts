import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { vendorBundle } from './new';
import { flagString, readManifest, type Args } from './util';

/** Top-level entries of the Add On folder that never ship in a bundle. */
function isExcluded(name: string): boolean {
  return (
    name === 'node_modules' ||
    name === '.git' ||
    name === 'tests' ||
    name === 'package-lock.json' ||
    name.startsWith('vitest.config.') ||
    name.endsWith('.zip') ||
    name.endsWith('.lunaaddon')
  );
}

/**
 * Validate the manifest, refresh the vendored SDK bundle if the Add On carries one, and copy
 * the folder into a `.lunaaddon` bundle for distribution: a folder with the `.lunaaddon`
 * extension holding the Add On (manifest.json at its root). On macOS the Finder treats it as
 * a single file and LUNA installs it on open; on Windows it is a plain folder to drop into
 * LUNA's Add Ons folder.
 */
export async function pack(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const { entries } = readManifest(dir);
  if (existsSync(join(dir, 'vendor', 'luna.global.js')) && !args.flags['no-vendor']) {
    vendorBundle(dir);
    console.log('Refreshed vendor/luna.global.js');
  }
  let out = resolve(flagString(args, 'out') ?? `${basename(dir)}.lunaaddon`);
  if (!out.endsWith('.lunaaddon')) out += '.lunaaddon';
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const entry of readdirSync(dir)) {
    if (isExcluded(entry)) continue;
    cpSync(join(dir, entry), join(out, entry), { recursive: true, dereference: true });
  }
  console.log(`Packed ${entries.length} Add On(s) -> ${out}`);
  console.log(`Install by opening it in LUNA (double-click on macOS) or copying it into LUNA's Add Ons folder, or run: ua-builder install ${basename(dir)}`);
  return 0;
}
