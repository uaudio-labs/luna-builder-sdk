import { cpSync, existsSync, lstatSync, readdirSync, readlinkSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { addOnClashes, addOnsFolder, entryTargets, flagString, installedAddOns, menuFor, prepareAddOnsFolder, readManifest, type Args } from './util';

/**
 * Put an Add On folder where LUNA looks for it. macOS: a symlink, so edits are live.
 * Windows: a copy (symlinks need elevation); `--force` copies over an installed copy in place.
 * LUNA rescans the folder; no restart needed.
 *
 * LUNA keeps an Add On's secrets, allowed servers and web storage for the folder it is
 * installed in, not its id: a new folder starts with nothing, and a removed one has them
 * deleted. So a reinstall must keep the same folder: on macOS the link resolves to the
 * project folder either way, and on Windows `--force` updates the copy's contents instead of
 * deleting and re-creating it.
 */
export async function install(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const { manifest, entries } = readManifest(dir);
  const name = flagString(args, 'name') ?? (typeof manifest.package_name === 'string' && manifest.package_name.trim() ? manifest.package_name.trim() : basename(dir));
  if (/[\\/]/.test(name) || name === '.' || name === '..') throw new Error(`invalid link name "${name}"`);
  const folder = addOnsFolder();
  prepareAddOnsFolder(folder);
  const target = join(folder, name);
  // The entry being replaced, and any other link to this same folder, are this Add On.
  const installed = installedAddOns(folder);
  const own = installed.filter((a) => a.entry === target || sameFolder(a.entry, dir)).map((a) => a.entry);
  const clashes = addOnClashes(entries, installed, own);
  if (clashes.length) throw new Error(`An installed Add On already uses this identity:\n  - ${clashes.join('\n  - ')}\nChange "id" or "name" in manifest.json, or remove the other Add On.`);
  let update = false;
  if (existsSync(target) || isDanglingLink(target)) {
    const st = lstatSync(target);
    if (st.isSymbolicLink()) {
      const current = readlinkSync(target);
      if (resolve(current) === dir) {
        console.log(`Already installed: ${target} -> ${dir}`);
        return report(entries);
      }
      rmSync(target);
    } else if (process.platform === 'win32' && args.flags['force'] && st.isDirectory()) {
      update = true;
    } else {
      throw new Error(`${target} exists and is not a symlink; remove it or pass --force (Windows copy)`);
    }
  }
  if (process.platform === 'win32') {
    const copied = (src: string) => !src.includes(`${join('node_modules')}`);
    if (update) prune(dir, target, copied);
    cpSync(dir, target, { recursive: true, force: true, filter: copied });
    console.log(`${update ? 'Updated' : 'Copied'} ${dir} -> ${target}`);
  } else {
    symlinkSync(dir, target);
    console.log(`Linked ${target} -> ${dir}`);
  }
  return report(entries);
}

/**
 * Delete what is in the installed copy `target` but no longer in the project `dir` (or no
 * longer copied), keeping `target` itself and every folder still in `dir`, so the folder LUNA
 * identifies the install by stays the same.
 */
function prune(dir: string, target: string, copied: (src: string) => boolean): void {
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const src = join(dir, entry.name);
    const dest = join(target, entry.name);
    const there = copied(src) && (existsSync(src) || isDanglingLink(src));
    if (there && entry.isDirectory() && lstatSync(src).isDirectory()) prune(src, dest, copied);
    else if (!there || entry.isDirectory() !== lstatSync(src).isDirectory()) rmSync(dest, { recursive: true, force: true });
  }
}

function sameFolder(a: string, b: string): boolean {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

function isDanglingLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function report(entries: { id: string; name: string; target?: string }[]): number {
  console.log(`LUNA will list:`);
  for (const e of entries) console.log(`  ${e.name}  (${e.id})  under ${menuFor(entryTargets(e)[0])}`);   // its default host's menu, until swapped
  return 0;
}
