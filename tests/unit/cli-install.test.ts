/** `ua-builder install` refuses an Add On whose id or name another installed Add On uses. */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { install } from '../../cli/install';
import {
  ADD_ONS_SETUP_SCRIPT,
  addOnsFolder,
  canWriteFolder,
  parseArgs,
  prepareAddOnsFolder,
  runAddOnsFolderScript,
  WINDOWS_ADD_ONS_CHECK_SCRIPT,
  WINDOWS_ADD_ONS_SETUP_SCRIPT,
} from '../../cli/util';

const dirs: string[] = [];
let addOns = '';

function addOn(parent: string, name: string, manifest: object): string {
  const dir = join(parent, name);
  mkdirSync(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html>');
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ html: 'index.html', width: 400, height: 300, ...manifest }));
  return dir;
}

async function run(dir: string, ...flags: string[]): Promise<number> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    return await install(parseArgs([dir, ...flags]));
  } finally {
    log.mockRestore();
  }
}

beforeEach(() => {
  addOns = mkdtempSync(join(tmpdir(), 'ua-addons-'));
  dirs.push(addOns);
  vi.stubEnv('UA_ADDONS_FOLDER', addOns);
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe.skipIf(process.platform === 'win32')('ua-builder install', () => {
  it('refuses an id or name already installed, and links nothing', async () => {
    addOn(addOns, 'Other', { id: 'com.x.taken', name: 'Taken' });
    const src = mkdtempSync(join(tmpdir(), 'ua-src-'));
    dirs.push(src);
    const byId = addOn(src, 'a', { package_name: 'A', id: 'com.x.taken', name: 'Fresh' });
    await expect(run(byId)).rejects.toThrow('id "com.x.taken" is already used by "Taken"');
    expect(existsSync(join(addOns, 'A'))).toBe(false);
    const byName = addOn(src, 'b', { package_name: 'B', id: 'com.x.fresh', name: 'taken' });
    await expect(run(byName)).rejects.toThrow('name "taken" is already used by com.x.taken');
  });

  it('reinstalls the same Add On without calling it a clash', async () => {
    const src = mkdtempSync(join(tmpdir(), 'ua-src-'));
    dirs.push(src);
    const dir = addOn(src, 'mine', { package_name: 'Mine', id: 'com.x.mine', name: 'Mine' });
    expect(await run(dir)).toBe(0);
    expect(await run(dir)).toBe(0);
    expect(existsSync(join(addOns, 'Mine', 'manifest.json'))).toBe(true);
  });
});

// LUNA keeps an Add On's secrets, servers and web storage for the folder it is installed in,
// so a Windows reinstall must update the copy, not delete and re-create it.
describe.skipIf(process.platform === 'win32')('ua-builder install (Windows copy, simulated)', () => {
  const platform = process.platform;
  beforeEach(() => { Object.defineProperty(process, 'platform', { value: 'win32' }); });
  afterEach(() => { Object.defineProperty(process, 'platform', { value: platform }); });

  it('--force updates the installed copy in place, keeping its folder', async () => {
    const src = mkdtempSync(join(tmpdir(), 'ua-src-'));
    dirs.push(src);
    const dir = addOn(src, 'mine', { package_name: 'Mine', id: 'com.x.mine', name: 'Mine' });
    writeFileSync(join(dir, 'old.js'), 'old');
    mkdirSync(join(dir, 'lib'));
    writeFileSync(join(dir, 'lib', 'a.js'), 'a1');
    writeFileSync(join(dir, 'lib', 'gone.js'), 'x');
    mkdirSync(join(dir, 'swap'));
    mkdirSync(join(dir, 'node_modules'));
    writeFileSync(join(dir, 'node_modules', 'dep.js'), 'dep');
    expect(await run(dir)).toBe(0);
    const target = join(addOns, 'Mine');
    const ino = statSync(target).ino;
    expect(existsSync(join(target, 'node_modules'))).toBe(false);

    await expect(run(dir)).rejects.toThrow('pass --force');
    rmSync(join(dir, 'old.js'));
    rmSync(join(dir, 'lib', 'gone.js'));
    writeFileSync(join(dir, 'lib', 'a.js'), 'a2');
    rmSync(join(dir, 'swap'), { recursive: true });
    writeFileSync(join(dir, 'swap'), 'now a file');
    writeFileSync(join(target, 'stray.txt'), 'left by hand');
    expect(await run(dir, '--force')).toBe(0);

    expect(statSync(target).ino).toBe(ino);
    expect(readFileSync(join(target, 'lib', 'a.js'), 'utf8')).toBe('a2');
    expect(readFileSync(join(target, 'swap'), 'utf8')).toBe('now a file');
    for (const gone of ['old.js', 'stray.txt', join('lib', 'gone.js'), 'node_modules']) expect(existsSync(join(target, gone))).toBe(false);
    expect(existsSync(join(target, 'manifest.json'))).toBe(true);
  });
});

describe.skipIf(process.platform === 'win32')('prepareAddOnsFolder', () => {
  it('creates a missing Add Ons folder without asking for a password', () => {
    const folder = join(addOns, 'nested', 'Add Ons');
    vi.stubEnv('UA_ADDONS_FOLDER', folder);
    prepareAddOnsFolder(folder);
    expect(existsSync(folder)).toBe(true);
  });

  it.skipIf(process.getuid?.() === 0)('never escalates an overridden folder it cannot write', () => {
    const folder = join(addOns, 'locked');
    mkdirSync(folder);
    chmodSync(folder, 0o555);
    try {
      expect(() => prepareAddOnsFolder(folder)).toThrow('cannot write the Add Ons folder');
    } finally {
      chmodSync(folder, 0o755);
    }
  });

  it.skipIf(process.platform !== 'darwin')('has a setup script AppleScript compiles', () => {
    const out = join(addOns, 'setup.scpt');
    execFileSync('/usr/bin/osacompile', ['-e', ADD_ONS_SETUP_SCRIPT, '-o', out]);
    expect(existsSync(out)).toBe(true);
  });
});

// The same cases on Windows, where the folder is in ProgramData and set up with icacls.
describe.skipIf(process.platform !== 'win32')('prepareAddOnsFolder (Windows)', () => {
  const icacls = (...args: string[]) => execFileSync('icacls', args, { stdio: 'ignore' });

  it('creates a missing overridden Add Ons folder without asking for approval', () => {
    const folder = join(addOns, 'nested', 'Add Ons');
    vi.stubEnv('UA_ADDONS_FOLDER', folder);
    prepareAddOnsFolder(folder);
    expect(existsSync(folder)).toBe(true);
    expect(canWriteFolder(folder)).toBe(true);
  });

  it('never escalates an overridden folder it cannot write', () => {
    const folder = join(addOns, 'locked');
    mkdirSync(folder);
    // Everyone may not add files or folders here.
    icacls(folder, '/deny', '*S-1-1-0:(WD,AD)');
    try {
      expect(canWriteFolder(folder)).toBe(false);
      expect(() => prepareAddOnsFolder(folder)).toThrow('cannot write the Add Ons folder');
    } finally {
      icacls(folder, '/remove:d', '*S-1-1-0');
    }
  });

  it('has setup and check scripts PowerShell parses', () => {
    for (const script of [WINDOWS_ADD_ONS_SETUP_SCRIPT, WINDOWS_ADD_ONS_CHECK_SCRIPT]) {
      const parse =
        '$errors = $null; [void][System.Management.Automation.Language.Parser]::ParseInput($env:UA_ADDONS_SETUP_FOLDER, [ref]$null, [ref]$errors); ' +
        'if ($errors.Count) { $errors | ForEach-Object { [Console]::Error.WriteLine($_.Message) }; exit 1 }';
      const result = runAddOnsFolderScript(parse, script);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    }
  });

  it('tells a folder set up for every user from one only this user can write', () => {
    const folder = join(addOns, 'Add Ons');
    mkdirSync(folder);
    // Only its owner, as when a standard user creates it in ProgramData (CREATOR OWNER), and
    // nothing inherited: a temp folder may inherit a grant to Everyone.
    icacls(folder, '/inheritance:r', '/grant:r', '*S-1-3-4:(OI)(CI)F');
    expect(canWriteFolder(folder)).toBe(true);
    expect(runAddOnsFolderScript(WINDOWS_ADD_ONS_CHECK_SCRIPT, folder).status).toBe(1);
    // What the setup grants; this user owns the folder, so it needs no elevation here.
    icacls(folder, '/grant', '*S-1-5-32-545:(OI)(CI)M');
    expect(runAddOnsFolderScript(WINDOWS_ADD_ONS_CHECK_SCRIPT, folder).status).toBe(0);
  });

  it('puts the real Add Ons folder in ProgramData, shared by every account', () => {
    vi.stubEnv('UA_ADDONS_FOLDER', '');
    vi.stubEnv('ProgramData', 'D:\\Data');
    expect(addOnsFolder()).toBe('D:\\Data\\Universal Audio\\LUNA\\Add Ons');
  });
});
