/**
 * Live lane for the editing surface added for the recipes: note velocity, mute and
 * deletion through LUNA's edit selection (fact 74), note rewrites inside both kinds of
 * transaction (facts 74, 115), marker and Chord ruler verbs (fact 100),
 * and the waveform placement that draws a clip (facts 72-73).
 *
 * Needs LUNA on 4718 with a session open and at least one track with an active playlist.
 * Everything it creates it removes; the undo entries remain, because the wire cannot drop
 * them. It never rolls the transport — `tests/live/record.test.ts` is the one that does.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';
const B = Luna.TICKS_PER_BEAT;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe.skipIf(!live)('live: editing', () => {
  let luna: Luna.Client;
  let session: Luna.Session;
  let lane: Luna.Playlist;
  let clip: Luna.Clip | undefined;
  let marker: Luna.Marker | undefined;
  let base = 0;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 8000 });
    session = await luna.session();
    await session.musical.ready();
    for (const p of session.playlists.items) await p.clips.load();
    await session.markers.load();
    const track = session.visibleTracks.find((t) => session.playlistFor(t));
    if (!track) throw new Error('the open session needs a track with an active playlist');
    lane = session.playlistFor(track)!;
    // Past every existing clip, so nothing this test does can overlap real content.
    const end = Math.max(0, ...session.playlists.items.flatMap((p) => p.clips.items).map((c) => c.stop.value ?? 0));
    base = Math.ceil(end / B / 4) * 4 * B + 16 * B;
  });

  afterAll(async () => {
    await clip?.delete().catch(() => undefined);
    await marker?.delete().catch(() => undefined);
    await luna?.close();
  });

  it('writes notes onto the lane, making the MIDI clip to hold them', async () => {
    const created = await lane.createNotes([60, 64, 67].map((pitch, i) => ({ pitch, startTick: base + i * B, stopTick: base + (i + 1) * B })));
    clip = created.clip;
    expect(clip.clipType.value).toBe('midi');
    expect(created.notes.map((n) => n.pitch).sort()).toEqual([60, 64, 67]);
    expect(clip.midi.notes.items.length).toBeGreaterThanOrEqual(3);
    // Session ticks in, clip-relative ticks out, all on channel 0 (facts 41, 111).
    const start = clip.start.value ?? 0;
    expect(start).toBeLessThanOrEqual(base);
    expect(created.notes.map((n) => [n.pitch, start + n.startTick, n.channel]).sort((a, b) => a[0]! - b[0]!)).toEqual([
      [60, base, 0],
      [64, base + B, 0],
      [67, base + 2 * B, 0],
    ]);
  });

  it('makes a second clip for notes past the first, named after the track (fact 111)', async () => {
    const at = (clip!.stop.value ?? 0) + 8 * B + B / 2;
    const created = await lane.createNotes([{ pitch: 62, startTick: at, stopTick: at + B }]);
    try {
      expect(created.clip.id).not.toBe(clip!.id);
      const start = created.clip.start.value ?? 0;
      expect(start).toBeLessThanOrEqual(at);
      expect(start + created.notes[0]!.startTick).toBe(at);
      expect(created.clip.stop.value ?? 0).toBeGreaterThanOrEqual(at + B);
      expect(created.clip.name.value).toBe(session.tracks.byId(lane.trackUid.value ?? '')?.name.value);
    } finally {
      await created.clip.delete().catch(() => undefined);
    }
  });

  it('refuses a MIDI insertClip with no source (fact 112)', async () => {
    const before = lane.clips.items.length;
    await expect(
      session.insertClip({ playlistUid: lane.id, sourceUid: '', startTick: base + 64 * B, stopTick: base + 68 * B, clipType: 'midi' }),
    ).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await sleep(300);
    await lane.clips.reload();
    expect(lane.clips.items.length).toBe(before);
  });

  it('rewrites the key signature at a tick in place, one undo entry each (fact 113)', async () => {
    const m = session.musical;
    const at = base + 32 * B;
    const atTick = () => m.keySignatures.items.filter((k) => k.tick.value === at);
    expect(atTick()).toHaveLength(0);
    const first = await m.setKeySignature(2, false, at);
    const second = await m.setKeySignature(-1, true, at);
    try {
      expect(second.id).toBe(first.id);
      expect(atTick()).toHaveLength(1);
      expect(m.keySignatureAt(at + B)?.sharpsAndFlats.value).toBe(-1);
    } finally {
      await session.undo();
      await session.undo();
      await Luna.settle(() => atTick().length === 0, 'undo key signatures', { refresh: () => m.keySignatures.reload() });
    }
  });

  it('scales every velocity in one undo entry and leaves the selection alone', async () => {
    const midi = clip!.midi;
    await session.context.refreshSelection();
    const selection = JSON.stringify(session.context.snapshot());

    const original = midi.notes.items.map((n) => n.velocity);
    await midi.setVelocities(midi.notes.items.map((n) => ({ note: n, velocity: 55 })));
    expect(midi.notes.items.map((n) => n.velocity)).toEqual(original.map(() => 55));

    await session.context.refreshSelection();
    expect(JSON.stringify(session.context.snapshot())).toBe(selection);

    await session.undo();
    await Luna.settle(() => midi.notes.items.every((n) => n.velocity !== 55), 'undo velocities', { refresh: () => midi.refresh() });
    expect(midi.notes.items.map((n) => n.velocity)).toEqual(original);
  });

  it('mutes and deletes notes, each one undo entry, selection restored', async () => {
    const midi = clip!.midi;
    await session.context.refreshSelection();
    const selection = JSON.stringify(session.context.snapshot());

    const target = midi.notes.items[1]!;
    await midi.setMuted([target], true);
    expect(midi.notes.byId(String(target.rowid))!.muted).toBe(true);
    expect(midi.notes.items.filter((n) => n.muted)).toHaveLength(1);
    // Checked here, before the Undo: LUNA's own undo re-selects what it restored, which is
    // its business, not the wrapper's.
    await session.context.refreshSelection();
    expect(JSON.stringify(session.context.snapshot())).toBe(selection);

    await session.undo();
    await Luna.settle(() => midi.notes.items.every((n) => !n.muted), 'undo mute', { refresh: () => midi.refresh() });

    await session.context.refreshSelection();
    const beforeDelete = JSON.stringify(session.context.snapshot());
    const doomed = midi.notes.items.at(-1)!;
    const was = midi.notes.items.length;
    await midi.deleteNotes([doomed]);
    expect(midi.notes.byId(String(doomed.rowid))).toBeUndefined();
    await session.context.refreshSelection();
    expect(JSON.stringify(session.context.snapshot())).toBe(beforeDelete);

    await session.undo();
    await Luna.settle(() => midi.notes.items.length === was, 'undo delete', { refresh: () => midi.refresh() });
  });

  it('rewrites notes as one batch transaction: deleteNotes then addNotes, one undo (fact 74)', async () => {
    const midi = clip!.midi;
    await midi.refresh();
    const pitches = () => midi.notes.items.map((n) => n.pitch).sort((x, y) => x - y);
    const before = pitches();
    const old = midi.notes.items;
    await session.transaction('SDK live rewrite', async () => {
      await midi.deleteNotes(old);
      await clip!.addNotes(old.map((n) => ({ pitch: n.pitch + 12, tick: n.startTick, lengthTicks: (n.stopTick ?? n.startTick + B) - n.startTick })));
    });
    const raised = before.map((p) => p + 12);
    await Luna.settle(() => JSON.stringify(pitches()) === JSON.stringify(raised), 'rewrite', { refresh: () => midi.refresh() });

    await session.undo();
    await Luna.settle(() => JSON.stringify(pitches()) === JSON.stringify(before), 'undo rewrite', { refresh: () => midi.refresh() });
  });

  it('keeps only the last createNotes of a continuous transaction, one undo (fact 115)', async () => {
    const midi = clip!.midi;
    await midi.refresh();
    const pitches = () => midi.notes.items.map((n) => n.pitch).sort((x, y) => x - y);
    const before = pitches();
    const at = (clip!.start.value ?? 0) + B / 2; // inside the clip, so every take lands in it
    await session.transaction('SDK live takes', async () => {
      for (const pitch of [48, 50, 52]) {
        const { clip: into } = await lane.createNotes([{ pitch, startTick: at, stopTick: at + B / 2 }]);
        expect(into.id).toBe(clip!.id);
      }
    }, { continuous: true });
    const last = [52, ...before].sort((x, y) => x - y);
    await Luna.settle(() => JSON.stringify(pitches()) === JSON.stringify(last), 'last take only', { refresh: () => midi.refresh() });

    await session.undo();
    await Luna.settle(() => JSON.stringify(pitches()) === JSON.stringify(before), 'undo takes', { refresh: () => midi.refresh() });
  });

  it('adds several notes to a clip in one undo entry', async () => {
    const midi = clip!.midi;
    const was = midi.notes.items.length;
    const added = () => midi.notes.items.filter((n) => n.pitch === 72 || n.pitch === 76);
    await clip!.addNotes([
      { pitch: 72, tick: 0, lengthTicks: B / 2 },
      { pitch: 76, tick: B, lengthTicks: B / 2, velocity: 70 },
    ]);
    await Luna.settle(() => added().length === 2, 'add notes', { refresh: () => midi.refresh() });
    const notes = added().sort((a, b) => a.startTick - b.startTick);
    expect(notes).toMatchObject([
      { pitch: 72, startTick: 0, stopTick: B / 2 },
      { pitch: 76, startTick: B, stopTick: B + B / 2, velocity: 70 },
    ]);

    await session.undo();
    await Luna.settle(() => added().length === 0, 'undo add notes', { refresh: () => midi.refresh() });
    expect(midi.notes.items.length).toBe(was);
  });

  it('adds, renames, nudges and deletes a marker', async () => {
    const before = new Set(session.markers.items.map((m) => m.id));
    await session.addMarker(base, 'SDK live marker');
    await Luna.settle(() => session.markers.items.some((m) => !before.has(m.id)), 'add marker', { refresh: () => session.markers.reload() });
    marker = session.markers.items.find((m) => !before.has(m.id));
    expect(marker).toBeDefined();

    await marker!.rename('SDK live marker renamed');
    await Luna.settle(() => marker!.name.value === 'SDK live marker renamed', 'rename marker', { refresh: () => session.markers.reload() });

    await marker!.moveTo(base + 4 * B);
    await Luna.settle(() => marker!.location.value === base + 4 * B, 'move marker', { refresh: () => session.markers.reload() });

    const uid = marker!.id;
    await marker!.delete();
    await Luna.settle(() => session.markers.byId(uid) === undefined, 'delete marker', { refresh: () => session.markers.reload() });
    marker = undefined;
  });

  it('writes a chord progression as one undo entry and edits a chord', async () => {
    const chords = session.musical.chords;
    const span: [number, number] = [base, base + 16 * B];
    const before = chords.items.filter((c) => (c.location.value ?? 0) >= span[0] && (c.location.value ?? 0) < span[1]);
    expect(before).toEqual([]); // past every clip, so past any chord a user put there too

    await session.musical.setChords(
      ['C', 'Am', 'F', 'G'].map((name, i) => ({ tick: base + i * 4 * B, name })),
      { replaceRange: span },
    );
    const written = () => chords.sorted.filter((c) => (c.location.value ?? 0) >= span[0] && (c.location.value ?? 0) < span[1]);
    expect(written().map((c) => c.name.value)).toEqual(['C', 'Am', 'F', 'G']);

    await session.undo();
    await Luna.settle(() => written().length === 0, 'undo set chords', { refresh: () => chords.reload() });

    const chord = await session.musical.addChord(base, 'C');
    await chord.rename('C/E');
    expect(chord.parsed).toEqual({ root: 'C', type: '', bass: 'E' });
    await chord.moveTo(base + 4 * B);
    await chord.delete();
    expect(written()).toEqual([]);
  });

  it('reads overview pairs at the size the engine really uses', async () => {
    await session.sources?.load();
    const source = session.sources?.items.find((s) => (s.length.value ?? 0) > 2e9);
    if (!source) return; // nothing long enough in this session to measure against
    const info = await source.overviewInfo();
    expect(info).toBeDefined();
    // A pair is 125 samples at 48 kHz whatever the file's own rate (fact 72).
    const expected = Math.floor((source.length.value ?? 0) / Luna.OVERVIEW_PAIR_NS);
    expect(Math.abs(info!.count - expected)).toBeLessThanOrEqual(2);
    const coarse = await source.overviewInfo({ kind: 'coarse' });
    expect(Math.abs(coarse!.count - Math.floor(info!.count / Luna.COARSE_PAIRS_PER_FINE))).toBeLessThanOrEqual(1);

    const page = await new Luna.Waveforms().range(source, 0, Luna.OVERVIEW_PAIR_NS * 64, 'fine');
    expect(page.count).toBe(64);
    for (const channel of page.channels) {
      for (let i = 0; i < channel.min.length; i++) {
        expect(channel.min[i]!).toBeLessThanOrEqual(channel.max[i]!);
        expect(Math.abs(channel.min[i]!)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('picks the right audio for every clip in the session', async () => {
    await session.sources?.load();
    await sleep(100);
    for (const p of session.playlists.items) {
      for (const c of p.clips.items) {
        if (c.clipType.value !== 'audio') continue;
        const audio = Luna.clipAudio(c, session.sources!);
        if (!audio) continue; // a render LUNA has named but not announced: draw an outline
        expect(audio.stopNs).toBeGreaterThanOrEqual(audio.startNs);
        // A stretched clip draws the render, whose length is the clip's span in seconds.
        if (audio.stretched) expect(audio.source.id).toBe(c.renderSourceUid.value);
        else expect(audio.source.id).toBe(c.sourceUid.value);
      }
    }
  });

  it('lists the device inputs a track can record from', async () => {
    const inputs = await luna.audioInputs();
    for (const input of inputs) {
      expect(typeof input.uid).toBe('string');
      expect(typeof input.name).toBe('string');
      expect(typeof input.inUse).toBe('boolean');
    }
  });
});
