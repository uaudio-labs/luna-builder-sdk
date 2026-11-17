import { existsSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, posix, resolve, sep } from 'node:path';
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

/**
 * True when `folder` is a `ua-builder eject-wasm` output (its `serve.py` and engine). It may sit
 * in the Add On folder, so a pack or an eject leaves it out, as it does a `.lunaaddon`.
 */
export function isEjectOutput(folder: string): boolean {
  return existsSync(join(folder, 'serve.py')) && existsSync(join(folder, '__engine', 'luna-engine.js'));
}

/** Top-level build configuration: TypeScript and bundler configs. Never loaded by the page. */
const BUILD_CONFIG = /^(tsconfig(\..+)?\.json|(vite|rollup|webpack|esbuild|rspack)\.config\.[cm]?[jt]s)$/;

/** True when the Add On folder has a build step, so its top-level `src/` is bundler input. */
export function hasBuildStep(dir: string): boolean {
  return readdirSync(dir).some((name) => BUILD_CONFIG.test(name));
}

/**
 * Build inputs and outputs that never ship, at any depth: TypeScript and JSX sources, which
 * LUNA's web view cannot run, and source maps, unless `keepMaps`. At the top level also the
 * build configs and, when there is a build step, `src/`: the page loads the bundle, not this.
 */
export function isBuildOnly(name: string, { isRoot = false, buildStep = false, keepMaps = false } = {}): boolean {
  if (/\.([cm]?ts|tsx|jsx)$/.test(name)) return true;
  if (!keepMaps && name.endsWith('.map')) return true;
  return isRoot && (BUILD_CONFIG.test(name) || (buildStep && name === 'src'));
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
 * each folder is added once, so a link back up the tree cannot loop, and a folder left with
 * nothing to ship is left out. Returns how many junk entries were left out, and the paths of
 * the build-only ones (see {@link isBuildOnly}).
 */
export function collect(dir: string, top: string, keepMaps: boolean): { entries: ZipEntry[]; skipped: number; buildOnly: string[] } {
  const entries: ZipEntry[] = [];
  const buildOnly: string[] = [];
  const visited = new Set<string>();
  const buildStep = hasBuildStep(dir);
  let skipped = 0;
  const walk = (folder: string, prefix: string, isRoot: boolean): void => {
    const real = realpathSync(folder);
    if (visited.has(real)) return;
    visited.add(real);
    const stat = statSync(folder);
    const at = entries.length;
    entries.push({ name: `${prefix}/`, mtime: stat.mtime, mode: 0o40755 });
    for (const name of readdirSync(folder).sort()) {
      if (isRoot && (isExcluded(name) || isEjectOutput(join(folder, name)))) continue;
      if (isJunk(name)) {
        skipped++;
        continue;
      }
      if (isBuildOnly(name, { isRoot, buildStep, keepMaps })) {
        buildOnly.push(`${prefix}/${name}`.slice(top.length + 1));
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
    if (!isRoot && entries.length === at + 1) entries.pop();
  };
  walk(dir, top, true);
  return { entries, skipped, buildOnly };
}

/**
 * Problems with the local scripts and stylesheets each `html` page of the manifest loads:
 * `errors` for a file that is missing or that the pack leaves out (the page would break
 * wherever it is installed), `warnings` for a module script (blocked on Windows, which loads
 * Add Ons from `file://`).
 */
export function checkPageReferences(dir: string, pages: string[], packed: Set<string>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const page of new Set(pages)) {
    const html = page.split(/[?#]/)[0]!;
    const path = join(dir, html);
    if (!existsSync(path)) continue; // readManifest has already reported it
    const text = readFileSync(path, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const [tag] of text.matchAll(/<(script|link)\b[^>]*>/gi)) {
      if (/^<script/i.test(tag) && /\stype\s*=\s*["']?module\b/i.test(tag)) {
        warnings.push(`${html}: ${tag} is a module script, which LUNA on Windows will not run (it loads Add Ons from file://). Bundle to a classic script instead.`);
      }
      const ref = /\s(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
      const url = ref?.[1] ?? ref?.[2];
      if (!url || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
      const rel = posix.normalize(posix.join(posix.dirname(html.split(sep).join('/')), decodeURI(url.split(/[?#]/)[0]!)));
      if (packed.has(rel)) continue;
      errors.push(
        existsSync(join(dir, rel))
          ? `${html} loads ${url}, which the pack leaves out (a source, source map or build file). Load the built file instead.`
          : `${html} loads ${url}, which does not exist.${rel.startsWith('dist/') ? ' Run the build first (npm run build).' : ''}`,
      );
    }
  }
  return { errors, warnings };
}

/**
 * Validate the manifest, refresh the vendored SDK bundle if the Add On carries one, and zip
 * the folder into a `.lunaaddon` file for distribution: a zip holding the Add On folder
 * (`<folder>/manifest.json`), the same as zipping it in the Finder or Explorer and renaming
 * the `.zip`. Opening it in LUNA installs the Add On as a plain folder in LUNA's Add Ons
 * folder. Dotfiles and OS metadata files are left out at every depth (see {@link isJunk}), and
 * so are sources, source maps and build configs (see {@link isBuildOnly}; `--source-maps`
 * keeps the maps). Refuses when a page loads a script or stylesheet the zip would not hold.
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
  const top = basename(dir);
  const { entries, skipped, buildOnly } = collect(dir, top, !!args.flags['source-maps']);
  const packed = new Set(entries.filter((e) => e.data).map((e) => e.name.slice(top.length + 1)));
  const pages = addOns.flatMap((a) => (a.html ? [a.html] : []));
  const { errors, warnings } = checkPageReferences(dir, pages, packed);
  for (const w of warnings) console.warn(`warning: ${w}`);
  if (errors.length) {
    console.error(`Not packed; the Add On would not load:\n  - ${errors.join('\n  - ')}`);
    return 1;
  }
  rmSync(out, { recursive: true, force: true });
  writeFileSync(out, createZip(entries));
  console.log(`Packed ${addOns.length} Add On(s) -> ${out}`);
  if (skipped) console.log(`Left out ${skipped} dotfile(s) and OS metadata file(s)`);
  if (buildOnly.length) {
    const shown = buildOnly.slice(0, 6).join(', ') + (buildOnly.length > 6 ? `, and ${buildOnly.length - 6} more` : '');
    console.log(`Left out sources, source maps and build configs: ${shown}${args.flags['source-maps'] ? '' : ' (--source-maps keeps the maps)'}`);
  }
  console.log(`Install by opening it in LUNA (double-click it), or run: ua-builder install ${basename(dir)}`);
  return 0;
}
