/**
 * @hidden `ua-builder selftest`: run the SDK's checks against a running LUNA and report pass,
 * fail or skip for each, optionally as JUnit XML. Not in `usage()`: it is for QA and SDK
 * developers verifying a LUNA build, not for Add On authors.
 *
 *   ua-builder selftest                          # every check, against LUNA on localhost:4718
 *   ua-builder selftest --junit results.xml      # also write JUnit XML
 *   ua-builder selftest --only tracks,session.lyrics
 *   ua-builder selftest --list                   # the checks, without running them
 *
 * LUNA must be running with no session open: the self-test makes its own session, works only
 * in it, and closes it at the end. The session's package stays on disk (in LUNA's default
 * session folder, named "SDK self-test <date>"); delete it afterwards. Exit code: 0 when nothing
 * failed, 1 when a check failed, 2 when the run could not start.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect } from '../src/client/connect';
import { CHECKS } from './selftest/checks';
import { formatResult, runSelfTest, selectChecks, summarize, toJUnit } from './selftest/runner';
import { errorMessage, flagNumber, flagString, type Args } from './util';

export async function selftest(args: Args): Promise<number> {
  const only = flagString(args, 'only')?.split(',').map((s) => s.trim()).filter(Boolean);
  if (args.flags['list']) {
    for (const c of selectChecks(CHECKS, only)) console.log(`${c.id.padEnd(40)} ${c.title}${c.facts.length ? `  [fact ${c.facts.join(', ')}]` : ''}`);
    return 0;
  }
  const host = flagString(args, 'host') ?? 'localhost';
  const port = flagNumber(args, 'port', 4718);
  const junit = flagString(args, 'junit');
  let luna;
  try {
    luna = await connect({ host, port, requestTimeoutMs: 20_000, log: (level, message) => level === 'error' && console.error(message) });
  } catch (err) {
    console.error(`cannot reach LUNA on ${host}:${port}: ${errorMessage(err)}`);
    return 2;
  }
  try {
    console.log(`LUNA Builder SDK self-test against ${host}:${port}`);
    const report = await runSelfTest({ luna, checks: CHECKS, ...(only ? { only } : {}), onResult: (r) => console.log(formatResult(r)) });
    const t = summarize(report);
    console.log(`\n${report.luna.name ?? 'LUNA'} ${report.luna.version ?? ''}: ${t.pass} passed, ${t.fail} failed, ${t.skip} skipped in ${(report.ms / 1000).toFixed(1)} s`);
    console.log(`The self-test's session "${report.sessionName}" is closed; delete its package from LUNA's sessions when done.`);
    if (junit) {
      writeFileSync(resolve(junit), toJUnit(report));
      console.log(`JUnit XML: ${resolve(junit)}`);
    }
    return t.fail > 0 ? 1 : 0;
  } catch (err) {
    console.error(`self-test could not run: ${errorMessage(err)}`);
    return 2;
  } finally {
    await luna.close();
  }
}
