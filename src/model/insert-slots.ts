/**
 * Insert slots, LUNA's extensions and plug-in formats: pure helpers over slot names and
 * plug-in ids (fact 181). The id lists mirror LUNA's own and must be kept in step with it; an id LUNA
 * adds later is not recognised until the SDK learns it.
 */
import type { InsertSlot } from './effect';

/**
 * The prefix of LUNA's synthetic alias plug-in ids. LUNA shows an extension slot inside an
 * ordinary effect chain as a plug-in id `alias.<slot>`: a channel's console plug-in (LUNA
 * Channel, a summing console) appears among its `effect_N` inserts as `alias.console`.
 */
export const INSERT_ALIAS_PREFIX = 'alias.';

/** Named slots LUNA's `StringToInsertType` accepts (`channel_strip` is its old name for `console`). */
const NAMED_SLOTS: Readonly<Record<string, InsertSlot>> = {
  instrument: 'instrument',
  tape: 'tape',
  bus_input: 'bus_input',
  console: 'console',
  channel_strip: 'console',
  reserved_0: 'reserved_0',
  sidechain_filter: 'sidechain_filter',
  bus_compressor: 'bus_compressor',
  ara_editor_renderer: 'ara_editor_renderer',
};

/** Indexed slots: `effect_N` and `midi_N` (N up to 64), `record_fx_N` (up to 15). */
const INDEXED_SLOT = /^(effect|midi|record_fx)_(\d+)$/;
const MAX_INDEX: Readonly<Record<string, number>> = { effect: 64, midi: 64, record_fx: 15 };

function parseSlot(name: string): InsertSlot | undefined {
  if (Object.prototype.hasOwnProperty.call(NAMED_SLOTS, name)) return NAMED_SLOTS[name];
  const m = INDEXED_SLOT.exec(name);
  if (!m) return undefined;
  return Number(m[2]) <= (MAX_INDEX[m[1]!] ?? -1) ? (name as InsertSlot) : undefined;
}

/**
 * Whether a slot is one of the record FX slots (`record_fx_0`, `record_fx_1`, ...): the
 * inserts LUNA prints into a recording, as opposed to the `effect_N` playback inserts.
 *
 * @example
 * Luna.isRecordFxSlot('record_fx_0');   // true
 * Luna.isRecordFxSlot('effect_0');      // false
 * const recordFx = track.effects.items.filter((e) => Luna.isRecordFxSlot(e.id));
 */
export function isRecordFxSlot(slot: string): boolean {
  return /^record_fx_\d+$/.test(slot);
}

/**
 * Whether a plug-in id is one of LUNA's synthetic `alias.<slot>` ids rather than a real
 * plug-in. Today LUNA makes only `alias.console`, but it reads any `alias.<slot>` whose slot it
 * knows, and so does this.
 *
 * @example
 * Luna.isInsertAliasPluginId('alias.console');           // true
 * Luna.isInsertAliasPluginId('com.uaudio.uadx.1176');    // false
 */
export function isInsertAliasPluginId(pluginId: string): boolean {
  return insertSlotForAlias(pluginId) !== undefined;
}

/**
 * The slot an alias plug-in id stands for, so a chain's `alias.console` entry can be shown
 * as the channel's console slot: `alias.console` gives `'console'`. Any other id, an alias
 * included whose slot LUNA does not know, gives `undefined`.
 *
 * @example
 * for (const slot of track.effects.items) {
 *   const target = Luna.insertSlotForAlias(slot.pluginId.value ?? '');
 *   if (target) showAsLink(slot, track.effects.byId(target));   // the console plug-in
 * }
 */
export function insertSlotForAlias(pluginId: string): InsertSlot | undefined {
  if (!pluginId.startsWith(INSERT_ALIAS_PREFIX)) return undefined;
  return parseSlot(pluginId.slice(INSERT_ALIAS_PREFIX.length));
}

/** LUNA Channel's plug-in id. */
export const LUNA_CHANNEL_PLUGIN_ID = 'uaudio_luna_channel';

/**
 * The plug-in ids of LUNA's extensions: plug-ins LUNA hosts as part of itself (the summing
 * consoles, tape, the sampler, the hardware insert, LUNA Channel), whose window is LUNA's own.
 * This list mirrors LUNA's and must track it: an extension added in a later LUNA is not in it
 * until the SDK is updated.
 */
export const LUNA_EXTENSION_PLUGIN_IDS: readonly string[] = [
  'uaudio_neve_console',
  'uaudio_api_summing',
  'uaudio_api_vision_ext',
  'uaudio_tube_channel_strip_ext',
  'uaudio_api_2500_ext',
  'uaudio_ampex_atr_102_ext',
  'UAD API Preamp',
  'uaudio_cambridge_ext',
  'uaudio_rhea',
  'uaudio_hardware_insert',
  LUNA_CHANNEL_PLUGIN_ID,
];

/**
 * Whether a plug-in id is one of {@link LUNA_EXTENSION_PLUGIN_IDS}. The test is by exact id,
 * so the list must track LUNA's.
 *
 * @example
 * Luna.isLunaExtensionPluginId('uaudio_luna_channel');    // true
 * Luna.isLunaExtensionPluginId('com.uaudio.uadx.1176');   // false
 * const plugins = slots.filter((e) => !Luna.isLunaExtensionPluginId(e.pluginId.value ?? ''));
 */
export function isLunaExtensionPluginId(pluginId: string): boolean {
  return LUNA_EXTENSION_PLUGIN_IDS.includes(pluginId);
}

/**
 * A plug-in format, as LUNA names its SDK types: third-party `vst`, `vst3`, `au` and `aax`,
 * UA's `uad2` and `uadx`, and the server-hosted `cloud` and `localml` clip effects. A plug-in's
 * reported format (`plugin.sdkType`, {@link PluginSdkType}) is one of these, or `''`.
 */
export type PluginFormat = 'vst' | 'vst3' | 'au' | 'aax' | 'uad2' | 'uadx' | 'cloud' | 'localml';

/**
 * A plug-in's format guessed from its id, with the patterns LUNA itself uses: `.vst.`,
 * `.vst3.` or `.au.` anywhere in the id, a `cloud:` or `localml:` prefix, a `UAD ` prefix for
 * UAD-2, and `uadx` for anything else. It is a heuristic: an id that matches none of them is
 * reported as `uadx`, as LUNA does, and LUNA may treat a `cloud:` effect as unavailable when
 * cloud clip effects are off. Prefer the format LUNA reports for an installed plug-in
 * (`Plugin.sdkType`) where you have it.
 *
 * @example
 * Luna.pluginFormat('com.fabfilter.vst3.ProQ3');   // 'vst3'
 * Luna.pluginFormat('UAD 1176LN');                 // 'uad2'
 * Luna.pluginFormat('com.uaudio.uadx.1176');       // 'uadx'
 */
export function pluginFormat(pluginId: string): PluginFormat {
  if (pluginId.includes('.vst.')) return 'vst';
  if (pluginId.includes('.vst3.')) return 'vst3';
  if (pluginId.includes('.au.')) return 'au';
  if (pluginId.startsWith('cloud:')) return 'cloud';
  if (pluginId.startsWith('localml:')) return 'localml';
  if (pluginId.startsWith('UAD ')) return 'uad2';
  return 'uadx';
}
