/**
 * Live lane for HBH-36711: the self-test's checks (cli/selftest/checks), one vitest test each,
 * against LUNA on 4718. The same checks QA runs with `ua-builder selftest`.
 *
 * Needs LUNA running with NO session open: the checks run in a session made here, which is
 * closed afterwards (its package stays on disk, named "SDK self-test (vitest) ..."). Set
 * UA_SELFTEST_ONLY=tracks,session.lyrics to run some of them.
 */
import { afterAll, beforeAll, describe, it } from 'vitest';
import { Luna } from '../../src/index';
import { CHECKS } from '../../cli/selftest/checks';
import { runCheck, selectChecks } from '../../cli/selftest/runner';

const live = process.env['UA_LIVE'] === '1';
const only = process.env['UA_SELFTEST_ONLY']?.split(',').map((s) => s.trim()).filter(Boolean);

describe.skipIf(!live)('live: SDK self-test (HBH-36711)', () => {
  let luna: Luna.Client;
  let session: Luna.Session | undefined;
  let refusal: string | undefined;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 20_000 });
    await luna.sessions.ready();
    if (luna.sessions.items.items.length > 0) {
      refusal = 'a session is open in LUNA; close it first, since the self-test makes its own';
      return;
    }
    session = await luna.sessions.create({ name: `SDK self-test (vitest) ${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`, timeoutMs: 60_000 });
    await session.ready();
  }, 90_000);

  afterAll(async () => {
    await session?.close().catch(() => undefined);
    await luna?.close();
  });

  for (const check of selectChecks(CHECKS, only)) {
    it(`${check.id}: ${check.title}`, async (t) => {
      if (refusal || !session) return t.skip(refusal ?? 'no session');
      const result = await runCheck(check, luna, session);
      for (const note of result.notes) console.log(`  ${check.id}: ${note}`);
      if (result.status === 'skip') return t.skip(result.message);
      if (result.status === 'fail') throw new Error(result.message);
    }, (check.timeoutMs ?? 30_000) + 10_000);
  }
});
