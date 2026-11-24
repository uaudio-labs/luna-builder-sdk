/** @hidden Self-test checks for sessions, transport settings, musical data and the context (facts 153-163). */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formatRollDuration, parseRollDuration } from '../../../src/model/session-settings';
import { BAR, newMidiTrack, tinyMidiFile, uniqueName, waitFor } from '../fixtures';
import type { Check } from '../runner';

const area = 'session';

export const SESSION_CHECKS: Check[] = [
  {
    id: 'session.lyrics.edit',
    area,
    title: 'Add, edit, move and delete a lyric line',
    facts: [153],
    async run({ session, assert, equal }) {
      await session.lyrics.load();
      const line = await session.lyrics.add(BAR * 2, 'self-test line');
      equal(line.text.value, 'self-test line', 'added text');
      equal(line.location.value, BAR * 2, 'added location');
      assert(!line.transcribed, 'a ruler line is not transcribed');
      await line.setText('self-test line, edited');
      equal(line.text.value, 'self-test line, edited', 'edited text');
      await line.moveTo(BAR * 3);
      equal(line.location.value, BAR * 3, 'moved location');
      await line.delete();
      assert(!session.lyrics.items.some((l) => l.text.value?.startsWith('self-test line')), 'the line is gone');
    },
  },
  {
    id: 'session.signatures.delete',
    area,
    title: 'Delete a time signature and a key signature',
    facts: [154],
    async run({ session, assert, equal }) {
      const m = session.musical;
      await m.setTimeSignature(3, 4, 5);
      await waitFor(() => m.timeSignatures.items.some((t) => t.bar.value === 5), 'the 3/4 at bar 5');
      await m.deleteTimeSignature(5);
      assert(!m.timeSignatures.items.some((t) => t.bar.value === 5), 'bar 5 has no time signature');
      let refused = '';
      await m.deleteTimeSignature(99).catch((e: { code?: string }) => (refused = e.code ?? 'error'));
      equal(refused, 'not_found', 'deleting a time signature that is not there');
      await m.setKeySignature(2, false, BAR * 4);
      await waitFor(() => m.keySignatures.items.some((k) => k.tick.value === BAR * 4), 'the key at bar 5');
      await m.deleteKeySignature(BAR * 4);
      assert(!m.keySignatures.items.some((k) => k.tick.value === BAR * 4), 'the key is gone');
    },
  },
  {
    id: 'session.settings.roll',
    area,
    title: 'Pre-roll and post-roll amounts read and write',
    facts: [155],
    async run({ session, assert, equal, note, cleanup }) {
      const t = session.transport;
      const before = { pre: t.preRoll.value, post: t.postRoll.value };
      note(`pre_roll was ${JSON.stringify(before.pre)}, post_roll ${JSON.stringify(before.post)}`);
      // A session that never set a roll may publish an empty string; any set value must parse.
      assert(before.pre === '' || parseRollDuration(before.pre) !== undefined, `pre_roll is empty or bars,beats,ticks (got ${JSON.stringify(before.pre)})`);
      cleanup(async () => {
        if (before.pre !== undefined) await t.preRoll.set(before.pre);
        if (before.post !== undefined) await t.postRoll.set(before.post);
      });
      const pre = formatRollDuration({ bars: 2 });
      await t.preRoll.set(pre);
      await waitFor(() => parseRollDuration(t.preRoll.value)?.bars === 2, 'pre_roll of 2 bars');
      const post = formatRollDuration({ beats: 3 });
      await t.postRoll.set(post);
      await waitFor(() => parseRollDuration(t.postRoll.value)?.beats === 3, 'post_roll of 3 beats');
      equal(parseRollDuration(t.preRoll.value)?.beats, 0, 'pre_roll beats');
    },
  },
  {
    id: 'session.settings.click',
    area,
    title: 'Click and MIDI merge settings toggle',
    facts: [156],
    async run({ session, equal, cleanup }) {
      const t = session.transport;
      for (const prop of [t.clickDuringPlay, t.clickDuringRecord, t.clickDuringCountIn, t.mergeMidi]) {
        const before = prop.value;
        equal(typeof before, 'boolean', 'the setting is published');
        cleanup(() => prop.set(before!));
        await prop.set(!before);
        await waitFor(() => prop.value === !before, 'the toggle');
      }
    },
  },
  {
    id: 'session.settings.soloMode',
    area,
    title: 'Solo mode switches between latching and exclusive',
    facts: [157],
    async run({ session, equal, cleanup }) {
      const before = session.soloMode.value;
      equal(before === 'latching' || before === 'exclusive', true, `solo_mode is a known value (got ${JSON.stringify(before)})`);
      const other = before === 'exclusive' ? 'latching' : 'exclusive';
      cleanup(() => session.soloMode.set(before!));
      await session.soloMode.set(other);
      await waitFor(() => session.soloMode.value === other, `solo mode ${other}`);
    },
  },
  {
    id: 'session.settings.tempoPercent',
    area,
    title: 'Varispeed (tempo percent) writes',
    facts: [155],
    async run({ session, skip, cleanup }) {
      const t = session.transport;
      if (t.enableTempoPercent.value === undefined) skip("LUNA's EnableTempoPercent feature key is off");
      const before = { on: t.enableTempoPercent.value, pct: t.tempoPercent.value };
      cleanup(async () => {
        if (before.pct !== undefined) await t.tempoPercent.set(before.pct);
        await t.enableTempoPercent.set(before.on!);
      });
      await t.enableTempoPercent.set(true);
      await t.tempoPercent.set(90);
      await waitFor(() => t.tempoPercent.value === 90, 'tempo percent 90');
    },
  },
  {
    id: 'session.context.timelineScroll',
    area,
    title: 'Timeline scroll position reads and writes',
    facts: [159],
    async run({ session, cleanup }) {
      const p = session.context.timelineViewStartTick;
      const before = p.value;
      if (before !== undefined && before !== null) cleanup(() => p.set(before));
      await p.set(BAR * 8);
      await waitFor(() => p.value === BAR * 8, 'the scroll position');
    },
  },
  {
    id: 'session.context.midiOperation',
    area,
    title: 'Transpose selected notes',
    facts: [158],
    async run(ctx) {
      const track = await newMidiTrack(ctx);
      const playlistUid = track.playlistUid.value;
      if (!playlistUid) throw new Error('the track has no playlist');
      const lane = ctx.session.playlists.byId(playlistUid)!;
      const { clip, notes } = await lane.createNotes([{ pitch: 60, startTick: 0, stopTick: BAR / 4 }]);
      const note = notes[0]!;
      const start = (clip.start.value ?? 0) + note.startTick;
      const stop = (clip.start.value ?? 0) + (note.stopTick ?? note.startTick);
      await ctx.session.context.selectNotes(playlistUid, [[note.pitch, start, stop, note.rowid]]);
      await ctx.session.context.midiOperation({ type: 'transpose', semitones: 2 });
      await clip.midi.ready();
      await waitFor(() => clip.midi.notes.items.some((n) => n.pitch === 62), 'the note at pitch 62');
    },
  },
  {
    id: 'session.workspace.tags',
    area,
    title: 'Tag the session and find it by the tag; templates by filter',
    facts: [161, 162],
    async run({ luna, session, assert, note }) {
      const pkg = session.sessionPackageUid.value;
      if (!pkg) throw new Error('the session has no package uid');
      const tag = uniqueName('sdk-selftest').replace(' ', '-');
      await luna.workspace.addTag(pkg, tag);
      await waitFor(async () => (await luna.workspace.query({ tags: [tag] })).some((r) => r.uid === pkg.replaceAll('-', '')), 'the tagged package in the query');
      const factory = await luna.workspace.templates({ factory: true });
      const mine = await luna.workspace.templates({ factory: false });
      note(`${factory.length} factory templates, ${mine.length} of the user's`);
      assert(factory.every((t) => t.factory) && mine.every((t) => !t.factory), 'templates({ factory }) filters');
    },
  },
  {
    id: 'session.gui.storagePath',
    area,
    title: "LUNA's session folder is readable",
    facts: [160],
    async run({ luna, skip, assert, note }) {
      if (!(await luna.gui.available())) skip('this LUNA has no /gui tree');
      await luna.gui.watch().ready;
      const path = luna.gui.sessionStoragePath.value;
      note(`session folder: ${path}`);
      assert(typeof path === 'string' && path.length > 0, 'a non-empty path');
    },
  },
  {
    id: 'session.importPath.midi',
    area,
    title: 'Import a MIDI file into the session by path',
    facts: [163],
    async run({ session, equal, assert }) {
      const dir = mkdtempSync(join(tmpdir(), 'sdk-selftest-'));
      const file = join(dir, 'selftest.mid');
      writeFileSync(file, tinyMidiFile());
      const imported = await session.importPath(file, { type: 'midi' });
      assert('type' in imported, 'resolves to an ImportedFile');
      equal((imported as { type: string }).type, 'midi', 'the import type');
    },
  },
];
