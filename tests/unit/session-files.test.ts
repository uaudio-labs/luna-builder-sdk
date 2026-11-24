/**
 * Session files, sessions and the recent list: the improvements asked for on GitHub (#2-#7).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected(tracks: string[] = ['Vocal', 'Bass']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo', packageUid: 'pkg1' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  return { engine, luna };
}

const until = async (check: () => boolean, what: string): Promise<void> => {
  const end = Date.now() + 2000;
  while (!check()) {
    if (Date.now() > end) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 5));
  }
};

describe('luna.session()', () => {
  it('rejects at once with NoSessionOpen when nothing is open', async () => {
    const engine = new Luna.MockEngine();
    const luna = await Luna.connect({ port_: engine.port() });
    const started = Date.now();
    await expect(luna.session()).rejects.toBeInstanceOf(Luna.NoSessionOpen);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('with wait, resolves once a session opens', async () => {
    const engine = new Luna.MockEngine();
    const luna = await Luna.connect({ port_: engine.port() });
    const pending = luna.session({ wait: true });
    setTimeout(() => engine.addSession('late', { name: 'Late' }), 20);
    expect((await pending).uid).toBe('late');
  });

  it('with wait and a timeout, rejects with RequestTimeout instead of hanging', async () => {
    const engine = new Luna.MockEngine();
    const luna = await Luna.connect({ port_: engine.port() });
    await expect(luna.session({ wait: true, timeoutMs: 50 })).rejects.toBeInstanceOf(Luna.RequestTimeout);
  });
});

describe('session.loadSources() and Collection.onAnyChange', () => {
  it('answers the loaded collection in one call', async () => {
    const { engine, luna } = await connected();
    engine.addSource('pkg1', 'f1', { name: 'Kick.wav' });
    const session = await luna.session();
    const sources = await session.loadSources();
    expect(sources.items.map((s) => s.name.value)).toEqual(['Kick.wav']);
  });

  it('calls one listener for adds, removes and watched props of any member, once per turn', async () => {
    const { engine, luna } = await connected();
    engine.addSource('pkg1', 'f1', { name: 'Kick.wav' });
    const session = await luna.session();
    const sources = await session.loadSources();
    let calls = 0;
    const stop = sources.onAnyChange(() => calls++, { props: ['name', 'length'] });

    engine.setValue('/workspace/sessions/pkg1/audio/f1', 'name', 'Kick 2.wav');
    await engine.settled();
    await luna.settled();
    await until(() => calls >= 1, 'rename'); expect(calls).toBe(1);

    engine.addSource('pkg1', 'f2', { name: 'Snare.wav' });
    await engine.settled();
    await luna.settled();
    await until(() => calls === 2, 'add');

    // The member added later is followed too.
    engine.setValue('/workspace/sessions/pkg1/audio/f2', 'length', 5);
    await engine.settled();
    await luna.settled();
    await until(() => calls === 3, 'length of the new member');

    stop();
    engine.setValue('/workspace/sessions/pkg1/audio/f2', 'name', 'x.wav');
    await engine.settled();
    await luna.settled();
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toBe(3);
  });
});

describe('AudioSource names, origin and paths', () => {
  it('treats a file LUNA named with its own uid as unnamed (fact 238)', async () => {
    const { engine, luna } = await connected();
    engine.addSource('pkg1', 'f87c275ebc554640bba4ca2d388320b0', { unnamed: true });
    engine.addSource('pkg1', 'f2', { name: 'Vocal.wav' });
    const sources = await (await luna.session()).loadSources();
    const unnamed = sources.byId('f87c275ebc554640bba4ca2d388320b0')!;
    expect(unnamed.name.value).toBe('f87c275ebc554640bba4ca2d388320b0');
    expect(unnamed.displayName.value).toBeUndefined();
    expect(unnamed.hasName).toBe(false);
    expect(sources.byId('f2')!.displayName.value).toBe('Vocal.wav');
    expect(Luna.sourceDisplayName('F87C275E-BC55-4640-BBA4-CA2D388320B0.wav', 'f87c275ebc554640bba4ca2d388320b0')).toBeUndefined();
    expect(Luna.sourceDisplayName('  ', 'x')).toBeUndefined();
  });

  it('builds a source path from the session package, renders under renders/clips (fact 239)', async () => {
    const { engine, luna } = await connected();
    engine.addSource('pkg1', 'ABC-123', { name: 'Kick.wav' });
    engine.addSource('pkg1', 'r1', { name: 'r1', origin: Luna.SourceOrigin.ClipRendering });
    const session = await luna.session();
    const sources = await session.loadSources();
    const pkg = session.sessionPackagePath.value!;
    expect(pkg).toBe('/tmp/Demo/Demo.luna');
    expect(session.sourcePath(sources.byId('ABC-123')!)).toBe(`${pkg}/audio/abc123.wav`);
    expect(sources.byId('r1')!.isRender).toBe(true);
    expect(session.sourcePath('r1')).toBe(`${pkg}/renders/clips/r1.wav`);
    expect(await sources.byId('ABC-123')!.filePath()).toBe(`${pkg}/audio/abc123.wav`);
    expect(sources.byId('ABC-123')!.format.value).toBe('wav');
    expect(Luna.sourceFilePath('C:\\Music\\S.luna', 'u', false)).toBe('C:\\Music\\S.luna\\audio\\u.wav');
  });

  it('reveals the file through /gui/reveal_path', async () => {
    const { engine, luna } = await connected();
    engine.addSource('pkg1', 'f1', { name: 'Kick.wav' });
    const revealed: unknown[] = [];
    engine.overrideCommand('/gui/reveal_path', (data) => {
      revealed.push(data);
      return null;
    });
    const sources = await (await luna.session()).loadSources();
    await sources.byId('f1')!.reveal();
    expect(revealed).toEqual([{ path: '/tmp/Demo/Demo.luna/audio/f1.wav' }]);
  });
});

describe('session.package()', () => {
  it('answers the session’s own package, loaded, without the whole workspace', async () => {
    const { luna } = await connected();
    const session = await luna.session();
    const pkg = await session.package();
    expect(pkg.uid.value).toBe('pkg1');
    expect(pkg.name).toBe('Demo');
    expect(luna.workspace.packages.items).toEqual([]);
  });
});

describe('session.sourceUsage()', () => {
  it('lists the tracks using each file and follows new takes', async () => {
    const { engine, luna } = await connected();
    const session = await luna.session();
    engine.finishTake('abc', 'Vocal');
    const usage = await session.sourceUsage();
    const vocalFile = usage.items[0]!.id;
    expect(usage.byId(vocalFile)?.trackUids).toEqual(['Vocal']);
    expect(usage.byId(vocalFile)?.uses[0]?.active).toBe(true);

    let changes = 0;
    usage.onChange(() => changes++);
    engine.finishTake('abc', 'Bass');
    await engine.settled();
    await luna.settled();
    await until(() => usage.items.length === 2, 'the second take');
    expect(changes).toBeGreaterThan(0);
    const bassFile = usage.items.find((e) => e.trackUids.includes('Bass'))!.id;
    // Takes on two tracks get distinct files.
    expect(bassFile).not.toBe(vocalFile);
    expect(usage.isUsed('nope')).toBe(false);
    usage.dispose();
  });
});

describe('workspace.unusedMedia() and deleteUnusedMedia() (fact 240)', () => {
  it('lists the unused files and why the others stay, then removes the unused ones', async () => {
    const { engine, luna } = await connected();
    const session = await luna.session();
    engine.finishTake('abc', 'Vocal');
    engine.addSource('pkg1', 'loose', { name: 'Loose.wav' });
    engine.addSource('pkg1', 'undone', { name: 'Undone.wav' });
    engine.keepMedia('pkg1', 'undone', 'undo');
    const used = (await session.sourceUsage()).items[0]!.id;

    const plan = await luna.workspace.unusedMedia('pkg1');
    expect(plan.totalFiles).toBe(3);
    expect(plan.unusedUids).toEqual(['loose']);
    expect(plan.kept).toEqual([{ uid: used, reason: 'session' }, { uid: 'undone', reason: 'undo' }]);
    expect((await luna.workspace.unusedMedia('pkg1', { clearUndo: true })).unusedUids).toEqual(['loose', 'undone']);

    const done = await luna.workspace.deleteUnusedMedia('pkg1', { toTrash: true });
    expect(done.unusedCount).toBe(1);
    expect(engine.has('/workspace/sessions/pkg1/audio/loose')).toBe(false);
    expect(engine.has('/workspace/sessions/pkg1/audio/undone')).toBe(true);
  });

  it('answers counts alone from a LUNA that does not list files', async () => {
    const { engine, luna } = await connected();
    engine.overrideCommand('/workspace/delete_unused_media', () => ({ total_files: 4, total_unused_files: 1, files_only_in_backups: 2 }));
    const plan = await luna.workspace.unusedMedia('pkg1');
    expect(plan).toEqual({ totalFiles: 4, unusedCount: 1, onlyInBackupsCount: 2, unusedUids: undefined, kept: undefined });
  });

  it('lets overrideCommand add a command the mock lacks', async () => {
    const { engine, luna } = await connected();
    engine.overrideCommand('/workspace/made_up', () => ({ ok: true }));
    expect(await luna.raw.post('/workspace/made_up', {})).toEqual({ ok: true });
  });
});

describe('Luna.startSourceDrag (fact 241)', () => {
  it('fills the drag with the file path and its file:// URL', async () => {
    const { engine, luna } = await connected();
    engine.addSource('pkg1', 'f1', { name: 'Kick.wav' });
    const session = await luna.session();
    const source = (await session.loadSources()).byId('f1')!;
    const data = new Map<string, string>();
    const event = { dataTransfer: { setData: (k: string, v: string) => data.set(k, v), effectAllowed: 'all' } };
    expect(Luna.startSourceDrag(event, { session, source })).toEqual(['/tmp/Demo/Demo.luna/audio/f1.wav']);
    expect(data.get('text/plain')).toBe('/tmp/Demo/Demo.luna/audio/f1.wav');
    expect(data.get('text/uri-list')).toBe('file:///tmp/Demo/Demo.luna/audio/f1.wav');
    expect(event.dataTransfer.effectAllowed).toBe('copy');
    expect(Luna.fileUrl('/My Music/a b.wav')).toBe('file:///My%20Music/a%20b.wav');
    expect(Luna.fileUrl('C:\\Music\\a.wav')).toBe('file:///C:/Music/a.wav');
  });
});

describe('recent sessions and package uids (#7)', () => {
  it('knows each open session’s package uid without ready(), and matches it with or without dashes', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('s1', { name: 'One', packageUid: '7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7' });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    await luna.sessions.ready();
    expect(luna.sessions.items.items[0]!.sessionPackageUid.value).toBe('7d3c0f9e2b8a4c61a5e4f0b9c2d1e3a7');
    expect(luna.sessions.byPackageUid('7D3C0F9E-2B8A-4C61-A5E4-F0B9C2D1E3A7')?.uid).toBe('s1');
    expect(luna.sessions.byPackageUid('other')).toBeUndefined();
  });

  it('keeps the recent list current as sessions open, and marks the open ones', async () => {
    const engine = new Luna.MockEngine();
    engine.addPackage('old', { name: 'Old', lastOpened: 1000 });
    engine.addPackage('older', { name: 'Older', lastOpened: 500 });
    const luna = await Luna.connect({ port_: engine.port() });
    const recent = await luna.workspace.recentList(5);
    expect(recent.items.map((r) => r.uid)).toEqual(['old', 'older']);
    expect(recent.items.every((r) => r.openSessionUid === undefined)).toBe(true);

    const session = await luna.sessions.openOrFocus('older');
    await until(() => recent.items[0]?.uid === 'older', 'the reopened package on top');
    expect(recent.byId('older')?.openSessionUid).toBe(session.uid);
    // Already open: focused, not opened twice.
    const again = await luna.sessions.openOrFocus('older');
    expect(again.uid).toBe(session.uid);
    expect(luna.sessions.items.items.length).toBe(1);
    recent.dispose();
  });
});
