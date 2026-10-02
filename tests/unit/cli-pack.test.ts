/** `ua-builder pack` leaves dotfiles and OS metadata files out of the bundle at every depth. */
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { newAddOn } from '../../cli/new';
import { isJunk, pack } from '../../cli/pack';
import { bundlePath, parseArgs } from '../../cli/util';

const dirs: string[] = [];

async function quietly<T>(run: () => Promise<T>): Promise<{ result: T; out: string }> {
  const lines: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void lines.push(a.join(' ')));
  try {
    return { result: await run(), out: lines.join('\n') };
  } finally {
    log.mockRestore();
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

  it('leaves junk out of the bundle at the top level and in subfolders', async () => {
    const parent = mkdtempSync(join(tmpdir(), 'ua-pack-'));
    dirs.push(parent);
    const dir = join(parent, 'demo');
    await quietly(() => newAddOn(parseArgs(['demo', '--dir', parent])));
    mkdirSync(join(dir, 'assets', '.cache'), { recursive: true });
    for (const rel of ['.DS_Store', 'Thumbs.db', '._index.html', '.env', 'assets/.DS_Store', 'assets/desktop.ini', 'assets/.cache/x', 'assets/logo.svg']) {
      writeFileSync(join(dir, rel), 'x');
    }

    const out = join(parent, 'demo.lunaaddon');
    const { result: code, out: log } = await quietly(() => pack(parseArgs([dir, '--out', out])));

    expect(code).toBe(0);
    for (const rel of ['manifest.json', 'index.html', 'vendor/luna.global.js', 'assets/logo.svg']) {
      expect(existsSync(join(out, rel)), rel).toBe(true);
    }
    for (const rel of ['.DS_Store', 'Thumbs.db', '._index.html', '.env', '.gitignore', 'assets/.DS_Store', 'assets/desktop.ini', 'assets/.cache']) {
      expect(existsSync(join(out, rel)), rel).toBe(false);
    }
    expect(log).toMatch(/Left out \d+ dotfile\(s\) and OS metadata file\(s\)/);
  });
});
