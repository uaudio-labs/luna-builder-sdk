/**
 * Edits resolve once the live model shows them, because LUNA's editing verbs answer the same
 * whether or not anything happened (fact 71). A verb that answers without acting rejects
 * with `no_effect` instead of resolving.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected(tracks: string[] = ['Vocal', 'Bass']) {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks, name: 'Demo' });
  engine.addSource('pkg_abc', 'src1', { name: 'take.wav', lengthNs: 2_000_000_000 });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

describe('edits wait for the model (fact 71)', () => {
  it('adds, edits and deletes a marker, each resolving with the change visible', async () => {
    const { session } = await connected();
    await session.markers.load();
    await session.addMarker(Luna.WHOLE_NOTE, 'Verse');
    const marker = session.markers.items.find((m) => m.name.value === 'Verse')!;
    expect(marker.location.value).toBe(Luna.WHOLE_NOTE);
    await marker.rename('Chorus');
    expect(marker.name.value).toBe('Chorus');
    await marker.moveTo(Luna.WHOLE_NOTE * 2);
    expect(marker.location.value).toBe(Luna.WHOLE_NOTE * 2);
    await marker.setColor(0xffff0000);
    expect(marker.color.value).toBe(0xffff0000);
    await marker.setComments('twice');
    expect(marker.comments.value).toBe('twice');
    await marker.delete();
    expect(session.markers.items).toEqual([]);
  });

  it('trims and deletes a clip, each resolving with the change visible', async () => {
    const { session } = await connected(['Vocal']);
    const playlist = session.playlistFor(session.tracks.byId('Vocal')!)!;
    await playlist.clips.load();
    const { uid } = (await session.insertClip({ trackUid: 'Vocal', sourceUid: 'src1', startTick: 0, stopTick: Luna.WHOLE_NOTE, clipType: 'audio' })) as { uid: string };
    await Luna.settle(() => playlist.clips.byId(uid) !== undefined, 'insert');
    const clip = playlist.clips.byId(uid)!;
    await clip.load();
    await clip.trim(0, Luna.WHOLE_NOTE / 2);
    expect([clip.start.value, clip.stop.value]).toEqual([0, Luna.WHOLE_NOTE / 2]);
    await clip.delete();
    expect(playlist.clips.byId(uid)).toBeUndefined();
  });

  it('deletes tracks and resolves once they are gone', async () => {
    const { session } = await connected(['Vocal', 'Bass']);
    await session.deleteTracks(['Bass']);
    expect(session.tracks.byId('Bass')).toBeUndefined();
    expect(session.tracks.byId('Vocal')).toBeDefined();
  });

  it('refuses a fractional tick before the wire', async () => {
    const { session } = await connected();
    await expect(session.addMarker(1.5, 'x')).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('rejects with no_effect when LUNA answers but nothing changes', async () => {
    const { engine, session } = await connected();
    await session.markers.load();
    await session.addMarker(0, 'Intro');
    const marker = session.markers.items[0]!;
    engine.overrideCommand('/sessions/abc/set_marker', () => null);
    await expect(marker.rename('Outro')).rejects.toMatchObject({ code: 'no_effect' });
    expect(marker.name.value).toBe('Intro');
  }, 10_000);
});
