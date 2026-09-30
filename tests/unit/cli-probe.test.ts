/** `ua-builder probe`: argument handling and the default expressions. Driving Chrome is not
 * unit-testable; the CDP plumbing mirrors tests/engine/run.mjs, which the engine lane runs. */
import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPR, DEFAULT_WAIT, LOADED_GATE, PAINTED, mockUrl, probe } from '../../cli/probe';
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
});
