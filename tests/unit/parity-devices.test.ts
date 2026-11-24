/**
 * Devices and inputs parity: watchable device inputs and outputs (facts 185, 189), input
 * analyses held by reference (facts 186-188), the active audio engine (fact 190) and Auto Gain
 * (facts 191-194).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';
import { analysisHolds } from '../../src/model/devices';

async function rig(options: { autoGain?: boolean } = {}) {
  const engine = new Luna.MockEngine(options.autoGain === false ? { autoGain: false } : {});
  engine.addSession('abc', { tracks: ['Drums', 'Keys'], name: 'Demo' });
  engine.addDevice('Apollo', { inputs: ['Mic 1', 'Mic 2'], outputs: ['Monitor L/R'], stemFormat: 'mono', ioType: 'Mic', autoGain: true });
  engine.addDevice('BuiltIn', { inputs: ['Internal Mic'] });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  await luna.devices.load();
  const apollo = luna.devices.byId('Apollo')!;
  return { engine, luna, apollo };
}

function sets(engine: Luna.MockEngine, prop: string) {
  return engine.requests.filter((r) => r.verb === 'set' && r.path.endsWith(`/${prop}`));
}

describe('Device.inputs', () => {
  it('loads every input with its properties', async () => {
    const { luna, apollo } = await rig();
    await apollo.inputs.load();
    const mic = apollo.inputs.byId('in_2')!;
    expect(apollo.inputs.items.map((i) => i.name.value)).toEqual(['Mic 1', 'Mic 2']);
    expect(mic).toBeInstanceOf(Luna.DeviceInput);
    expect(mic.type.value).toBe('input');
    expect(mic.stemFormat.value).toBe('mono');
    expect(mic.deviceChannels.value).toEqual([1]);
    expect(mic.channelIndex.value).toEqual([1]);
    expect(mic.ioType.value).toEqual(['Mic']);
    expect(mic.inUse.value).toBe(false);
    expect(mic.ioDesc.value).toMatchObject({ name: 'Mic 2', stem_format: 'mono', device_channels: [1] });
    expect(mic.signalLevelAnalysisEnabled.value).toBe(false);
    expect(mic.signalLevelPeak.value).toBe(-144);
    await luna.close();
  });

  it('follows hotplug while watched', async () => {
    const { engine, luna, apollo } = await rig();
    // The mock delivers deeper pushes to any subscription; native LUNA needs a recursive one
    // for the inputs' properties (fact 185), so check what was asked for.
    const asked: unknown[] = [];
    const subscribe = luna.raw.subscribe.bind(luna.raw);
    luna.raw.subscribe = (path, handler, options) => {
      if (path === '/devices/Apollo/inputs') asked.push(options);
      return subscribe(path, handler, options);
    };
    const w = apollo.inputs.watch();
    await w.ready;
    expect(asked).toEqual([{ recursive: true }]);
    let changes = 0;
    apollo.inputs.onChange(() => changes++);
    engine.addDeviceInput('Apollo', 'Hi-Z', { uid: 'hiz', stemFormat: 'stereo', channel: 2 });
    await engine.settled();
    await luna.settled();
    const hiz = apollo.inputs.byId('hiz')!;
    expect(hiz.name.value).toBe('Hi-Z');
    expect(hiz.deviceChannels.value).toEqual([4, 5]);
    const gone = apollo.inputs.byId('in_1')!;
    engine.removeNode('/devices/Apollo/inputs/in_1');
    await engine.settled();
    await luna.settled();
    expect(apollo.inputs.items.map((i) => i.id)).toEqual(['in_2', 'hiz']);
    expect(gone.disposed).toBe(true);
    expect(changes).toBeGreaterThanOrEqual(2);
    w.release();
    await luna.close();
  });

  it('follows in_use as tracks are routed to it', async () => {
    const { engine, luna, apollo } = await rig();
    const session = await luna.session();
    const w = apollo.inputs.watch();
    await w.ready;
    const mic = apollo.inputs.byId('in_1')!;
    await session.tracks.byId('Drums')!.inputNodeUid.set('in_1');
    await engine.settled();
    expect(mic.inUse.value).toBe(true);
    await session.tracks.byId('Drums')!.inputNodeUid.set(null);
    await engine.settled();
    expect(mic.inUse.value).toBe(false);
    w.release();
    await luna.close();
  });

  it('keeps luna.audioInputs() working, and snapshot() gives the same record', async () => {
    const { luna, apollo } = await rig();
    const inputs = await luna.audioInputs();
    expect(inputs.map((i) => i.name)).toEqual(['Mic 1', 'Mic 2', 'Internal Mic']);
    await apollo.inputs.load();
    expect(apollo.inputs.items[0]!.snapshot()).toEqual(inputs[0]);
    await luna.close();
  });

  it('a device in /devices with no inputs folder has an empty collection', async () => {
    const engine = new Luna.MockEngine();
    engine.addMidiDevice('Keys');
    await engine.settled();
    const luna = await Luna.connect({ port_: engine.port() });
    await luna.devices.load();
    const device = luna.devices.items[0]!;
    await device.inputs.load();
    expect(device.inputs.items).toEqual([]);
    await luna.close();
  });
});

describe('DeviceInput.watchAnalysis', () => {
  it('turns the analysis on, follows its result, and turns it off on release', async () => {
    const { engine, luna, apollo } = await rig();
    await apollo.inputs.load();
    const mic = apollo.inputs.byId('in_1')!;
    const hold = mic.watchAnalysis('signal_level');
    await hold.ready;
    expect(engine.value('/devices/Apollo/inputs/in_1', 'signal_level_analysis_enabled')).toBe(true);
    expect(engine.setInputAnalysis('Apollo', 'in_1', { signalLevelPeak: 0.25 })).toBe(true);
    await engine.settled();
    expect(mic.signalLevelPeak.value).toBe(0.25);
    hold.release();
    await luna.store.readsSettled();
    await engine.settled();
    await new Promise((r) => setTimeout(r, 0));
    await engine.settled();
    expect(engine.value('/devices/Apollo/inputs/in_1', 'signal_level_analysis_enabled')).toBe(false);
    await luna.close();
  });

  it('is reference-counted: one write on, one write off', async () => {
    const { engine, luna, apollo } = await rig();
    await apollo.inputs.load();
    const mic = apollo.inputs.byId('in_1')!;
    const a = mic.watchAnalysis('tempo');
    const b = mic.watchAnalysis('tempo');
    await Promise.all([a.ready, b.ready]);
    expect(analysisHolds(luna, mic.path, 'tempo')).toBe(2);
    expect(sets(engine, 'tempo_analysis_enabled')).toHaveLength(1);
    a.release();
    a.release(); // idempotent
    await new Promise((r) => setTimeout(r, 5));
    expect(engine.value(mic.path, 'tempo_analysis_enabled')).toBe(true);
    b.release();
    await new Promise((r) => setTimeout(r, 5));
    await engine.settled();
    expect(engine.value(mic.path, 'tempo_analysis_enabled')).toBe(false);
    expect(sets(engine, 'tempo_analysis_enabled').map((r) => r.data)).toEqual([true, false]);
    await luna.close();
  });

  it('leaves alone a switch someone else had on', async () => {
    const { engine, luna, apollo } = await rig();
    engine.setValue('/devices/Apollo/inputs/in_2', 'stereo_detect_analysis_enabled', true);
    await engine.settled();
    await apollo.inputs.load();
    const mic = apollo.inputs.byId('in_2')!;
    const hold = mic.watchAnalysis('stereo_detect');
    await hold.ready;
    hold.release();
    await new Promise((r) => setTimeout(r, 5));
    await engine.settled();
    expect(sets(engine, 'stereo_detect_analysis_enabled')).toEqual([]);
    expect(engine.value(mic.path, 'stereo_detect_analysis_enabled')).toBe(true);
    await luna.close();
  });

  it('a hold taken right after the last release ends with the analysis on', async () => {
    const { engine, luna, apollo } = await rig();
    await apollo.inputs.load();
    const mic = apollo.inputs.byId('in_1')!;
    const first = mic.watchAnalysis('instrument');
    await first.ready;
    first.release();
    const second = mic.watchAnalysis('instrument');
    await second.ready;
    await engine.settled();
    expect(engine.value(mic.path, 'instrument_analysis_enabled')).toBe(true);
    engine.setInputAnalysis('Apollo', 'in_1', { instrument: 'Vocal' });
    await engine.settled();
    expect(mic.instrument.value).toBe('Vocal');
    second.release();
    await luna.close();
  });

  it('a hold released before it was ready, and taken again at once, still ends on', async () => {
    const { engine, luna, apollo } = await rig();
    await apollo.inputs.load();
    const mic = apollo.inputs.byId('in_2')!;
    const first = mic.watchAnalysis('signal_level');
    first.release();
    const second = mic.watchAnalysis('signal_level');
    await second.ready;
    await new Promise((r) => setTimeout(r, 5));
    await engine.settled();
    expect(engine.value(mic.path, 'signal_level_analysis_enabled')).toBe(true);
    second.release();
    await luna.close();
  });

  it('the result returns to its no-result value when the analysis goes off', async () => {
    const { engine, luna, apollo } = await rig();
    const w = apollo.inputs.watch();
    await w.ready;
    const mic = apollo.inputs.byId('in_1')!;
    const hold = mic.watchAnalysis('tempo');
    await hold.ready;
    engine.setInputAnalysis('Apollo', 'in_1', { tempo: 128 });
    await engine.settled();
    expect(mic.tempo.value).toBe(128);
    hold.release();
    await new Promise((r) => setTimeout(r, 5));
    await engine.settled();
    expect(mic.tempo.value).toBe(0);
    // With the analysis off a result is not published.
    expect(engine.setInputAnalysis('Apollo', 'in_1', { tempo: 90 })).toBe(false);
    w.release();
    await luna.close();
  });

  it('refuses an unknown kind', async () => {
    const { luna, apollo } = await rig();
    await apollo.inputs.load();
    expect(() => apollo.inputs.items[0]!.watchAnalysis('spectrum' as Luna.InputAnalysisKind)).toThrow(TypeError);
    await luna.close();
  });
});

describe('Device.outputs', () => {
  it('lists outputs with name, ioType and stem format', async () => {
    const { luna, apollo } = await rig();
    await apollo.outputs.load();
    const out = apollo.outputs.items[0]!;
    expect(out).toBeInstanceOf(Luna.DeviceOutput);
    expect(out.name.value).toBe('Monitor L/R');
    expect(out.ioType.value).toEqual(['Mic']);
    expect(out.stemFormat.value).toBe('mono');
    expect(out.type.value).toBe('output');
    await luna.close();
  });
});

describe('luna.activeAudioEngine', () => {
  it('reads the root property and follows it while watched', async () => {
    const { engine, luna } = await rig();
    const w = luna.activeAudioEngine.watch();
    await w.ready;
    expect(luna.activeAudioEngine.enabled.value).toBe(true);
    expect(luna.activeAudioEngine.engineType.value).toBe('system');
    expect(luna.activeAudioEngine.isDeviceActive('mock')).toBe(true);
    expect(luna.activeAudioEngine.isDeviceActive({ id: 'other' })).toBe(false);
    let told = 0;
    luna.activeAudioEngine.enabled.onChange(() => told++);
    engine.setActiveAudioEngine({ enabled: false, audio_engine_type: '', devices: [] });
    await engine.settled();
    await luna.settled();
    expect(luna.activeAudioEngine.enabled.value).toBe(false);
    expect(luna.activeAudioEngine.isDeviceActive('mock')).toBe(false);
    expect(told).toBe(1);
    w.release();
    await luna.close();
  });

  it('a running engine with the driver listed but disabled is not active', async () => {
    const { engine, luna } = await rig();
    engine.setActiveAudioEngine({ enabled: false, audio_engine_type: 'apollo', devices: [{ id: 'mock' }] });
    await engine.settled();
    await luna.activeAudioEngine.load();
    expect(luna.activeAudioEngine.isDeviceActive('mock')).toBe(false);
    await expect(luna.raw.set('/active_audio_engine', { enabled: true })).rejects.toMatchObject({ code: 'uasrv.read_only' });
    await luna.close();
  });
});

describe('luna.autoGain', () => {
  it('is available only when LUNA publishes /auto_gain', async () => {
    const on = await rig();
    expect(await on.luna.autoGain.available()).toBe(true);
    await on.luna.close();
    const off = await rig({ autoGain: false });
    expect(await off.luna.autoGain.available()).toBe(false);
    await off.luna.close();
  });

  it('track.supportsAutoGain follows the routed input', async () => {
    const { engine, luna } = await rig();
    const session = await luna.session();
    const drums = session.tracks.byId('Drums')!;
    expect(drums.supportsAutoGain.value).toBe(false);
    await drums.inputNodeUid.set('in_1');
    await engine.settled();
    expect(drums.supportsAutoGain.value).toBe(true);
    await drums.inputNodeUid.set('in_3_missing');
    await engine.settled();
    expect(drums.supportsAutoGain.value).toBe(false);
    const keys = session.tracks.byId('Keys')!;
    await keys.inputNodeUid.set('in_1');
    await engine.settled();
    expect(keys.supportsAutoGain.value).toBe(true);
    await luna.close();
  });

  it('start posts the channel, adds it and turns on its input; stop takes it away', async () => {
    const { engine, luna, apollo } = await rig();
    const session = await luna.session();
    const drums = session.tracks.byId('Drums')!;
    await drums.inputNodeUid.set('in_1');
    await engine.settled();
    const w = luna.autoGain.watch();
    await w.ready;
    await luna.autoGain.start(drums, { duration: 8 });
    await engine.settled();
    await luna.settled();
    const post = engine.requests.find((r) => r.path === '/auto_gain/start_auto_gain');
    expect(post?.data).toEqual({ session_uid: 'abc', channel_uid: 'Drums', auto_start: true, duration: 8 });
    expect(engine.autoGainDuration).toBe(8);
    expect(luna.autoGain.status.value).toBe('waiting_for_signal');
    const channel = luna.autoGain.channelFor(drums)!;
    expect(channel.channelUid.value).toBe('Drums');
    expect(engine.value('/devices/Apollo/inputs/in_1', 'signal_level_analysis_enabled')).toBe(true);
    engine.setInputAnalysis('Apollo', 'in_1', { signalLevelPeak: 0.5 });
    await engine.settled();
    expect(channel.signalLevelPeak.value).toBe(0.5);
    await luna.autoGain.stop({ sessionUid: 'abc', channelUid: 'Drums' });
    await engine.settled();
    await luna.settled();
    expect(luna.autoGain.channelFor(drums)).toBeUndefined();
    expect(luna.autoGain.status.value).toBe('stopped');
    expect(engine.value('/devices/Apollo/inputs/in_1', 'signal_level_analysis_enabled')).toBe(false);
    expect(apollo).toBeDefined();
    w.release();
    await luna.close();
  });

  it('stopAll stops every channel; duration is whole seconds', async () => {
    const { engine, luna } = await rig();
    const session = await luna.session();
    const w = luna.autoGain.watch();
    await w.ready;
    for (const [id, input] of [['Drums', 'in_1'], ['Keys', 'in_2']] as const) await session.tracks.byId(id)!.inputNodeUid.set(input);
    await luna.autoGain.start(session.tracks.byId('Drums')!, { autoStart: false });
    await luna.autoGain.start(session.tracks.byId('Keys')!, { duration: 0 });
    await engine.settled();
    await luna.settled();
    expect(engine.requests.filter((r) => r.path === '/auto_gain/start_auto_gain').map((r) => r.data)).toEqual([
      { session_uid: 'abc', channel_uid: 'Drums', auto_start: false },
      { session_uid: 'abc', channel_uid: 'Keys', auto_start: true },
    ]);
    expect(luna.autoGain.channels.items).toHaveLength(2);
    await luna.autoGain.stopAll();
    await engine.settled();
    await luna.settled();
    expect(luna.autoGain.channels.items).toHaveLength(0);
    expect(engine.value('/devices/Apollo/inputs/in_2', 'signal_level_analysis_enabled')).toBe(false);
    await expect(luna.autoGain.start(session.tracks.byId('Drums')!, { duration: 1.5 })).rejects.toBeInstanceOf(RangeError);
    w.release();
    await luna.close();
  });
});
