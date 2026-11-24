/**
 * Live lane for fact 151: `workspace.templates()` lists only session templates whose files
 * are there, and `sessions.createFromTemplate()` makes a loaded copy as a package of its own.
 *
 * Needs LUNA on 4718 with at least one session template installed, and `UA_LIVE_TEMPLATE=1`
 * as well as `UA_LIVE=1`: the copy is a new session package on disk, which the wire cannot
 * delete. It is named "SDK template check" and closed afterwards; delete it from LUNA's
 * sessions by hand. Set `UA_LIVE_TEMPLATE_UID` to pick the template (default: the first).
 */
import { afterAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1' && process.env['UA_LIVE_TEMPLATE'] === '1';
const NAME = 'SDK template check';

describe.skipIf(!live)('live: session templates (fact 151)', () => {
  let luna: Luna.Client | undefined;
  let made: Luna.Session | undefined;

  afterAll(async () => {
    if (made) await made.close().catch(() => undefined);
    await luna?.close();
  });

  it('lists templates and creates a loaded copy that is not the template', async () => {
    luna = await Luna.connect({ requestTimeoutMs: 20000 });
    const templates = await luna.workspace.templates();
    expect(templates.length, 'no session template installed').toBeGreaterThan(0);
    for (const t of templates) expect(t).toMatchObject({ online: true, sessionType: 3 });

    const wanted = process.env['UA_LIVE_TEMPLATE_UID'];
    const template = wanted ? templates.find((t) => t.uid === wanted.replaceAll('-', '')) : templates[0];
    expect(template, `template ${wanted} not installed`).toBeDefined();

    made = await luna.sessions.createFromTemplate({ templatePackageUid: template!.uid, name: NAME, timeoutMs: 60_000 });
    expect(made.loaded.value).toBe(true);
    expect(made.name.value).toBe(NAME);
    await made.ready();
    expect(made.sessionPackageUid.value).toBeTruthy();
    expect(made.sessionPackageUid.value).not.toBe(template!.uid);
    // The template is still listed, unchanged.
    expect((await luna.workspace.templates()).some((t) => t.uid === template!.uid)).toBe(true);
  }, 90_000);
});
