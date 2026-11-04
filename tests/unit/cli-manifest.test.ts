/** `readManifest()` is stricter than LUNA: it rejects what LUNA would drop or silently correct. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addOnClashes, readManifest } from '../../cli/util';

const dirs: string[] = [];

function addOn(entry: Record<string, unknown>, omit: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'ua-manifest-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html>');
  const manifest: Record<string, unknown> = { id: 'com.example.a', title: 'A', html: 'index.html', width: 400, height: 300, ...entry };
  for (const k of omit) delete manifest[k];
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest));
  return dir;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('readManifest', () => {
  it('requires a non-empty string title', () => {
    expect(() => readManifest(addOn({}, ['title']))).toThrow(/"title" must be a non-empty string/);
    expect(() => readManifest(addOn({ title: '' }))).toThrow(/"title" must be a non-empty string/);
    expect(() => readManifest(addOn({ title: 7 }))).toThrow(/"title" must be a non-empty string/);
  });

  it('reads title as the entry name without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ title: 'Old' })).entries[0]!.name).toBe('Old');
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts name, which newer LUNA releases read, and checks it in place of title', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ name: 'New' }, ['title'])).entries[0]!.name).toBe('New');
    expect(() => readManifest(addOn({ name: '' }, ['title']))).toThrow(/"name" must be a non-empty string/);
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts a title matching name without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ name: 'A', title: 'A' })).entries[0]!.name).toBe('A');
    expect(warn).not.toHaveBeenCalled();
  });

  it('prefers name over title, as LUNA does, and warns when they differ', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ name: 'New', title: 'Old' })).entries[0]!.name).toBe('New');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"title" differs from "name"/));
  });

  it('warns about an id with capitals, which LUNA reads in lowercase', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readManifest(addOn({ id: 'com.Example.A' })).entries[0]!.id).toBe('com.Example.A');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/LUNA reads "id" as "com.example.a"; write it in lowercase/));
  });

  it('does not warn about a lowercase id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readManifest(addOn({}));
    expect(warn).not.toHaveBeenCalled();
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

  it('accepts a description as a string, an array of strings, or none, and rejects anything else, which LUNA would ignore', () => {
    expect(readManifest(addOn({ description: 'Does things.' })).entries[0]!.description).toBe('Does things.');
    expect(readManifest(addOn({ description: ['Does ', 'things.\n', 'Well.'] })).entries[0]!.description).toEqual(['Does ', 'things.\n', 'Well.']);
    expect(readManifest(addOn({ description: [] })).entries[0]!.description).toEqual([]);
    expect(readManifest(addOn({})).entries[0]!.description).toBeUndefined();
    expect(() => readManifest(addOn({ description: 42 }))).toThrow(/"description" must be a string or an array of strings/);
    expect(() => readManifest(addOn({ description: ['ok', 7] }))).toThrow(/"description" must be a string or an array of strings/);
  });

  it('accepts a top-level description in the add_ons shape as a string or an array of strings, and rejects anything else', () => {
    const shape = (description: unknown): string => {
      const dir = addOn({});
      const entry = { id: 'com.example.a', name: 'A', html: 'index.html', width: 400, height: 300 };
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ description, add_ons: [entry] }));
      return dir;
    };
    expect(readManifest(shape('Both of them.')).manifest.description).toBe('Both of them.');
    expect(readManifest(shape(['Both ', 'of them.'])).manifest.description).toEqual(['Both ', 'of them.']);
    expect(() => readManifest(shape(7))).toThrow(/top level: "description" must be a string or an array of strings/);
    expect(() => readManifest(shape(['ok', 7]))).toThrow(/top level: "description" must be a string or an array of strings/);
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

  it('accepts run_hidden true, false, or absent on any target, and rejects a non-boolean', () => {
    expect(readManifest(addOn({ run_hidden: true })).entries[0]!.run_hidden).toBe(true);
    expect(readManifest(addOn({ run_hidden: false })).entries[0]!.run_hidden).toBe(false);
    expect(readManifest(addOn({})).entries[0]!.run_hidden).toBeUndefined();
    expect(() => readManifest(addOn({ run_hidden: 'yes' }))).toThrow(/"run_hidden" must be true or false/);
  });

  it('accepts unload_on_close true, false, or absent, alongside run_hidden, and rejects a non-boolean', () => {
    expect(readManifest(addOn({ unload_on_close: true })).entries[0]!.unload_on_close).toBe(true);
    expect(readManifest(addOn({ unload_on_close: false })).entries[0]!.unload_on_close).toBe(false);
    expect(readManifest(addOn({})).entries[0]!.unload_on_close).toBeUndefined();
    expect(readManifest(addOn({ target: 'browser', unload_on_close: true })).entries[0]!.unload_on_close).toBe(true);
    expect(readManifest(addOn({ target: 'editor', unload_on_close: true })).entries[0]!.unload_on_close).toBe(true);
    const both = readManifest(addOn({ run_hidden: true, unload_on_close: true })).entries[0]!;
    expect([both.run_hidden, both.unload_on_close]).toEqual([true, true]);
    expect(() => readManifest(addOn({ unload_on_close: 'true' }))).toThrow(/"unload_on_close" must be true or false/);
  });

  it('accepts fixed_size true, false, or absent, and rejects a non-boolean', () => {
    expect(readManifest(addOn({ fixed_size: true })).entries[0]!.fixed_size).toBe(true);
    expect(readManifest(addOn({ fixed_size: false })).entries[0]!.fixed_size).toBe(false);
    expect(readManifest(addOn({})).entries[0]!.fixed_size).toBeUndefined();
    expect(() => readManifest(addOn({ fixed_size: 1 }))).toThrow(/"fixed_size" must be true or false/);
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

describe('addOnClashes', () => {
  const installed = [{ id: 'com.example.a', name: 'A', entry: '/Add Ons/A' }];

  it('treats ids that differ only in case as the same Add On, as LUNA does', () => {
    expect(addOnClashes([{ id: 'com.Example.A', name: 'Other' }], installed)).toEqual([
      'id "com.Example.A" is already used by "A" in /Add Ons/A',
    ]);
  });

  it('leaves a different id and name alone', () => {
    expect(addOnClashes([{ id: 'com.example.b', name: 'B' }], installed)).toEqual([]);
  });
});
