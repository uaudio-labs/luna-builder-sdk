/** `ua-builder pack` zips the Add On folder into a `.lunaaddon`, leaving dotfiles and OS metadata out. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { newAddOn } from '../../cli/new';
import { isBuildOnly, isJunk, pack } from '../../cli/pack';
import { bundlePath, parseArgs } from '../../cli/util';
import { crc32, createZip } from '../../cli/zip';

const dirs: string[] = [];

/** Every entry of a zip, read through its central directory, with file contents inflated. */
function readZip(zip: Buffer): Map<string, Buffer | null> {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(end).toBeGreaterThanOrEqual(0);
  const count = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  const out = new Map<string, Buffer | null>();
  for (let i = 0; i < count; i++) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50);
    const method = zip.readUInt16LE(at + 10);
    const crc = zip.readUInt32LE(at + 16);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const extra = zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    const name = zip.toString('utf8', at + 46, at + 46 + nameLength);
    const dataAt = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const body = zip.subarray(dataAt, dataAt + size);
    const data = method === 8 ? inflateRawSync(body) : Buffer.from(body);
    expect(crc32(data), name).toBe(crc);
    out.set(name, name.endsWith('/') ? null : data);
    at += 46 + nameLength + extra;
  }
  return out;
}

async function scaffold(...argv: string[]): Promise<{ parent: string; dir: string }> {
  const parent = mkdtempSync(join(tmpdir(), 'ua-pack-'));
  dirs.push(parent);
  await quietly(() => newAddOn(parseArgs(['demo', '--dir', parent, ...argv])));
  return { parent, dir: join(parent, 'demo') };
}

/** A TypeScript scaffold with the files `npm run build` would write, without running it. */
async function builtTypeScript(): Promise<{ parent: string; dir: string }> {
  const scaffolded = await scaffold('--template', 'add-on-typescript');
  mkdirSync(join(scaffolded.dir, 'dist'));
  writeFileSync(join(scaffolded.dir, 'dist', 'main.js'), '(function(){})();\n//# sourceMappingURL=main.js.map');
  writeFileSync(join(scaffolded.dir, 'dist', 'main.js.map'), '{}');
  return scaffolded;
}

async function quietly<T>(run: () => Promise<T>): Promise<{ result: T; out: string }> {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
  const error = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
  try {
    return { result: await run(), out: lines.join('\n') };
  } finally {
    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  }
}

beforeAll(() => {
  if (!bundlePath()) throw new Error('run "npm run build" first: the scaffold vendors dist/luna.global.js');
});

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('ua-builder pack', () => {
  it('names dotfiles and OS metadata files as junk, and nothing else', () => {
    for (const name of ['.DS_Store', '._index.html', '.git', '.gitignore', '.env', '.vscode', 'Thumbs.db', 'THUMBS.DB', 'desktop.ini', 'ehthumbs.db', 'Icon\r']) {
      expect(isJunk(name), name).toBe(true);
    }
    for (const name of ['index.html', 'main.js', 'vendor', 'Icon.png', 'thumbs.png', 'manifest.json']) {
      expect(isJunk(name), name).toBe(false);
    }
  });

  it('names sources, source maps and build configs as build-only', () => {
    for (const name of ['main.ts', 'types.d.ts', 'App.tsx', 'App.jsx', 'x.mts', 'x.cts', 'main.js.map', 'main.css.map']) {
      expect(isBuildOnly(name), name).toBe(true);
    }
    // Configs and src/ are build-only at the top level alone.
    for (const name of ['main.js', 'main.css', 'index.html', 'tsconfig.json', 'webpack.config.js', 'src']) {
      expect(isBuildOnly(name), name).toBe(false);
    }
    for (const name of ['tsconfig.json', 'tsconfig.app.json', 'vite.config.ts', 'vite.config.mjs', 'webpack.config.js', 'rollup.config.mjs', 'esbuild.config.js']) {
      expect(isBuildOnly(name, { isRoot: true }), name).toBe(true);
    }
    expect(isBuildOnly('main.js.map', { keepMaps: true })).toBe(false);
    expect(isBuildOnly('src', { isRoot: true })).toBe(false);
    expect(isBuildOnly('src', { isRoot: true, buildStep: true })).toBe(true);
    expect(isBuildOnly('src', { buildStep: true }), 'only the top-level src/').toBe(false);
  });

  it('packs a TypeScript Add On as its built page: no sources, maps, configs or src/', async () => {
    const { parent, dir } = await builtTypeScript();
    writeFileSync(join(dir, '.env'), 'API_KEY=x');
    const out = join(parent, 'demo.lunaaddon');
    const { result: code, out: log } = await quietly(() => pack(parseArgs([dir, '--out', out])));

    expect(code, log).toBe(0);
    const names = [...readZip(readFileSync(out)).keys()];
    for (const rel of ['manifest.json', 'index.html', 'dist/main.js', 'vendor/luna.global.js']) expect(names, rel).toContain(`demo/${rel}`);
    for (const rel of ['src/', 'src/main.ts', 'tsconfig.json', 'vite.config.ts', 'dist/main.js.map', 'vendor/luna.global.js.map', '.env', 'tests/']) {
      expect(names, rel).not.toContain(`demo/${rel}`);
    }
    expect(names.some((n) => /\.(ts|map)$/.test(n))).toBe(false);
    expect(log).toMatch(/Left out sources, source maps and build configs: .*src.*\(--source-maps keeps the maps\)/);
  });

  it('keeps source maps with --source-maps', async () => {
    const { parent, dir } = await builtTypeScript();
    const out = join(parent, 'demo.lunaaddon');
    await quietly(() => pack(parseArgs([dir, '--out', out, '--source-maps'])));
    const zip = readZip(readFileSync(out));
    expect(zip.has('demo/dist/main.js.map')).toBe(true);
    expect(zip.has('demo/src/main.ts')).toBe(false);
  });

  it('refuses to pack a page whose bundle has not been built', async () => {
    const { parent } = await builtTypeScript();
    const dir = join(parent, 'demo');
    rmSync(join(dir, 'dist'), { recursive: true });
    const out = join(parent, 'demo.lunaaddon');
    const { result: code, out: log } = await quietly(() => pack(parseArgs([dir, '--out', out])));
    expect(code).toBe(1);
    expect(log).toContain('index.html loads dist/main.js, which does not exist. Run the build first (npm run build).');
    expect(() => statSync(out)).toThrow();
  });

  it('refuses to pack a page that loads a file the pack leaves out', async () => {
    const { parent, dir } = await builtTypeScript();
    const html = join(dir, 'index.html');
    writeFileSync(html, readFileSync(html, 'utf8').replace('dist/main.js', 'src/main.ts'));
    const { result: code, out: log } = await quietly(() => pack(parseArgs([dir, '--out', join(parent, 'demo.lunaaddon')])));
    expect(code).toBe(1);
    expect(log).toContain('index.html loads src/main.ts, which the pack leaves out');
  });

  it('warns about a module script, and ignores remote and commented-out references', async () => {
    const { parent, dir } = await scaffold();
    const html = join(dir, 'index.html');
    writeFileSync(
      html,
      readFileSync(html, 'utf8').replace(
        '<script src="main.js"></script>',
        '<script type="module" src="main.js"></script><script src="https://cdn.example.com/x.js"></script><!-- <script src="gone.js"></script> -->',
      ),
    );
    const { result: code, out: log } = await quietly(() => pack(parseArgs([dir, '--out', join(parent, 'demo.lunaaddon')])));
    expect(code, log).toBe(0);
    expect(log).toMatch(/warning: index.html: <script type="module" src="main.js"> is a module script, which LUNA on Windows will not run/);
    expect(log).not.toContain('gone.js');
  });

  it('ships src/ when the Add On has no build step', async () => {
    const { parent, dir } = await scaffold();
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src', 'helper.js'), 'x');
    await quietly(() => pack(parseArgs([dir, '--out', join(parent, 'demo.lunaaddon')])));
    expect(readZip(readFileSync(join(parent, 'demo.lunaaddon'))).has('demo/src/helper.js')).toBe(true);
  });

  it('writes a zip holding the Add On folder, leaving junk out at every depth', async () => {
    const { parent, dir } = await scaffold();
    mkdirSync(join(dir, 'assets', '.cache'), { recursive: true });
    mkdirSync(join(dir, 'node_modules', 'x'), { recursive: true });
    for (const rel of ['.DS_Store', 'Thumbs.db', '._index.html', '.env', 'assets/.DS_Store', 'assets/desktop.ini', 'assets/.cache/x', 'assets/logo.svg', 'node_modules/x/y.js']) {
      writeFileSync(join(dir, rel), 'x');
    }
    writeFileSync(join(dir, 'assets', 'big.txt'), 'compress me '.repeat(1000));

    const out = join(parent, 'demo.lunaaddon');
    const { result: code, out: log } = await quietly(() => pack(parseArgs([dir, '--out', out])));

    expect(code).toBe(0);
    expect(statSync(out).isFile()).toBe(true);
    const zip = readZip(readFileSync(out));
    for (const rel of ['manifest.json', 'index.html', 'vendor/luna.global.js', 'assets/logo.svg']) {
      expect(zip.get(`demo/${rel}`), rel).toEqual(readFileSync(join(dir, rel)));
    }
    expect(zip.get('demo/assets/big.txt')?.toString()).toBe('compress me '.repeat(1000));
    expect(zip.has('demo/')).toBe(true);
    expect([...zip.keys()].every((name) => name.startsWith('demo/')), 'one top-level folder').toBe(true);
    for (const rel of ['.DS_Store', 'Thumbs.db', '._index.html', '.env', '.gitignore', 'assets/.DS_Store', 'assets/desktop.ini', 'assets/.cache/', 'node_modules/']) {
      expect(zip.has(`demo/${rel}`), rel).toBe(false);
    }
    expect(log).toMatch(/Left out \d+ dotfile\(s\) and OS metadata file\(s\)/);
  });

  it('adds the .lunaaddon extension, replaces an old bundle folder, and never packs a previous one', async () => {
    const { parent, dir } = await scaffold();
    writeFileSync(join(dir, 'old.lunaaddon'), 'x');
    mkdirSync(join(parent, 'demo.lunaaddon', 'assets'), { recursive: true });

    await quietly(() => pack(parseArgs([dir, '--out', join(parent, 'demo')])));

    const zip = readZip(readFileSync(join(parent, 'demo.lunaaddon')));
    expect(zip.has('demo/manifest.json')).toBe(true);
    expect(zip.has('demo/old.lunaaddon')).toBe(false);
  });

  it('follows symlinks but adds each folder once', async () => {
    const { parent, dir } = await scaffold();
    try {
      symlinkSync(dir, join(dir, 'loop'), 'dir');
    } catch {
      return; // no symlink permission (Windows without developer mode)
    }
    await quietly(() => pack(parseArgs([dir, '--out', join(parent, 'demo.lunaaddon')])));
    const zip = readZip(readFileSync(join(parent, 'demo.lunaaddon')));
    expect(zip.has('demo/manifest.json')).toBe(true);
    expect([...zip.keys()].some((name) => name.startsWith('demo/loop/'))).toBe(false);
  });

  it('writes a zip the system unzip accepts', async () => {
    if (spawnSync('unzip', ['-v']).status !== 0) return;
    const { parent, dir } = await scaffold();
    const out = join(parent, 'demo.lunaaddon');
    await quietly(() => pack(parseArgs([dir, '--out', out])));
    const test = spawnSync('unzip', ['-t', out], { encoding: 'utf8' });
    expect(test.status, test.stdout + test.stderr).toBe(0);
    const into = join(parent, 'unzipped');
    expect(spawnSync('unzip', ['-q', out, '-d', into]).status).toBe(0);
    expect(readFileSync(join(into, 'demo', 'manifest.json'))).toEqual(readFileSync(join(dir, 'manifest.json')));
  });

  it('round-trips empty files, stored entries and UTF-8 names', () => {
    const mtime = new Date(2026, 9, 6, 12, 30, 10);
    const zip = readZip(createZip([
      { name: 'a/', mtime, mode: 0o40755 },
      { name: 'a/empty.txt', data: Buffer.alloc(0), mtime, mode: 0o100644 },
      { name: 'a/x', data: Buffer.from('x'), mtime, mode: 0o100644 },
      { name: 'a/Café ✓.txt', data: Buffer.from('ok'), mtime, mode: 0o100644 },
    ]));
    expect(zip.get('a/')).toBeNull();
    expect(zip.get('a/empty.txt')).toEqual(Buffer.alloc(0));
    expect(zip.get('a/x')?.toString()).toBe('x');
    expect(zip.get('a/Café ✓.txt')?.toString()).toBe('ok');
  });
});
