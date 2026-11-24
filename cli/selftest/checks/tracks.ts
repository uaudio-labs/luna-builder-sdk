/** @hidden Self-test checks for tracks, buses, effects, presets and plug-ins (facts 165-178). */
import type { Effect } from '../../../src/model/effect';
import type { Track } from '../../../src/model/track';
import { BAR, audioClip, newAudioTrack, uniqueName, waitFor } from '../fixtures';
import type { Check, CheckContext } from '../runner';

const area = 'tracks';

/** An effect plug-in this LUNA can load into an insert: an Apple AU effect if there is one. */
async function effectPluginId(ctx: CheckContext): Promise<string> {
  await ctx.luna.plugins.load();
  const ids = ctx.luna.plugins.items.map((p) => p.pluginId.value ?? p.id).filter((id): id is string => typeof id === 'string');
  const pick = ids.find((id) => id.startsWith('com.appl.au.aufx_')) ?? ids.find((id) => id.includes('.au.') && !id.includes('aumu'));
  if (!pick) ctx.skip('no AU effect plug-in to load into an insert');
  return pick;
}

/** A track with `pluginId` in its first insert slot. */
async function trackWithEffect(ctx: CheckContext, pluginId: string): Promise<{ track: Track; effect: Effect }> {
  const track = await newAudioTrack(ctx);
  await track.effects.load();
  const effect = await track.insert(pluginId);
  if (!effect) throw new Error('insert() found no free slot');
  await waitFor(() => effect.pluginId.value === pluginId, 'the plug-in in the slot');
  return { track, effect };
}

export const TRACK_CHECKS: Check[] = [
  {
    id: 'tracks.rename',
    area,
    title: "Rename a track as the user's own name",
    facts: [165],
    async run(ctx) {
      const track = await newAudioTrack(ctx);
      const name = uniqueName('Self-test renamed');
      await track.rename(name);
      await waitFor(() => track.name.value === name, 'the new name');
      await waitFor(() => track.nameModified.value === true, 'name_modified true');
    },
  },
  {
    id: 'tracks.duplicate',
    area,
    title: 'Duplicate a track after another and get the new Track',
    facts: [166],
    async run(ctx) {
      const first = await newAudioTrack(ctx);
      const track = await newAudioTrack(ctx);
      const copy = await track.duplicate({ after: first });
      ctx.assert(copy.id !== track.id, 'a new track');
      // Right after `first`, so before the source, which came after it.
      await waitFor(() => (copy.order.value ?? -1) === (first.order.value ?? -2) + 1 && (track.order.value ?? 0) > (copy.order.value ?? 0), 'the copy right after the other track');
    },
  },
  {
    id: 'tracks.automationMode.bus',
    area,
    title: 'Set a bus automation mode',
    facts: [167],
    async run({ session }) {
      const bus = await session.newBus({ name: uniqueName('Self-test bus') });
      await bus.setAutomationMode('read');
      const read = bus.automationMode.value;
      await bus.setAutomationMode('touch');
      await waitFor(() => bus.automationMode.value !== read, 'the bus automation mode to change');
    },
  },
  {
    id: 'tracks.bus.delete',
    area,
    title: 'Delete a bus, and a folder with its contents',
    facts: [168],
    async run(ctx) {
      const { session, assert } = ctx;
      const bus = await session.newBus({ name: uniqueName('Self-test bus') });
      await bus.delete();
      assert(!session.buses.byId(bus.id), 'the bus is gone');
      const folder = await session.newFolder({ name: uniqueName('Self-test folder') });
      const inside = await newAudioTrack(ctx);
      await session.moveToFolder([inside], folder);
      await waitFor(() => inside.folderUid.value === folder.id, 'the track inside the folder');
      await folder.deleteWithContents();
      assert(!session.buses.byId(folder.id) && !session.tracks.byId(inside.id), 'the folder and its track are gone');
    },
  },
  {
    id: 'tracks.playlists.delete',
    area,
    title: "Delete a track's unused playlists",
    facts: [170],
    async run(ctx) {
      const { session } = ctx;
      const track = await newAudioTrack(ctx);
      const mine = () => session.playlists.items.filter((p) => p.trackUid.value === track.id);
      await session.newPlaylists([track.id]);
      await waitFor(() => mine().length >= 2, 'a second playlist');
      await session.deleteUnusedPlaylists([track]);
      await waitFor(() => mine().length === 1, 'only the active playlist left');
      ctx.equal(mine()[0]?.id, track.playlistUid.value, 'the active playlist is the one kept');
    },
  },
  {
    id: 'tracks.effect.power',
    area,
    title: "Turn an insert's power off and on",
    facts: [171],
    async run(ctx) {
      const { effect } = await trackWithEffect(ctx, await effectPluginId(ctx));
      await effect.setPower(false);
      ctx.equal(effect.pluginPower.value, false, 'power off');
      await effect.setPower(true);
      ctx.equal(effect.pluginPower.value, true, 'power on');
    },
  },
  {
    id: 'tracks.effect.copy',
    area,
    title: 'Copy an insert to another track, and refuse a slot of another kind',
    facts: [173],
    async run(ctx) {
      const pluginId = await effectPluginId(ctx);
      const { effect } = await trackWithEffect(ctx, pluginId);
      const other = await newAudioTrack(ctx);
      await other.effects.load();
      const dest = other.effectSlots.find((e) => e.isEmpty);
      if (!dest) throw new Error('no empty slot on the second track');
      await effect.copyTo(dest);
      ctx.equal(dest.pluginId.value, pluginId, 'the copy');
      ctx.equal(effect.pluginId.value, pluginId, 'the original stays');
      const console = other.effects.items.find((e) => e.id === 'console');
      if (console) {
        let code = '';
        await effect.copyTo(console).catch((e: { code?: string }) => (code = e.code ?? 'error'));
        ctx.equal(code, 'invalid_slot', 'copying into the console slot');
      } else {
        ctx.note('no console slot on this track; the slot-kind guard was not exercised');
      }
    },
  },
  {
    id: 'tracks.newTracksFromInputs',
    area,
    title: 'Make a track from an audio input',
    facts: [172],
    async run({ luna, session, skip, assert, note }) {
      const inputs = await luna.audioInputs();
      const input = inputs.find((i) => !i.inUse) ?? inputs[0];
      if (!input) return skip('no audio inputs (connect an audio interface)');
      const tracks = await session.newTracksFromInputs({ inputUids: [input.uid] });
      note(`input "${input.name}" made ${tracks.length} track(s)`);
      assert(tracks.length >= 1, 'at least one track');
      await waitFor(() => tracks[0]!.inputNodeUid.value === input.uid, 'the track on the input');
    },
  },
  {
    id: 'tracks.moveClips.crossTrack',
    area,
    title: 'Move a clip to another track',
    facts: [174],
    async run(ctx) {
      const { session } = ctx;
      const { track } = await audioClip(ctx);
      const target = await newAudioTrack(ctx);
      const from = session.playlistFor(track);
      const to = session.playlistFor(target);
      if (!from || !to) throw new Error('a track has no playlist');
      await Promise.all([from.clips.load(), to.clips.load()]);
      await session.moveClips(0, { startTick: 0, stopTick: BAR * 2, trackUids: [track.id], playlists: [{ from, to }] });
      await waitFor(() => to.clips.items.length === 1, 'the clip on the second track');
      await waitFor(() => from.clips.items.length === 0, 'the first track empty');
    },
  },
  {
    id: 'tracks.presets',
    area,
    title: "Preset favourites, descriptions and a track preset's plug-ins",
    facts: [169, 175, 176],
    timeoutMs: 60_000,
    async run({ luna, session, skip, note, equal, cleanup }) {
      const rows = await luna.presets.query({ deviceTypeId: 'track', withDescriptions: true });
      const preset = rows[0];
      if (!preset) return skip('no track presets installed');
      note(`${rows.length} track presets; "${preset.name}" description ${JSON.stringify(preset.description)}`);
      const before = preset.favorite;
      cleanup(() => luna.presets.setFavorite(preset, before));
      await luna.presets.setFavorite(preset, !before);
      const after = (await luna.presets.query({ deviceTypeId: 'track' })).find((r) => r.uid === preset.uid);
      equal(after?.favorite, !before, 'the favourite flag');
      const plugins = await luna.presets.trackPresetPlugins(preset);
      note(`its plug-ins: ${plugins === undefined ? 'unknown' : plugins.map((p) => p.pluginId).join(', ') || 'none'}`);
      const bus = await session.newBus({ name: uniqueName('Self-test bus') });
      await bus.loadPreset(preset);
      await waitFor(() => bus.presetUid.value === preset.uid, 'the preset on the bus');
    },
  },
  {
    id: 'tracks.plugin.sdkType',
    area,
    title: "LUNA reports each plug-in's format",
    facts: [177],
    async run({ luna, skip, assert, note }) {
      await luna.plugins.load();
      const plugins = luna.plugins.items;
      if (plugins.length === 0) skip('no plug-ins listed');
      if (plugins.every((p) => p.sdkType.value === undefined)) return skip('this LUNA publishes no sdk_type on its plug-ins (newer builds do, fact 177)');
      const types = new Map<string, number>();
      for (const p of plugins) types.set(String(p.sdkType.value), (types.get(String(p.sdkType.value)) ?? 0) + 1);
      note([...types].map(([t, n]) => `${t}: ${n}`).join(', '));
      assert(plugins.every((p) => typeof p.sdkType.value === 'string'), 'every plug-in has an sdk_type');
    },
  },
  {
    id: 'tracks.gui.pluginWindow',
    area,
    title: "Open and close a plug-in's window in the main window",
    facts: [178],
    async run(ctx) {
      if (process.env['UA_SELFTEST_UI'] !== '1') ctx.skip('opens a plug-in window in LUNA; set UA_SELFTEST_UI=1 to run it');
      if (!(await ctx.luna.gui.available())) ctx.skip('this LUNA has no /gui tree');
      const { track, effect } = await trackWithEffect(ctx, await effectPluginId(ctx));
      await ctx.luna.gui.showPlugin(track.id, effect.id, { sessionUid: ctx.session.uid, contextType: 'main' });
      await ctx.luna.gui.hidePlugin(track.id, effect.id, { sessionUid: ctx.session.uid, contextType: 'main' });
    },
  },
];
