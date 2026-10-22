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

  it('writes description only when --description is given', async () => {
    const without = await scaffold();
    expect(without.code).toBe(0);
    expect(JSON.parse(readFileSync(join(without.dir, 'manifest.json'), 'utf8'))).not.toHaveProperty('description');

    const withIt = await scaffold('--description', 'Does "one" thing.\nWell.', '--target', 'browser');
    expect(withIt.code).toBe(0);
    expect(JSON.parse(readFileSync(join(withIt.dir, 'manifest.json'), 'utf8')).description).toBe('Does "one" thing.\nWell.');
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
    installed('Other', { id: 'com.example.demo', name: 'Something Else', html: 'index.html' });
    const { dir, code, out } = await scaffold();
    expect(code).toBe(1);
    expect(existsSync(dir)).toBe(false);
    expect(out).toContain('id "com.example.demo" is already used by "Something Else"');
  });

  it('refuses a name an installed Add On already uses, ignoring case', async () => {
    installed('Bundle.lunaaddon', { add_ons: [{ id: 'com.other.a', name: 'A' }, { id: 'com.other.demo', name: 'DEMO ' }] });
    const { dir, code, out } = await scaffold();
    expect(code).toBe(1);
    expect(existsSync(dir)).toBe(false);
    expect(out).toContain('name "Demo" is already used by com.other.demo');
  });

  it('refuses a name an installed Add On still declares as the deprecated title', async () => {
    installed('Legacy', { id: 'com.other.demo', title: 'Demo', html: 'index.html' });
    const { dir, code, out } = await scaffold();
    expect(code).toBe(1);
    expect(existsSync(dir)).toBe(false);
    expect(out).toContain('name "Demo" is already used by com.other.demo');
  });

  it('accepts a new --id and --name, and skips unreadable manifests', async () => {
    installed('Other', { id: 'com.example.demo', name: 'Demo', html: 'index.html' });
    mkdirSync(join(addOns, 'Broken'));
    writeFileSync(join(addOns, 'Broken', 'manifest.json'), '{ not json');
    const { dir, code } = await scaffold('--id', 'com.example.demo2', '--name', 'Demo 2');
    expect(code).toBe(0);
    const entry = readManifest(dir).entries[0];
    // The manifest writes title, which every LUNA release reads; readManifest fills in name.
    expect(entry).toMatchObject({ id: 'com.example.demo2', name: 'Demo 2', title: 'Demo 2' });
    expect(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))).not.toHaveProperty('name');
  });

  it('still takes --title as an alias for --name', async () => {
    const { dir, code } = await scaffold('--title', 'Demo 3');
    expect(code).toBe(0);
    expect(readManifest(dir).entries[0]).toMatchObject({ name: 'Demo 3' });
  });

  it('scaffolds the TypeScript template: sources in src/, the page loading the built bundle', async () => {
    const { dir, code, out } = await scaffold('--template', 'add-on-typescript', '--name', 'TS Demo');
    expect(code).toBe(0);
    for (const rel of ['src/main.ts', 'src/logic.ts', 'tests/setup.ts', 'tests/add-on.test.ts', 'tsconfig.json', 'vite.config.ts', 'vendor/luna.global.js']) {
      expect(existsSync(join(dir, rel)), rel).toBe(true);
    }
    for (const rel of ['package.json', 'src/main.ts', 'src/logic.ts', 'tests/add-on.test.ts']) {
      expect(readFileSync(join(dir, rel), 'utf8'), rel).not.toMatch(/__[A-Z_]+__/);
    }
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    expect(html).toContain('<script src="vendor/luna.global.js"></script>');
    expect(html).toContain('<script src="dist/main.js"></script>');
    expect(html).not.toMatch(/type="module"/);
    expect(JSON.parse(readFileSync(join(dir, 'tsconfig.json'), 'utf8')).compilerOptions.types).toEqual(['@uaudio/luna-builder-sdk/global']);
    expect(readManifest(dir).entries[0]).toMatchObject({ name: 'TS Demo', html: 'index.html' });
    expect(out).toContain('npm run build');
    expect(out).toContain('src/main.ts');
  });

  it('names the templates there are when --template is unknown', async () => {
    const { dir, code, out } = await scaffold('--template', 'nope');
    expect(code).toBe(1);
    expect(existsSync(dir)).toBe(false);
    expect(out).toMatch(/available: .*add-on-basic.*add-on-typescript/);
  });
});
