/** `readManifest()` is stricter than LUNA: it rejects what LUNA would drop or silently correct. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addOnClashes, entryTargets, missingCategoryNotes, networkEntryProblem, readManifest } from '../../cli/util';
import { ADD_ON_CATEGORIES, suggestAddOnCategories } from '../../src/model/add-on-categories';

const dirs: string[] = [];

function addOn(entry: Record<string, unknown>, omit: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'ua-manifest-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'index.html'), '<!doctype html>');
  const manifest: Record<string, unknown> = { id: 'com.example.a', title: 'A', html: 'index.html', width: 400, height: 300, categories: ['Utility'], ...entry };
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

  it('accepts categories named from the list, and rejects anything else, which LUNA would read as written', () => {
    expect(readManifest(addOn({ categories: ['MIDI', 'Mixing & Mastering'] })).entries[0]!.categories).toEqual(['MIDI', 'Mixing & Mastering']);
    expect(() => readManifest(addOn({ categories: 'MIDI' }))).toThrow(/"categories" must be a non-empty array of category names/);
    expect(() => readManifest(addOn({ categories: [] }))).toThrow(/"categories" must be a non-empty array of category names/);
    expect(() => readManifest(addOn({ categories: ['midi'] }))).toThrow(/unknown category "midi"; did you mean "MIDI"\?/);
    expect(() => readManifest(addOn({ categories: ['Games'] }))).toThrow(/unknown category "Games"; use one of "AI Tools", /);
    expect(() => readManifest(addOn({ categories: [7] }))).toThrow(/unknown category 7/);
    expect(() => readManifest(addOn({ categories: ['MIDI', 'MIDI'] }))).toThrow(/category "MIDI" is listed twice/);
  });

  it('accepts requires_plugins with one id or several, and rejects what LUNA would drop', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ok = [
      { name: 'Clingy Ex', plugin_id: ['com.evfd.au.aufx_clex', 'com.evfd.vst3.clex'], min_version: '0.4.3' },
      { name: 'Extra', plugin_id: 'com.evfd.vst3.extra', optional: true },
    ];
    expect(readManifest(addOn({ requires_plugins: ok })).entries[0]!.requires_plugins).toEqual(ok);
    expect(readManifest(addOn({ requires_plugins: [] })).entries[0]!.requires_plugins).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
    expect(() => readManifest(addOn({ requires_plugins: { plugin_id: 'x' } }))).toThrow(/"requires_plugins" must be an array/);
    expect(() => readManifest(addOn({ requires_plugins: ['com.evfd.vst3.clex'] }))).toThrow(/requires_plugins\[0\] must be an object with "plugin_id"/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 'Clingy Ex' }] }))).toThrow(/requires_plugins\[0\]: "plugin_id" must be a plugin id/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 'C', plugin_id: [] }] }))).toThrow(/"plugin_id" must be a plugin id/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 'C', plugin_id: ['a', 7] }] }))).toThrow(/"plugin_id" must be a plugin id/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 'C', plugin_id: 'a', min_version: 'v0.4' }] }))).toThrow(/"min_version" must be a version such as "0.4.3"/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 'C', plugin_id: 'a', min_version: 4 }] }))).toThrow(/"min_version" must be a version/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 'C', plugin_id: 'a', optional: 'yes' }] }))).toThrow(/"optional" must be true or false/);
    expect(() => readManifest(addOn({ requires_plugins: [{ name: 7, plugin_id: 'a' }] }))).toThrow(/"name" must be a string/);
  });

  it('warns about a requirement with no name, which LUNA shows by its plugin id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readManifest(addOn({ requires_plugins: [{ plugin_id: 'com.evfd.vst3.clex' }] }));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/requires_plugins\[0\] has no "name"; LUNA will show its plugin id/));
  });

  it('checks a top-level requires_plugins in the add_ons shape', () => {
    const shape = (requires_plugins: unknown): string => {
      const dir = addOn({});
      const entry = { id: 'com.example.a', name: 'A', html: 'index.html', width: 400, height: 300, categories: ['Utility'] };
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ requires_plugins, add_ons: [entry] }));
      return dir;
    };
    expect(readManifest(shape([{ name: 'C', plugin_id: 'a', min_version: '1.2' }])).manifest.requires_plugins).toEqual([{ name: 'C', plugin_id: 'a', min_version: '1.2' }]);
    expect(() => readManifest(shape('a'))).toThrow(/top level: "requires_plugins" must be an array/);
  });

  it('warns about an entry with no categories and suggests some from its name and description', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readManifest(addOn({ name: 'Arp', description: 'An arpeggiator that quantizes MIDI notes.' }, ['title', 'categories']));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/entry 0 \(com.example.a\) has no "categories"\. From its name and description it could be "MIDI"/));
  });

  it('takes a top-level categories in the add_ons shape as the default, without a warning, and checks it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const shape = (categories: unknown): string => {
      const dir = addOn({});
      const entry = { id: 'com.example.a', name: 'A', html: 'index.html', width: 400, height: 300 };
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ categories, add_ons: [entry] }));
      return dir;
    };
    expect(readManifest(shape(['Workflow'])).manifest.categories).toEqual(['Workflow']);
    expect(warn).not.toHaveBeenCalled();
    expect(() => readManifest(shape(['Nope']))).toThrow(/top level: unknown category "Nope"/);
    const { manifest, entries } = readManifest(shape(undefined));
    expect(missingCategoryNotes(manifest, entries)).toHaveLength(1);
  });

  it('accepts network hosts as LUNA reads them: names, a leading wildcard, a port, any case', () => {
    for (const h of ['api.example.com', ' API.Example.COM ', '*.example.com', 'api.example.com:8443', '*.example.co.uk', '203.0.113.5']) {
      expect(networkEntryProblem(h), h).toBeUndefined();
    }
    expect(readManifest(addOn({ network: ['api.example.com', '*.cdn.example.com'] })).entries[0]!.network).toEqual(['api.example.com', '*.cdn.example.com']);
    expect(readManifest(addOn({ network: [] })).entries[0]!.network).toEqual([]);
  });

  it('rejects network entries LUNA would drop', () => {
    const bad = ['', '*', 'com', 'localhost', '127.0.0.1', 'https://api.example.com', 'api.example.com/x', 'user@api.example.com',
      '*.com', '*.co.uk', 'a.*.example.com', '*.203.0.113.5', 'api.example.com:0', 'api.example.com:70000', 'api.example.com:',
      '-bad.example.com', 'api..example.com', '[::1]', '123.456'];
    for (const h of bad) expect(networkEntryProblem(h), h).toBeDefined();
    expect(() => readManifest(addOn({ network: 'api.example.com' }))).toThrow(/"network" must be an array of host names/);
    expect(() => readManifest(addOn({ network: ['https://api.example.com'] }))).toThrow(/"network" entry "https:\/\/api.example.com": a host name, not a URL/);
    expect(() => readManifest(addOn({ network: ['api.example.com', 'API.example.com'] }))).toThrow(/lists "API.example.com" twice/);
  });

  it('checks a top-level network in the add_ons shape', () => {
    const shape = (network: unknown): string => {
      const dir = addOn({});
      const entry = { id: 'com.example.a', name: 'A', html: 'index.html', width: 400, height: 300, categories: ['Utility'] };
      writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ network, add_ons: [entry] }));
      return dir;
    };
    expect(readManifest(shape(['api.example.com'])).manifest.network).toEqual(['api.example.com']);
    expect(() => readManifest(shape(['*.co.uk']))).toThrow(/top level: "network" entry "\*.co.uk": a wildcard cannot cover a whole domain suffix/);
  });

  it('requires a hosted url to be https unless it is on this computer', () => {
    const hosted = (url: string): string => addOn({ url }, ['html']);
    expect(() => readManifest(hosted('https://app.example.com/'))).not.toThrow();
    expect(() => readManifest(hosted('http://localhost:5173/'))).not.toThrow();
    expect(() => readManifest(hosted('http://127.0.0.1:8080/x'))).not.toThrow();
    expect(() => readManifest(hosted('http://app.example.com/'))).toThrow(/"url" must be https unless it is on this computer/);
    expect(() => readManifest(hosted('ftp://app.example.com/'))).toThrow(/"url" must be an http or https URL/);
    expect(() => readManifest(hosted('not a url'))).toThrow(/"url" must be an http or https URL/);
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

  it('accepts whole-number min/max size limits and rejects bad or crossed ones', () => {
    const entry = readManifest(addOn({ min_width: 300, min_height: 200, max_width: 900, max_height: 700 })).entries[0]!;
    expect([entry.min_width, entry.min_height, entry.max_width, entry.max_height]).toEqual([300, 200, 900, 700]);
    expect(() => readManifest(addOn({ min_width: 0 }))).toThrow(/"min_width" must be a whole number above 0/);
    expect(() => readManifest(addOn({ max_height: 10.5 }))).toThrow(/"max_height" must be a whole number above 0/);
    expect(() => readManifest(addOn({ min_height: '200' }))).toThrow(/"min_height" must be a whole number above 0/);
    expect(() => readManifest(addOn({ min_width: 900, max_width: 300 }))).toThrow(/"min_width" is above "max_width"/);
  });

  it('requires width and height only for a window, which a missing target means', () => {
    for (const target of ['app', 'page', 'browser', 'editor']) {
      expect(readManifest(addOn({ target }, ['width', 'height'])).entries[0]!.width).toBeUndefined();
    }
    expect(() => readManifest(addOn({ target: 'window' }, ['width']))).toThrow(/"width" must be a number/);
    expect(() => readManifest(addOn({}, ['height']))).toThrow(/"height" must be a number/);
  });

  it('accepts targets of window, browser and editor, and rejects anything else in it', () => {
    expect(readManifest(addOn({ targets: ['browser', 'window'] })).entries[0]!.targets).toEqual(['browser', 'window']);
    expect(readManifest(addOn({ target: 'editor', targets: ['window', 'editor'] })).entries[0]!.targets).toEqual(['window', 'editor']);
    expect(() => readManifest(addOn({ targets: ['browser', 'panel'] }))).toThrow(/"targets" can only list "window", "browser", "editor", not "panel"/);
    expect(() => readManifest(addOn({ targets: ['app', 'window'] }))).toThrow(/"targets" can only list .* not "app"/);
    expect(() => readManifest(addOn({ targets: [] }))).toThrow(/"targets" must be a non-empty array/);
    expect(() => readManifest(addOn({ targets: 'window' }))).toThrow(/"targets" must be a non-empty array/);
  });

  it('warns about a repeated target, a target targets does not list, and targets on an app', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readManifest(addOn({ targets: ['window', 'window'] }));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/lists a target twice/));
    readManifest(addOn({ target: 'editor', targets: ['browser', 'window'] }));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/"target" "editor" is not in "targets"; LUNA opens it as "browser"/));
    readManifest(addOn({ target: 'app', targets: ['browser', 'window'] }));
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/an "app" Add On is app only; LUNA ignores "targets"/));
  });

  it('requires width and height when targets lists window, and not otherwise', () => {
    expect(() => readManifest(addOn({ target: 'browser', targets: ['browser', 'window'] }, ['width']))).toThrow(/"width" must be a number/);
    expect(readManifest(addOn({ targets: ['browser', 'editor'] }, ['width', 'height'])).entries[0]!.width).toBeUndefined();
  });

  it('orders the hosts as LUNA does: target first when listed, else the list as written', () => {
    expect(entryTargets({})).toEqual(['window']);
    expect(entryTargets({ target: 'page' })).toEqual(['app']);
    expect(entryTargets({ targets: ['browser', 'window'] })).toEqual(['browser', 'window']);
    expect(entryTargets({ target: 'window', targets: ['browser', 'editor', 'window'] })).toEqual(['window', 'browser', 'editor']);
    expect(entryTargets({ target: 'editor', targets: ['browser', 'window'] })).toEqual(['browser', 'window']);
    expect(entryTargets({ target: 'app', targets: ['browser', 'window'] })).toEqual(['app']);
    expect(entryTargets({ target: 'browser', targets: ['app', 'panel', 'window', 'window'] })).toEqual(['window']);
    expect(entryTargets({ target: 'browser', targets: ['panel'] })).toEqual(['browser']);
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
