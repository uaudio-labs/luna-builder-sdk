/** @hidden Self-test checks for helpers, devices, analysis, structure and automation (facts 180-231). */
import { dbToGain, gainToDb } from '../../../src/model/gain';
import { folderTree } from '../../../src/model/folder-tree';
import { ErrorCodes } from '../../../src/model/error-codes';
import { BAR, audioClip, newAudioTrack, newMidiTrack, uniqueName, waitFor, sleep } from '../fixtures';
import type { Check } from '../runner';

export const HELPER_CHECKS: Check[] = [
  {
    id: 'helpers.folderTree',
    area: 'helpers',
    title: "The folder tree matches LUNA's track order",
    facts: [136, 182],
    async run(ctx) {
      const { session, equal } = ctx;
      const folder = await session.newFolder({ name: uniqueName('Self-test folder') });
      const inside = await newAudioTrack(ctx);
      await session.moveToFolder([inside], folder);
      await waitFor(() => inside.folderUid.value === folder.id, 'the track inside the folder');
      const tree = folderTree(session);
      equal(tree.anomalies.length, 0, 'no malformed folder links');
      equal(tree.rows.map((r) => r.channel.id), session.channelsInOrder.map((c) => c.id), "rows in LUNA's order");
      equal(tree.summingFolder(inside)?.id, folder.id, 'the track sums into its folder');
    },
  },
  {
    id: 'helpers.gain',
    area: 'helpers',
    title: 'dB and gain conversions agree with LUNA meters and the -144 dB floor',
    facts: [228],
    async run({ equal, assert }) {
      equal(dbToGain(0), 1, '0 dB');
      equal(dbToGain(-144), 0, "LUNA's -infinity");
      assert(Math.abs(gainToDb(0.5) + 6.0206) < 1e-3, '-6 dB at half gain');
      assert(typeof ErrorCodes === 'object' && Object.keys(ErrorCodes).length > 10, 'error codes are exported');
    },
  },
];

export const DEVICE_CHECKS: Check[] = [
  {
    id: 'devices.inputsOutputs',
    area: 'devices',
    title: 'Each device lists its inputs and outputs live',
    facts: [185, 189],
    async run({ luna, skip, assert, note }) {
      await luna.devices.load();
      const devices = luna.devices.items;
      if (devices.length === 0) return skip('no audio device');
      for (const d of devices) {
        const w1 = d.inputs.watch();
        const w2 = d.outputs.watch();
        await Promise.all([w1.ready, w2.ready]);
        note(`${d.name.value}: ${d.inputs.items.length} inputs, ${d.outputs.items.length} outputs`);
        w1.release();
        w2.release();
      }
      const snapshot = await luna.audioInputs();
      const live = devices.flatMap((d) => d.inputs.items.map((i) => i.uid.value));
      assert(snapshot.every((s) => live.includes(s.uid)), 'every input audioInputs() reports is in a device.inputs collection');
    },
  },
  {
    id: 'devices.inputAnalysis',
    area: 'devices',
    title: "Hold an input's signal-level analysis and read its peak",
    facts: [186, 187, 188],
    async run({ luna, skip, assert, note }) {
      await luna.devices.load();
      const input = luna.devices.items.flatMap((d) => (d.inputs.watch(), d.inputs.items))[0];
      if (!input) return skip('no audio inputs (connect an audio interface)');
      const before = input.signalLevelAnalysisEnabled.value;
      const hold = input.watchAnalysis('signal_level');
      await hold.ready;
      await waitFor(() => input.signalLevelAnalysisEnabled.value === true, 'the analysis on');
      await sleep(500);
      note(`input "${input.name.value}" peak ${input.signalLevelPeak.value}`);
      assert(typeof input.signalLevelPeak.value === 'number', 'a numeric peak');
      hold.release();
      if (before === false) await waitFor(() => input.signalLevelAnalysisEnabled.value === false, 'the analysis back off');
    },
  },
  {
    id: 'devices.activeAudioEngine',
    area: 'devices',
    title: 'The active audio engine is readable',
    facts: [190],
    async run({ luna, assert, note }) {
      const w = luna.activeAudioEngine.watch();
      await w.ready;
      note(`enabled ${luna.activeAudioEngine.enabled.value}, type ${luna.activeAudioEngine.engineType.value}`);
      assert(typeof luna.activeAudioEngine.enabled.value === 'boolean', 'enabled is known');
      w.release();
    },
  },
  {
    id: 'devices.autoGain',
    area: 'devices',
    title: 'Auto Gain service is reachable',
    facts: [191, 192, 193, 194],
    async run({ luna, skip, assert, note }) {
      if (!(await luna.autoGain.available())) return skip("LUNA's Auto Gain feature key is off");
      const w = luna.autoGain.watch();
      await w.ready;
      note(`status ${luna.autoGain.status.value} (${luna.autoGain.statusStr.value})`);
      assert(luna.autoGain.status.value !== undefined, 'a status');
      w.release();
    },
  },
];

export const ANALYSIS_CHECKS: Check[] = [
  {
    id: 'analysis.chords.detect',
    area: 'analysis',
    title: 'Run chord detection on a clip and wait for the job',
    facts: [200, 201, 202, 203],
    timeoutMs: 120_000,
    async run(ctx) {
      const { clip } = await audioClip(ctx);
      const result = await ctx.session.musical.chords.detect({ clip, timeoutMs: 100_000 });
      ctx.note(`job ${result.uid} ended ${result.status}${result.empty ? ' (nothing found)' : ''}`);
    },
  },
  {
    id: 'analysis.lyrics.providers',
    area: 'analysis',
    title: 'Lyric transcription providers are listed',
    facts: [204],
    async run({ session, note, assert }) {
      const p = await session.lyrics.providers();
      note(`available ${p.available}, providers ${p.providers.join(', ') || 'none'}, default ${p.defaultProvider ?? 'none'}`);
      assert(Array.isArray(p.providers), 'a provider list');
    },
  },
  {
    id: 'analysis.source',
    area: 'analysis',
    title: "A source's overview analysis is watchable",
    facts: [205, 206, 207],
    async run(ctx) {
      const { source } = await audioClip(ctx);
      const w = source.analysis.watch();
      await w.ready;
      await waitFor(() => (source.analysis.overview.count.value ?? 0) > 0, 'an overview count', 20_000);
      ctx.note(`overview count ${source.analysis.overview.count.value}, kinds ${JSON.stringify(source.analysis.kinds.value)}`);
      w.release();
    },
  },
];

export const STRUCTURE_CHECKS: Check[] = [
  {
    id: 'structure.groups',
    area: 'structure',
    title: 'Make, change, query and delete a group',
    facts: [215, 216, 217, 218],
    async run(ctx) {
      const { session, equal, assert } = ctx;
      const [a, b] = [await newAudioTrack(ctx), await newAudioTrack(ctx)];
      await session.groups.load();
      const group = await session.groups.add({ attributes: ['mix', 'edit'], name: uniqueName('Self-test group'), members: [a] });
      equal([...group.members.value ?? []], [a.id], 'the first member');
      await group.addMembers([b]);
      await waitFor(() => (group.members.value ?? []).includes(b.id), 'the second member');
      const affected = await session.groups.affectedTracks(a, 'mix');
      assert(affected.includes(a.id) && affected.includes(b.id), 'a mix edit on one member reaches both');
      await group.removeMembers([b]);
      await waitFor(() => !(group.members.value ?? []).includes(b.id), 'the second member removed');
      await group.delete();
      assert(!session.groups.byId(group.id), 'the group is gone');
    },
  },
  {
    id: 'structure.midiOutputs',
    area: 'structure',
    title: "Route a MIDI track's output to another track",
    facts: [219, 220],
    async run(ctx) {
      const source = await newMidiTrack(ctx);
      const target = await newMidiTrack(ctx);
      await source.midiOutputs.load();
      await source.midiOutputs.set([{ track: target, channel: 1 }]);
      ctx.equal(source.midiOutputs.items.map((o) => [o.destinationTrackUid.value, o.channel.value]), [[target.id, 1]], 'the assignment');
      await source.midiOutputs.set([]);
      ctx.equal(source.midiOutputs.items.length, 0, 'cleared');
    },
  },
  {
    id: 'structure.progressSuppression',
    area: 'structure',
    title: "Hold back LUNA's progress dialog and release it",
    facts: [223, 224, 225],
    async run({ luna, skip, assert }) {
      if (!(await luna.gui.available())) return skip('this LUNA has no /gui tree');
      const hold = await luna.gui.suppressProgress({ maxMs: 10_000 });
      assert(!hold.released, 'held');
      await hold.release();
      assert(hold.released, 'released');
      await hold.release();
    },
  },
];

export const AUTOMATION_CHECKS: Check[] = [
  {
    id: 'automation.range',
    area: 'automation',
    title: "Write and trim a track's gain over a range",
    facts: [227],
    async run(ctx) {
      const track = await newAudioTrack(ctx);
      await track.loadStrip();
      const gain = track.gain;
      const lane = gain.automation;
      await lane.load();
      const value = typeof gain.value.value === 'number' ? gain.value.value : 0;
      await lane.writeRange(value, { start: BAR, stop: BAR * 2 });
      await waitFor(() => lane.breakpoints.some((b) => b.tick === BAR), 'a breakpoint at the range start');
      const before = lane.breakpoints.find((b) => b.tick === BAR)?.value;
      await lane.trimRange(-0.1, { start: BAR, stop: BAR * 2 });
      await waitFor(() => lane.breakpoints.find((b) => b.tick === BAR)?.value !== before, 'the trimmed value');
      ctx.note(`breakpoints: ${lane.breakpoints.map((b) => `${b.tick / BAR}:${b.value.toFixed(3)}`).join(' ')}`);
    },
  },
  {
    id: 'automation.clipGain',
    area: 'automation',
    title: "A clip's gain control and its automation",
    facts: [228],
    async run(ctx) {
      const { clip } = await audioClip(ctx);
      await clip.controls.load();
      const gain = clip.gainControl;
      ctx.assert(gain, 'the clip has a gain control');
      const lane = gain.automation;
      await lane.load();
      await lane.insert([{ tick: (clip.start.value ?? 0) + BAR / 2, value: typeof gain.value.value === 'number' ? gain.value.value : 0 }]);
      await waitFor(() => lane.breakpoints.length > 0, 'a clip-gain breakpoint');
    },
  },
  {
    id: 'automation.warps',
    area: 'automation',
    title: 'Add, delete and clear warp markers on a clip',
    facts: [229, 230, 231],
    async run(ctx) {
      const { clip } = await audioClip(ctx);
      const warps = clip.warps;
      await warps.load();
      const marker = await warps.set({ start: BAR / 2, sourceStart: 1_000_000_000 });
      ctx.note(`marker at ${marker.start} ticks, ${marker.sourceStart} ns`);
      await waitFor(() => warps.markers.some((m) => m.start === BAR / 2), 'the marker listed');
      await warps.delete(BAR / 2);
      await waitFor(() => !warps.markers.some((m) => m.start === BAR / 2), 'the marker deleted');
      await warps.removeTimeStretch();
    },
  },
];

export const APP_CHECKS: Check[] = [
  {
    id: 'app.preferences',
    area: 'app',
    title: 'A preference context stores and reads back',
    facts: [232],
    async run({ luna, equal, note }) {
      const value = { at: new Date().toISOString() };
      await luna.preferences.context('com.uaudio.sdk-selftest').set('lastRun', value);
      // A second context object reads it as a fresh launch of the Add On would.
      const read = await luna.preferences.context('com.uaudio.sdk-selftest').get('lastRun');
      equal(read, value, 'the stored value');
      note("context com.uaudio.sdk-selftest (LUNA keeps it in com.uaudio.sdk-selftest_prefs.json)");
    },
  },
  {
    id: 'app.errors',
    area: 'app',
    title: "LUNA's error notices are readable",
    facts: [235],
    async run({ luna, assert, note }) {
      const w = luna.errors.watch();
      await w.ready;
      await luna.errors.membersReady();
      const notices = luna.errors.sorted;
      note(`${notices.length} notices${notices[0] ? `; newest: ${notices[0].level.value} ${notices[0].code.value} "${notices[0].title.value}"` : ''}`);
      assert(notices.every((n) => typeof n.code.value === 'string'), 'every notice has a code');
      w.release();
    },
  },
  {
    id: 'app.gui.setPage',
    area: 'app',
    title: 'Switch the main window between pages',
    facts: [236],
    async run({ luna, skip, equal, cleanup }) {
      if (!(await luna.gui.available())) return skip('this LUNA has no /gui tree');
      await luna.gui.watch().ready;
      const before = luna.gui.main.page.value;
      if (before && before !== 'lunaplay') cleanup(() => luna.gui.setPage(before as 'timeline'));
      await luna.gui.setPage('mixer');
      equal(luna.gui.main.page.value, 'mixer', 'the page after setPage');
      await luna.gui.setPage('timeline');
      equal(luna.gui.main.page.value, 'timeline', 'the page after setPage');
      let refused = '';
      await luna.gui.setPage('lunaplay' as 'timeline').catch((e: { code?: string }) => (refused = e.code ?? 'error'));
      equal(refused, 'uasrv.invalid_value', 'setting lunaplay');
    },
  },
];

export const FOLLOW_UP_CHECKS: Check[] = [
  {
    id: 'tracks.postRecordCommands',
    area: 'tracks',
    title: 'Set and clear what LUNA runs after a take; read the detected instrument',
    facts: [233],
    async run(ctx) {
      const track = await newAudioTrack(ctx);
      await track.postRecordCommands.set(['extract_lyrics']);
      await waitFor(async () => JSON.stringify((await ctx.luna.raw.get(`${track.path}/post_record_commands`) as { value?: unknown })?.value) === '["extract_lyrics"]', 'LUNA to hold the list');
      await track.postRecordCommands.set([]);
      await waitFor(async () => JSON.stringify((await ctx.luna.raw.get(`${track.path}/post_record_commands`) as { value?: unknown })?.value) === '[]', 'LUNA to clear the list');
      ctx.note(`instrument_determined: ${JSON.stringify(track.instrumentDetermined.value)}`);
    },
  },
  {
    id: 'session.commandEnabled',
    area: 'session',
    title: "A command's enabled state is followed",
    facts: [234],
    async run({ session, equal }) {
      const paste = session.context.commandEnabled('paste');
      const redo = session.commandEnabled('redo');
      await waitFor(() => typeof paste.value === 'boolean' && typeof redo.value === 'boolean', 'both enabled states');
      equal(typeof paste.value, 'boolean', 'paste publishes its state');
    },
  },
];
