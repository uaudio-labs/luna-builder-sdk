/**
 * What tracks and buses share: a strip with outputs, controls and effects.
 * `/sessions/<uid>/tracks/<id>` and `/sessions/<uid>/buses/<id>`.
 */
import type { Client } from '../client/client';
import { automationModeOrdinal, type AutomationModeName } from './automation';
import type { Prop, WritableProp } from '../store/prop';
import { Collection } from './collection';
import type { Control } from './control';
import { Controls } from './controls';
import { Effect } from './effect';
import type { Meter } from './meter';
import { Node } from './node';
import { Output } from './output';

export type AutomationMode = 'off' | 'read' | 'write' | 'touch' | 'latch';
export type StemFormat = 'mono' | 'stereo' | (string & {});

export abstract class Channel extends Node {
  readonly uid: Prop<string>;
  readonly name: WritableProp<string>;
  readonly order: Prop<number>;
  /** ARGB packed integer as the engine stores it. */
  readonly color: WritableProp<number>;
  readonly comments: WritableProp<string>;
  readonly stemFormat: Prop<StemFormat>;
  readonly automationMode: Prop<AutomationMode>;
  readonly folderUid: Prop<string | null>;
  readonly frozen: Prop<boolean>;
  readonly enabled: Prop<boolean>;
  /** Strip-level controls (`solo`, trims, preamp). */
  readonly controls: Controls;
  readonly outputs: Collection<Output>;
  /** The `main` output, always present. */
  readonly main: Output;
  /** All insert slots, including `console` and `sidechain_filter`. See {@link effectSlots}. */
  readonly effects: Collection<Effect>;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    /** Uid of the owning session, for session-level commands that name this channel. */
    readonly sessionUid: string,
  ) {
    super(client, path);
    this.uid = this.prop<string>('uid');
    this.name = this.writableProp<string>('name');
    this.order = this.prop<number>('order');
    this.color = this.writableProp<number>('color');
    this.comments = this.writableProp<string>('comments');
    this.stemFormat = this.prop<StemFormat>('stem_format');
    this.automationMode = this.prop<AutomationMode>('automation_mode');
    this.folderUid = this.prop<string | null>('folder_uid');
    this.frozen = this.prop<boolean>('frozen');
    this.enabled = this.prop<boolean>('enabled');
    this.controls = new Controls(client, `${path}/controls`);
    // levels 3 reaches each output's `assignment_objects/<uid>` names, the handles routing needs (fact 83).
    this.outputs = new Collection<Output>(client, `${path}/outputs`, (p) => new Output(client, p), { levels: 3, commands: false, flatvalue: true });
    this.main = new Output(client, `${path}/outputs/main`);
    this.effects = new Collection<Effect>(client, `${path}/effects`, (p) => new Effect(client, p, sessionUid, this.id), { levels: 2, commands: false, flatvalue: true });
  }

  /** The user-facing `effect_0`..`effect_N` slots in order. */
  get effectSlots(): Effect[] {
    return this.effects.items.filter((e) => e.isEffectSlot).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  /** Effect slots that hold a plugin. */
  get loadedEffects(): Effect[] {
    return this.effectSlots.filter((e) => !e.isEmpty);
  }

  /** Load a plugin into the first empty effect slot (or a named slot). */
  async insert(pluginId: string, slot?: string): Promise<Effect | undefined> {
    await this.effects.load();
    const target = slot ? this.effects.byId(slot) : this.effectSlots.find((e) => e.isEmpty);
    if (!target) return undefined;
    await target.setPlugin(pluginId);
    return target;
  }

  /**
   * Set this track's or bus's automation mode (`off | read | write | touch | latch`) in one
   * undo step. `set_automode_on_tracks` takes track and bus uids alike (fact 167);
   * {@link automationMode} follows on LUNA's push.
   *
   * @example
   * await track.setAutomationMode('touch');
   * await session.master!.setAutomationMode('read');
   */
  setAutomationMode(mode: AutomationModeName): Promise<unknown> {
    return this.wire.post(`/sessions/${this.sessionUid}/set_automode_on_tracks`, { uid: this.sessionUid, tracks: [this.id], automation_mode: automationModeOrdinal(mode) });
  }

  /** Main output gain. */
  get gain(): Control {
    return this.main.gain;
  }
  /** Main output pan. */
  get pan(): Control {
    return this.main.pan;
  }
  /** Main output mute. */
  get mute(): Control {
    return this.main.mute;
  }
  /** Main output level meter. */
  get meter(): Meter {
    return this.main.meter;
  }

  /** Load this strip's properties plus the main output's controls in two round trips. */
  async loadStrip(): Promise<void> {
    await Promise.all([this.load({ flatvalue: true, commands: false }), this.main.controls.load()]);
  }

  protected override release(): void {
    this.controls.dispose();
    this.outputs.dispose();
    this.main.dispose();
    this.effects.dispose();
  }
}
