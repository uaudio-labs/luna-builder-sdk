/**
 * Live lane for `luna.gui.setPage()` (facts 236, 243): pages, routes, and the checks LUNA makes
 * on a route before switching.
 *
 * Needs LUNA on 4718 with its main window showing. It switches the main window between pages
 * and puts it back on the page it started on. `catalog` and `universe` need their feature keys
 * (`next_gen_free_with_luna`, `add_ons_showcase`); without them LUNA answers
 * `uasrv.not_implemented` and those checks are skipped.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: gui pages and routes', () => {
  let luna: Luna.Client;
  let startPage: string | undefined;

  /** Switch, or answer false when this LUNA has no such page here. */
  async function tryPage(page: Luna.SettablePage, options: Luna.SetPageOptions = {}): Promise<boolean> {
    try {
      await luna.gui.setPage(page, options);
      return true;
    } catch (err) {
      if ((err as { code?: string }).code === 'uasrv.not_implemented') return false;
      throw err;
    }
  }

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    await luna.gui.windows.load();
    startPage = luna.gui.main.page.value;
  });

  afterAll(async () => {
    const back = startPage === 'lunaplay' || startPage === undefined ? 'timeline' : (startPage as Luna.SettablePage);
    await luna.gui.setPage(back).catch(() => undefined);
    luna.close();
  });

  it('switches between the plain pages', async () => {
    await luna.gui.setPage('mixer');
    expect(luna.gui.main.page.value).toBe('mixer');
    await luna.gui.setPage('timeline', { contextType: 'main' });
    expect(luna.gui.main.page.value).toBe('timeline');
  });

  it('refuses a route for a page that takes none, and an empty route, without switching (fact 243)', async () => {
    await luna.gui.setPage('timeline');
    await expect(luna.gui.setPage('mixer', { route: 'x' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.setPage('dashboard', { route: '' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.setPage('universe', { route: 'a b' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    expect(luna.gui.main.page.value).toBe('timeline');
  });

  it('opens the catalog and universe at a route where LUNA has them (fact 243)', async () => {
    if (await tryPage('catalog', { route: 'filter:free' })) expect(luna.gui.main.page.value).toBe('catalog');
    if (await tryPage('universe', { route: 'index/showcase?kind=addon' })) expect(luna.gui.main.page.value).toBe('universe');
  });
});
