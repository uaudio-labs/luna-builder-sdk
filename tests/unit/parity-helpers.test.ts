/**
 * Pure helpers and definitions ported from LUNA's client: dB and linear gain, note lengths,
 * insert slots and extension ids, plug-in formats, value lists (fact 181), error codes, the
 * folder tree (facts 136, 182), and the save dialog's release command (fact 180).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

describe('Luna.gainToDb / Luna.dbToGain', () => {
  it('converts linear gain and dB both ways', () => {
    expect(Luna.gainToDb(1)).toBe(0);
    expect(Luna.gainToDb(10)).toBeCloseTo(20, 12);
    expect(Luna.gainToDb(0.5)).toBeCloseTo(-6.0206, 4);
    expect(Luna.dbToGain(0)).toBe(1);
    expect(Luna.dbToGain(-20)).toBeCloseTo(0.1, 12);
    expect(Luna.dbToGain(Luna.gainToDb(0.3))).toBeCloseTo(0.3, 12);
  });

  it('treats silence as -Infinity and back', () => {
    expect(Luna.gainToDb(0)).toBe(-Infinity);
    expect(Luna.gainToDb(-1)).toBe(-Infinity);
    expect(Luna.gainToDb(Number.NaN)).toBe(-Infinity);
    expect(Luna.dbToGain(-Infinity)).toBe(0);
  });

  it('is not the fader taper', () => {
    // -6 dB is 0.501 linear, but 0.6727 on the +12 fader.
    expect(Luna.dbToGain(-6)).toBeCloseTo(0.5012, 4);
    expect(Luna.Taper.named('+12')!.toNormalized(-6)).toBeCloseTo(0.6727, 4);
  });
});

describe('note lengths', () => {
  it('halves down to the 128th note, in engine ticks', () => {
    expect(Luna.THIRTY_SECOND_NOTE).toBe(Luna.WHOLE_NOTE / 32);
    expect(Luna.SIXTY_FOURTH_NOTE).toBe(Luna.WHOLE_NOTE / 64);
    expect(Luna.ONE_TWENTY_EIGHTH_NOTE).toBe(Luna.WHOLE_NOTE / 128);
    expect(Luna.ONE_TWENTY_EIGHTH_NOTE).toBe(3e9);
  });

  it('dots and triplets a note', () => {
    expect(Luna.dotted(Luna.QUARTER_NOTE)).toBe(144e9);
    expect(Luna.triplet(Luna.EIGHTH_NOTE)).toBe(32e9);
    expect(3 * Luna.triplet(Luna.QUARTER_NOTE)).toBe(2 * Luna.QUARTER_NOTE);
    expect(Number.isInteger(Luna.triplet(Luna.ONE_TWENTY_EIGHTH_NOTE))).toBe(true);
  });
});

describe('insert slots and extensions', () => {
  it('tells record FX slots from the rest', () => {
    expect(['record_fx_0', 'record_fx_3', 'effect_0', 'console', 'record_fx_', 'xrecord_fx_1'].map(Luna.isRecordFxSlot)).toEqual([true, true, false, false, false, false]);
  });

  it('maps alias plug-in ids to their slot', () => {
    expect(Luna.insertSlotForAlias('alias.console')).toBe('console');
    expect(Luna.insertSlotForAlias('alias.channel_strip')).toBe('console');
    expect(Luna.insertSlotForAlias('alias.tape')).toBe('tape');
    expect(Luna.insertSlotForAlias('alias.effect_2')).toBe('effect_2');
    expect(Luna.insertSlotForAlias('alias.nope')).toBeUndefined();
    expect(Luna.insertSlotForAlias('alias.record_fx_16')).toBeUndefined();
    expect(Luna.insertSlotForAlias('console')).toBeUndefined();
    expect(Luna.insertSlotForAlias('alias.toString')).toBeUndefined();
    expect(Luna.isInsertAliasPluginId('alias.console')).toBe(true);
    expect(Luna.isInsertAliasPluginId('com.uaudio.uadx.1176')).toBe(false);
  });

  it('knows LUNA’s extension ids exactly', () => {
    expect(Luna.isLunaExtensionPluginId('uaudio_luna_channel')).toBe(true);
    expect(Luna.isLunaExtensionPluginId('UAD API Preamp')).toBe(true);
    expect(Luna.isLunaExtensionPluginId('uaudio_luna_channel ')).toBe(false);
    expect(Luna.isLunaExtensionPluginId('com.uaudio.uadx.1176')).toBe(false);
    expect(Luna.LUNA_EXTENSION_PLUGIN_IDS).toHaveLength(11);
    expect(Luna.LUNA_EXTENSION_PLUGIN_IDS).toContain(Luna.LUNA_CHANNEL_PLUGIN_ID);
  });

  it('guesses a plug-in’s format from its id as LUNA does', () => {
    expect(
      ['com.x.vst.Foo', 'com.x.vst3.Foo', 'com.x.au.Foo', 'cloud:identity', 'localml:identity', 'UAD 1176LN', 'com.uaudio.uadx.1176', 'UADx 1176', 'weird', 'com.x.myvst3'].map(Luna.pluginFormat),
    ).toEqual(['vst', 'vst3', 'au', 'cloud', 'localml', 'uad2', 'uadx', 'uadx', 'uadx', 'uadx']);
    // The third-party patterns win over a prefix, in LUNA's order.
    expect(Luna.pluginFormat('UAD .vst3.x')).toBe('vst3');
  });
});

describe('value lists (fact 181)', () => {
  it('parses track, folder and stem values exactly', () => {
    expect(Luna.TRACK_TYPES).toContain('midi_matrix');
    expect([Luna.parseTrackType('instrument'), Luna.parseTrackType('Audio'), Luna.parseTrackType(null)]).toEqual(['instrument', undefined, undefined]);
    expect([Luna.parseFolderMode('container'), Luna.parseFolderMode(''), Luna.parseFolderMode(1)]).toEqual(['container', undefined, undefined]);
    expect([Luna.parseStemFormat('stereo'), Luna.parseStemFormat('lcr'), Luna.parseStemFormat('LCR'), Luna.parseStemFormat('mid-side')]).toEqual(['stereo', 'lcr', undefined, undefined]);
  });

  it('parses bus types, cue buses included up to cue_63', () => {
    expect(['aux', 'master', 'cue_0', 'cue_63', 'cue_64', 'cue_01', 'cue_', 'cue'].map(Luna.parseBusType)).toEqual(['aux', 'master', 'cue_0', 'cue_63', undefined, undefined, undefined, undefined]);
  });

  it('parses session types by name or by index, and hides history and track presets', () => {
    expect(Luna.SESSION_TYPES[3]).toBe('template');
    expect([Luna.parseSessionType(3), Luna.parseSessionType('track_preset'), Luna.parseSessionType('session_template'), Luna.parseSessionType(8), Luna.parseSessionType(1.5)]).toEqual(['template', 'track_preset', undefined, undefined, undefined]);
    expect([2, 'history', 4, 'track_preset', 0, 'template', 'nope'].map(Luna.isHiddenSessionType)).toEqual([true, true, true, true, false, false, false]);
  });

  it('lists every LUNA control type', () => {
    expect(Luna.CONTROL_TYPES).toHaveLength(33);
    expect(new Set(Luna.CONTROL_TYPES).size).toBe(33);
    expect(Luna.CONTROL_TYPES).toEqual(expect.arrayContaining(['gain', 'audio_source', 'input_trim_link', 'preamp_max_compressor']));
    expect([Luna.parseControlType('preamp_48v'), Luna.parseControlType('preamp_embedded_auto_gain_active'), Luna.parseControlType('48v')]).toEqual(['preamp_48v', undefined, undefined]);
  });
});

describe('Luna.ErrorCodes', () => {
  it('spells LUNA’s codes as the engine sends them', () => {
    expect(Luna.ErrorCodes.NOT_INSTALLED).toBe('uasrv.not_installed');
    expect(Luna.ErrorCodes.INVALID_VALUE).toBe('uasrv.invalid_value');
    expect(Luna.ErrorCodes.DATABASE_ERROR).toBe('device.database_error');
    expect(Luna.ErrorCodes.MISSING_PLUGIN).toBe(Luna.PLUGIN_ERROR_MISSING);
  });

  it('matches the codes the SDK’s own errors carry', () => {
    expect(new Luna.NotRunning('ws://x').code).toBe(Luna.ErrorCodes.NOT_RUNNING);
    expect(new Luna.RequestTimeout('get', '/x', 1).code).toBe(Luna.ErrorCodes.TIMEOUT);
    expect(new Luna.ConnectionLost().code).toBe(Luna.ErrorCodes.DISCONNECTED);
    expect(new Luna.Unsupported('x').code).toBe(Luna.ErrorCodes.UNSUPPORTED);
    expect(new Luna.NoSessionOpen().code).toBe(Luna.ErrorCodes.NO_SESSION);
    expect(new Luna.Disposed('x').code).toBe(Luna.ErrorCodes.DISPOSED);
  });

  it('matches what a refused command rejects with', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Drums'], name: 'Demo' });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const err = await session.moveToFolder(['Drums'], session.master!).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Luna.Error);
    expect((err as Luna.Error).code).toBe(Luna.ErrorCodes.INVALID_VALUE);
    luna.close();
  });
});

/** A plain channel for the tree. */
function ch(id: string, order: number | undefined, folderUid: string | null = null, folderMode?: Luna.FolderMode): Luna.FolderChannel {
  return { id, order: { value: order }, folderUid: { value: folderUid }, ...(folderMode ? { folderMode: { value: folderMode } } : {}) };
}

const outline = (rows: readonly Luna.FolderRow<Luna.FolderChannel>[]) => rows.map((r) => `${'.'.repeat(r.depth)}${r.id}`);

describe('Luna.folderTree', () => {
  // A (summing) > [t1, B (container) > [t2, C (summing) > [t3]]], t4 at the root.
  const channels = [
    ch('t3', 6, 'C'),
    ch('t4', 7),
    ch('B', 3, 'A', 'container'),
    ch('A', 1, null, 'summing'),
    ch('t1', 2, 'A'),
    ch('C', 5, 'B', 'summing'),
    ch('t2', 4, 'B'),
  ];

  it('orders rows depth first by order, with depths, parents and children', () => {
    const tree = Luna.folderTree(channels);
    expect(outline(tree.rows)).toEqual(['A', '.t1', '.B', '..t2', '..C', '...t3', 't4']);
    expect(tree.roots.map((r) => r.id)).toEqual(['A', 't4']);
    expect(tree.row('B')).toMatchObject({ parentId: 'A', depth: 1, isFolder: true, childIds: ['t2', 'C'] });
    expect(tree.row('t1')).toMatchObject({ parentId: 'A', isFolder: false, childIds: [] });
    expect(tree.anomalies).toEqual([]);
  });

  it('hides what is inside collapsed folders, nested ones included', () => {
    const tree = Luna.folderTree(channels);
    expect(outline(tree.visibleRows({ collapsed: ['B'] }))).toEqual(['A', '.t1', '.B', 't4']);
    expect(outline(tree.visibleRows({ collapsed: ['C', 'B'] }))).toEqual(['A', '.t1', '.B', 't4']);
    expect(outline(tree.visibleRows({ collapsed: ['C'] }))).toEqual(['A', '.t1', '.B', '..t2', '..C', 't4']);
    // Ids of tracks or of nothing are ignored; null is no list.
    expect(outline(tree.visibleRows({ collapsed: ['t1', 'gone'] }))).toHaveLength(7);
    expect(outline(tree.visibleRows({ collapsed: null }))).toHaveLength(7);
  });

  it('shows a later folder’s contents after a collapsed one ends', () => {
    const tree = Luna.folderTree([ch('F1', 1, null, 'summing'), ch('G', 2, 'F1', 'summing'), ch('x', 3, 'G'), ch('F2', 4, null, 'summing'), ch('H', 5, 'F2', 'summing'), ch('y', 6, 'H')]);
    expect(outline(tree.visibleRows({ collapsed: ['G'] }))).toEqual(['F1', '.G', 'F2', '.H', '..y']);
  });

  it('filters single rows, and a filtered-out folder still hides its contents', () => {
    const tree = Luna.folderTree(channels);
    expect(outline(tree.visibleRows({ filter: (r) => !r.isFolder }))).toEqual(['.t1', '..t2', '...t3', 't4']);
    expect(outline(tree.visibleRows({ collapsed: ['B'], filter: (r) => r.id !== 'B' }))).toEqual(['A', '.t1', 't4']);
  });

  it('lists a folder’s descendants and widens a selection (fact 182)', () => {
    const tree = Luna.folderTree(channels);
    expect(tree.descendants('B').map((r) => r.id)).toEqual(['t2', 'C', 't3']);
    expect(tree.descendants('t1')).toEqual([]);
    expect(tree.descendants('gone')).toEqual([]);
    expect(tree.expandSelection(['t4', 'B', 't3', 'gone'])).toEqual(['t4', 'B', 't2', 'C', 't3']);
    expect(tree.expandSelection(['t3', 't1'])).toEqual(['t3', 't1']);
  });

  it('routes to the nearest summing folder, through containers, else the master (fact 136)', () => {
    const tree = Luna.folderTree(channels);
    const target = (id: string) => tree.summingFolder(id)?.id ?? null;
    expect([target('t1'), target('B'), target('t2'), target('C'), target('t3'), target('A'), target('t4'), target('gone')]).toEqual(['A', 'A', 'A', 'A', 'C', null, null, null]);
  });

  it('reports malformed links without losing a row', () => {
    const tree = Luna.folderTree([
      ch('F', 1, null, 'summing'),
      ch('self', 2, 'self'),
      ch('orphan', 3, 'missing'),
      ch('inTrack', 4, 'plain'),
      ch('plain', 5),
      ch('demoted', 6, null, 'none'),
      ch('kid', 7, 'demoted'),
      ch('x', 8, 'y', 'summing'),
      ch('y', 9, 'x', 'summing'),
      ch('below', 10, 'y'),
      ch('F', 11),
    ]);
    expect(tree.anomalies).toEqual([
      { kind: 'duplicate-id', id: 'F' },
      { kind: 'self-parent', id: 'self', folderUid: 'self' },
      { kind: 'dangling-parent', id: 'orphan', folderUid: 'missing' },
      { kind: 'non-folder-parent', id: 'inTrack', folderUid: 'plain' },
      { kind: 'non-folder-parent', id: 'kid', folderUid: 'demoted' },
      { kind: 'cycle', id: 'x', folderUid: 'y' },
    ]);
    expect(outline(tree.rows)).toEqual(['F', 'self', 'orphan', 'plain', '.inTrack', 'demoted', '.kid', 'x', '.y', '..below']);
    expect(tree.rows).toHaveLength(10);
    // The routing walk follows the raw links and stops at the loop.
    expect(tree.summingFolder('below')?.id).toBe('y');
    expect(tree.summingFolder('x')?.id).toBe('y');
    expect(tree.summingFolder('kid')).toBeNull();
  });

  it('puts rows with no order yet last, keeping their input order', () => {
    const tree = Luna.folderTree([ch('late1', undefined), ch('b', 2), ch('late2', undefined), ch('a', 1)]);
    expect(tree.rows.map((r) => r.id)).toEqual(['a', 'b', 'late1', 'late2']);
  });

  it('builds from a session’s tracks and buses', async () => {
    const engine = new Luna.MockEngine();
    engine.addSession('abc', { tracks: ['Drums', 'Bass'], name: 'Demo' });
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    const session = await luna.session();
    await session.ready();
    const outer = await session.newFolder({ name: 'Rhythm', mode: 'container' });
    const inner = await session.newFolder({ name: 'Kit', folderUid: outer.id });
    await session.moveToFolder(['Drums'], inner);
    await luna.settled();
    const tree = Luna.folderTree(session);
    const drums = session.tracks.byId('Drums')!;
    expect(tree.row(drums)).toMatchObject({ depth: 2, parentId: inner.id });
    expect(tree.row(inner)!.channel).toBe(inner);
    expect(tree.descendants(outer).map((r) => r.channel)).toEqual([inner, drums]);
    expect(tree.summingFolder(drums)).toBe(inner);
    expect(tree.summingFolder(inner)).toBeNull();
    expect(tree.rows.map((r) => r.channel)).toEqual(session.channelsInOrder);
    expect(tree.anomalies).toEqual([]);
    luna.close();
  });
});

describe('save dialog release (fact 180)', () => {
  async function connected() {
    const engine = new Luna.MockEngine();
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    return { engine, luna };
  }
  const released = (engine: Luna.MockEngine) => engine.requests.map((r) => r.path).filter((p) => p.startsWith('/gui/release_'));

  it('releases with release_file_chooser, as LUNA names it', async () => {
    const { engine, luna } = await connected();
    engine.nextDialogFiles = ['/tmp/out.wav'];
    expect(await luna.gui.chooseSavePath({ extensions: ['wav'] })).toBe('/tmp/out.wav');
    expect(released(engine)).toEqual(['/gui/release_file_chooser']);
    luna.close();
  });

  it('falls back to release_save_dialog on a LUNA without release_file_chooser', async () => {
    const { engine, luna } = await connected();
    engine.fail('/gui/release_file_chooser', 'uasrv.invalid_object');
    engine.nextDialogFiles = [];
    expect(await luna.gui.chooseSavePath()).toBeUndefined();
    expect(released(engine)).toEqual(['/gui/release_file_chooser', '/gui/release_save_dialog']);
    luna.close();
  });
});
