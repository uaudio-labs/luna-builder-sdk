/** `ua-builder eject-wasm` copies a built Add On and a wasm engine into a folder a browser runs on its own. */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ENGINE_META, ejectFolderName, ejectWasm, withEngineMeta } from '../../cli/eject-wasm';
import { newAddOn } from '../../cli/new';
import { pack } from '../../cli/pack';
import { bundlePath, parseArgs } from '../../cli/util';

const dirs: string[] = [];

function temp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ua-eject-'));
  dirs.push(dir);
  return dir;
}

async function quietly<T>(run: () => Promise<T>): Promise<{ result: T; out: string }> {
  const lines: string[] = [];
  const spies = (['log', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void lines.push(a.join(' '))));
  try {
    return { result: await run(), out: lines.join('\n') };
  } finally {
    for (const s of spies) s.mockRestore();
  }
}

/** Run `run` with `cwd` as the current directory, where the default output goes. */
async function inDir<T>(cwd: string, run: () => Promise<T>): Promise<T> {
  const spy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  try {
    return await run();
  } finally {
    spy.mockRestore();
  }
}

async function scaffold(...argv: string[]): Promise<{ parent: string; dir: string }> {
  const parent = temp();
  await quietly(() => newAddOn(parseArgs(['demo', '--dir', parent, ...argv])));
  return { parent, dir: join(parent, 'demo') };
}

/** An engine stage as the wasm_engine build lays it out, with the files an eject leaves behind. */
function fakeEngine(): string {
  const dir = temp();
  writeFileSync(join(dir, 'luna-engine.js'), 'var createLunaEngineModule = () => {};');
  writeFileSync(join(dir, 'luna-engine.wasm'), Buffer.from([0, 0x61, 0x73, 0x6d]));
  writeFileSync(join(dir, 'build.json'), JSON.stringify({ config: 'Release', engine_id: 'abc123' }));
  mkdirSync(join(dir, 'plugins', 'uaudio_luna_channel'), { recursive: true });
  writeFileSync(join(dir, 'plugins', 'uaudio_luna_channel', 'plugin.wasm'), 'p');
  writeFileSync(join(dir, 'plugins', '.DS_Store'), 'x');
  for (const f of ['index.html', 'serve.py', 'serve_lan.py', 'wasm_socket.js', 'wasm_uanet_link.js']) writeFileSync(join(dir, f), f);
  return dir;
}

/** Every file under `dir`, `/`-separated and relative to it. */
function files(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p).split('\\').join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** The names in a zip's central directory. */
function zipNames(zip: Buffer): string[] {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let at = zip.readUInt32LE(end + 16);
  const names: string[] = [];
  for (let i = zip.readUInt16LE(end + 10); i > 0; i--) {
    const nameLength = zip.readUInt16LE(at + 28);
    names.push(zip.toString('utf8', at + 46, at + 46 + nameLength));
    at += 46 + nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
  }
  return names;
}

beforeAll(() => {
  if (!bundlePath()) throw new Error('run "npm run build" first: the scaffold vendors dist/luna.global.js');
});

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('ua-builder eject-wasm', () => {
  it('puts the engine meta first in <head>, and leaves a page that names an engine alone', () => {
    expect(withEngineMeta('<!doctype html>\n<html>\n<head lang="en">\n  <script src="a.js"></script>\n</head>\n</html>')).toBe(
      `<!doctype html>\n<html>\n<head lang="en">\n  ${ENGINE_META}\n  <script src="a.js"></script>\n</head>\n</html>`,
    );
    expect(withEngineMeta('<html><body></body></html>')).toBe(`<html>\n${ENGINE_META}<body></body></html>`);
    expect(withEngineMeta('<script></script>')).toBe(`${ENGINE_META}\n<script></script>`);
    const named = '<head><meta name="luna-engine" content="luna"></head>';
    expect(withEngineMeta(named)).toBe(named);
  });

  it('names the output after the package name', () => {
    expect(ejectFolderName('StudioLo', '/x/src')).toBe('studiolo-web');
    expect(ejectFolderName(' My Add On ', '/x/src')).toBe('my-add-on-web');
    expect(ejectFolderName(undefined, '/x/Video Window')).toBe('video-window-web');
    expect(ejectFolderName('a/b', '/x/src')).toBe('src-web');
    expect(ejectFolderName('..', '/x/src')).toBe('src-web');
  });

  it('writes the Add On, the engine, serve.py and a README in the current directory, and a zip of it', async () => {
    const { parent, dir } = await scaffold();
    const before = new Map(files(dir).map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
    const { result: code, out: log } = await inDir(parent, () => quietly(() => ejectWasm(parseArgs([dir, '--engine', fakeEngine()]))));
    expect(code, log).toBe(0);

    const out = join(parent, 'demo-web');
    const written = files(out);
    for (const f of ['manifest.json', 'index.html', 'main.js', 'vendor/luna.global.js', 'serve.py', 'README.txt']) expect(written, f).toContain(f);
    expect(written.filter((f) => f.startsWith('__engine/'))).toEqual([
      '__engine/build.json',
      '__engine/luna-engine.js',
      '__engine/luna-engine.wasm',
      '__engine/plugins/uaudio_luna_channel/plugin.wasm',
    ]);
    expect(written.some((f) => f.endsWith('.map'))).toBe(false);
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toContain(ENGINE_META);
    expect(readFileSync(join(out, 'vendor', 'luna.global.js'))).toEqual(readFileSync(bundlePath()!));
    expect(readFileSync(join(out, 'serve.py'), 'utf8')).toContain('PAGE = "index.html"');
    expect(statSync(join(out, 'serve.py')).mode & 0o100).toBeTruthy();
    expect(log).toMatch(/Ejected .* with wasm engine abc123/);

    const zipped = zipNames(readFileSync(`${out}.zip`)).filter((n) => !n.endsWith('/'));
    expect(zipped.sort()).toEqual(written.map((f) => `demo-web/${f}`));

    // The Add On's own folder is untouched.
    expect(files(dir)).toEqual([...before.keys()]);
    for (const [f, text] of before) expect(readFileSync(join(dir, f), 'utf8'), f).toBe(text);
  });

  it('ejects a built TypeScript Add On as its built page', async () => {
    const { parent, dir } = await scaffold('--template', 'add-on-typescript');
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist', 'main.js'), '(function(){})();');
    const { result: code, out: log } = await quietly(() => ejectWasm(parseArgs([dir, '--engine', fakeEngine(), '--out', join(parent, 'site')])));
    expect(code, log).toBe(0);
    const written = files(join(parent, 'site'));
    expect(written).toContain('dist/main.js');
    expect(written.some((f) => f.startsWith('src/') || f.endsWith('.ts'))).toBe(false);
    expect(existsSync(join(parent, 'site.zip'))).toBe(true);
  });

  it('refuses, writing nothing, when the engine folder holds no engine', async () => {
    const { parent, dir } = await scaffold();
    const { result: code, out: log } = await inDir(parent, () => quietly(() => ejectWasm(parseArgs([dir, '--engine', temp()]))));
    expect(code).toBe(1);
    expect(log).toMatch(/not a wasm engine build \(no luna-engine\.js or luna-engine\.wasm\)/);
    expect(existsSync(join(parent, 'demo-web'))).toBe(false);
    expect(existsSync(join(parent, 'demo-web.zip'))).toBe(false);
  });

  it('leaves an output inside the Add On out of later ejects and packs', async () => {
    const { parent, dir } = await scaffold();
    const engine = fakeEngine();
    expect((await inDir(dir, () => quietly(() => ejectWasm(parseArgs([dir, '--engine', engine]))))).result).toBe(0);
    expect(existsSync(join(dir, 'demo-web', 'serve.py'))).toBe(true);

    expect((await inDir(dir, () => quietly(() => ejectWasm(parseArgs([dir, '--engine', engine]))))).result).toBe(0);
    expect(files(join(dir, 'demo-web')).some((f) => f.startsWith('demo-web/'))).toBe(false);

    const lunaaddon = join(parent, 'demo.lunaaddon');
    expect((await quietly(() => pack(parseArgs([dir, '--out', lunaaddon])))).result).toBe(0);
    expect(zipNames(readFileSync(lunaaddon)).some((n) => n.includes('demo-web') || n.includes('__engine'))).toBe(false);
  });

  it('refuses an output that is or holds the Add On, and a folder that is not an earlier eject', async () => {
    const { parent, dir } = await scaffold();
    const engine = fakeEngine();
    for (const out of [dir, parent]) {
      const holding = await quietly(() => ejectWasm(parseArgs([dir, '--engine', engine, '--out', out])));
      expect(holding.result, out).toBe(1);
      expect(holding.out).toMatch(/would replace the Add On folder/);
    }
    expect(existsSync(join(dir, 'manifest.json'))).toBe(true);

    mkdirSync(join(parent, 'mine'));
    writeFileSync(join(parent, 'mine', 'notes.txt'), 'keep');
    const taken = await quietly(() => ejectWasm(parseArgs([dir, '--engine', engine, '--out', join(parent, 'mine')])));
    expect(taken.result).toBe(1);
    expect(readFileSync(join(parent, 'mine', 'notes.txt'), 'utf8')).toBe('keep');

    // An earlier eject is replaced: nothing stale survives.
    const again = () => inDir(parent, () => quietly(() => ejectWasm(parseArgs([dir, '--engine', engine]))));
    expect((await again()).result).toBe(0);
    writeFileSync(join(parent, 'demo-web', 'stale.txt'), 'x');
    expect((await again()).result).toBe(0);
    expect(existsSync(join(parent, 'demo-web', 'stale.txt'))).toBe(false);
  });
});
