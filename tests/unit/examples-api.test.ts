/**
 * Every `Luna.<Name>` an example reaches for must exist in the namespace it ships beside.
 *
 * The example pages cannot be executed here (no DOM implementation in the dev
 * dependencies), so this is the guard that catches the porting mistake that actually
 * happens: a member named the way a sibling SDK named it. `addon-example.test.ts` runs the
 * one page whose DOM needs are small enough to shim.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const EXAMPLES = fileURLToPath(new URL('../../examples/', import.meta.url));

function exampleFiles(dir = EXAMPLES): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...exampleFiles(path));
    else if (/\.(html|mjs|js)$/.test(name)) out.push(path);
  }
  return out;
}

const files = exampleFiles();

describe('examples', () => {
  it('ships some', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [f.slice(EXAMPLES.length), f] as const))('%s uses only real Luna members', (_name, path) => {
    const text = readFileSync(path, 'utf8');
    const used = new Set<string>();
    // `Luna.Foo` in code, but not inside a comment line that merely mentions it.
    for (const match of text.matchAll(/\bUA\.([A-Za-z_$][A-Za-z0-9_$]*)/g)) if (match[1]) used.add(match[1]);
    const missing = [...used].filter((m) => !(m in (Luna as unknown as Record<string, unknown>)));
    expect(missing, `${path.slice(EXAMPLES.length)} references Luna members that do not exist`).toEqual([]);
  });

  // An Add On page has the keyboard focus while it is in front, so a page that connects
  // must hand the keys it does not use back to LUNA's standard shortcuts (facts 79, 81).
  // tracks.html is a raw-wire check that closes at once, not an Add On.
  const pages = files.filter((f) => f.endsWith('.html') && /Luna\.connect\(/.test(readFileSync(f, 'utf8')) && !/[\\/]tracks\.html$/.test(f));
  it.each(pages.map((f) => [f.slice(EXAMPLES.length), f] as const))('%s binds the standard shortcuts', (_name, path) => {
    expect(readFileSync(path, 'utf8')).toMatch(/Luna\.bindShortcuts\(luna\b/);
  });

  // `node --check` parses a module without running it: catches a syntax slip in a script
  // that otherwise only a live LUNA would exercise.
  const scripts = files.filter((f) => f.endsWith('.mjs'));
  if (scripts.length) {
    it.each(scripts.map((f) => [f.slice(EXAMPLES.length), f] as const))('%s parses', (_name, path) => {
      const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      expect(result.stderr.trim(), `${path.slice(EXAMPLES.length)} does not parse`).toBe('');
      expect(result.status).toBe(0);
    });
  }

  it.each(files.map((f) => [f.slice(EXAMPLES.length), f] as const))('%s does not reach for the other SDK', (_name, path) => {
    const text = readFileSync(path, 'utf8');
    // Names a port can leave behind: the other SDK's, and examples that no longer exist.
    for (const stale of ['UaClientSdk', 'ua-client-sdk', 'WsPort', 'propValue(', 'childNames(', 'LunaNotRunning', '.isSystem', 'onDispose(', 'onSessionChange(', 'luna-probe', '/probe']) {
      expect(text, `${path.slice(EXAMPLES.length)} still uses "${stale}"`).not.toContain(stale);
    }
  });
});
