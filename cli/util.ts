import { chmodSync, existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Give `path` back its executable bit if it lost one (zip extractions and plain file copies
 * drop it, and then `npx ua-builder` dies with "Permission denied"). Returns what happened:
 * `'ok'` (already executable), `'fixed'`, or `'failed'` (read-only install). Windows has no
 * executable bit, so there it is always `'ok'`.
 */
export function ensureExecutable(path: string): 'ok' | 'fixed' | 'failed' {
  if (process.platform === 'win32') return 'ok';
  try {
    const mode = statSync(path).mode;
    if ((mode & 0o111) !== 0) return 'ok';
    chmodSync(path, mode | 0o755);
    return 'fixed';
  } catch {
    return 'failed';
  }
}

export interface Args {
  positional: string[];
  flags: Record<string, string | boolean>;
}

/** `--key value`, `--key=value`, `--flag`, positionals. */
export function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith('--')) {
      positional.push(a);
      continue;
    }
    const eq = a.indexOf('=');
    if (eq >= 0) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { positional, flags };
}

export function flagString(args: Args, key: string): string | undefined {
  const v = args.flags[key];
  return typeof v === 'string' ? v : undefined;
}

export function flagNumber(args: Args, key: string, fallback: number): number {
  const v = flagString(args, key);
  const n = v === undefined ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** The @uaudio/ua-builder-sdk package root (this file lives in dist/ once built). */
export function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'templates'))) return dir;
    dir = dirname(dir);
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '..');
}

/**
 * The script-tag bundle this CLI vendors into an Add On. A checkout builds it into `dist/`;
 * the ua-luna-builder agent plugin ships a prebuilt copy in `sdk/` and has no `dist/`, so
 * both layouts resolve. `undefined` means nothing is built yet.
 */
export function bundlePath(): string | undefined {
  for (const dir of ['dist', 'sdk']) {
    const p = join(packageRoot(), dir, 'luna.global.js');
    if (existsSync(p)) return p;
  }
  return undefined;
}

export function sdkVersion(): string {
  try {
    return (JSON.parse(readFileSync(join(packageRoot(), 'package.json'), 'utf8')) as { version: string }).version;
  } catch {
    return '0.0.0';
  }
}

/** LUNA's Add Ons folder for this platform. */
export function addOnsFolder(): string {
  if (process.platform === 'darwin') return '/Library/Application Support/Universal Audio/LUNA/Add Ons';
  if (process.platform === 'win32') return join(process.env['LOCALAPPDATA'] ?? join(process.env['USERPROFILE'] ?? '', 'AppData', 'Local'), 'Universal Audio', 'LUNA', 'Add Ons');
  throw new Error('LUNA Add Ons are supported on macOS and Windows only');
}

export interface Manifest {
  package_name?: string;
  add_ons?: ManifestEntry[];
  [k: string]: unknown;
}

export interface ManifestEntry {
  id: string;
  title: string;
  html?: string;
  url?: string;
  /** Required for a `"window"`; LUNA sizes browser and app Add Ons itself. */
  width?: number;
  height?: number;
  target?: string;
  floating?: boolean;
  show_with_session?: boolean;
  version?: string;
  engines?: string[];
  [k: string]: unknown;
}

/** True for a `"window"` Add On, which is also what a missing `target` means. */
export function isWindow(target: string | undefined): boolean {
  return target === undefined || target === 'window';
}

/** Where LUNA lists an Add On of `target`: a submenu of its Add Ons menu, one per target. */
export function menuFor(target: string | undefined): string {
  if (target === 'app' || target === 'page') return 'Add Ons > Apps';
  if (target === 'browser') return 'Add Ons > Browsers';
  return 'Add Ons > Windows';
}

/** Read and validate `manifest.json` in `dir`. Throws with a readable message on problems. */
export function readManifest(dir: string): { manifest: Manifest; entries: ManifestEntry[] } {
  const path = join(dir, 'manifest.json');
  if (!existsSync(path)) throw new Error(`no manifest.json in ${dir}`);
  let manifest: Manifest;
  try {
    manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  } catch (e) {
    throw new Error(`manifest.json is not valid JSON: ${(e as Error).message}`);
  }
  const entries = Array.isArray(manifest.add_ons) ? manifest.add_ons : [manifest as unknown as ManifestEntry];
  const problems: string[] = [];
  for (const [i, e] of entries.entries()) {
    const where = `entry ${i} (${e.id ?? 'no id'})`;
    for (const k of ['id', 'title'] as const) if (typeof e[k] !== 'string' || !e[k]) problems.push(`${where}: "${k}" must be a non-empty string`);
    for (const k of ['width', 'height'] as const) {
      if (e[k] === undefined ? isWindow(e.target) : typeof e[k] !== 'number') problems.push(`${where}: "${k}" must be a number${isWindow(e.target) ? '' : ' when present'}`);
    }
    if ((e.html ? 1 : 0) + (e.url ? 1 : 0) !== 1) problems.push(`${where}: exactly one of "html" or "url" is required`);
    if (e.html && !existsSync(join(dir, e.html))) problems.push(`${where}: html file not found: ${e.html}`);
    if (e.target !== undefined && !['window', 'app', 'page', 'browser'].includes(e.target)) problems.push(`${where}: unknown target "${e.target}"`);
    for (const k of ['floating', 'show_with_session'] as const) if (e[k] !== undefined && typeof e[k] !== 'boolean') problems.push(`${where}: "${k}" must be true or false`);
  }
  if (problems.length) throw new Error(`manifest.json problems:\n  - ${problems.join('\n  - ')}`);
  return { manifest, entries };
}

export function usage(): string {
  return `ua-builder ${sdkVersion()} — build LUNA Add Ons

  ua-builder new <name> [--id com.x.y] [--title "Title"] [--target window|app|browser]
                        [--no-floating] [--show-with-session] [--width 900 --height 600] [--dir path]
  ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
  ua-builder test [dir] [--live]
  ua-builder probe <url> [--expr <js>] [--wait <js>] [--timeout <ms>]   read a served page's live DOM
  ua-builder install [dir] [--name "Link Name"]
  ua-builder pack [dir] [--out Name.lunaaddon]
  ua-builder doctor
  ua-builder tree [path] [--levels 1] [--out tree.json]   the shape of LUNA's tree (read-only)

Docs: docs/QUICKSTART.md, docs/MANIFEST.md in the @uaudio/ua-builder-sdk package.`;
}
