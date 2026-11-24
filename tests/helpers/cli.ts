/** Shared helpers for the `ua-builder` command tests. */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { vi } from 'vitest';
import { newAddOn } from '../../cli/new';
import { parseArgs } from '../../cli/util';

const temps: string[] = [];

/** A new empty folder, removed by {@link removeTemps}. */
export function temp(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ua-cli-test-'));
  temps.push(dir);
  return dir;
}

/** Removes every folder {@link temp} made; call it from `afterEach`. */
export function removeTemps(): void {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/** Runs `run` with console output captured instead of printed. */
export async function quietly<T>(run: () => Promise<T>): Promise<{ result: T; out: string }> {
  const lines: string[] = [];
  const spies = (['log', 'warn', 'error'] as const).map((m) => vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void lines.push(a.join(' '))));
  try {
    return { result: await run(), out: lines.join('\n') };
  } finally {
    for (const s of spies) s.mockRestore();
  }
}

/** `ua-builder new demo` (plus `argv`) in a new temp folder. */
export async function scaffold(...argv: string[]): Promise<{ parent: string; dir: string }> {
  const parent = temp();
  await quietly(() => newAddOn(parseArgs(['demo', '--dir', parent, ...argv])));
  return { parent, dir: join(parent, 'demo') };
}

/**
 * An engine stage as the wasm_engine build lays it out: the files a page needs, plus the test
 * page, servers, socket shims and OS junk that eject and publish leave behind.
 */
export function fakeEngine(engineId = 'abc123', wasm: string | Buffer = Buffer.from([0, 0x61, 0x73, 0x6d])): string {
  const dir = temp();
  writeFileSync(join(dir, 'luna-engine.js'), 'var createLunaEngineModule = () => {};');
  writeFileSync(join(dir, 'luna-engine.wasm'), wasm);
  writeFileSync(join(dir, 'build.json'), JSON.stringify({ config: 'Release', engine_id: engineId }));
  mkdirSync(join(dir, 'plugins', 'uaudio_luna_channel'), { recursive: true });
  writeFileSync(join(dir, 'plugins', 'uaudio_luna_channel', 'plugin.wasm'), 'p');
  writeFileSync(join(dir, 'plugins', '.DS_Store'), 'x');
  for (const f of ['index.html', 'serve.py', 'serve_lan.py', 'wasm_socket.js', 'wasm_uanet_link.js']) writeFileSync(join(dir, f), f);
  return dir;
}
