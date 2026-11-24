/**
 * Live lane for fact 237: `sessions.create({ sessionPackageUid })` makes a package under that
 * uid, listed in `workspace.query()`, which `sessions.open()` reopens under its name; LUNA
 * ignores `session_package_uid` in a sessions query.
 *
 * Needs LUNA on 4718 and `UA_LIVE_OWN_SESSION=1` as well as `UA_LIVE=1`: it closes the open
 * session (LUNA is single-session) and leaves a new session package on disk, which the wire
 * cannot delete. The package is named "SDK own session check", in the standalone sessions
 * folder "com.uaudio.sdk-check"; delete it from LUNA's sessions by hand. Set
 * `UA_LIVE_OWN_SESSION_UID` to reuse a package uid across runs (default: a new one each run).
 * The folder is LUNA's standalone sessions folder, `~/Music/UAD Standalone/<standalone id>` on macOS.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1' && process.env['UA_LIVE_OWN_SESSION'] === '1';
const NAME = 'SDK own session check';

describe.skipIf(!live)('live: an Add On\'s own session (fact 237)', () => {
  let luna: Luna.Client | undefined;
  let open: Luna.Session | undefined;

  afterAll(async () => {
    if (open) await open.close().catch(() => undefined);
    await luna?.close();
  });

  it('creates under a fixed package uid, finds the row and reopens it by name', async () => {
    luna = await Luna.connect({ requestTimeoutMs: 20000 });
    const uid = (process.env['UA_LIVE_OWN_SESSION_UID'] ?? crypto.randomUUID()).replaceAll('-', '');
    const find = async () => (await luna!.workspace.query()).find((r) => r.uid === uid);

    const before = await find();
    open = before?.online
      ? await luna.sessions.open(uid, 60_000)
      : await luna.sessions.create({ name: NAME, sessionPackageUid: uid, sessionType: 'standalone', standaloneId: 'com.uaudio.sdk-check', timeoutMs: 60_000 });
    await open.ready();
    expect(open.sessionPackageUid.value).toBe(uid);

    const row = await find();
    expect(row, 'the new package is not in workspace.query()').toBeDefined();
    // A standalone package's row reports session_type 0 (default), not 7.
    expect(row).toMatchObject({ online: true, name: NAME, ...(before ? {} : { sessionType: 0 }) });

    // The sessions table answers every package whatever session_package_uid says.
    const all = await luna.workspace.query();
    const filtered = await luna.workspace.query({ sessionPackageUid: uid });
    expect(filtered.length).toBe(all.length);

    await luna.sessions.close(open.id);
    open = await luna.sessions.open(uid, 60_000);
    await open.ready();
    expect(open.name.value).toBe(NAME);
    expect(open.sessionPackageUid.value).toBe(uid);
  });
});
