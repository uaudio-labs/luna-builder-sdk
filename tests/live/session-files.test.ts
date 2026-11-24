/**
 * Live lane for a session's files and the recent list (facts 238, 239, 240, 242).
 *
 * Needs LUNA on 4718 with a session open. Reads only: nothing in the session or on disk is
 * changed (`unusedMedia` is LUNA's pre-flight).
 */
import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: session files', () => {
  let luna: Luna.Client;
  let session: Luna.Session;

  beforeAll(async () => {
    luna = await Luna.connect();
    session = await luna.session({ timeoutMs: 15_000 });
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('finds every source file on disk where filePath() says (fact 239)', async () => {
    const sources = await session.loadSources();
    const report = [];
    for (const source of sources.items) {
      const path = await source.filePath();
      report.push({ uid: source.id, origin: source.origin.value, format: source.format.value, render: source.isRender, named: source.hasName, path, exists: path ? existsSync(path) : false });
      expect(path).toBe(session.sourcePath(source));
    }
    console.table(report);
    // A rendering LUNA has named but not written yet may be missing; every other file is there.
    for (const row of report) if (!row.render) expect(row.exists, row.path).toBe(true);
  });

  it('answers the session package and its unused-media pre-flight (fact 240)', async () => {
    const pkg = await session.package();
    expect(pkg.uid.value?.replaceAll('-', '')).toBe(session.sessionPackageUid.value?.replaceAll('-', ''));
    const plan = await luna.workspace.unusedMedia(pkg.uid.value!);
    console.log('unused media', plan);
    expect(plan.totalFiles).toBeGreaterThanOrEqual(plan.unusedCount);
  });

  it('lists the open session in the recent list, marked open (fact 242)', async () => {
    const recent = await luna.workspace.recentList(10);
    const row = recent.byId(session.sessionPackageUid.value!);
    expect(row?.openSessionUid).toBe(session.uid);
    expect(luna.sessions.byPackageUid(session.sessionPackageUid.value!)?.uid).toBe(session.uid);
    recent.dispose();
  });
});
