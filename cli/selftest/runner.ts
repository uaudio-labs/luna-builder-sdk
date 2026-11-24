/**
 * @hidden The self-test runner: plain async checks against a running LUNA, with no test
 * framework, so the shipped `ua-builder selftest` command can run them. `tests/live/selftest.test.ts`
 * runs the same checks under vitest.
 *
 * Every check runs in a session the runner makes for itself, so a tester's own sessions are
 * never touched. A check that needs something the machine doesn't have (an audio interface with
 * inputs, a feature key, a plug-in) skips with the reason instead of failing.
 */
import type { Client } from '../../src/client/client';
import type { Session } from '../../src/model/session';

/** Thrown by {@link CheckContext.skip}: the check did not run, for this reason. */
export class Skip extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'Skip';
  }
}

/** What a check gets to work with. */
export interface CheckContext {
  luna: Client;
  /** The runner's own session; checks add to it and may leave things behind in it. */
  session: Session;
  /** Stop here and report the check as skipped. */
  skip(reason: string): never;
  /** Fail unless `ok`. */
  assert(ok: unknown, message: string): void;
  /** Fail unless `actual` deep-equals `expected`. */
  equal(actual: unknown, expected: unknown, message: string): void;
  /** Note a detail for the report (shown with the result). */
  note(message: string): void;
  /** Run after the check, pass or fail, in reverse order. */
  cleanup(fn: () => unknown): void;
}

export interface Check {
  /** Stable id, e.g. `session.lyrics.edit`. */
  id: string;
  /** The area it belongs to; one JUnit suite per area. */
  area: string;
  title: string;
  /** The `docs/EVIDENCE.md` facts it verifies. */
  facts: number[];
  /** Time allowed, default 30 s. */
  timeoutMs?: number;
  run(ctx: CheckContext): Promise<void>;
}

export type Status = 'pass' | 'fail' | 'skip';

export interface CheckResult {
  check: Check;
  status: Status;
  ms: number;
  /** The failure or skip reason. */
  message?: string;
  notes: string[];
}

export interface RunOptions {
  luna: Client;
  checks: readonly Check[];
  /** Run only the checks whose id starts with one of these. */
  only?: readonly string[];
  /** Called as each check finishes. */
  onResult?: (result: CheckResult) => void;
  /** Name for the runner's session. */
  sessionName?: string;
}

export interface RunReport {
  results: CheckResult[];
  luna: { name: string | undefined; version: string | undefined };
  started: Date;
  ms: number;
  sessionName: string;
}

export function selectChecks(checks: readonly Check[], only?: readonly string[]): Check[] {
  if (!only || only.length === 0) return [...checks];
  return checks.filter((c) => only.some((p) => c.id === p || c.id.startsWith(`${p}.`) || c.area === p));
}

/** Run `check` against `session` and report how it went. */
export async function runCheck(check: Check, luna: Client, session: Session): Promise<CheckResult> {
  const notes: string[] = [];
  const cleanups: (() => unknown)[] = [];
  const ctx: CheckContext = {
    luna,
    session,
    skip(reason) {
      throw new Skip(reason);
    },
    assert(ok, message) {
      if (!ok) throw new Error(message);
    },
    equal(actual, expected, message) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) throw new Error(`${message}: expected ${e}, got ${a}`);
    },
    note(message) {
      notes.push(message);
    },
    cleanup(fn) {
      cleanups.push(fn);
    },
  };
  const t0 = Date.now();
  let status: Status = 'pass';
  let message: string | undefined;
  const timeoutMs = check.timeoutMs ?? 30_000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      check.run(ctx),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
      }),
    ]);
  } catch (err) {
    if (err instanceof Skip) {
      status = 'skip';
      message = err.message;
    } else {
      status = 'fail';
      const e = err as { code?: string; message?: string };
      message = e.code && !String(e.message).includes(e.code) ? `${e.code}: ${e.message}` : String(e?.message ?? err);
    }
  } finally {
    clearTimeout(timer);
  }
  for (const fn of cleanups.reverse()) {
    try {
      await fn();
    } catch (err) {
      notes.push(`cleanup failed: ${(err as Error)?.message ?? err}`);
    }
  }
  return { check, status, ms: Date.now() - t0, ...(message !== undefined ? { message } : {}), notes };
}

/**
 * Make the runner's session, run the checks in it, and close it. Refuses to start when a
 * session is already open, so a tester's unsaved work is never put at risk.
 */
export async function runSelfTest(options: RunOptions): Promise<RunReport> {
  const { luna } = options;
  const started = new Date();
  await luna.sessions.ready();
  if (luna.sessions.items.items.length > 0) {
    const names = (await Promise.all(luna.sessions.items.items.map(async (s) => {
      const read = (await luna.raw.get(`${s.path}/name`).catch(() => undefined)) as { value?: unknown } | undefined;
      return typeof read?.value === 'string' ? `"${read.value}"` : s.uid;
    }))).join(', ');
    throw new Error(`a session is open in LUNA (${names}); close it first, since the self-test makes its own`);
  }
  const status = (await luna.raw.get('/status', { properties: true }).catch(() => undefined)) as { properties?: Record<string, { value?: unknown }> } | undefined;
  const info = { name: status?.properties?.['name']?.value as string | undefined, version: status?.properties?.['version']?.value as string | undefined };
  const sessionName = options.sessionName ?? `SDK self-test ${started.toISOString().slice(0, 19).replace(/[T:]/g, '-')}`;
  const session = await luna.sessions.create({ name: sessionName, timeoutMs: 60_000 });
  await session.ready();
  const results: CheckResult[] = [];
  try {
    for (const check of selectChecks(options.checks, options.only)) {
      const result = await runCheck(check, luna, session);
      results.push(result);
      options.onResult?.(result);
    }
  } finally {
    await session.close().catch(() => undefined);
  }
  return { results, luna: info, started, ms: Date.now() - started.getTime(), sessionName };
}

/** One line per result, for a terminal. */
export function formatResult(r: CheckResult): string {
  const mark = r.status === 'pass' ? 'PASS' : r.status === 'fail' ? 'FAIL' : 'SKIP';
  const facts = r.check.facts.length ? ` [fact ${r.check.facts.join(', ')}]` : '';
  const why = r.message ? `\n       ${r.status === 'skip' ? 'skipped: ' : ''}${r.message}` : '';
  const notes = r.notes.map((n) => `\n       note: ${n}`).join('');
  return `${mark}  ${r.check.id}  ${r.check.title}${facts}  (${r.ms} ms)${why}${notes}`;
}

export function summarize(report: RunReport): { pass: number; fail: number; skip: number } {
  const count = (s: Status) => report.results.filter((r) => r.status === s).length;
  return { pass: count('pass'), fail: count('fail'), skip: count('skip') };
}

const xml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The report as JUnit XML: one `<testsuite>` per area, with LUNA's name and version as properties. */
export function toJUnit(report: RunReport): string {
  const areas = new Map<string, CheckResult[]>();
  for (const r of report.results) areas.set(r.check.area, [...(areas.get(r.check.area) ?? []), r]);
  const totals = summarize(report);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="LUNA Builder SDK self-test" tests="${report.results.length}" failures="${totals.fail}" skipped="${totals.skip}" time="${(report.ms / 1000).toFixed(3)}" timestamp="${report.started.toISOString()}">`,
  ];
  for (const [area, results] of areas) {
    const fail = results.filter((r) => r.status === 'fail').length;
    const skip = results.filter((r) => r.status === 'skip').length;
    const time = results.reduce((t, r) => t + r.ms, 0) / 1000;
    lines.push(`  <testsuite name="${xml(area)}" tests="${results.length}" failures="${fail}" skipped="${skip}" time="${time.toFixed(3)}">`);
    lines.push('    <properties>');
    lines.push(`      <property name="luna.name" value="${xml(report.luna.name ?? '')}"/>`);
    lines.push(`      <property name="luna.version" value="${xml(report.luna.version ?? '')}"/>`);
    lines.push(`      <property name="session" value="${xml(report.sessionName)}"/>`);
    lines.push('    </properties>');
    for (const r of results) {
      const name = `${r.check.id}: ${r.check.title}`;
      lines.push(`    <testcase classname="${xml(area)}" name="${xml(name)}" time="${(r.ms / 1000).toFixed(3)}">`);
      if (r.status === 'fail') lines.push(`      <failure message="${xml(r.message ?? 'failed')}"/>`);
      if (r.status === 'skip') lines.push(`      <skipped message="${xml(r.message ?? 'skipped')}"/>`);
      const out = [r.check.facts.length ? `facts: ${r.check.facts.join(', ')}` : '', ...r.notes].filter(Boolean).join('\n');
      if (out) lines.push(`      <system-out>${xml(out)}</system-out>`);
      lines.push('    </testcase>');
    }
    lines.push('  </testsuite>');
  }
  lines.push('</testsuites>');
  return lines.join('\n') + '\n';
}
