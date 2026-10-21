/**
 * An insert slot on a track or bus: `<channel>/effects/<slot>`.
 *
 * Slots are fixed: `console`, `reserved_0`, `effect_0`..`effect_7`, `sidechain_filter` (plus
 * `record_fx_*` on some channels). An empty slot has `pluginId === null`.
 *
 * Bypass is not the `enabled` property (the engine ignores writes to it). The IN/OUT state is
 * the plugin control named by `bypassControl`, with `bypassControlActiveLow` polarity, and is
 * written through the context command `set_inserts_in_out` so undo, touch and mix groups are
 * handled by the engine. {@link Effect.in} and {@link Effect.setIn} wrap that.
 *
 * @example
 * const slot = track.effects.byId('effect_0')!;
 * await slot.setPlugin('com.uaudio.uadx.1176');
 * await slot.waitForPlugin();
 * slot.pluginName.value;                          // '1176 ...'
 * await slot.setIn(false);                        // bypass
 * slot.controls.items.map((c) => c.name.value);   // plugin parameters
 */
import type { Client } from '../client/client';
import { derived, type Prop } from '../store/prop';
import { RequestTimeout, UAError } from '../wire/errors';
import type { Control } from './control';
import { Controls } from './controls';
import { Node } from './node';

export type InsertSlot = 'console' | 'reserved_0' | `effect_${number}` | `record_fx_${number}` | 'sidechain_filter' | string;

/** The engine reports a missing plugin with this error string. */
export const PLUGIN_ERROR_MISSING = 'mixer.missing_plug-in';

export class Effect extends Node {
  readonly uid: Prop<string>;
  readonly insertType: Prop<InsertSlot>;
  /** Plugin id (for example `com.uaudio.uadx.1176`), or `null` when the slot is empty. */
  readonly pluginId: Prop<string | null>;
  readonly pluginName: Prop<string | null>;
  /** Reported by the engine; not the bypass state. See {@link in}. */
  readonly enabled: Prop<boolean>;
  readonly pluginPower: Prop<boolean>;
  readonly presetName: Prop<string | null>;
  readonly presetUid: Prop<string | null>;
  readonly presetDirty: Prop<boolean>;
  readonly frozen: Prop<boolean>;
  readonly sidechainAllowed: Prop<boolean>;
  readonly sidechainInUse: Prop<boolean>;
  readonly pluginError: Prop<string | null>;
  readonly pluginLicenseError: Prop<string | null>;
  /** Name of the control that carries the IN/OUT state, or `null` if the plugin has none. */
  readonly bypassControl: Prop<string | null>;
  readonly bypassControlActiveLow: Prop<boolean | null>;
  /** IN (true) or bypassed (false); `undefined` until known or when the plugin has no bypass control. */
  readonly in: Prop<boolean | undefined>;
  /**
   * The plugin instance id, set once the plugin has loaded (fact 86). `plugin_name` is not a
   * load signal: it can stay null for a loaded plugin; the catalog has the name.
   */
  readonly instanceId: Prop<number | null>;
  /** True once a plugin is loaded in this slot without an error. */
  readonly loaded: Prop<boolean>;
  /**
   * Every child of the slot's `controls` folder, including parameters a cleared plugin left
   * behind (fact 86). Prefer {@link params}.
   */
  readonly controls: Controls;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    private readonly sessionUid: string,
    private readonly channelUid: string,
  ) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.insertType = this.prop<InsertSlot>('insert_type');
    this.pluginId = this.prop<string | null>('plugin_id');
    this.pluginName = this.prop<string | null>('plugin_name');
    this.enabled = this.prop<boolean>('enabled');
    this.pluginPower = this.prop<boolean>('plugin_power');
    this.presetName = this.prop<string | null>('preset_name');
    this.presetUid = this.prop<string | null>('preset_uid');
    this.presetDirty = this.prop<boolean>('preset_uid_dirty');
    this.frozen = this.prop<boolean>('frozen');
    this.sidechainAllowed = this.prop<boolean>('sidechain_allowed');
    this.sidechainInUse = this.prop<boolean>('sidechain_in_use');
    this.pluginError = this.prop<string | null>('plugin_error');
    this.pluginLicenseError = this.prop<string | null>('plugin_license_error');
    this.bypassControl = this.prop<string | null>('bypass_control');
    this.bypassControlActiveLow = this.prop<boolean | null>('bypass_control_active_low');
    this.controls = new Controls(client, `${path}/controls`);
    this.instanceId = this.prop<number | null>('external_sdk_instance_id');
    this.loaded = derived([this.pluginId, this.instanceId, this.pluginError], () => !this.isEmpty && this.instanceId.value !== null && this.instanceId.value !== undefined && !this.pluginError.value);
    const bypassValue = derived([this.bypassControl], () => {
      const name = this.bypassControl.value;
      return name ? this.controls.get(name).value.value : undefined;
    });
    this.in = derived([bypassValue, this.bypassControlActiveLow], () => {
      const name = this.bypassControl.value;
      if (!name) return undefined;
      const v = this.controls.get(name).value.value;
      if (v === undefined) return undefined;
      const on = v !== 0;
      return this.bypassControlActiveLow.value === true ? !on : on;
    });
  }

  get isEmpty(): boolean {
    const id = this.pluginId.value;
    return id === null || id === undefined || id === '';
  }

  /** True for the user-facing `effect_N` slots. */
  get isEffectSlot(): boolean {
    return this.id.startsWith('effect_');
  }

  /** The control carrying the IN/OUT state, if the plugin has one. */
  get bypass(): Control | undefined {
    const name = this.bypassControl.value;
    return name ? this.controls.get(name) : undefined;
  }

  /**
   * The plugin's live parameters, in engine order: the `controls` that are `initialized`.
   * A cleared slot keeps its old parameters as ghosts (fact 86); they are left out here.
   * Writes are touch-bracketed like any control, which makes them undoable (fact 85).
   *
   * @example
   * await slot.controls.load();
   * for (const p of slot.params) console.log(p.name.value, p.display.value);
   */
  get params(): Control[] {
    return this.controls.items.filter((c) => c.initialized.value === true);
  }

  /**
   * Load a plugin into this slot (replacing any current one) and resolve once it has
   * loaded. `set_inserts` answers `null` whether or not the plugin exists (fact 86), so the
   * slot is the proof: an unknown or unusable plugin rejects with the slot's
   * `plugin_error` as the code (for example `mixer.missing_plug-in`). Pass `wait: false`
   * to resolve on the reply alone.
   *
   * A preset can ride in the same call: `presetUid` (from {@link Presets.find}) makes LUNA
   * load that preset onto the effect — state and identity, which is what the preset browser
   * keys on — while `presetName` alone only labels the effect (fact 99).
   *
   * @example
   * await slot.setPlugin('com.uaudio.uadx.1176');
   * slot.loaded.value; // true
   * const preset = await luna.presets.find('uaudio_qi', '4-Band EQ');
   * await slot.setPlugin('uaudio_qi', { presetName: preset?.name, presetUid: preset?.uid });
   */
  async setPlugin(pluginId: string, options: { pluginName?: string; presetName?: string; presetUid?: string; wait?: boolean; timeoutMs?: number } = {}): Promise<unknown> {
    const insert: Record<string, unknown> = { insert_type: this.id, plugin_id: pluginId };
    if (options.pluginName !== undefined) insert['plugin_name'] = options.pluginName;
    if (options.presetName !== undefined) insert['preset_name'] = options.presetName;
    if (options.presetUid !== undefined) insert['preset_uid'] = options.presetUid;
    const reply = await this.wire.post(`/sessions/${this.sessionUid}/set_inserts`, { session_uid: this.sessionUid, channel_uid: this.channelUid, inserts: [insert] });
    if (options.wait === false) return reply;
    await this.waitForPlugin(options.timeoutMs, pluginId);
    const error = this.pluginError.value;
    if (error) throw new UAError(error, `${pluginId} did not load into ${this.id}: ${error}`, { path: this.path });
    return reply;
  }

  /** Remove the plugin from this slot. */
  clear(): Promise<unknown> {
    return this.wire.post(`/sessions/${this.sessionUid}/set_inserts`, { session_uid: this.sessionUid, channel_uid: this.channelUid, inserts: [{ insert_type: this.id, plugin_id: '' }] });
  }

  /**
   * Resolve once the slot holds a loaded plugin (it has an instance id) or reports a
   * `plugin_error` (fact 86). With `pluginId`, wait for that plugin rather than whatever
   * the slot held before. Rejects with {@link RequestTimeout} after `timeoutMs`.
   *
   * @example
   * await slot.waitForPlugin();
   * if (slot.pluginError.value) show(slot.pluginError.value);
   */
  waitForPlugin(timeoutMs = 10_000, pluginId?: string): Promise<void> {
    const done = () => {
      if (pluginId !== undefined && this.pluginId.value !== pluginId) return false;
      return this.loaded.value === true || Boolean(this.pluginError.value);
    };
    if (done()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const offs: (() => void)[] = [];
      const finish = (err?: Error) => {
        clearTimeout(timer);
        for (const off of offs) off();
        if (err) reject(err);
        else resolve();
      };
      const timer = setTimeout(() => finish(new RequestTimeout('set_inserts', this.path, timeoutMs)), timeoutMs);
      const check = () => {
        if (done()) finish();
      };
      offs.push(this.pluginId.onChange(check), this.instanceId.onChange(check), this.pluginError.onChange(check));
      // A push may have been missed or held back; read the slot once in case it already landed.
      void this.client.store.load(this.path, { children: false, commands: false, flatvalue: true }).then(check, () => {});
    });
  }

  /** Set IN (true) or bypass (false) through the engine's undoable, group-aware path. */
  setIn(on: boolean, contextType = 'main'): Promise<unknown> {
    return this.wire.post(`/sessions/${this.sessionUid}/contexts/${contextType}/commands/set_inserts_in_out`, {
      session_uid: this.sessionUid,
      channel_uid: this.channelUid,
      inserts: [this.id],
      value: on,
    });
  }

  /**
   * Load a preset onto the plugin in this slot: its state and its identity, so `presetUid`
   * and `presetName` follow (fact 122). The preset must belong to the slot's plugin; take its
   * uid from {@link Presets.query}, {@link Presets.recommend} or a {@link PresetSelection}.
   * Rejects with code `unavailable` when the slot is empty.
   *
   * @example
   * const [row] = await luna.presets.query({ pluginId: slot.pluginId.value!, search: 'Clean' });
   * await slot.loadPreset(row.uid);
   * slot.presetName.value; // row.name
   */
  async loadPreset(presetUid: string): Promise<void> {
    this.assertLive();
    if (this.pluginId.value === undefined || this.uid.value === undefined) await this.load();
    const pluginId = this.pluginId.value;
    if (!pluginId) throw new UAError('unavailable', `loadPreset(): ${this.id} holds no plugin`, { path: this.path });
    await this.wire.post(`/presets/plugins/${pluginId}/load`, { session_uid: this.sessionUid, uid: this.uid.value, preset_uid: presetUid });
  }

  /** Step through the plugin's presets. */
  nextPreset(): Promise<unknown> {
    return this.post('commands/preset_browser_increment');
  }

  previousPreset(): Promise<unknown> {
    return this.post('commands/preset_browser_decrement');
  }

  protected override release(): void {
    this.controls.dispose();
  }
}
