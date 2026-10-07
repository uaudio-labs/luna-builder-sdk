/** `ua-builder probe`: argument handling and the default expressions. Driving Chrome is not
 * unit-testable; the CDP plumbing mirrors tests/engine/run.mjs, which the engine lane runs. */
import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPR, DEFAULT_WAIT, FAKE_LUNA_BRIDGE, FILE_HELPERS, LOADED_GATE, PAINTED, mockUrl, probe } from '../../cli/probe';
import { Luna } from '../../src/index';
import { parseArgs } from '../../cli/util';

describe('ua-builder probe', () => {
  it('refuses to run without a url', async () => {
    expect(await probe(parseArgs([]))).toBe(2);
  });

  it('waits for a connected client with a ready session, keeps waiting through a connect retry loop, and flags a stale SDK', () => {
    expect(DEFAULT_WAIT).toContain('Luna.clients()');
    expect(DEFAULT_WAIT).toContain('if (!client) return false');
    expect(DEFAULT_WAIT).toContain('session.ready()');
    expect(DEFAULT_WAIT).toContain("'no-clients-hook'");
    expect(DEFAULT_EXPR).toBe('document.body.innerText');
  });

  it('gates every wait on the real page having loaded, not the initial blank document', () => {
    expect(LOADED_GATE).toContain("location.href !== 'about:blank'");
    expect(LOADED_GATE).toContain("document.readyState === 'complete'");
  });

  it('adds engine=mock to the url for --mock, keeping what the url already carries', () => {
    expect(mockUrl('http://localhost:8790/')).toBe('http://localhost:8790/?engine=mock');
    expect(mockUrl('http://localhost:8790/index.html?port=4718&engine=wasm')).toBe('http://localhost:8790/index.html?port=4718&engine=mock');
  });

  it('refuses a --mock setup file that does not exist, and a --screenshot with no file, before starting Chrome', async () => {
    expect(await probe(parseArgs(['http://localhost:1/', '--mock', 'no-such-fixture.js']))).toBe(2);
    expect(await probe(parseArgs(['http://localhost:1/', '--screenshot']))).toBe(2);
  });

  it('waits two animation frames before a screenshot, so a canvas has painted', () => {
    expect(PAINTED.match(/requestAnimationFrame/g)).toHaveLength(2);
  });

  it('installs file helpers that parse as a script', () => {
    expect(() => new Function(FILE_HELPERS)).not.toThrow();
    expect(FILE_HELPERS).toContain("new DragEvent(type, { dataTransfer, bubbles: true, cancelable: true })");
  });

  it('fakes LUNA’s bridge: path drops reach Luna.onPathDrop only after the page opts in', () => {
    const g = globalThis as { lunaAPI?: unknown; lunaHost?: unknown; LunaProbe?: { dropPaths(p: string[], x?: number, y?: number): boolean; acceptsPathDrops: boolean } };
    try {
      new Function(FAKE_LUNA_BRIDGE)();
      expect(Luna.canDropPaths()).toBe(true);
      expect(g.LunaProbe!.dropPaths(['/a.wav'])).toBe(false); // not opted in: LUNA leaves it to HTML
      const drops: unknown[] = [];
      const stop = Luna.onPathDrop((d) => drops.push(d));
      expect(g.LunaProbe!.acceptsPathDrops).toBe(true);
      expect(g.LunaProbe!.dropPaths(['/a.wav'], 3.6, 4.2)).toBe(true);
      expect(drops).toEqual([{ paths: ['/a.wav'], x: 4, y: 4 }]);
      stop();
      expect(g.LunaProbe!.acceptsPathDrops).toBe(false);
    } finally {
      delete g.lunaAPI;
      delete g.lunaHost;
      delete g.LunaProbe;
    }
  });
});
