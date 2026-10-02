import { cpSync, existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { addOnsFolder, flagString, menuFor, readManifest, type Args } from './util';

/**
 * Put an Add On folder where LUNA looks for it. macOS: a symlink, so edits are live.
 * Windows: a copy (symlinks need elevation). LUNA rescans the folder; no restart needed.
 */
export async function install(args: Args): Promise<number> {
  const dir = resolve(args.positional[0] ?? process.cwd());
  const { manifest, entries } = readManifest(dir);
  const name = flagString(args, 'name') ?? (typeof manifest.package_name === 'string' && manifest.package_name.trim() ? manifest.package_name.trim() : basename(dir));
  if (/[\\/]/.test(name) || name === '.' || name === '..') throw new Error(`invalid link name "${name}"`);
  const folder = addOnsFolder();
  mkdirSync(folder, { recursive: true });
  const target = join(folder, name);
  if (existsSync(target) || isDanglingLink(target)) {
    const st = lstatSync(target);
    if (st.isSymbolicLink()) {
      const current = readlinkSync(target);
      if (resolve(current) === dir) {
        console.log(`Already installed: ${target} -> ${dir}`);
        return report(entries);
      }
      rmSync(target);
    } else if (process.platform === 'win32' && args.flags['force']) {
      rmSync(target, { recursive: true, force: true });
    } else {
      throw new Error(`${target} exists and is not a symlink; remove it or pass --force (Windows copy)`);
    }
  }
  if (process.platform === 'win32') {
    cpSync(dir, target, { recursive: true, filter: (src) => !src.includes(`${join('node_modules')}`) });
    console.log(`Copied ${dir} -> ${target}`);
  } else {
    symlinkSync(dir, target);
    console.log(`Linked ${target} -> ${dir}`);
  }
  return report(entries);
}

function isDanglingLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function report(entries: { id: string; title: string; target?: string }[]): number {
  console.log(`LUNA will list:`);
  for (const e of entries) console.log(`  ${e.title}  (${e.id})  under ${menuFor(e.target)}`);
  return 0;
}
