/**
 * Automation of one control. Two lanes exist per automatable control:
 * `<control>/automation/<rowid>` (playback) and `<control>/automation_recording/<rowid>`.
 * Breakpoints have `start` (tick) and `value` (the control's native value, not normalized).
 * Edits are session commands keyed by `(control uid, tick)`.
 *
 * @example
 * const auto = track.gain.automation;
 * await auto.load();
 * auto.breakpoints.map((b) => [b.tick, b.value]);
 * await auto.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
 * await auto.clear(0, Luna.WHOLE_NOTE * 2);
 */
import type { Client } from '../client/client';
import type { Prop } from '../store/prop';
import { float } from '../wire/codec';
import { UAError } from '../wire/errors';
import { Collection } from './collection';
import { postControlValues } from './control-values';
import { Node } from './node';
import { requireTick, settle } from './settle';

export const AUTOMATION_MODES = ['off', 'read', 'write', 'touch', 'latch'] as const;
export type AutomationModeName = (typeof AUTOMATION_MODES)[number];

/** Commands take the mode as an integer ordinal; the track property reports it as a string. */
export function automationModeOrdinal(mode: AutomationModeName): number {
  return AUTOMATION_MODES.indexOf(mode);
}

export interface Breakpoint {
  tick: number;
  value: number;
}

export class BreakpointNode extends Node {
  readonly start: Prop<number>;
  readonly value: Prop<number>;

  /** @internal */
  constructor(client: Client, path: string) {
    super(client, path);
    this.start = this.prop<number>('start');
    this.value = this.prop<number>('value');
  }
}

export class Automation extends Collection<BreakpointNode> {
  /** @internal */
  constructor(
    client: Client,
    controlPath: string,
    private readonly controlUidProp: Prop<string>,
    private readonly sessionUid: string,
    lane: 'automation' | 'automation_recording' = 'automation',
  ) {
    super(client, `${controlPath}/${lane}`, (p) => new BreakpointNode(client, p), { levels: 2, commands: false, flatvalue: true });
  }

  /** Breakpoints sorted by tick. */
  get breakpoints(): Breakpoint[] {
    return this.items
      .map((b) => ({ tick: b.start.value ?? 0, value: b.value.value ?? 0 }))
      .sort((a, b) => a.tick - b.tick);
  }

  private post(command: string, payload: Record<string, unknown>): Promise<unknown> {
    const controlUid = this.controlUidProp.value;
    if (!controlUid) return Promise.reject(new UAError('unavailable', 'control uid not loaded; call control.load() first', { path: this.path }));
    return this.client.raw.post(`/sessions/${this.sessionUid}/${command}`, { session_uid: this.sessionUid, control_uid: controlUid, ...payload });
  }

  /**
   * Wait until the lane shows the edit. The breakpoint verbs answer `null` whether or not
   * anything changed (fact 71), and LUNA holds pushes inside a batch but answers reads
   * (fact 60), so the lane is re-read while waiting.
   */
  private settled(done: () => boolean, what: string): Promise<void> {
    return settle(done, what, { path: this.path, refresh: () => this.reload() });
  }

  private at(tick: number): Breakpoint | undefined {
    return this.breakpoints.find((b) => b.tick === tick);
  }

  /**
   * Insert breakpoints. With `clearRange`, existing breakpoints in that range are removed first;
   * without it, new points stack on existing ones. Values go on the wire as float literals,
   * because LUNA stores a bare whole number as 0 (fact 82). Resolves once every point is in
   * the lane.
   *
   * @example
   * await track.gain.automation.insert([{ tick: 0, value: 0 }, { tick: Luna.WHOLE_NOTE, value: -6 }]);
   */
  async insert(points: Breakpoint[], clearRange?: { startTick: number; stopTick: number }): Promise<void> {
    const values = points.map((p) => ({ location: requireTick(p.tick, 'breakpoint tick'), value: float(p.value) }));
    const payload: Record<string, unknown> = { values };
    if (clearRange) {
      payload['start'] = requireTick(clearRange.startTick, 'clearRange.startTick');
      payload['stop'] = requireTick(clearRange.stopTick, 'clearRange.stopTick');
    }
    await this.post('insert_bp', payload);
    await this.settled(() => points.every((p) => sameValue(this.at(p.tick)?.value, p.value)), 'insert breakpoints');
  }

  /**
   * Delete the breakpoint at `tick`, or every breakpoint in `[startTick, stopTick]`. Resolves
   * once they are gone.
   *
   * @example
   * await track.gain.automation.clear(0, Luna.WHOLE_NOTE * 4);
   */
  async clear(startTick: number, stopTick?: number): Promise<void> {
    const payload: Record<string, unknown> = { start: requireTick(startTick, 'startTick') };
    if (stopTick !== undefined) payload['stop'] = requireTick(stopTick, 'stopTick');
    await this.post('delete_bp', payload);
    const gone = (b: Breakpoint) => (stopTick === undefined ? b.tick !== startTick : b.tick < startTick || b.tick > stopTick);
    await this.settled(() => this.breakpoints.every(gone), 'clear breakpoints');
  }

  /**
   * Move the breakpoint at `fromTick` to `toTick`. Resolves once it has moved.
   *
   * @example
   * await track.gain.automation.move(0, Luna.QUARTER_NOTE);
   */
  async move(fromTick: number, toTick: number): Promise<void> {
    const value = this.at(fromTick)?.value;
    await this.post('move_bp', { location: requireTick(fromTick, 'fromTick'), new_location: requireTick(toTick, 'toTick') });
    if (fromTick === toTick) return;
    await this.settled(() => this.at(toTick) !== undefined && (value === undefined || this.at(fromTick) === undefined), 'move breakpoint');
  }

  /**
   * Set the value of the breakpoint at `tick`, sent as a float literal (fact 82). Resolves
   * once the lane shows it.
   *
   * @example
   * await track.gain.automation.setValue(0, -3);
   */
  async setValue(tick: number, value: number): Promise<void> {
    await this.post('trim_bp', { location: requireTick(tick, 'tick'), value: float(value) });
    await this.settled(() => sameValue(this.at(tick)?.value, value), 'set breakpoint value');
  }

  /**
   * Write `value` over `[start, stop)` (`write_control_values`, fact 227): breakpoints in the
   * range go, and LUNA adds anchors so the curve outside it keeps its shape (one at `start - 1`
   * holding the old value, a step to `value` at `start` and `stop - 1`, and one at `stop` back
   * to the old value). `start === stop` writes a single point. One undo step. The value goes as
   * a float literal (fact 82). Resolves once the lane shows the write.
   *
   * @example
   * await track.gain.automation.writeRange(-12, { start: Luna.WHOLE_NOTE, stop: Luna.WHOLE_NOTE * 2 });
   */
  async writeRange(value: number, range: { start: number; stop: number }): Promise<void> {
    const { start, stop } = range;
    await postControlValues(this.client, this.sessionUid, 'write_control_values', [{ control: this.uidOrThrow(), value }], { start, stop }, 'main');
    await this.settled(
      () => sameValue(this.at(start)?.value, value) && this.breakpoints.every((b) => b.tick <= start || b.tick >= stop - 1),
      'write automation range',
    );
  }

  /**
   * Add `delta` to the curve over `[start, stop)` (`trim_control_values`, fact 227): every
   * breakpoint in the range moves by `delta`, LUNA adds anchors at the edges so the curve
   * outside keeps its shape, and on a mixer output it puts that output's `gain_trim` back to 0.
   * With no breakpoints yet, the control's value plus `delta` becomes a plateau. One undo step.
   * Resolves once the lane has changed.
   *
   * @example
   * await track.gain.automation.trimRange(3, { start: 0, stop: Luna.WHOLE_NOTE * 4 }); // +3 dB
   */
  async trimRange(delta: number, range: { start: number; stop: number }): Promise<void> {
    const { start, stop } = range;
    const before = JSON.stringify(this.breakpoints);
    await postControlValues(this.client, this.sessionUid, 'trim_control_values', [{ control: this.uidOrThrow(), value: delta }], { start, stop }, 'main');
    await this.settled(
      () => this.at(start) !== undefined && (delta === 0 || JSON.stringify(this.breakpoints) !== before),
      'trim automation range',
    );
  }

  private uidOrThrow(): string {
    const uid = this.controlUidProp.value;
    if (!uid) throw new UAError('unavailable', 'control uid not loaded; call control.load() first', { path: this.path });
    return uid;
  }
}

/** LUNA stores breakpoint values as float32, so compare to that precision. */
function sameValue(stored: number | undefined, wanted: number): boolean {
  return stored !== undefined && Math.abs(stored - wanted) <= 1e-5 * Math.max(1, Math.abs(wanted));
}
