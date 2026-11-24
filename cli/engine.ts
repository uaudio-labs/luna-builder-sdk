/**
 * @hidden Wasm support is not released: nothing here is in `usage()` or the shipped docs.
 *
 * Which wasm engine `ua-builder serve` mounts and `ua-builder eject-wasm` copies. One rule for both:
 *
 *   --engine <dir>           a local build: the folder holding luna-engine.js, or its Release/
 *   --luna-version <x.y.z>   the engine that LUNA release ships, from the engine remote
 *                            (--engine-base <url> or UA_WASM_ENGINE_BASE; see engine-remote.ts)
 *   neither                  UA_WASM_ENGINE, an engine/ folder in the installed SDK, or a
 *                            sibling hbsystem/wasm_engine/dist build in the tree
 *
 * `--engine` and `--luna-version` can't be combined.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveRemoteEngine } from './engine-remote';
import { flagString, packageRoot, type Args } from './util';

/** Env var naming a local engine build when `--engine` is not passed. */
export const ENGINE_ENV = 'UA_WASM_ENGINE';
/** Env var naming the engine remote's base URL when `--engine-base` is not passed. */
export const ENGINE_BASE_ENV = 'UA_WASM_ENGINE_BASE';
/** How to name an engine, for messages about a missing one. */
export const ENGINE_HINT = `pass --engine <folder holding luna-engine.js> or --luna-version <x.y.z>, or set ${ENGINE_ENV}`;

/** An engine ready to mount or copy. */
export interface Engine {
  /** The folder holding `luna-engine.js`. */
  dir: string;
  /** The LUNA release it was resolved for, when it came from the engine remote. */
  lunaVersion?: string;
}

/**
 * The engine `args` ask for, or `undefined` when they name none and none is found locally. With
 * `--luna-version`, a cold cache downloads the engine first, logging one line.
 *
 * @throws Error when `--engine`, `--luna-version` or `--engine-base` has no value, when `--engine` and
 *   `--luna-version` are both passed, when `--engine` names a
 *   folder with no engine, when `--luna-version` has no remote configured, or when the remote
 *   cannot supply that version (see {@link resolveRemoteEngine}).
 */
export async function resolveEngine(args: Args): Promise<Engine | undefined> {
  // parseArgs stores a flag given with no value as true, which flagString reads as absent.
  for (const key of ['engine', 'luna-version', 'engine-base']) {
    if (args.flags[key] === true) throw new Error(`--${key} needs a value`);
  }
  const local = flagString(args, 'engine');
  const lunaVersion = flagString(args, 'luna-version');
  if (local !== undefined && lunaVersion !== undefined) throw new Error('pass --engine <dir> or --luna-version <x.y.z>, not both');
  if (lunaVersion !== undefined) {
    const base = flagString(args, 'engine-base') ?? process.env[ENGINE_BASE_ENV];
    if (!base) throw new Error(`--luna-version needs the engine remote: pass --engine-base <url> or set ${ENGINE_BASE_ENV}`);
    const remote = await resolveRemoteEngine({ base, lunaVersion, log: console.log });
    return { dir: remote.dir, lunaVersion: remote.lunaVersion };
  }
  if (local !== undefined) {
    const dir = engineIn(local);
    if (!dir) throw new Error(`--engine ${resolve(local)} holds no luna-engine.js`);
    return { dir };
  }
  const dir = findLocalEngine();
  return dir ? { dir } : undefined;
}

/** `UA_WASM_ENGINE`, an `engine/` folder in the installed SDK, or a sibling tree build. */
export function findLocalEngine(): string | undefined {
  const root = packageRoot();
  const candidates = [
    process.env[ENGINE_ENV],
    join(root, 'engine'),
    // builder lives at <tree>/packages/sdk/luna/builder/sdk; the engine at <tree>/packages/hbsystem/wasm_engine/dist
    resolve(root, '../../../../hbsystem/wasm_engine/dist/Release'),
    resolve(root, '../../../../hbsystem/wasm_engine/dist/Debug'),
  ];
  for (const c of candidates) {
    const dir = c ? engineIn(c) : undefined;
    if (dir) return dir;
  }
  return undefined;
}

/** `path` when it holds `luna-engine.js`, else its `Release/` when that does. */
function engineIn(path: string): string | undefined {
  const dir = resolve(path);
  if (existsSync(join(dir, 'luna-engine.js'))) return dir;
  if (existsSync(join(dir, 'Release', 'luna-engine.js'))) return join(dir, 'Release');
  return undefined;
}
