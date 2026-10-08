/** `ua-builder install` refuses an Add On whose id or name another installed Add On uses. */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { install } from '../../cli/install';
import { parseArgs } from '../../cli/util';

const dirs: string[] = [];
let addOns = '';

function addOn(parent: string, name: string, manifest: object): string {
  const dir = join(parent, name);
  mkdirSync(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html>');
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ html: 'index.html', width: 400, height: 300, ...manifest }));
  return dir;
}

async function run(dir: string): Promise<number> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    return await install(parseArgs([dir]));
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
