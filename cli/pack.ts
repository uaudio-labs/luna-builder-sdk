import { existsSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { vendorBundle } from './new';
import { flagString, readManifest, type Args } from './util';
import { createZip, type ZipEntry } from './zip';

/** Top-level entries of the Add On folder that never ship in a `.lunaaddon`. */
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

/** OS metadata files that Windows drops beside user files. Compared case-insensitively. */
const OS_JUNK = new Set(['thumbs.db', 'ehthumbs.db', 'ehthumbs_vista.db', 'desktop.ini']);

/**
 * Entries at any depth that never ship: dotfiles and dot-folders (`.DS_Store`, `._*` AppleDouble
 * files, `.git`, `.gitignore`, `.env`, editor folders), Windows thumbnail and folder-settings
 * files, and the macOS custom-icon file `Icon\r`.
 */
export function isJunk(name: string): boolean {
  return name.startsWith('.') || name === 'Icon\r' || OS_JUNK.has(name.toLowerCase());
}

/**
 * The zip entries for the Add On folder `dir`, all under `<top>/`. Symlinks are followed, but
 * each folder is added once, so a link back up the tree cannot loop. Returns how many junk
 * entries were left out.
 */
function collect(dir: string, top: string): { entries: ZipEntry[]; skipped: number } {
  const entries: ZipEntry[] = [];
  const visited = new Set<string>();
  let skipped = 0;
  const walk = (folder: string, prefix: string, isRoot: boolean): void => {
    const real = realpathSync(folder);
    if (visited.has(real)) return;
    visited.add(real);
    const stat = statSync(folder);
    entries.push({ name: `${prefix}/`, mtime: stat.mtime, mode: 0o40755 });
    for (const name of readdirSync(folder).sort()) {
      if (isRoot && isExcluded(name)) continue;
      if (isJunk(name)) {
        skipped++;
        continue;
      }
      const path = join(folder, name);
      let entryStat;
      try {
        entryStat = statSync(path);
      } catch {
        continue; // a broken symlink
      }
      if (entryStat.isDirectory()) walk(path, `${prefix}/${name}`, false);
      else if (entryStat.isFile()) {
        entries.push({ name: `${prefix}/${name}`, data: readFileSync(path), mtime: entryStat.mtime, mode: 0o100000 | (entryStat.mode & 0o777) });
      }
    }
  };
  walk(dir, top, true);
  return { entries, skipped };
}

/**
 * Validate the manifest, refresh the vendored SDK bundle if the Add On carries one, and zip
 * the folder into a `.lunaaddon` file for distribution: a zip holding the Add On folder
 * (`<folder>/manifest.json`), the same as zipping it in the Finder or Explorer and renaming
 * the `.zip`. Opening it in LUNA installs the Add On as a plain folder in LUNA's Add Ons
 * folder. Dotfiles and OS metadata files are left out at every depth (see {@link isJunk}).
 */
export async function pack(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const { entries: addOns } = readManifest(dir);
  if (existsSync(join(dir, 'vendor', 'luna.global.js')) && !args.flags['no-vendor']) {
    vendorBundle(dir);
    console.log('Refreshed vendor/luna.global.js');
  }
  let out = resolve(flagString(args, 'out') ?? `${basename(dir)}.lunaaddon`);
  if (!out.endsWith('.lunaaddon')) out += '.lunaaddon';
  const { entries, skipped } = collect(dir, basename(dir));
  rmSync(out, { recursive: true, force: true });
  writeFileSync(out, createZip(entries));
  console.log(`Packed ${addOns.length} Add On(s) -> ${out}`);
  if (skipped) console.log(`Left out ${skipped} dotfile(s) and OS metadata file(s)`);
  console.log(`Install by opening it in LUNA (double-click it), or run: ua-builder install ${basename(dir)}`);
  return 0;
}
