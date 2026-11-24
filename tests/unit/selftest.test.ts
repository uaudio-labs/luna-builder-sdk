// The self-test runner and its checks, against Luna.MockEngine: every check must pass or skip
// with a reason on the mock, so a failure against LUNA points at LUNA (or the mock's model of
// it), not at a broken check.
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';
import { CHECKS } from '../../cli/selftest/checks';
import { runCheck, runSelfTest, selectChecks, summarize, toJUnit, type Check } from '../../cli/selftest/runner';

async function mockLuna(setup?: (engine: InstanceType<typeof Luna.MockEngine>) => void) {
  const engine = new Luna.MockEngine();
  engine.addDevice?.('dev1', { name: 'Mock Interface', inputs: ['Mic 1', 'Mic 2'] } as never);
  engine.addPlugin('com.appl.au.aufx_dely', { name: 'AUDelay', manufacturer: 'Apple', categories: ['Delay'] });
  setup?.(engine);
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  return { engine, luna };
}

describe('selftest runner', () => {
  it('refuses to start while a session is open', async () => {
    const { luna } = await mockLuna((e) => e.addSession('open', { name: 'My Song' }));
    await expect(runSelfTest({ luna, checks: [] })).rejects.toThrow(/"My Song"|session is open/);
  });

  it('reports pass, fail and skip, and writes JUnit with one suite per area', async () => {
    const { engine, luna } = await mockLuna();
    const checks: Check[] = [
      { id: 'a.ok', area: 'a', title: 'passes', facts: [1], run: async () => undefined },
      { id: 'a.bad', area: 'a', title: 'fails', facts: [], run: async ({ equal }) => equal(1, 2, 'one is two') },
      { id: 'b.skip', area: 'b', title: 'skips', facts: [], run: async ({ skip }) => skip('no hardware') },
    ];
    const report = await runSelfTest({ luna, checks, sessionName: 'unit' });
    expect(summarize(report)).toEqual({ pass: 1, fail: 1, skip: 1 });
    expect(report.results[1]?.message).toBe('one is two: expected 2, got 1');
    const xml = toJUnit(report);
    expect(xml).toContain('<testsuite name="a" tests="2" failures="1" skipped="0"');
    expect(xml).toContain('<testsuite name="b" tests="1" failures="0" skipped="1"');
    expect(xml).toContain('<skipped message="no hardware"/>');
    await engine.settled();
    await luna.settled();
    expect(luna.sessions.items.items).toHaveLength(0);
  });

  it('runs cleanups after a failure, and times a check out', async () => {
    const { luna } = await mockLuna();
    const session = await luna.sessions.create({ name: 'unit' });
    let cleaned = false;
    const r = await runCheck({ id: 'x', area: 'x', title: 'x', facts: [], timeoutMs: 50, run: async ({ cleanup }) => { cleanup(() => (cleaned = true)); await new Promise(() => undefined); } }, luna, session);
    expect(r.status).toBe('fail');
    expect(r.message).toContain('timed out');
    expect(cleaned).toBe(true);
  });

  it('selects checks by area or id prefix', () => {
    expect(selectChecks(CHECKS, ['tracks']).every((c) => c.area === 'tracks')).toBe(true);
    expect(selectChecks(CHECKS, ['session.lyrics']).map((c) => c.id)).toEqual(['session.lyrics.edit']);
  });
});

/** Checks the mock cannot run, and why: they still run against LUNA. */
const MOCK_GAPS: Record<string, string> = {
  'analysis.source': 'the mock gives an uploaded file no overview analysis',
};

describe('selftest checks on the mock', () => {
  it('every check passes or skips with a reason', async () => {
    // The mock starts a job only when one is planned (LUNA starts one per launch).
    const { luna } = await mockLuna((e) => e.planNextJob({ outcome: 'empty' }));
    const report = await runSelfTest({ luna, checks: CHECKS.filter((c) => !(c.id in MOCK_GAPS)), sessionName: 'mock self-test' });
    const failed = report.results.filter((r) => r.status === 'fail').map((r) => `${r.check.id}: ${r.message}`);
    expect(failed).toEqual([]);
    for (const r of report.results.filter((x) => x.status === 'skip')) expect(r.message).toBeTruthy();
  }, 60_000);
});
