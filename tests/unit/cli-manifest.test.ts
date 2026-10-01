/** `readManifest()` is stricter than LUNA: it rejects what LUNA would drop or silently correct. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readManifest } from '../../cli/util';

const dirs: string[] = [];

function addOn(entry: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ua-manifest-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html>');
  const manifest = { id: 'com.example.a', title: 'A', html: 'index.html', width: 400, height: 300, ...entry };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('readManifest', () => {
  it('accepts every target LUNA shows, and rejects one it would turn into "window"', () => {
    for (const target of ['window', 'app', 'page', 'browser']) {
      expect(readManifest(addOn({ target })).entries[0]!.target).toBe(target);
    }
    expect(() => readManifest(addOn({ target: 'panel' }))).toThrow(/unknown target "panel"/);
  });

  it('accepts floating true, false, or absent', () => {
    expect(readManifest(addOn({ floating: true })).entries[0]!.floating).toBe(true);
    expect(readManifest(addOn({ floating: false })).entries[0]!.floating).toBe(false);
    expect(readManifest(addOn({})).entries[0]!.floating).toBeUndefined();
  });

  it('rejects a floating that is not a boolean, which LUNA would ignore', () => {
    expect(() => readManifest(addOn({ floating: 'false' }))).toThrow(/"floating" must be true or false/);
    expect(() => readManifest(addOn({ floating: 0 }))).toThrow(/"floating" must be true or false/);
  });

  it('accepts show_with_session true, false, or absent, and rejects a non-boolean', () => {
    expect(readManifest(addOn({ show_with_session: true })).entries[0]!.show_with_session).toBe(true);
    expect(readManifest(addOn({ show_with_session: false })).entries[0]!.show_with_session).toBe(false);
    expect(readManifest(addOn({})).entries[0]!.show_with_session).toBeUndefined();
    expect(() => readManifest(addOn({ show_with_session: 'true' }))).toThrow(/"show_with_session" must be true or false/);
  });
});
