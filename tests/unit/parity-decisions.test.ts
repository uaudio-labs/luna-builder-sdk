// The HBH-36711 design follow-ups: post-record commands and the detected instrument (fact 233),
// command enabled state (234), LUNA's error notices (235), setPage() (236).
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { name: 'Demo', tracks: ['Vocal'] });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  return { engine, luna, session, vocal: session.tracks.items[0]! };
}

describe('track.postRecordCommands and instrumentDetermined (fact 233)', () => {
  it('sets what LUNA runs on each take, and reads the detected instrument', async () => {
    const { engine, vocal } = await connected();
    expect(vocal.postRecordCommands.value).toEqual([]);
    await vocal.postRecordCommands.set(['extract_lyrics', 'extract_chords']);
    expect(engine.value(vocal.path, 'post_record_commands')).toEqual(['extract_lyrics', 'extract_chords']);
    expect(Luna.POST_RECORD_COMMANDS).toEqual(['extract_lyrics', 'extract_chords']);
    expect(vocal.instrumentDetermined.value).toBeNull();
    engine.setValue(vocal.path, 'instrument_determined', 'Female Vocal');
    await engine.settled();
    expect(vocal.instrumentDetermined.value).toBe('Female Vocal');
  });
});

describe('node.commandEnabled() (fact 234)', () => {
  it("follows a command's enabled state, under the node and under a context's commands", async () => {
    const { engine, session, luna } = await connected();
    engine.setCommandEnabled(`${session.path}/contexts/main/commands`, 'paste', false);
    engine.setCommandEnabled(session.path, 'redo', false);
    const paste = session.context.commandEnabled('paste');
    const redo = session.commandEnabled('redo');
    await luna.settled();
    await engine.settled();
    await luna.settled();
    expect(paste.value).toBe(false);
    expect(redo.value).toBe(false);
    let changes = 0;
    paste.onChange(() => changes++);
    engine.setCommandEnabled(`${session.path}/contexts/main/commands`, 'paste', true);
    await engine.settled();
    await luna.settled();
    expect(paste.value).toBe(true);
    expect(changes).toBeGreaterThan(0);
    // The same Prop each time; a command that publishes nothing reads undefined.
    expect(session.context.commandEnabled('paste')).toBe(paste);
    expect(session.commandEnabled('consolidate').value).toBeUndefined();
  });
});

describe('luna.errors (fact 235)', () => {
  it("lists LUNA's error notices, newest first, with groups parsed", async () => {
    const { engine, luna } = await connected();
    engine.addErrorNotice({ code: 'uasrv.launch_failed', title: 'OPEN IN LUNA', payload: 'Failed to launch application.', groups: ['launch'], timestamp: 100 });
    engine.addErrorNotice({ level: 'warning', code: 'device.disconnected', title: 'Interface', timestamp: 200 });
    const w = luna.errors.watch();
    await w.ready;
    await luna.errors.membersReady();
    const [newest, older] = luna.errors.sorted;
    expect(newest?.code.value).toBe('device.disconnected');
    expect(newest?.level.value).toBe('warning');
    expect(older?.title.value).toBe('OPEN IN LUNA');
    expect(older?.payload.value).toBe('Failed to launch application.');
    expect(older?.groups.value).toEqual(['launch']);
    w.release();
  });
});

describe('gui.setPage() (fact 236)', () => {
  it("resolves once the window's page shows the new page, and refuses LUNA Play", async () => {
    const { luna } = await connected();
    await luna.gui.setPage('mixer');
    expect(luna.gui.main.page.value).toBe('mixer');
    await expect(luna.gui.setPage('lunaplay' as Luna.SettablePage)).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
  });

  it('switches to the catalog and universe, and hands a route to the pages that take one (fact 243)', async () => {
    const { luna, engine } = await connected();
    await luna.gui.setPage('catalog', { route: 'filter:free' });
    expect(luna.gui.main.page.value).toBe('catalog');
    await luna.gui.setPage('universe', { route: 'index/showcase?kind=addon' });
    expect(luna.gui.main.page.value).toBe('universe');
    expect(engine.pageRoutes).toEqual([
      { page: 'catalog', route: 'filter:free', contextType: 'main' },
      { page: 'universe', route: 'index/showcase?kind=addon', contextType: 'main' },
    ]);
    const sent = engine.requests.filter((r) => r.path === '/gui/set_page').map((r) => r.data);
    expect(sent[0]).toEqual({ page: 'catalog', context_type: 'main', route: 'filter:free' });
  });

  it('refuses a route for a page that takes none, an empty one, or a universe route that is not a path, before switching', async () => {
    const { luna, engine } = await connected();
    await luna.gui.setPage('timeline');
    await expect(luna.gui.setPage('mixer', { route: 'x' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.setPage('dashboard', { route: '' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.setPage('universe', { route: 'a b' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    await expect(luna.gui.setPage('universe', { route: 'a#b' })).rejects.toMatchObject({ code: 'uasrv.invalid_value' });
    expect(luna.gui.main.page.value).toBe('timeline');
    expect(engine.pageRoutes).toEqual([]);
  });

  it('still takes the context type as a string, and sends no route when none is given', async () => {
    const { luna, engine } = await connected();
    await luna.gui.setPage('home', 'main');
    await luna.gui.setPage('mixer', { contextType: 'main' });
    const sent = engine.requests.filter((r) => r.path === '/gui/set_page').map((r) => r.data);
    expect(sent).toEqual([{ page: 'home', context_type: 'main' }, { page: 'mixer', context_type: 'main' }]);
  });
});
