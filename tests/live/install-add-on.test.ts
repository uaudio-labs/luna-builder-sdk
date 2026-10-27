/**
 * Live lane for `/gui/install_add_on` (fact 128): the refusals `luna.gui.installAddOn()`
 * gets from LUNA.
 *
 * Needs LUNA on 4718 with its Add On marketplace (the `add_ons_marketplace` feature key).
 * Only requests LUNA refuses are sent, so nothing downloads, nothing installs, no prompt
 * opens and no saved import is removed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: install Add On', () => {
  let luna: Luna.Client;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
  });

  afterAll(async () => {
    await luna?.close();
  });

  it('refuses an unknown id, a url that is not a GitHub repo or a Drive, iCloud or Dropbox share, both, and neither', async () => {
    await expect(luna.gui.installAddOn({ id: 'com.example.not-in-the-marketplace' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.installAddOn({ url: 'https://example.com/uaudio-labs/video-window' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.installAddOn({ url: 'https://github.com/uaudio-labs' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.installAddOn({ url: 'https://drive.google.com/drive/folders/1QFSOyxrPC6thx3kYgSggBTcyHJCjIaEu' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.installAddOn({ url: 'https://www.icloud.com/photos/076FaevAR0a2KAthHx_Bfv4-A' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.installAddOn({ url: 'https://www.dropbox.com/scl/fo/5vs12quvmxdhdm65htp0q/h?rlkey=z045urvstr9rw6exdmduiq0g5' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    const both = { id: 'uaudio-labs.video-window', url: 'https://github.com/uaudio-labs/video-window' } as unknown as { id: string };
    await expect(luna.gui.installAddOn(both)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.installAddOn({} as { id: string })).rejects.toMatchObject({ code: 'uasrv.missing_field' });
  });

  it('refuses to remove an unknown id or a marketplace repo\'s package', async () => {
    await expect(luna.gui.removeImportedAddOn('com.example.not-in-the-marketplace')).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    const packages = await luna.raw.get('/gui/marketplace/packages', { children: true, flatvalue: true });
    const own = Object.values((packages as { children?: Record<string, { properties?: { id?: string; import_url?: string } }> }).children ?? {})
      .map((c) => c.properties)
      .find((p) => p?.id && !p.import_url);
    if (own?.id) await expect(luna.gui.removeImportedAddOn(own.id)).rejects.toMatchObject({ code: 'uasrv.not_permitted' });
  });
});
