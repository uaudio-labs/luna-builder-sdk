/**
 * @hidden Wasm support is not released: nothing here is in `usage()` or the shipped docs.
 *
 * Versioned wasm engines on a remote, matched to LUNA releases, and the per-user cache that
 * `ua-builder serve` and `ua-builder eject-wasm` use them from (`--luna-version`; see engine.ts).
 *
 * The remote is any static host; `base` is its URL. It holds:
 *
 *   <base>/index.json                       {@link EngineIndex}
 *   <base>/engines/<engine_id>/files.json   {@link EngineFiles}
 *   <base>/engines/<engine_id>/<path>       the engine's files (luna-engine.js, .wasm, build.json, plugins/...)
 *
 * A LUNA version maps to exactly one engine build, several versions can share one, and a
 * published mapping or engine never changes, so neither is fetched twice. A document in a
 * schema other than {@link SCHEMA} is refused, not guessed at. The cache is keyed by `engine_id`: two LUNA versions that ship the
 * same engine share one copy. It also remembers, per remote, which engine each LUNA version
 * mapped to ({@link KNOWN_FILE}), so a version already resolved needs no network at all.
 */
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, normalize, resolve } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { engineFiles, readEngineId } from './engine-build';
import { errorMessage, flagString, safeJoin, type Args } from './util';

/** Env var overriding where downloaded engines are kept. */
export const ENGINE_CACHE_ENV = 'UA_WASM_ENGINE_CACHE';
/** In the cache folder: `{ "schema": 1, "remotes": { "<base>": { "3.2.0": "<engine_id>" } } }`. */
const KNOWN_FILE = 'luna-versions.json';

/** `<base>/index.json`: which engine build each LUNA release ships, e.g. `{ "schema": 1, "luna": { "3.2.0": "ec812618e67b" } }`. */
export interface EngineIndex {
  schema: 1;
  /** LUNA version (`major.minor.patch`) to `engine_id`. */
  luna: Record<string, string>;
}

/**
 * `<base>/engines/<engine_id>/files.json`: every file of one engine build, e.g.
 * `{ "schema": 1, "engine_id": "ec812618e67b", "files": { "luna-engine.wasm": { "sha256": "…", "size": 21750000 } } }`.
 */
export interface EngineFiles {
  schema: 1;
  engine_id: string;
  /** `/`-separated path under the engine folder to its SHA-256 (hex) and size in bytes. */
  files: Record<string, { sha256: string; size: number }>;
}

/** An engine from the remote, in the cache: a local folder holding `luna-engine.js`. */
export interface ResolvedEngine {
  dir: string;
  engineId: string;
  lunaVersion: string;
}

/** A folder name: no separators, and not `.` or `..` (it may not start with a dot). */
const ENGINE_ID = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
/** How long a request may go without receiving data before it is given up. */
const IDLE_TIMEOUT_MS = 30_000;
/** The only remote format this CLI reads and writes; a later one is refused rather than guessed at. */
const SCHEMA = 1;

/** Refuses `doc` unless it declares the schema this CLI understands. */
function checkSchema(doc: unknown, what: string): void {
  const schema = (doc as { schema?: unknown } | null | undefined)?.schema;
  if (schema === SCHEMA) return;
  if (typeof schema === 'number' && schema > SCHEMA) throw new Error(`${what} uses schema ${schema}, and this ua-builder reads only schema ${SCHEMA}; update the LUNA Builder SDK`);
  throw new Error(`${what} has no usable schema (expected ${SCHEMA}, got ${JSON.stringify(schema)})`);
}

/** `"3.2"` → `"3.2.0"`; anything that is not 1-3 dot-separated numbers is refused. */
export function normalizeLunaVersion(version: string): string {
  const parts = version.trim().split('.');
  if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) {
    throw new Error(`"${version}" is not a LUNA version (expected major.minor.patch, e.g. 3.2.0)`);
  }
  while (parts.length < 3) parts.push('0');
  return parts.map(Number).join('.');
}

/** Where downloaded engines live: `UA_WASM_ENGINE_CACHE`, else the platform's per-user cache folder. */
export function engineCacheDir(): string {
  const env = process.env[ENGINE_CACHE_ENV];
  if (env) return resolve(env);
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Caches', 'ua-builder', 'engines');
  if (process.platform === 'win32') return join(process.env['LOCALAPPDATA'] ?? join(homedir(), 'AppData', 'Local'), 'ua-builder', 'engines');
  return join(process.env['XDG_CACHE_HOME'] ?? join(homedir(), '.cache'), 'ua-builder', 'engines');
}

/**
 * Finds the engine LUNA `lunaVersion` ships, and returns its cached folder. A version this cache
 * has already resolved from `base`, with its engine still cached, is answered with no network.
 * Otherwise the remote's index is read, and the engine is downloaded and hash-checked into the
 * cache when it is not there.
 *
 * @throws Error when the index has no such LUNA version (the message lists those it has).
 * @throws Error when a file is missing, has the wrong size or hash, or names a path outside the engine folder.
 */
export async function resolveRemoteEngine(options: { base: string; lunaVersion: string; cacheDir?: string; log?: (line: string) => void; idleTimeoutMs?: number }): Promise<ResolvedEngine> {
  const log = options.log ?? (() => undefined);
  const idleMs = options.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
  const lunaVersion = normalizeLunaVersion(options.lunaVersion);
  const base = options.base.replace(/\/+$/, '');
  const cacheRoot = options.cacheDir ?? engineCacheDir();
  const remembered = readKnown(cacheRoot).remotes[base]?.[lunaVersion];
  if (remembered !== undefined && ENGINE_ID.test(remembered) && existsSync(join(cacheRoot, remembered, 'files.json'))) {
    return { dir: join(cacheRoot, remembered), engineId: remembered, lunaVersion };
  }

  const index = (await fetchJson(`${base}/index.json`, idleMs)) as Partial<EngineIndex>;
  checkSchema(index, `the engine remote's ${base}/index.json`);
  const known = index.luna && typeof index.luna === 'object' ? index.luna : {};
  const engineId = known[lunaVersion];
  if (typeof engineId !== 'string') {
    const versions = Object.keys(known).sort(compareVersions);
    throw new Error(`the engine remote ${base} has no engine for LUNA ${lunaVersion}${versions.length ? ` (it has ${versions.join(', ')})` : ' (its index is empty)'}`);
  }
  if (!ENGINE_ID.test(engineId)) throw new Error(`the engine remote's index names an invalid engine_id "${engineId}" for LUNA ${lunaVersion}`);

  const dir = join(cacheRoot, engineId);
  // A finished download is renamed into place in one step, so a folder with files.json is complete.
  if (!existsSync(join(dir, 'files.json'))) await downloadEngine(base, engineId, lunaVersion, dir, log, idleMs);
  remember(cacheRoot, base, lunaVersion, engineId);
  return { dir, engineId, lunaVersion };
}

/**
 * Downloads engine `engineId` from `base` into `dir`. Each file streams to disk and is hashed as
 * it arrives; any failure leaves nothing behind.
 */
async function downloadEngine(base: string, engineId: string, lunaVersion: string, dir: string, log: (line: string) => void, idleMs: number): Promise<void> {
  const engineUrl = `${base}/engines/${engineId}`;
  const listing = (await fetchJson(`${engineUrl}/files.json`, idleMs)) as Partial<EngineFiles>;
  checkSchema(listing, `${engineUrl}/files.json`);
  if (listing.engine_id !== engineId || !listing.files || typeof listing.files !== 'object') {
    throw new Error(`${engineUrl}/files.json does not describe engine ${engineId}`);
  }
  const files = Object.entries(listing.files);
  const total = files.reduce((n, [, f]) => n + (f.size ?? 0), 0);
  log(`Downloading wasm engine ${engineId} for LUNA ${lunaVersion} (${(total / 1e6).toFixed(1)} MB) from ${base}`);

  mkdirSync(dirname(dir), { recursive: true });
  const partial = `${dir}.partial-${process.pid}-${Date.now()}`;
  try {
    for (const [path, expected] of files) {
      const target = safeEnginePath(partial, path);
      mkdirSync(dirname(target), { recursive: true });
      const got = await fetchToFile(`${engineUrl}/${path.split('/').map(encodeURIComponent).join('/')}`, target, expected.size, idleMs);
      if (got.size !== expected.size) throw new Error(`${path}: expected ${expected.size} bytes, got ${got.size}`);
      if (got.sha256 !== expected.sha256) throw new Error(`${path}: hash mismatch (expected ${expected.sha256}, got ${got.sha256})`);
    }
    // files.json may leave a file out; an engine missing either of these would be cached as complete.
    for (const required of ['luna-engine.js', 'luna-engine.wasm']) {
      if (!existsSync(join(partial, required))) throw new Error(`files.json does not list ${required}`);
    }
    const builtId = readEngineId(partial);
    if (builtId !== engineId) throw new Error(`its build.json says engine ${builtId ?? '(none)'}, not ${engineId}`);
    writeFileSync(join(partial, 'files.json'), JSON.stringify(listing, null, 2));
    try {
      renameSync(partial, dir);
    } catch (err) {
      // Another process finished the same download first; its copy is identical.
      if (!existsSync(join(dir, 'files.json'))) throw err;
      rmSync(partial, { recursive: true, force: true });
    }
  } catch (err) {
    rmSync(partial, { recursive: true, force: true });
    throw new Error(`could not download wasm engine ${engineId} for LUNA ${lunaVersion}: ${errorMessage(err)}`);
  }
}

/** What {@link KNOWN_FILE} holds: per remote base URL, LUNA version to `engine_id`. */
interface KnownVersions {
  schema: 1;
  remotes: Record<string, Record<string, string>>;
}

/** The cache's {@link KNOWN_FILE}; a missing, unreadable or other-schema one counts as empty. */
function readKnown(cacheRoot: string): KnownVersions {
  try {
    const doc = JSON.parse(readFileSync(join(cacheRoot, KNOWN_FILE), 'utf8')) as Partial<KnownVersions>;
    if (doc.schema === SCHEMA && doc.remotes && typeof doc.remotes === 'object') return doc as KnownVersions;
  } catch {
    /* a cache: start again */
  }
  return { schema: SCHEMA, remotes: {} };
}

/** Records that `base` maps LUNA `lunaVersion` to `engineId`. A published mapping never changes. */
function remember(cacheRoot: string, base: string, lunaVersion: string, engineId: string): void {
  const known = readKnown(cacheRoot);
  if (known.remotes[base]?.[lunaVersion] === engineId) return;
  known.remotes[base] = { ...known.remotes[base], [lunaVersion]: engineId };
  mkdirSync(cacheRoot, { recursive: true });
  // Written aside and renamed, so a reader never sees half a file.
  const tmp = join(cacheRoot, `${KNOWN_FILE}.${process.pid}`);
  writeFileSync(tmp, JSON.stringify(known, null, 2));
  renameSync(tmp, join(cacheRoot, KNOWN_FILE));
}

/**
 * Publishes the engine build in `engineDir` to the remote folder `remoteDir` and maps LUNA
 * `lunaVersion` to it: what a LUNA release would do. Writes the same files `eject-wasm` copies
 * (the stage's test page and servers stay behind) and their `files.json`, unless that engine is
 * already published, then the index entry. A version already mapped to this engine changes nothing.
 *
 * @throws Error when `engineDir` is not an engine build or has no `engine_id` in its build.json.
 * @throws Error when `lunaVersion` already maps to a different engine (a published mapping never changes).
 */
export function publishEngine(engineDir: string, remoteDir: string, lunaVersion: string): { engineId: string; lunaVersion: string; added: boolean } {
  const version = normalizeLunaVersion(lunaVersion);
  const dir = resolve(engineDir);
  const files = engineFiles(dir);
  const engineId = readEngineId(dir);
  if (engineId === undefined || !ENGINE_ID.test(engineId)) throw new Error(`${engineDir} has no usable engine_id in its build.json, so it cannot be published`);

  const indexPath = join(remoteDir, 'index.json');
  const index: EngineIndex = existsSync(indexPath) ? (JSON.parse(readFileSync(indexPath, 'utf8')) as EngineIndex) : { schema: SCHEMA, luna: {} };
  checkSchema(index, indexPath);
  const current = index.luna[version];
  if (current === engineId) return { engineId, lunaVersion: version, added: false };
  if (current !== undefined) throw new Error(`LUNA ${version} already maps to engine ${current}; a published mapping does not change`);

  // A published engine never changes; files.json is written last, so its presence means complete.
  const engineOut = join(remoteDir, 'engines', engineId);
  if (!existsSync(join(engineOut, 'files.json'))) {
    const listing: EngineFiles = { schema: SCHEMA, engine_id: engineId, files: {} };
    for (const f of files) {
      const data = readFileSync(f.file);
      const target = safeEnginePath(engineOut, f.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, data);
      listing.files[f.path] = { sha256: createHash('sha256').update(data).digest('hex'), size: data.length };
    }
    writeFileSync(join(engineOut, 'files.json'), JSON.stringify(listing, null, 2));
  }
  index.luna[version] = engineId;
  index.luna = Object.fromEntries(Object.entries(index.luna).sort(([a], [b]) => compareVersions(a, b)));
  mkdirSync(remoteDir, { recursive: true });
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
  return { engineId, lunaVersion: version, added: true };
}

/**
 * `ua-builder publish-engine <engine dir> --luna-version <x.y.z> --to <remote folder>`.
 * Internal: stands in for the release step that will publish each LUNA's engine.
 */
export async function publishEngineCommand(args: Args): Promise<number> {
  const engineDir = args.positional[0];
  const to = flagString(args, 'to');
  const version = flagString(args, 'luna-version');
  if (!engineDir || !to || !version) {
    console.error('usage: ua-builder publish-engine <engine dir> --luna-version <x.y.z> --to <remote folder>');
    return 2;
  }
  try {
    const r = publishEngine(engineDir, resolve(to), version);
    console.log(`${r.added ? 'Published' : 'Already published:'} LUNA ${r.lunaVersion} -> wasm engine ${r.engineId} in ${resolve(to)}`);
    return 0;
  } catch (err) {
    console.error(`Not published: ${errorMessage(err)}`);
    return 1;
  }
}

/** `path` (from a remote listing) as a file under `root`, refusing anything that is not plainly one. */
function safeEnginePath(root: string, path: string): string {
  const plain = path && !isAbsolute(path) && !path.includes('\\') && !path.split('/').some((p) => p === '..' || p === '');
  const full = plain ? safeJoin(root, path) : undefined;
  if (!full || full === normalize(root)) throw new Error(`refusing engine file path "${path}"`);
  return full;
}

/** Orders `major.minor.patch` versions numerically: 3.2.0 before 3.10.0. */
function compareVersions(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

/**
 * Streams `url` into `target`, hashing it on the way, and returns its size and SHA-256. Gives up
 * when no data arrives for `idleMs`, or as soon as it grows past `maxSize`.
 */
async function fetchToFile(url: string, target: string, maxSize: number, idleMs: number): Promise<{ size: number; sha256: string }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stillReceiving = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(new Error(`no data for ${idleMs / 1000} s`)), idleMs);
  };
  const hash = createHash('sha256');
  let size = 0;
  stillReceiving();
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const check = new Transform({
      transform(chunk: Buffer, _encoding, done) {
        stillReceiving();
        size += chunk.length;
        if (size > maxSize) return done(new Error(`expected ${maxSize} bytes, got more`));
        hash.update(chunk);
        done(null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(res.body as WebReadableStream<Uint8Array>), check, createWriteStream(target));
    return { size, sha256: hash.digest('hex') };
  } catch (err) {
    const reason: unknown = controller.signal.aborted ? controller.signal.reason : err;
    throw new Error(`${url}: ${errorMessage(reason)}`);
  } finally {
    clearTimeout(timer);
  }
}

/** A small document (index.json, files.json), read whole; it must arrive within `timeoutMs`. */
async function fetchBytes(url: string, timeoutMs: number): Promise<Buffer> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    throw new Error(`${url}: ${errorMessage(err)}`);
  }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const data = await fetchBytes(url, timeoutMs);
  try {
    return JSON.parse(data.toString('utf8'));
  } catch {
    throw new Error(`${url} is not JSON`);
  }
}
