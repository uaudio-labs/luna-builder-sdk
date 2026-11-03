/**
 * An object whose node the engine removed is disposed: it says so, tells its listeners once,
 * and refuses commands, so a stale reference cannot act on whatever replaces it.
 */
import { describe, expect, it, vi } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal', 'Bass'], name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

describe('dispose', () => {
  it('disposes a track the engine removed, once, with its outputs and controls', async () => {
    const { session } = await connected();
    const bass = session.tracks.byId('Bass')!;
    await bass.outputs.load();
    const send = bass.outputs.byId('send_0')!;
    const gain = bass.gain;
    const seen = vi.fn();
    bass.onDispose(seen);
    expect(bass.disposed).toBe(false);

    await session.deleteTracks(['Bass']);
    expect(bass.disposed).toBe(true);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(send.disposed).toBe(true);
    expect(bass.main.disposed).toBe(true);
    expect(gain.disposed).toBe(true);
    bass.dispose(); // idempotent
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('refuses writes and commands on a disposed object with Luna.Disposed', async () => {
    const { session } = await connected();
    const bass = session.tracks.byId('Bass')!;
    await bass.outputs.load();
    const send = bass.outputs.byId('send_0')!;
    await session.deleteTracks(['Bass']);
    await expect(bass.name.set('ghost')).rejects.toBeInstanceOf(Luna.Disposed);
    await expect(bass.name.set('ghost')).rejects.toMatchObject({ code: 'disposed' });
    await expect(send.assign('master_abc')).rejects.toBeInstanceOf(Luna.Disposed);
    await expect(bass.duplicate()).rejects.toMatchObject({ code: 'disposed' });
  });

  it('calls a listener added after disposal at once', async () => {
    const { session } = await connected();
    const bass = session.tracks.byId('Bass')!;
    await session.deleteTracks(['Bass']);
    const late = vi.fn();
    bass.onDispose(late);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('does not treat a clip deleting itself as a failure', async () => {
    const { engine, session } = await connected();
    engine.addSource('pkg_abc', 'src1', { lengthNs: 1_000_000_000 });
    const playlist = session.playlistFor(session.tracks.byId('Vocal')!)!;
    await playlist.clips.load();
    const { id: uid } = await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, clipType: 'audio' });
    await Luna.settle(() => playlist.clips.byId(uid) !== undefined, 'insert');
    const clip = playlist.clips.byId(uid)!;
    await clip.delete();
    expect(clip.disposed).toBe(true);
    await expect(clip.delete()).rejects.toBeInstanceOf(Luna.Disposed);
  });
});
