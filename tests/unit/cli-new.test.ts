/** `ua-builder new` writes only the manifest fields the chosen target uses. */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { newAddOn } from '../../cli/new';
import { bundlePath, parseArgs, readManifest } from '../../cli/util';

const dirs: string[] = [];
let addOns = '';

/** Put an Add On with `manifest` in the stand-in Add Ons folder. */
function installed(name: string, manifest: object): void {
  mkdirSync(join(addOns, name));
  writeFileSync(join(addOns, name, 'manifest.json'), JSON.stringify(manifest));
}

async function scaffold(...argv: string[]): Promise<{ dir: string; code: number; out: string }> {
  const parent = mkdtempSync(join(tmpdir(), 'ua-new-'));
  dirs.push(parent);
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
  const err = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
  try {
    const code = await newAddOn(parseArgs(['demo', '--dir', parent, ...argv]));
    return { dir: join(parent, 'demo'), code, out: lines.join('\n') };
  } finally {
    log.mockRestore();
    err.mockRestore();
  }
}

beforeAll(() => {
  if (!bundlePath()) throw new Error('run "npm run build" first: the scaffold vendors dist/luna.global.js');
});

beforeEach(() => {
  addOns = mkdtempSync(join(tmpdir(), 'ua-addons-'));
  dirs.push(addOns);
  vi.stubEnv('UA_ADDONS_FOLDER', addOns);
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('ua-builder new', () => {
  it('writes the window fields for a window Add On', async () => {
    const { dir, code, out } = await scaffold('--width', '640', '--height', '480');
    expect(code).toBe(0);
    const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    expect(m).toMatchObject({ target: 'window', floating: true, show_with_session: false, width: 640, height: 480 });
    expect(out).toContain('Add Ons > Windows');
  });

  it('writes manufacturer only when --manufacturer is given', async () => {
    const without = await scaffold();
    expect(without.code).toBe(0);
    expect(JSON.parse(readFileSync(join(without.dir, 'manifest.json'), 'utf8'))).not.toHaveProperty('manufacturer');

    const withIt = await scaffold('--manufacturer', 'Example "Audio" Co', '--target', 'editor');
    expect(withIt.code).toBe(0);
    expect(JSON.parse(readFileSync(join(withIt.dir, 'manifest.json'), 'utf8')).manufacturer).toBe('Example "Audio" Co');
    expect(() => readManifest(withIt.dir)).not.toThrow();
  });

  for (const [target, menu] of [['browser', 'Add Ons > Browsers'], ['editor', 'Add Ons > Editors'], ['app', 'Add Ons > Apps']] as const) {
    it(`leaves floating, show_with_session and the size out of a ${target} Add On`, async () => {
      const { dir, code, out } = await scaffold('--target', target);
      expect(code).toBe(0);
      const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
      expect(m.target).toBe(target);
      for (const k of ['floating', 'show_with_session', 'width', 'height']) expect(m).not.toHaveProperty(k);
      expect(() => readManifest(dir)).not.toThrow();
      expect(out).toContain(menu);
    });
  }

  it('refuses an unknown target before writing anything', async () => {
    const { dir, code } = await scaffold('--target', 'panel');
    expect(code).toBe(2);
    expect(existsSync(dir)).toBe(false);
  });

  it('refuses an id an installed Add On already uses, before writing anything', async () => {
    installed('Other', { id: 'com.example.demo', title: 'Something Else', html: 'index.html' });
    const { dir, code, out } = await scaffold();
    expect(code).toBe(1);
    expect(existsSync(dir)).toBe(false);
    expect(out).toContain('id "com.example.demo" is already used by "Something Else"');
  });

  it('refuses a title an installed Add On already uses, ignoring case', async () => {
    installed('Bundle.lunaaddon', { add_ons: [{ id: 'com.other.a', title: 'A' }, { id: 'com.other.demo', title: 'DEMO ' }] });
    const { dir, code, out } = await scaffold();
    expect(code).toBe(1);
    expect(existsSync(dir)).toBe(false);
    expect(out).toContain('title "Demo" is already used by com.other.demo');
  });

  it('accepts a new --id and --title, and skips unreadable manifests', async () => {
    installed('Other', { id: 'com.example.demo', title: 'Demo', html: 'index.html' });
    mkdirSync(join(addOns, 'Broken'));
    writeFileSync(join(addOns, 'Broken', 'manifest.json'), '{ not json');
    const { dir, code } = await scaffold('--id', 'com.example.demo2', '--title', 'Demo 2');
    expect(code).toBe(0);
    expect(readManifest(dir).entries[0]).toMatchObject({ id: 'com.example.demo2', title: 'Demo 2' });
  });
});
