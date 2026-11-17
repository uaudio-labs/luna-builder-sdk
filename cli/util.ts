import { spawnSync } from 'node:child_process';
import { accessSync, chmodSync, constants, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADD_ON_CATEGORIES, isAddOnCategory, suggestAddOnCategories } from '../src/model/add-on-categories';

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
  /** In the `add_ons` shape, the default for every entry without its own `categories`. */
  categories?: string[];
  /** In the `add_ons` shape, the default for every entry without its own `network`. */
  network?: string[];
  /** In the `add_ons` shape, the default for every entry without its own `requires_plugins`. */
  requires_plugins?: ManifestPluginRequirement[];
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
  /** Required when it can be a `"window"`; LUNA sizes browser, app and editor Add Ons itself. */
  width?: number;
  height?: number;
  /** The one host, or the default among `targets`. */
  target?: string;
  /** Every host the user can swap it between: `"window"`, `"browser"` and `"editor"`. */
  targets?: string[];
  floating?: boolean;
  show_with_session?: boolean;
  /** `"window"` only: open at `width` x `height` and never resize. */
  fixed_size?: boolean;
  /** Keep running at full speed while hidden (no throttling, no suspension). */
  run_hidden?: boolean;
  /** Unload the page when the Add On is closed; reopening loads it fresh. */
  unload_on_close?: boolean;
  /** `"window"` only: the window's size limits in pixels; LUNA drops a bad one. */
  min_width?: number;
  min_height?: number;
  max_width?: number;
  max_height?: number;
  version?: string;
  /** Who makes the Add On; LUNA shows it in Settings > Add Ons. Overrides a top-level one. */
  manufacturer?: string;
  /** What the Add On does: a string, or an array of strings LUNA concatenates with no separator. */
  description?: string | string[];
  /** One or more of `ADD_ON_CATEGORIES` by name, such as `["MIDI"]`. Overrides a top-level one. */
  categories?: string[];
  /**
   * The servers the page may reach once the user allows them: `"api.example.com"`,
   * `"*.example.com"` or `"api.example.com:8443"`, over https and wss only. Without it the page
   * reaches no server but LUNA. Overrides a top-level one.
   */
  network?: string[];
  /** The plugins it needs; LUNA will not open it while one is missing or too old. Overrides a top-level one. */
  requires_plugins?: ManifestPluginRequirement[];
  engines?: string[];
  [k: string]: unknown;
}

/** One `requires_plugins` entry as a manifest writes it: `plugin_id` may be one id or several. */
export interface ManifestPluginRequirement {
  plugin_id: string | string[];
  name?: string;
  min_version?: string;
  optional?: boolean;
}

/**
 * Problems with a manifest `requires_plugins` value, `where` naming it. LUNA drops an entry it
 * cannot use (no id, a `min_version` that is not dot-separated whole numbers) and keeps the
 * Add On, so each is an error here rather than a surprise there.
 */
function requiresPluginsProblems(value: unknown, where: string): string[] {
  if (!Array.isArray(value)) return [`${where}: "requires_plugins" must be an array`];
  const problems: string[] = [];
  for (const [i, r] of value.entries()) {
    const at = `${where}: requires_plugins[${i}]`;
    if (typeof r !== 'object' || r === null || Array.isArray(r)) {
      problems.push(`${at} must be an object with "plugin_id"`);
      continue;
    }
    const req = r as Record<string, unknown>;
    const ids = Array.isArray(req['plugin_id']) ? req['plugin_id'] : [req['plugin_id']];
    if (!ids.length || ids.some((id) => typeof id !== 'string' || !id.trim())) problems.push(`${at}: "plugin_id" must be a plugin id, or an array of them (one per format)`);
    if (req['name'] !== undefined && typeof req['name'] !== 'string') problems.push(`${at}: "name" must be a string`);
    if (req['min_version'] !== undefined && (typeof req['min_version'] !== 'string' || !/^\d+(\.\d+)*$/.test(req['min_version']))) {
      problems.push(`${at}: "min_version" must be a version such as "0.4.3"`);
    }
    if (req['optional'] !== undefined && typeof req['optional'] !== 'boolean') problems.push(`${at}: "optional" must be true or false`);
  }
  return problems;
}

/**
 * A note for each requirement without a `name`: LUNA shows the first plugin id instead, as in
 * "Requires com.eventfield.vst3.clex".
 */
function unnamedRequirementNotes(value: unknown, where: string): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((r, i) =>
    typeof r === 'object' && r !== null && (r as Record<string, unknown>)['name'] === undefined
      ? [`${where}: requires_plugins[${i}] has no "name"; LUNA will show its plugin id to the user. Add the plugin's name`]
      : [],
  );
}

/** A manifest `description` as LUNA reads it: a string, or an array of strings it concatenates. */
function isDescription(d: unknown): boolean {
  return typeof d === 'string' || (Array.isArray(d) && d.every((s) => typeof s === 'string'));
}

/**
 * Problems with a manifest `categories` value, `where` naming it: it must be a non-empty array
 * of names from `ADD_ON_CATEGORIES`, written exactly and each once.
 */
function categoryProblems(c: unknown, where: string): string[] {
  if (!Array.isArray(c) || c.length === 0) return [`${where}: "categories" must be a non-empty array of category names`];
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const name of c) {
    if (!isAddOnCategory(name)) {
      const near = typeof name === 'string' ? ADD_ON_CATEGORIES.find((k) => k.name.toLowerCase() === name.trim().toLowerCase()) : undefined;
      problems.push(`${where}: unknown category ${JSON.stringify(name)}${near ? `; did you mean "${near.name}"?` : `; use one of ${categoryList()}`}`);
    } else if (seen.has(name)) problems.push(`${where}: category "${name}" is listed twice`);
    else seen.add(name);
  }
  return problems;
}

/** Second-level labels under which a two-letter country code sells names to anyone, as LUNA has them. */
const SECOND_LEVEL_SUFFIXES = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gob', 'nic']);

/** Whether `host` (no port) names this computer, as LUNA reads it. */
export function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'localhost' || h === '[::1]' || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h);
}

/**
 * Why LUNA would drop a manifest `network` entry, or `undefined` when it keeps it. Mirrors
 * LUNA's own reading: a host name, an optional leading `*.`, an optional `:port`; no scheme,
 * path, single-label name, wildcard over a whole suffix, wildcard IP, or loopback.
 */
export function networkEntryProblem(entry: string): string | undefined {
  const e = entry.trim().toLowerCase();
  if (!e) return 'empty';
  if (e.includes('://')) return 'a host name, not a URL: leave out the scheme (https is implied)';
  if (/[/?#@\[\] \t]/.test(e)) return 'a host name only, with no path, query, user or IPv6 address';
  let host = e;
  const colon = e.lastIndexOf(':');
  if (colon >= 0) {
    const port = e.slice(colon + 1);
    if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) return 'the port must be a number from 1 to 65535';
    host = e.slice(0, colon);
  }
  const wildcard = host.startsWith('*.');
  if (wildcard) host = host.slice(2);
  if (host.includes('*')) return 'a wildcard is only allowed as a leading "*."';
  if (!host || host.length > 253) return 'not a host name';
  const labels = host.split('.');
  if (labels.some((l) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l))) return 'not a host name';
  if (isLoopbackHost(host)) return 'LUNA on this computer is always allowed, so it is not listed';
  if (labels.length < 2) return 'a full host name, such as "api.example.com"';
  const ip = labels.length === 4 && labels.every((l) => /^\d{1,3}$/.test(l) && Number(l) <= 255);
  if (!ip && /^\d+$/.test(labels[labels.length - 1] ?? '')) return 'not a host name';
  if (wildcard && ip) return 'a wildcard cannot cover IP addresses';
  if (wildcard && labels.length === 2 && labels[1]!.length === 2 && SECOND_LEVEL_SUFFIXES.has(labels[0]!)) return 'a wildcard cannot cover a whole domain suffix';
  return undefined;
}

/** Problems with a manifest `network` value, `where` naming it. */
function networkProblems(n: unknown, where: string): string[] {
  if (!Array.isArray(n) || !n.every((h) => typeof h === 'string')) return [`${where}: "network" must be an array of host names`];
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const h of n as string[]) {
    const why = networkEntryProblem(h);
    if (why) problems.push(`${where}: "network" entry ${JSON.stringify(h)}: ${why}`);
    else if (seen.has(h.trim().toLowerCase())) problems.push(`${where}: "network" lists ${JSON.stringify(h)} twice`);
    seen.add(h.trim().toLowerCase());
  }
  return problems;
}

/** Problems with a server-hosted entry's `url`: https, or http on this computer only. */
function urlProblem(url: unknown, where: string): string | undefined {
  if (typeof url !== 'string') return `${where}: "url" must be a string`;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `${where}: "url" must be an http or https URL`;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return `${where}: "url" must be an http or https URL`;
  if (parsed.protocol === 'http:' && !isLoopbackHost(parsed.hostname)) return `${where}: "url" must be https unless it is on this computer; LUNA does not load it`;
  return undefined;
}

/** Every category name, quoted, for a message. */
export function categoryList(): string {
  return ADD_ON_CATEGORIES.map((c) => `"${c.name}"`).join(', ');
}

/**
 * A note for each entry that has no `categories` (its own or the manifest's top-level one),
 * with categories guessed from its name and description. Empty when every entry has some.
 */
export function missingCategoryNotes(manifest: Manifest, entries: ManifestEntry[]): string[] {
  const notes: string[] = [];
  for (const [i, e] of entries.entries()) {
    if (e.categories !== undefined || (Array.isArray(manifest.add_ons) && manifest.categories !== undefined)) continue;
    const text = [e.name, e.description, Array.isArray(manifest.add_ons) ? manifest.description : undefined]
      .flat()
      .filter((s): s is string => typeof s === 'string')
      .join(' ');
    const guess = suggestAddOnCategories(text);
    notes.push(`entry ${i} (${e.id}) has no "categories". From its name and description it could be ${guess.map((g) => `"${g}"`).join(', ')}; add e.g. "categories": ${JSON.stringify(guess.slice(0, 1))} to manifest.json. See docs/MANIFEST.md for the list.`);
  }
  return notes;
}

/** True for a `"window"` Add On, which is also what a missing `target` means. */
export function isWindow(target: string | undefined): boolean {
  return target === undefined || target === 'window';
}

/** The hosts `targets` may list together; `"app"` is always on its own. */
export const SWAPPABLE_TARGETS = ['window', 'browser', 'editor'] as const;

/**
 * Every host an entry can be shown in, default first, as LUNA reads it: the usable names in
 * `targets` (window, browser or editor; duplicates once), with `target` moved to the front when
 * the list holds it; or just `target` (default `"window"`) when there is no usable list or
 * `target` is `"app"`.
 */
export function entryTargets(e: { target?: unknown; targets?: unknown }): string[] {
  const single = typeof e.target === 'string' ? (e.target === 'page' ? 'app' : e.target) : 'window';
  const listed = Array.isArray(e.targets)
    ? [...new Set(e.targets.filter((t): t is string => typeof t === 'string' && (SWAPPABLE_TARGETS as readonly string[]).includes(t)))]
    : [];
  if (!listed.length || single === 'app') return [single];
  return listed.includes(single) && typeof e.target === 'string' ? [single, ...listed.filter((t) => t !== single)] : listed;
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
  if (Array.isArray(manifest.add_ons) && manifest.categories !== undefined) problems.push(...categoryProblems(manifest.categories, 'top level'));
  if (Array.isArray(manifest.add_ons) && manifest.network !== undefined) problems.push(...networkProblems(manifest.network, 'top level'));
  const notes: string[] = [];
  if (Array.isArray(manifest.add_ons) && manifest.requires_plugins !== undefined) {
    problems.push(...requiresPluginsProblems(manifest.requires_plugins, 'top level'));
    notes.push(...unnamedRequirementNotes(manifest.requires_plugins, 'top level'));
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
    const hosts = entryTargets(e);
    const canBeWindow = hosts.includes('window');
    for (const k of ['width', 'height'] as const) {
      if (e[k] === undefined ? canBeWindow : typeof e[k] !== 'number') problems.push(`${where}: "${k}" must be a number${canBeWindow ? '' : ' when present'}`);
    }
    if ((e.html ? 1 : 0) + (e.url ? 1 : 0) !== 1) problems.push(`${where}: exactly one of "html" or "url" is required`);
    if (e.html && !existsSync(join(dir, e.html))) problems.push(`${where}: html file not found: ${e.html}`);
    if (e.target !== undefined && !['window', 'app', 'page', 'browser', 'editor'].includes(e.target)) problems.push(`${where}: unknown target "${e.target}"`);
    if (e.targets !== undefined) {
      if (!Array.isArray(e.targets) || !e.targets.length) problems.push(`${where}: "targets" must be a non-empty array`);
      else {
        for (const t of e.targets) {
          if (!(SWAPPABLE_TARGETS as readonly unknown[]).includes(t)) problems.push(`${where}: "targets" can only list ${SWAPPABLE_TARGETS.map((n) => `"${n}"`).join(', ')}, not ${JSON.stringify(t)}`);
        }
        if (new Set(e.targets).size !== e.targets.length) console.warn(`manifest.json ${where}: "targets" lists a target twice; LUNA keeps the first`);
        if (e.target === 'app' || e.target === 'page') console.warn(`manifest.json ${where}: an "app" Add On is app only; LUNA ignores "targets"`);
        else if (e.target !== undefined && !e.targets.includes(e.target)) {
          console.warn(`manifest.json ${where}: "target" "${e.target}" is not in "targets"; LUNA opens it as "${hosts[0]}", the first of "targets"`);
        }
      }
    }
    for (const k of ['floating', 'show_with_session', 'fixed_size', 'run_hidden', 'unload_on_close'] as const) if (e[k] !== undefined && typeof e[k] !== 'boolean') problems.push(`${where}: "${k}" must be true or false`);
    // LUNA drops a limit that is not a positive integer, and both of a min above its max.
    for (const k of ['min_width', 'min_height', 'max_width', 'max_height'] as const) {
      const v = e[k];
      if (v !== undefined && (typeof v !== 'number' || !Number.isInteger(v) || v <= 0)) problems.push(`${where}: "${k}" must be a whole number above 0`);
    }
    for (const axis of ['width', 'height'] as const) {
      const min = e[`min_${axis}`];
      const max = e[`max_${axis}`];
      if (typeof min === 'number' && typeof max === 'number' && min > max) problems.push(`${where}: "min_${axis}" is above "max_${axis}"`);
    }
    if (!canBeWindow && ['min_width', 'min_height', 'max_width', 'max_height'].some((k) => e[k] !== undefined)) {
      console.warn(`manifest.json ${where}: "min_*" and "max_*" apply to a "window" only; LUNA ignores them here`);
    }
    if (e.manufacturer !== undefined && typeof e.manufacturer !== 'string') problems.push(`${where}: "manufacturer" must be a string`);
    if (e.description !== undefined && !isDescription(e.description)) problems.push(`${where}: "description" must be a string or an array of strings`);
    if (e.categories !== undefined) problems.push(...categoryProblems(e.categories, where));
    if (e.network !== undefined) problems.push(...networkProblems(e.network, where));
    if (e.requires_plugins !== undefined) {
      problems.push(...requiresPluginsProblems(e.requires_plugins, where));
      notes.push(...unnamedRequirementNotes(e.requires_plugins, where));
    }
    if (e.url !== undefined) {
      const why = urlProblem(e.url, where);
      if (why) problems.push(why);
    }
  }
  if (problems.length) throw new Error(`manifest.json problems:\n  - ${problems.join('\n  - ')}`);
  for (const note of notes) console.warn(`manifest.json ${note}`);
  for (const note of missingCategoryNotes(manifest, entries)) console.warn(`manifest.json ${note}`);
  return { manifest, entries };
}

export function usage(): string {
  return `ua-builder ${sdkVersion()} — build LUNA Add Ons

  ua-builder new <name> [--id com.x.y] [--name "Name"] [--manufacturer "Name"] [--description "Text"] [--categories "MIDI,Utility"]
                        [--target window|app|browser|editor]
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
