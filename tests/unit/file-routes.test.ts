/**
 * The two ways a user's file reaches an Add On: the File route (`uploadFile`, works on any
 * engine) and the path route (`chooseFiles`, `onPathDrop`, `importPath`, `importFile`),
 * with and without LUNA's `/gui` (facts 42, 102, 103).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

async function connected(options: { gui?: boolean } = {}) {
  const engine = new Luna.MockEngine(options);
  engine.addSession('abc', { tracks: ['Vocal'], name: 'Demo', packageUid: 'pkg_abc' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

describe('luna.gui.available', () => {
  it('is true when the engine has /gui', async () => {
    const { luna } = await connected();
    expect(await luna.gui.available()).toBe(true);
  });

  it('is false on an engine without /gui, and asks only once', async () => {
    const { engine, luna } = await connected({ gui: false });
    expect(await luna.gui.available()).toBe(false);
    expect(await luna.gui.available()).toBe(false);
    expect(engine.requests.filter((r) => r.verb === 'get' && r.path.startsWith('/?')).length).toBe(1);
  });

  it('MockEngine.demo takes the same option', async () => {
    const luna = await Luna.connect({ port_: Luna.MockEngine.demo({ gui: false }).port() });
    expect(await luna.gui.available()).toBe(false);
  });
});

describe('the path route without /gui', () => {
  it('chooseFiles rejects with Unsupported at once instead of waiting for a dialog', async () => {
    const { engine, luna } = await connected({ gui: false });
    const error = await luna.gui.chooseFiles({ timeoutMs: 60_000 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Luna.Unsupported);
    expect((error as Luna.Error).code).toBe('unsupported');
    expect(engine.requests.some((r) => r.verb === 'post')).toBe(false);
  });

  it('every gui command refuses the same way', async () => {
    const { luna } = await connected({ gui: false });
    await expect(luna.gui.setPage('mixer')).rejects.toBeInstanceOf(Luna.Unsupported);
    await expect(luna.gui.startTask('Render')).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('importFile rejects with Unsupported, since LUNA imports through its UI', async () => {
    const { session } = await connected({ gui: false });
    await expect(session.importFile('/Users/me/take.wav')).rejects.toBeInstanceOf(Luna.Unsupported);
  });

  it('importPath still works: the engine copies the file, no /gui needed', async () => {
    const { engine, session } = await connected({ gui: false });
    const source = await session.importPath('/Users/me/Loops/take.wav');
    expect(source.name.value).toBe('take.wav');
    expect(session.sources?.byId(source.id)).toBe(source);
    const post = engine.requests.find((r) => r.path === '/workspace/import_file');
    expect(post?.data).toMatchObject({ phase: 'local_copy', path: '/Users/me/Loops/take.wav', session_package_uid: 'pkg_abc', type: 'audio' });
  });
});

describe('the path route with /gui', () => {
  it('chooseFiles resolves to paths, which importPath turns into sources', async () => {
    const { engine, luna, session } = await connected();
    engine.nextDialogFiles = ['C:\\Samples\\kick.wav'];
    const [path] = await luna.gui.chooseFiles({ filters: ['*.wav'] });
    expect(path).toBe('C:\\Samples\\kick.wav');
    const source = await session.importPath(path!, { name: 'Kick' });
    expect(source.name.value).toBe('Kick');
  });

  it('importFile posts LUNA’s import_files', async () => {
    const { engine, session, luna } = await connected();
    await session.importFile('/Users/me/take.wav', session.tracks.items[0]!.id);
    expect(engine.requests.some((r) => r.path.endsWith('/import_files'))).toBe(true);
    expect(await luna.gui.available()).toBe(true);
  });

  it('importPath refuses a path with no file name', async () => {
    const { session } = await connected();
    await expect(session.importPath('/Users/me/')).rejects.toMatchObject({ code: 'out_of_range' });
  });
});

describe('the File route', () => {
  it('uploadFile works on an engine without /gui', async () => {
    const { session } = await connected({ gui: false });
    const source = await session.uploadFile({ bytes: new Uint8Array(100).fill(1), name: 'take.wav' });
    expect(source.name.value).toBe('take.wav');
  });
});

describe('Luna.onPathDrop', () => {
  const g = globalThis as { lunaAPI?: { setAcceptsFileDrops?: (b: boolean) => void }; lunaHost?: Record<string, unknown> };

  function fakeLuna() {
    const accepts: boolean[] = [];
    g.lunaAPI = { setAcceptsFileDrops: (b) => accepts.push(b) };
    return {
      accepts,
      // How LUNA calls the page: feature-detected methods on window.lunaHost (fact 102).
      call: (method: string, arg?: unknown) => {
        const fn = g.lunaHost?.[method];
        if (typeof fn === 'function') (fn as (a?: unknown) => void)(arg);
      },
    };
  }

  afterEach(() => {
    delete g.lunaAPI;
    delete g.lunaHost;
  });

  it('is unavailable outside LUNA, and says to use an HTML drop', () => {
    expect(Luna.canDropPaths()).toBe(false);
    expect(() => Luna.onPathDrop(() => undefined)).toThrow(Luna.Unsupported);
  });

  it('publishes window.lunaHost, opts in, and delivers drags and drops as paths', () => {
    const luna = fakeLuna();
    expect(Luna.canDropPaths()).toBe(true);
    const seen: string[] = [];
    const stop = Luna.onPathDrop({
      dragOver: (d) => seen.push(`over ${d.x},${d.y} ${d.paths.length}`),
      dragLeave: () => seen.push('leave'),
      drop: (d) => seen.push(`drop ${d.paths.join('|')}`),
    });
    expect(luna.accepts).toEqual([true]);
    luna.call('fileDragEnter', { paths: ['/a.wav'], x: 10, y: 20 });
    luna.call('fileDragOver', { paths: ['/a.wav'], x: 11, y: 21 });
    luna.call('fileDragLeave');
    luna.call('filesDropped', { paths: ['/a.wav', '/b.wav'], x: 12, y: 22 });
    expect(seen).toEqual(['over 10,20 1', 'over 11,21 1', 'leave', 'drop /a.wav|/b.wav']);
    stop();
    expect(luna.accepts).toEqual([true, false]);
    expect(g.lunaHost).toBeUndefined();
  });

  it('opts out only when the last handler unsubscribes, and stop() is idempotent', () => {
    const luna = fakeLuna();
    const a = vi.fn();
    const b = vi.fn();
    const stopA = Luna.onPathDrop(a);
    const stopB = Luna.onPathDrop(b);
    expect(luna.accepts).toEqual([true]);
    stopA();
    stopA();
    luna.call('filesDropped', { paths: ['/x.wav'], x: 0, y: 0 });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith({ paths: ['/x.wav'], x: 0, y: 0 });
    expect(luna.accepts).toEqual([true]);
    stopB();
    expect(luna.accepts).toEqual([true, false]);
  });

  it('ignores an empty drop, isolates a throwing handler, and keeps other lunaHost members', () => {
    const luna = fakeLuna();
    const other = () => 'mine';
    g.lunaHost = { somethingElse: other };
    const good = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const stop1 = Luna.onPathDrop(() => {
      throw new Error('boom');
    });
    const stop2 = Luna.onPathDrop(good);
    expect(g.lunaHost?.['somethingElse']).toBe(other);
    luna.call('filesDropped', { paths: [], x: 0, y: 0 });
    expect(good).not.toHaveBeenCalled();
    luna.call('filesDropped', { paths: ['/y.wav', 3], x: 1, y: 2 });
    expect(good).toHaveBeenCalledWith({ paths: ['/y.wav'], x: 1, y: 2 });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    stop1();
    stop2();
    expect(g.lunaHost).toEqual({ somethingElse: other }); // handed back as it was
  });
});
