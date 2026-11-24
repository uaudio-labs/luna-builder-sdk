/** Versioned wasm engines on a remote: publishing, resolving by LUNA version, and the per-user cache. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveEngine } from '../../cli/engine';
import { normalizeLunaVersion, publishEngine, resolveRemoteEngine } from '../../cli/engine-remote';
import { ejectWasm } from '../../cli/eject-wasm';
import { parseArgs } from '../../cli/util';
import { fakeEngine, quietly, removeTemps, scaffold, temp } from '../helpers/cli';

/** A static server over `remoteRoot` (a new folder per test), counting requests, standing in for the engine remote. */
let remoteRoot = '';
let server: Server;
let base = '';
const requests: string[] = [];
/** Paths the remote sends one byte of and then nothing more, keeping the connection open. */
const stalls = new Set<string>();
/** Paths the remote sends one byte at a time, 50 ms apart. */
const dribbles = new Set<string>();

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    requests.push(path);
    const file = join(remoteRoot, ...path.split('/').filter(Boolean));
    if (!file.startsWith(remoteRoot) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    if (dribbles.has(path)) {
      const data = readFileSync(file);
      res.writeHead(200);
      let i = 0;
      const next = (): void => {
        if (i === data.length) return void res.end();
        res.write(data.subarray(i, ++i));
        setTimeout(next, 50);
      };
      next();
      return;
    }
    if (stalls.has(path)) {
      res.writeHead(200).write(readFileSync(file).subarray(0, 1));
      return;
    }
    res.writeHead(200).end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/`;
});

afterAll(() => new Promise<void>((r) => {
  server.closeAllConnections();
  server.close(() => r());
}));

beforeEach(() => {
  remoteRoot = temp();
});

afterEach(() => {
  requests.length = 0;
  stalls.clear();
  dribbles.clear();
  vi.unstubAllEnvs();
  removeTemps();
});

describe('normalizeLunaVersion', () => {
  it.each([
    ['3.2', '3.2.0'],
    ['3.2.1', '3.2.1'],
    ['3', '3.0.0'],
    [' 03.2.0 ', '3.2.0'],
  ])('%s -> %s', (input, out) => expect(normalizeLunaVersion(input)).toBe(out));

  it.each(['3.2.x', '', 'v3.2.0', '3.2.0.1'])('refuses %j', (input) => expect(() => normalizeLunaVersion(input)).toThrow(/not a LUNA version/));
});

describe('publishEngine', () => {
  it('writes the engine files, their hashes and the LUNA mapping, leaving the stage extras behind', () => {
    const r = publishEngine(fakeEngine('eng1'), remoteRoot, '3.2');
    expect(r).toEqual({ engineId: 'eng1', lunaVersion: '3.2.0', added: true });
    expect(JSON.parse(readFileSync(join(remoteRoot, 'index.json'), 'utf8'))).toEqual({ schema: 1, luna: { '3.2.0': 'eng1' } });
    const listing = JSON.parse(readFileSync(join(remoteRoot, 'engines', 'eng1', 'files.json'), 'utf8'));
    expect(Object.keys(listing.files).sort()).toEqual(['build.json', 'luna-engine.js', 'luna-engine.wasm', 'plugins/uaudio_luna_channel/plugin.wasm']);
    expect(listing.files['luna-engine.wasm'].size).toBe(4);
    expect(existsSync(join(remoteRoot, 'engines', 'eng1', 'serve.py'))).toBe(false);
  });

  it('lets two LUNA versions share an engine, but never remaps a published version', () => {
    const engine = fakeEngine('eng1');
    publishEngine(engine, remoteRoot, '3.2.0');
    expect(publishEngine(engine, remoteRoot, '3.2.1').added).toBe(true);
    expect(publishEngine(engine, remoteRoot, '3.2.1').added).toBe(false);
    expect(() => publishEngine(fakeEngine('eng2'), remoteRoot, '3.2.0')).toThrow(/already maps to engine eng1/);
  });

  it('refuses to write over an index in a schema it does not know', () => {
    writeFileSync(join(remoteRoot, 'index.json'), JSON.stringify({ schema: 2, luna: {} }));
    expect(() => publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0')).toThrow(/uses schema 2.*reads only schema 1/);
    expect(JSON.parse(readFileSync(join(remoteRoot, 'index.json'), 'utf8')).schema).toBe(2);
  });

  it('never rewrites a published engine', () => {
    const engine = fakeEngine('eng1');
    publishEngine(engine, remoteRoot, '3.2.0');
    const published = join(remoteRoot, 'engines', 'eng1', 'luna-engine.wasm');
    writeFileSync(published, 'as published');
    // Republishing the same version returns early; a new version for the same engine only adds the mapping.
    expect(publishEngine(engine, remoteRoot, '3.2.0').added).toBe(false);
    expect(publishEngine(engine, remoteRoot, '3.2.1').added).toBe(true);
    expect(readFileSync(published, 'utf8')).toBe('as published');
  });

  it.each([
    ['no build.json', undefined],
    ['a numeric engine_id', 12],
    ['an engine_id of ..', '..'],
    ['an engine_id of .', '.'],
  ])('refuses an engine with %s', (_name, id) => {
    const engine = fakeEngine('eng1');
    if (id === undefined) rmSync(join(engine, 'build.json'));
    else writeFileSync(join(engine, 'build.json'), JSON.stringify({ engine_id: id }));
    expect(() => publishEngine(engine, remoteRoot, '3.2.0')).toThrow(/no usable engine_id/);
    expect(existsSync(join(remoteRoot, 'index.json'))).toBe(false);
  });
});

describe('resolveRemoteEngine', () => {
  it('downloads the engine a LUNA version maps to, then serves it from the cache', async () => {
    publishEngine(fakeEngine('eng1', 'first'), remoteRoot, '3.2.0');
    publishEngine(fakeEngine('eng2', 'second'), remoteRoot, '3.3.0');
    const cacheDir = temp();

    const first = await resolveRemoteEngine({ base, lunaVersion: '3.3', cacheDir });
    expect(first).toEqual({ engineId: 'eng2', lunaVersion: '3.3.0', dir: join(cacheDir, 'eng2') });
    expect(readFileSync(join(first.dir, 'luna-engine.wasm'), 'utf8')).toBe('second');
    expect(existsSync(join(first.dir, 'plugins', 'uaudio_luna_channel', 'plugin.wasm'))).toBe(true);

    requests.length = 0;
    expect(await resolveRemoteEngine({ base, lunaVersion: '3.3.0', cacheDir })).toEqual(first);
    expect(requests).toEqual([]);
  });

  it('answers a version it has resolved with the remote gone', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    const cacheDir = temp();
    const first = await resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir });
    rmSync(join(remoteRoot, 'index.json'));
    requests.length = 0;
    expect(await resolveRemoteEngine({ base, lunaVersion: '3.2', cacheDir })).toEqual(first);
    expect(requests).toEqual([]);
  });

  it('remembers versions per remote', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    const cacheDir = temp();
    await resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir });
    // Another remote may map 3.2.0 elsewhere, so it is asked, even with eng1 cached.
    await expect(resolveRemoteEngine({ base: 'http://127.0.0.1:1', lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(/127\.0\.0\.1:1\/index\.json/);
  });

  it('asks the remote again when the remembered engine is no longer cached', async () => {
    publishEngine(fakeEngine('eng1', 'again'), remoteRoot, '3.2.0');
    const cacheDir = temp();
    await resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir });
    rmSync(join(cacheDir, 'eng1'), { recursive: true });
    requests.length = 0;
    const r = await resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir });
    expect(requests).toContain('/index.json');
    expect(readFileSync(join(r.dir, 'luna-engine.wasm'), 'utf8')).toBe('again');
  });

  it('names the versions the remote has when it has none for the one asked for', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.10.0');
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.4.0', cacheDir: temp() })).rejects.toThrow(/no engine for LUNA 3\.4\.0 \(it has 3\.2\.0, 3\.10\.0\)/);
  });

  it('caches nothing when a file fails its hash check', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    writeFileSync(join(remoteRoot, 'engines', 'eng1', 'luna-engine.wasm'), 'evil');
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(/luna-engine\.wasm: hash mismatch/);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it("refuses an engine whose build.json doesn't name it, even when the listing matches", async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    const engineDir = join(remoteRoot, 'engines', 'eng1');
    const build = JSON.stringify({ config: 'Release' });
    writeFileSync(join(engineDir, 'build.json'), build);
    const listing = JSON.parse(readFileSync(join(engineDir, 'files.json'), 'utf8'));
    listing.files['build.json'] = { sha256: createHash('sha256').update(build).digest('hex'), size: build.length };
    writeFileSync(join(engineDir, 'files.json'), JSON.stringify(listing));
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(/build\.json says engine \(none\), not eng1/);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('gives up on a file that stops arriving, caching nothing', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    stalls.add('/engines/eng1/luna-engine.wasm');
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir, idleTimeoutMs: 200 })).rejects.toThrow(/luna-engine\.wasm: no data for 0\.2 s/);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('keeps a slow file that is still arriving, however long it takes in all', async () => {
    publishEngine(fakeEngine('eng1', 'slow-but-steady'), remoteRoot, '3.2.0');
    dribbles.add('/engines/eng1/luna-engine.wasm');
    // 15 bytes, 50 ms apart: about 750 ms in all, against a 200 ms idle limit.
    const r = await resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir: temp(), idleTimeoutMs: 200 });
    expect(readFileSync(join(r.dir, 'luna-engine.wasm'), 'utf8')).toBe('slow-but-steady');
  });

  it('stops a file as soon as it grows past its listed size', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    writeFileSync(join(remoteRoot, 'engines', 'eng1', 'luna-engine.wasm'), 'much longer than four bytes');
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(/luna-engine\.wasm: expected 4 bytes, got more/);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('refuses a listing that names a path outside the engine folder', async () => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    const listingPath = join(remoteRoot, 'engines', 'eng1', 'files.json');
    const listing = JSON.parse(readFileSync(listingPath, 'utf8'));
    listing.files['../../escape.js'] = { sha256: 'x', size: 1 };
    writeFileSync(listingPath, JSON.stringify(listing));
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(/refusing engine file path/);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it.each([
    ['index.json', 'index.json', /index\.json uses schema 2/],
    ['files.json', 'engines/eng1/files.json', /files\.json uses schema 2/],
  ])('refuses a %s in a newer schema, caching nothing', async (_name, rel, message) => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    const path = join(remoteRoot, ...rel.split('/'));
    writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync(path, 'utf8')), schema: 2 }));
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(message);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it.each(['..', '.'])('refuses an index that maps a version to engine_id "%s", caching nothing', async (id) => {
    writeFileSync(join(remoteRoot, 'index.json'), JSON.stringify({ schema: 1, luna: { '3.2.0': id } }));
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(/invalid engine_id/);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it.each(['luna-engine.js', 'luna-engine.wasm'])('refuses a listing that leaves out %s, caching nothing', async (name) => {
    publishEngine(fakeEngine('eng1'), remoteRoot, '3.2.0');
    const listingPath = join(remoteRoot, 'engines', 'eng1', 'files.json');
    const listing = JSON.parse(readFileSync(listingPath, 'utf8'));
    delete listing.files[name];
    writeFileSync(listingPath, JSON.stringify(listing));
    const cacheDir = temp();
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir })).rejects.toThrow(`files.json does not list ${name}`);
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('refuses an index with no schema', async () => {
    writeFileSync(join(remoteRoot, 'index.json'), JSON.stringify({ luna: { '3.2.0': 'eng1' } }));
    await expect(resolveRemoteEngine({ base, lunaVersion: '3.2.0', cacheDir: temp() })).rejects.toThrow(/no usable schema \(expected 1, got undefined\)/);
  });

  it('reports an unreachable remote with its URL', async () => {
    await expect(resolveRemoteEngine({ base: 'http://127.0.0.1:1', lunaVersion: '3.2.0', cacheDir: temp() })).rejects.toThrow(/127\.0\.0\.1:1\/index\.json/);
  });
});

describe('--luna-version on the CLI', () => {
  it('needs a remote, and cannot be combined with --engine', async () => {
    vi.stubEnv('UA_WASM_ENGINE_BASE', '');
    await expect(resolveEngine(parseArgs(['--luna-version', '3.2.0']))).rejects.toThrow(/needs the engine remote/);
    await expect(resolveEngine(parseArgs(['--luna-version', '3.2.0', '--engine', '/x']))).rejects.toThrow(/not both/);
  });

  it.each(['luna-version', 'engine', 'engine-base'])('refuses --%s with no value, rather than falling back to a local engine', async (key) => {
    await expect(resolveEngine(parseArgs([`--${key}`]))).rejects.toThrow(`--${key} needs a value`);
  });

  it('resolves to the cached engine, with the LUNA version it was asked for', async () => {
    publishEngine(fakeEngine('eng3'), remoteRoot, '3.2.0');
    const cacheDir = temp();
    vi.stubEnv('UA_WASM_ENGINE_CACHE', cacheDir);
    const { result } = await quietly(() => resolveEngine(parseArgs(['--luna-version', '3.2', '--engine-base', base])));
    expect(result).toEqual({ dir: join(cacheDir, 'eng3'), lunaVersion: '3.2.0' });
  });

  it('refuses an --engine folder with no engine, rather than falling back to another', async () => {
    await expect(resolveEngine(parseArgs(['--engine', temp()]))).rejects.toThrow(/holds no luna-engine\.js/);
    expect(await resolveEngine(parseArgs(['--engine', fakeEngine('eng4')]))).toEqual({ dir: expect.stringContaining('ua-cli-test-') });
  });

  it('ejects an Add On with the engine its LUNA version ships', async () => {
    publishEngine(fakeEngine('eng7', 'seven'), remoteRoot, '3.2.0');
    const { parent, dir } = await scaffold();
    const out = join(parent, 'demo-web');
    vi.stubEnv('UA_WASM_ENGINE_CACHE', temp());
    const { result, out: log } = await quietly(() => ejectWasm(parseArgs([dir, '--luna-version', '3.2', '--engine-base', base, '--out', out])));
    expect(result).toBe(0);
    expect(log).toMatch(/with wasm engine eng7 \(LUNA 3\.2\.0\)/);
    expect(readFileSync(join(out, '__engine', 'luna-engine.wasm'), 'utf8')).toBe('seven');
  });

  it('checks the Add On before it downloads anything', async () => {
    publishEngine(fakeEngine('eng8'), remoteRoot, '3.2.0');
    const { parent, dir } = await scaffold();
    vi.stubEnv('UA_WASM_ENGINE_CACHE', temp());
    const { result } = await quietly(() => ejectWasm(parseArgs([dir, '--luna-version', '3.2', '--engine-base', base, '--out', parent])));
    expect(result).toBe(1);
    expect(requests).toEqual([]);
  });
});
