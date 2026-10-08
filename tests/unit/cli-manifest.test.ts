/** `readManifest()` is stricter than LUNA: it rejects what LUNA would drop or silently correct. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readManifest } from '../../cli/util';

const dirs: string[] = [];

function addOn(entry: Record<string, unknown>, omit: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'ua-manifest-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html>');
  const manifest: Record<string, unknown> = { id: 'com.example.a', name: 'A', html: 'index.html', width: 400, height: 300, ...entry };
  for (const k of omit) delete manifest[k];
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('readManifest', () => {
  it('requires a non-empty string name', () => {
    expect(() => readManifest(addOn({}, ['name']))).toThrow(/"name" must be a non-empty string/);
    expect(() => readManifest(addOn({ name: '' }))).toThrow(/"name" must be a non-empty string/);
    expect(() => readManifest(addOn({ name: 7 }))).toThrow(/"name" must be a non-empty string/);
  });

  it('accepts the deprecated title in place of name, as LUNA does, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ title: 'Old' }, ['name'])).entries[0]!.name).toBe('Old');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"title" is deprecated; rename it to "name"/));
  });

  it('prefers name over title, as LUNA does, and warns that title is ignored', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ name: 'New', title: 'Old' })).entries[0]!.name).toBe('New');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"title" is ignored when "name" is present/));
  });

  it('accepts every target LUNA shows, and rejects one it would turn into "window"', () => {
    for (const target of ['window', 'app', 'page', 'browser', 'editor']) {
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

  it('accepts a string manufacturer or none, and rejects a non-string, which LUNA would ignore', () => {
    expect(readManifest(addOn({ manufacturer: 'Example Co' })).entries[0]!.manufacturer).toBe('Example Co');
    expect(readManifest(addOn({})).entries[0]!.manufacturer).toBeUndefined();
    expect(() => readManifest(addOn({ manufacturer: 42 }))).toThrow(/"manufacturer" must be a string/);
  });

  it('accepts a top-level string manufacturer in the add_ons shape, and rejects a non-string', () => {
    const shape = (manufacturer: unknown): string => {
      const dir = addOn({});
      const entry = { id: 'com.example.a', name: 'A', html: 'index.html', width: 400, height: 300 };
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ manufacturer, add_ons: [entry] }));
      return dir;
    };
    expect(readManifest(shape('Example Co')).manifest.manufacturer).toBe('Example Co');
    expect(() => readManifest(shape(7))).toThrow(/top level: "manufacturer" must be a string/);
  });

  it('accepts show_with_session true, false, or absent, and rejects a non-boolean', () => {
    expect(readManifest(addOn({ show_with_session: true })).entries[0]!.show_with_session).toBe(true);
    expect(readManifest(addOn({ show_with_session: false })).entries[0]!.show_with_session).toBe(false);
    expect(readManifest(addOn({})).entries[0]!.show_with_session).toBeUndefined();
    expect(() => readManifest(addOn({ show_with_session: 'true' }))).toThrow(/"show_with_session" must be true or false/);
  });

  it('requires width and height only for a window, which a missing target means', () => {
    for (const target of ['app', 'page', 'browser', 'editor']) {
      expect(readManifest(addOn({ target }, ['width', 'height'])).entries[0]!.width).toBeUndefined();
    }
    expect(() => readManifest(addOn({ target: 'window' }, ['width']))).toThrow(/"width" must be a number/);
    expect(() => readManifest(addOn({}, ['height']))).toThrow(/"height" must be a number/);
  });

  it('still rejects a width or height that is present but not a number', () => {
    expect(() => readManifest(addOn({ target: 'browser', width: '300' }))).toThrow(/"width" must be a number when present/);
  });
});
