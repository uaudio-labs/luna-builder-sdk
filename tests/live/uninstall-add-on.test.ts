/**
 * Live lane for `/gui/uninstall_add_on` (fact 130): the refusals `luna.gui.uninstallAddOn()`
 * gets from LUNA.
 *
 * Needs LUNA on 4718. Only requests LUNA refuses are sent, so no prompt opens and nothing is
 * removed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: uninstall Add On', () => {
  let luna: Luna.Client;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('refuses an unknown id and no id', async () => {
    await expect(luna.gui.uninstallAddOn('com.example.not-installed')).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.uninstallAddOn(undefined as unknown as string)).rejects.toMatchObject({ code: 'uasrv.missing_field' });
  });
});
