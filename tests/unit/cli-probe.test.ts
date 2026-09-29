/** `ua-builder probe`: argument handling and the default expressions. Driving Chrome is not
 * unit-testable; the CDP plumbing mirrors tests/engine/run.mjs, which the engine lane runs. */
import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPR, DEFAULT_WAIT, LOADED_GATE, probe } from '../../cli/probe';
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
});
