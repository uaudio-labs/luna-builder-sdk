import { spawnSync } from 'node:child_process';
import { accessSync, chmodSync, constants, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
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

/** The @uaudio/luna-builder-sdk package root (this file lives in dist/ once built). */
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

/** LUNA's Add Ons folder for this platform; `UA_ADDONS_FOLDER` overrides it (tests, staging). */
export function addOnsFolder(): string {
  const override = process.env['UA_ADDONS_FOLDER'];
  if (override) return override;
  if (process.platform === 'darwin') return '/Library/Application Support/Universal Audio/LUNA/Add Ons';
  if (process.platform === 'win32') return join(process.env['ProgramData'] ?? 'C:\\ProgramData', 'Universal Audio', 'LUNA', 'Add Ons');
  throw new Error('LUNA Add Ons are supported on macOS and Windows only');
}

/**
 * LUNA's one-time macOS setup of the Add Ons folder, run as root through osascript's
 * administrator prompt; the folder is argv item 1. The same script as LUNA's
 * Rack_AddOnInstaller (HBH-35640): owned by root, group staff, with an inherited ACL that
 * lets every local account add, change and remove Add Ons. find skips symlinks, so a linked
 * project folder is never touched.
 */
export const ADD_ONS_SETUP_SCRIPT = [
  'on run argv',
  'set d to quoted form of (item 1 of argv)',
  'do shell script "/bin/mkdir -p " & d & " && /usr/sbin/chown root:staff " & d & " && /bin/chmod 0775 " & d & ' +
    '" && /usr/bin/find " & d & " ! -type l -exec /bin/chmod +a \'group:staff allow list,add_file,search,add_subdirectory,' +
    'delete_child,readattr,writeattr,readextattr,writeextattr,readsecurity,file_inherit,directory_inherit\' {} +" ' +
    'with prompt "ua-builder wants to set up the LUNA Add Ons folder so everyone on this Mac can install Add Ons." ' +
    'with administrator privileges',
  'end run',
].join('\n');

/**
 * LUNA's one-time Windows setup of the Add Ons folder, the same as LUNA's Rack_AddOnInstaller
 * (HBH-35640): one UAC prompt runs cmd.exe elevated to create the folder and grant
 * BUILTIN\Users (by SID, so on any Windows language) Modify, inherited by files and folders.
 * /T also fixes what is already in it; /L changes a link itself, never its target. A
 * PowerShell script; the folder comes in as `UA_ADDONS_SETUP_FOLDER`. Exits 1223
 * (ERROR_CANCELLED) when the UAC prompt is declined.
 */
export const WINDOWS_ADD_ONS_SETUP_SCRIPT = [
  '$d = $env:UA_ADDONS_SETUP_FOLDER',
  'try {',
  '  $p = Start-Process -FilePath "$env:SystemRoot\\System32\\cmd.exe" -Verb RunAs -Wait -PassThru -WindowStyle Hidden ' +
    '-ArgumentList "/c mkdir `"$d`" & icacls `"$d`" /grant *S-1-5-32-545:(OI)(CI)M /T /L"',
  '  exit $p.ExitCode',
  '} catch {',
  '  for ($e = $_.Exception; $e; $e = $e.InnerException) { if ($e.NativeErrorCode -eq 1223) { exit 1223 } }',
  '  [Console]::Error.WriteLine($_.Exception.Message)',
  '  exit 1',
  '}',
].join('\n');

/**
 * Exits 0 when the folder in `UA_ADDONS_SETUP_FOLDER` has an allow rule for every local
 * account (BUILTIN\Users, Authenticated Users or Everyone, by SID) that grants Modify on the
 * folder and is inherited by files and folders: what the setup above and LUNA's installer
 * give it. 197055 is FileSystemRights.Modify.
 */
export const WINDOWS_ADD_ONS_CHECK_SCRIPT = [
  '$d = $env:UA_ADDONS_SETUP_FOLDER',
  '$rules = (Get-Acl -LiteralPath $d).GetAccessRules($true, $true, [System.Security.Principal.SecurityIdentifier])',
  "$ok = @($rules | Where-Object { $_.AccessControlType -eq 'Allow' -and " +
    "@('S-1-5-32-545', 'S-1-5-11', 'S-1-1-0') -contains $_.IdentityReference.Value -and " +
    '($_.InheritanceFlags -band 3) -eq 3 -and ($_.PropagationFlags -band 2) -eq 0 -and ' +
    '($_.FileSystemRights -band 197055) -eq 197055 }).Count -gt 0',
  'if ($ok) { exit 0 } else { exit 1 }',
].join('\n');

/** Runs a Windows PowerShell script with `UA_ADDONS_SETUP_FOLDER` set to `folder`. */
export function runAddOnsFolderScript(script: string, folder: string) {
  const powershell = join(process.env['SystemRoot'] ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return spawnSync(powershell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], {
    encoding: 'utf8',
    env: { ...process.env, UA_ADDONS_SETUP_FOLDER: folder },
    windowsHide: true,
  });
}

/** Whether this user can add and remove entries in `folder` (ACLs included). */
export function canWriteFolder(folder: string): boolean {
  try {
    if (!statSync(folder).isDirectory()) return false;
    if (process.platform === 'win32') {
      // access() sees only the read-only attribute on Windows, so try it.
      const probe = join(folder, `.ua_builder_write_test_${process.pid}`);
      writeFileSync(probe, '', { flag: 'wx' });
      unlinkSync(probe);
      return true;
    }
    accessSync(folder, constants.W_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether the Add Ons folder is ready for installs. On Windows the real folder must also be
 * set up for every user: one a standard user creates in ProgramData is theirs alone, so other
 * accounts could add Add Ons but not replace or remove that user's. Elsewhere, and for
 * `UA_ADDONS_FOLDER`, the same as `canWriteFolder()`.
 */
export function isAddOnsFolderReady(folder: string = addOnsFolder()): boolean {
  if (!canWriteFolder(folder)) return false;
  if (process.platform !== 'win32' || process.env['UA_ADDONS_FOLDER']) return true;
  return runAddOnsFolderScript(WINDOWS_ADD_ONS_CHECK_SCRIPT, folder).status === 0;
}

/**
 * Make sure this user can add and remove entries in the Add Ons folder, creating it if it is
 * missing. When the user cannot (macOS: the folder is in /Library; Windows: it is in
 * ProgramData and not set up for every user), sets it up for every user as LUNA does: macOS
 * asks once for an administrator's password, Windows shows one UAC prompt. After that no
 * install needs either. On Windows the real folder is never created without that setup.
 * `UA_ADDONS_FOLDER` (tests, staging) is never escalated. Throws when the folder stays
 * unwritable or the prompt is cancelled.
 */
export function prepareAddOnsFolder(folder: string = addOnsFolder()): void {
  if (isAddOnsFolderReady(folder)) return;
  const overridden = !!process.env['UA_ADDONS_FOLDER'];
  if (process.platform !== 'win32' || overridden) {
    try {
      mkdirSync(folder, { recursive: true });
    } catch {
      // Not ours to create; the setup below makes it.
    }
    if (isAddOnsFolderReady(folder)) return;
  }
  if ((process.platform !== 'darwin' && process.platform !== 'win32') || overridden) {
    throw new Error(`cannot write the Add Ons folder ${folder}`);
  }
  if (process.platform === 'darwin') {
    console.log('Setting up the LUNA Add Ons folder for every user on this Mac (one time; asks for an administrator password)...');
    const result = spawnSync('/usr/bin/osascript', ['-e', ADD_ONS_SETUP_SCRIPT, folder], { encoding: 'utf8' });
    if (result.status !== 0) {
      const detail = (result.stderr ?? '').trim() || (result.error?.message ?? 'osascript failed');
      throw new Error(detail.includes('(-128)') ? 'Setting up the Add Ons folder was cancelled' : `could not set up ${folder}: ${detail}`);
    }
  } else {
    console.log('Setting up the LUNA Add Ons folder for every user on this PC (one time; asks for administrator approval)...');
    const result = runAddOnsFolderScript(WINDOWS_ADD_ONS_SETUP_SCRIPT, folder);
    if (result.status === 1223) throw new Error('Setting up the Add Ons folder was cancelled');
    if (result.status !== 0) {
      const detail = (result.stderr ?? '').trim() || (result.error?.message ?? `exit ${result.status}`);
      throw new Error(`could not set up ${folder}: ${detail}`);
    }
  }
  if (!isAddOnsFolderReady(folder)) throw new Error(`${folder} is still not writable after setup`);
}

export interface Manifest {
  package_name?: string;
  /** In the `add_ons` shape, the default for every entry without its own `manufacturer`. */
  manufacturer?: string;
  /** In the `add_ons` shape, the default for every entry without its own `description`. */
  description?: string | string[];
  add_ons?: ManifestEntry[];
  [k: string]: unknown;
}

export interface ManifestEntry {
  id: string;
  /**
   * The Add On's display name: its menu item and panel header. Filled in from `title` by
   * `readManifest()`; newer LUNA releases accept it in a manifest, older ones do not.
   */
  name: string;
  /** The display name as a manifest writes it: every LUNA release reads it. */
  title?: string;
  html?: string;
  url?: string;
  /** Required for a `"window"`; LUNA sizes browser, app and editor Add Ons itself. */
  width?: number;
  height?: number;
  target?: string;
  floating?: boolean;
  show_with_session?: boolean;
  /** `"window"` only: open at `width` x `height` and never resize. */
  fixed_size?: boolean;
  /** Keep running at full speed while hidden (no throttling, no suspension). */
  run_hidden?: boolean;
  /** Unload the page when the Add On is closed; reopening loads it fresh. */
  unload_on_close?: boolean;
  version?: string;
  /** Who makes the Add On; LUNA shows it in Settings > Add Ons. Overrides a top-level one. */
  manufacturer?: string;
  /** What the Add On does: a string, or an array of strings LUNA concatenates with no separator. */
  description?: string | string[];
  engines?: string[];
  [k: string]: unknown;
}

/** A manifest `description` as LUNA reads it: a string, or an array of strings it concatenates. */
function isDescription(d: unknown): boolean {
  return typeof d === 'string' || (Array.isArray(d) && d.every((s) => typeof s === 'string'));
}

/** True for a `"window"` Add On, which is also what a missing `target` means. */
export function isWindow(target: string | undefined): boolean {
  return target === undefined || target === 'window';
}

/** Where LUNA lists an Add On of `target`: a submenu of its Add Ons menu, one per target. */
export function menuFor(target: string | undefined): string {
  if (target === 'app' || target === 'page') return 'Add Ons > Apps';
  if (target === 'browser') return 'Add Ons > Browsers';
  if (target === 'editor') return 'Add Ons > Editors';
  return 'Add Ons > Windows';
}

/**
 * An entry's display name as LUNA reads it: `name`, else `title`. Undefined
 * when neither is a string.
 */
export function entryName(e: { [k: string]: unknown }): string | undefined {
  if (e.name !== undefined) return typeof e.name === 'string' ? e.name : undefined;
  return typeof e.title === 'string' ? e.title : undefined;
}

/** An Add On LUNA lists from its Add Ons folder, and the folder entry it came from. */
export interface InstalledAddOn {
  id: string;
  name: string;
  /** The Add Ons folder entry (folder or symlink). */
  entry: string;
}

/**
 * Every Add On in LUNA's Add Ons folder, read leniently: an entry with no readable
 * `manifest.json` is skipped, as is a manifest entry without a string `id` and `name` (or
 * the deprecated `title`). No folder (LUNA not installed, or a platform LUNA does not run on)
 * means none.
 */
export function installedAddOns(folder?: string): InstalledAddOn[] {
  let root: string;
  try {
    root = folder ?? addOnsFolder();
  } catch {
    return [];
  }
  if (!existsSync(root)) return [];
  const out: InstalledAddOn[] = [];
  for (const name of readdirSync(root)) {
    const entry = join(root, name);
    let manifest: Manifest;
    try {
      manifest = JSON.parse(readFileSync(join(entry, 'manifest.json'), 'utf8')) as Manifest;
    } catch {
      continue;
    }
    const entries = 'add_ons' in manifest ? (Array.isArray(manifest.add_ons) ? manifest.add_ons : []) : [manifest];
    for (const e of entries) {
      const name = e ? entryName(e) : undefined;
      if (typeof e?.id === 'string' && name !== undefined) out.push({ id: e.id, name, entry });
    }
  }
  return out;
}

/**
 * The installed Add Ons whose `id` or `name` an Add On would collide with. LUNA needs both
 * unique across everything installed; a duplicate name collapses into one menu item. Names
 * compare without case or surrounding whitespace, since they read the same in the menu; ids
 * without case, since LUNA treats ids that differ only in case as the same Add On.
 * Entries in `except` (the Add On's own install, being replaced) are left out.
 */
export function addOnClashes(wanted: { id: string; name: string }[], installed: InstalledAddOn[], except: string[] = []): string[] {
  const nameKey = (t: string) => t.trim().toLowerCase();
  const skip = new Set(except.map((p) => resolve(p)));
  const problems: string[] = [];
  for (const w of wanted) {
    for (const i of installed) {
      if (skip.has(resolve(i.entry))) continue;
      if (i.id.toLowerCase() === w.id.toLowerCase()) problems.push(`id "${w.id}" is already used by "${i.name}" in ${i.entry}`);
      else if (nameKey(i.name) === nameKey(w.name)) problems.push(`name "${w.name}" is already used by ${i.id} in ${i.entry}`);
    }
  }
  return problems;
}

/**
 * Read and validate `manifest.json` in `dir`. Throws with a readable message on problems.
 * The display name is read as LUNA reads it, `name` else `title`, and the returned entry has
 * `name` filled in. An entry with both warns when they differ, since LUNA releases that
 * predate `name` show `title`.
 */
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
  if (Array.isArray(manifest.add_ons) && manifest.manufacturer !== undefined && typeof manifest.manufacturer !== 'string') {
    problems.push('top level: "manufacturer" must be a string');
  }
  if (Array.isArray(manifest.add_ons) && manifest.description !== undefined && !isDescription(manifest.description)) {
    problems.push('top level: "description" must be a string or an array of strings');
  }
  for (const [i, e] of entries.entries()) {
    const where = `entry ${i} (${e.id ?? 'no id'})`;
    if (typeof e.id !== 'string' || !e.id) problems.push(`${where}: "id" must be a non-empty string`);
    else if (e.id !== e.id.toLowerCase()) console.warn(`manifest.json ${where}: LUNA reads "id" as "${e.id.toLowerCase()}"; write it in lowercase`);
    const nameKey = e.name === undefined ? 'title' : 'name';
    if (nameKey === 'title') {
      if (typeof e.title === 'string') e.name = e.title;
    } else if (e.title !== undefined && e.title !== e.name) {
      console.warn(`manifest.json ${where}: "title" differs from "name"; LUNA shows "name" but older LUNA releases show "title". Make them match`);
    }
    if (typeof e.name !== 'string' || !e.name) problems.push(`${where}: "${nameKey}" must be a non-empty string`);
    for (const k of ['width', 'height'] as const) {
      if (e[k] === undefined ? isWindow(e.target) : typeof e[k] !== 'number') problems.push(`${where}: "${k}" must be a number${isWindow(e.target) ? '' : ' when present'}`);
    }
    if ((e.html ? 1 : 0) + (e.url ? 1 : 0) !== 1) problems.push(`${where}: exactly one of "html" or "url" is required`);
    if (e.html && !existsSync(join(dir, e.html))) problems.push(`${where}: html file not found: ${e.html}`);
    if (e.target !== undefined && !['window', 'app', 'page', 'browser', 'editor'].includes(e.target)) problems.push(`${where}: unknown target "${e.target}"`);
    for (const k of ['floating', 'show_with_session', 'fixed_size', 'run_hidden', 'unload_on_close'] as const) if (e[k] !== undefined && typeof e[k] !== 'boolean') problems.push(`${where}: "${k}" must be true or false`);
    if (e.manufacturer !== undefined && typeof e.manufacturer !== 'string') problems.push(`${where}: "manufacturer" must be a string`);
    if (e.description !== undefined && !isDescription(e.description)) problems.push(`${where}: "description" must be a string or an array of strings`);
  }
  if (problems.length) throw new Error(`manifest.json problems:\n  - ${problems.join('\n  - ')}`);
  return { manifest, entries };
}

export function usage(): string {
  return `ua-builder ${sdkVersion()} — build LUNA Add Ons

  ua-builder new <name> [--id com.x.y] [--name "Name"] [--manufacturer "Name"] [--description "Text"] [--target window|app|browser|editor]
                        [--no-floating] [--show-with-session] [--width 900 --height 600]
                        [--template add-on-basic|add-on-typescript] [--dir path]
  ua-builder serve [dir] [--port 8790] [--host 0.0.0.0] [--luna [--forward-port 4719]]
  ua-builder test [dir] [--live]
  ua-builder probe <url> [--expr <js>] [--wait <js>] [--timeout <ms>]   read a served page's live DOM
  ua-builder install [dir] [--name "Link Name"]
  ua-builder pack [dir] [--out Name.lunaaddon] [--source-maps]
  ua-builder doctor
  ua-builder tree [path] [--levels 1] [--out tree.json]   the shape of LUNA's tree (read-only)

Docs: docs/QUICKSTART.md, docs/MANIFEST.md in the @uaudio/luna-builder-sdk package.`;
}
