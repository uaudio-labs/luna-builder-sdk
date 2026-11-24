/**
 * A mixer or plugin control: gain, pan, mute, solo, a plugin parameter.
 *
 * Three views of one value: `value` (the engine's native number, the only undoable write),
 * `normalized` (0..1) and `real` (units, or boolean for switches), plus `display` (string).
 * Writes to any view are accepted by the engine; the others follow by push (fact 97).
 *
 * Touch: every user edit of an automatable control is bracketed by `set_touch` on and off so
 * LUNA records one undo step and one automation pass (fact 26). A discrete edit (a click) is
 * touch, write, release; a continuous one (a drag) is touch on press, writes while moving,
 * release on pointer up. Switches are always bracketed, automatable or not, because the touch
 * is what lets exclusive solo and group mute apply (fact 78).
 *
 * @example
 * const gain = track.gain;
 * gain.display.value;                    // "0.0"
 * gain.normalized.onChange(() => knob.set(gain.normalized.value ?? 0));
 *
 * // discrete (a click): one-shot writes bracket themselves
 * await track.mute.toggle();
 * await gain.real.set(-6);
 *
 * // continuous (a drag): Luna.bindRange calls begin() on press, writes, and end() on release
 * Luna.bindRange(fader, gain);
 * // or, writing from your own listener
 * Luna.bindGesture(fader, gain);
 * fader.addEventListener('input', () => gain.normalized.set(Number(fader.value)));
 *
 * // or by hand
 * gain.begin();
 * await gain.normalized.set(0.6);      // many of these
 * gain.end();
 */
import type { Client } from '../client/client';
import type { Prop, WritableProp } from '../store/prop';
import { derived } from '../store/prop';
import { float } from '../wire/codec';
import { Automation } from './automation';
import { Node } from './node';
import { Taper } from './taper';

/**
 * Every control type LUNA defines, as it writes them in `control_type` (`UA::ControlTypeToString`).
 * The list mirrors LUNA's and must track it; {@link ControlType} stays open (`| string`) so a
 * type a later LUNA adds still reads.
 *
 * @example
 * Luna.CONTROL_TYPES.includes(control.controlType.value as Luna.KnownControlType);
 */
export const CONTROL_TYPES = [
  'gain',
  'pan',
  'pan_left',
  'pan_right',
  'mute',
  'record_mute',
  'solo',
  'solo_safe',
  'parameter',
  'audio_source',
  'pre_fader',
  'enabled',
  'gain_trim',
  'input_trim_left',
  'input_trim_right',
  'input_trim_invert_left',
  'input_trim_invert_right',
  'input_trim_mono',
  'input_trim_invert_mono',
  'input_trim_link',
  'sidechain_input_trim',
  'latency_offset',
  'mix_to_mono',
  'preamp_gain',
  'preamp_hiz',
  'preamp_invert',
  'preamp_48v',
  'preamp_limitor',
  'preamp_compressor',
  'preamp_max_compressor',
  'preamp_tone',
  'preamp_pad',
  'preamp_low_cut',
] as const;

/** One of {@link CONTROL_TYPES}. */
export type KnownControlType = (typeof CONTROL_TYPES)[number];

/** A control's `control_type`: one LUNA defines ({@link CONTROL_TYPES}), or a newer one. */
export type ControlType = KnownControlType | (string & {});

export class Control extends Node {
  /** Engine-native value. Writing here is undoable. */
  readonly value: WritableProp<number>;
  /** 0..1 view. */
  readonly normalized: WritableProp<number>;
  /** Value in units (dB, pan position) or boolean for switches. */
  readonly real: WritableProp<number | boolean>;
  /** Formatted for display, as the engine formats it. */
  readonly display: Prop<string>;
  readonly uid: Prop<string>;
  readonly name: Prop<string>;
  readonly controlType: Prop<ControlType>;
  readonly automatable: Prop<boolean>;
  readonly discrete: Prop<boolean>;
  readonly numSteps: Prop<number>;
  readonly touchCount: Prop<number>;
  /**
   * `true` on a live control. A plugin parameter left behind when its slot was cleared has
   * `initialized: null` (fact 86); {@link Effect.params} lists only live ones.
   */
  readonly initialized: Prop<boolean | null>;
  /** For discrete controls: the real value of each step. */
  readonly realValues: Prop<(number | boolean)[]>;
  /** For discrete controls: the display string of each step. */
  readonly displayValues: Prop<string[]>;
  /**
   * The fader taper LUNA maps this control's `normalized` to dB with (fact 134): a
   * {@link Taper} for gain-type controls (gain, gain trim, input trims), `null` for the rest,
   * `undefined` until the control type arrives. It changes, and notifies, when LUNA swaps the
   * taper, as it does for a summing console on a bus input.
   *
   * @example
   * const taper = track.gain.taper.value!;
   * taper.name;                     // '+12'
   * taper.toNormalized(0);          // 0.7818
   * track.gain.taper.onChange(() => redrawMarks(track.gain.taper.value));
   */
  readonly taper: Prop<Taper | null>;

  private gestureDepth = 0;
  /** Whether the outermost {@link begin} sent a touch, so {@link end} releases only that. */
  private gestureTouched = false;
  private automationLane: Automation | undefined;
  private recordingLane: Automation | undefined;

  /** @internal */
  constructor(
    client: Client,
    path: string,
    /** Owning session uid; needed for automation commands. Derived from the path when omitted. */
    readonly sessionUid: string = sessionUidFromPath(path),
  ) {
    super(client, path);
    const wire = <T>(v: T): unknown => this.wireNumber(v);
    this.value = this.gated(this.writableProp<number>('value', wire));
    this.normalized = this.gated(this.writableProp<number>('normalized_value', wire));
    this.real = this.gated(this.writableProp<number | boolean>('real_value', wire));
    this.display = this.prop<string>('string_value');
    this.uid = this.prop<string>('uid');
    this.name = this.prop<string>('name');
    this.controlType = this.prop<ControlType>('control_type');
    this.automatable = this.prop<boolean>('automatable');
    this.discrete = this.prop<boolean>('discrete');
    this.numSteps = this.prop<number>('num_steps');
    this.touchCount = this.prop<number>('touch_count');
    this.initialized = this.prop<boolean | null>('initialized');
    this.realValues = this.prop<(number | boolean)[]>('real_values');
    this.displayValues = this.prop<string[]>('string_values');
    const taperName = this.prop<string | null>('taper');
    this.taper = derived([this.controlType, taperName], () => Taper.forControl(this.controlType.value, taperName.value));
  }

  /** Playback automation lane. Call `load()` on it before reading breakpoints. */
  get automation(): Automation {
    this.automationLane ??= new Automation(this.client, this.path, this.uid, this.sessionUid, 'automation');
    return this.automationLane;
  }

  /** Automation captured during the current record pass. */
  get automationRecording(): Automation {
    this.recordingLane ??= new Automation(this.client, this.path, this.uid, this.sessionUid, 'automation_recording');
    return this.recordingLane;
  }

  protected override release(): void {
    this.automationLane?.dispose();
    this.recordingLane?.dispose();
  }

  /**
   * A number written to a continuous control goes as a float literal (fact 142): LUNA refuses a
   * bare whole number for a plugin parameter's `real_value` and ignores one for its `value`, so
   * `real.set(-3)` would fail where `real.set(-3.5)` works. A discrete control's step value
   * stays a whole number, which is what it requires; so do booleans and anything else.
   */
  private wireNumber(v: unknown): unknown {
    return typeof v === 'number' && Number.isFinite(v) && this.discrete.value === false ? float(v) : v;
  }

  /** True when `real` is boolean-like (mute, solo, switches). */
  get isSwitch(): boolean {
    return this.discrete.value === true && this.numSteps.value === 2;
  }

  /** For switches: current state as a boolean. */
  get on(): boolean {
    const r = this.real.value;
    if (typeof r === 'boolean') return r;
    return (this.value.value ?? 0) !== 0;
  }

  /** For switches: flip the state. */
  async toggle(): Promise<void> {
    await this.real.set(!this.on);
  }

  /**
   * True when writes to this control are touch-bracketed: automatable controls, and discrete
   * ones (switches, stepped parameters), which LUNA's GUI always brackets (fact 78). A control
   * whose `automatable` has not arrived yet counts as automatable.
   *
   * @example
   * track.gain.touchable; // true
   * track.solo.touchable; // true: a switch, though not automatable
   */
  get touchable(): boolean {
    return this.automatable.value !== false || this.discrete.value === true;
  }

  /**
   * Start a continuous gesture (pointer down). Sends `set_touch` on for a {@link touchable}
   * control; writes until {@link end} are not bracketed individually. Nested calls are
   * counted and only the outermost touches. Always pair with {@link end}, including on
   * cancelled drags; {@link bindGesture} does the pairing for a DOM element.
   *
   * @example
   * gain.begin();
   * await gain.normalized.set(0.6);
   * gain.end();
   */
  begin(): void {
    if (this.gestureDepth++ > 0) return;
    this.gestureTouched = this.touchable;
    if (this.gestureTouched) void this.touch(true);
  }

  /**
   * Finish a continuous gesture (pointer up). Releases the touch the matching {@link begin}
   * took; an unmatched call is ignored, since LUNA rejects a release it never saw a touch for
   * (fact 78).
   */
  end(): void {
    if (this.gestureDepth === 0) return;
    if (--this.gestureDepth > 0 || !this.gestureTouched) return;
    this.gestureTouched = false;
    void this.touch(false);
  }

  /**
   * Put the control back to its default value (`set_control_default_value`). LUNA knows each
   * control's default, so there is no default to read or hard-code: a double-click-to-reset
   * calls this. Like a one-shot write it is touch-bracketed, so it makes one undo step; inside
   * a {@link begin}/{@link end} gesture it is not bracketed again. The new value arrives by
   * push. A plugin parameter whose plugin gives LUNA no default keeps its value (fact 92).
   *
   * @example
   * fader.addEventListener('dblclick', () => track.gain.resetToDefault());  // 0 dB
   * panKnob.addEventListener('dblclick', () => track.main.pans[0]?.resetToDefault()); // centre
   */
  async resetToDefault(): Promise<void> {
    const reset = (): Promise<void> => this.post('set_control_default_value', {}).then(() => undefined);
    if (this.gestureDepth > 0 || !this.touchable) return reset();
    await this.touch(true);
    try {
      await reset();
    } finally {
      await this.touch(false);
    }
  }

  /** True while inside a {@link begin}/{@link end} pair. */
  get inGesture(): boolean {
    return this.gestureDepth > 0;
  }

  /** Raw touch state on the engine (`set_touch` command). Prefer begin/end; errors are swallowed. */
  touch(touching: boolean): Promise<void> {
    return this.post('set_touch', { touch: touching }).then(() => undefined, () => undefined);
  }

  /** Wrap a writable view so one-shot writes outside a gesture are touch-bracketed. */
  private gated<T>(view: WritableProp<T>): WritableProp<T> {
    const set = view.set;
    return {
      get value() {
        return view.value;
      },
      onChange: (l) => view.onChange(l),
      set: async (v: T) => {
        if (this.gestureDepth > 0 || !this.touchable) {
          await set(v);
          return;
        }
        // One-shot write outside a gesture: touch on, write, touch off, and only then resolve.
        await this.touch(true);
        try {
          await set(v);
        } finally {
          await this.touch(false);
        }
      },
    };
  }
}

function sessionUidFromPath(path: string): string {
  const m = /^\/sessions\/([^/]+)/.exec(path);
  return m?.[1] ?? '';
}
