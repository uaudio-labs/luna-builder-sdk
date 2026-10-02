/** `ua-builder new` writes only the manifest fields the chosen target uses. */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { newAddOn } from '../../cli/new';
import { bundlePath, parseArgs, readManifest } from '../../cli/util';

const dirs: string[] = [];

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

afterEach(() => {
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

  for (const [target, menu] of [['browser', 'Add Ons > Browsers'], ['app', 'Add Ons > Apps']] as const) {
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
});
