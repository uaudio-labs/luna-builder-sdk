/**
 * @hidden Wasm support is not released: nothing here is in `usage()` or the shipped docs.
 *
 * What a wasm engine build folder holds that a page needs. `eject-wasm` copies these files and
 * `publish-engine` publishes them; the build's test page, servers and socket shims stay behind.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isJunk } from './pack';

const ENGINE_FILES = ['luna-engine.js', 'luna-engine.wasm', 'build.json'];
const ENGINE_FOLDERS = ['plugins'];

/** One file of an engine build. */
export interface EngineFile {
  /** `/`-separated, relative to the engine folder. */
  path: string;
  /** Where it is on disk. */
  file: string;
  mtime: Date;
  /** Permission bits. */
  mode: number;
}

/**
 * The files of the engine build in `dir` that a page needs.
 *
 * @throws Error when `dir` is not an engine build (it has no `luna-engine.js` or `luna-engine.wasm`).
 */
export function engineFiles(dir: string): EngineFile[] {
  const missing = ['luna-engine.js', 'luna-engine.wasm'].filter((f) => !existsSync(join(dir, f)));
  if (missing.length) throw new Error(`${dir} is not a wasm engine build (no ${missing.join(' or ')})`);
  const files: EngineFile[] = [];
  const add = (file: string, path: string): void => {
    const stat = statSync(file);
    if (stat.isDirectory()) {
      for (const child of readdirSync(file).sort()) if (!isJunk(child)) add(join(file, child), `${path}/${child}`);
    } else if (stat.isFile()) {
      files.push({ path, file, mtime: stat.mtime, mode: stat.mode & 0o777 });
    }
  };
  for (const f of [...ENGINE_FILES, ...ENGINE_FOLDERS]) if (existsSync(join(dir, f))) add(join(dir, f), f);
  return files;
}

/** The `engine_id` in the build's `build.json`, or `undefined` when there is no string one. */
export function readEngineId(dir: string): string | undefined {
  try {
    const id = (JSON.parse(readFileSync(join(dir, 'build.json'), 'utf8')) as { engine_id?: unknown }).engine_id;
    return typeof id === 'string' ? id : undefined;
  } catch {
    return undefined;
  }
}
