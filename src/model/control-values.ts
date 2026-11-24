/**
 * Write or trim automation over a tick range on one or more controls at once:
 * `write_control_values` and `trim_control_values` (fact 227). Reached as
 * {@link Automation.writeRange} / {@link Automation.trimRange} for one control and
 * {@link Context.writeControlValues} / {@link Context.trimControlValues} for several.
 *
 * @example
 * await session.context.writeControlValues(
 *   [{ control: track.gain, value: -12 }, { control: other.gain, value: -12 }],
 *   { start: 0, stop: Luna.WHOLE_NOTE * 4 },
 * );
 */
import type { Client } from '../client/client';
import { float } from '../wire/codec';
import { UAError } from '../wire/errors';
import type { Control } from './control';
import { requireTick } from './settle';

/** One control and its value for {@link Context.writeControlValues} / {@link Context.trimControlValues}. */
export interface ControlValue {
  /** The control, or its `uid`. A `Control` must have its `uid` loaded. */
  control: Control | string;
  /** Absolute value for a write, delta for a trim; in the control's native unit (dB for gain). */
  value: number;
}

/**
 * The tick range of a write or trim: `[start, stop)`. Give both or neither; with neither, LUNA
 * uses the context's selection (fact 227).
 */
export interface ControlValueRange {
  start?: number;
  stop?: number;
}

/** @internal Post `write_control_values` or `trim_control_values` and answer LUNA's reply. */
export function postControlValues(
  client: Client,
  sessionUid: string,
  command: 'write_control_values' | 'trim_control_values',
  entries: readonly ControlValue[],
  range: ControlValueRange,
  contextType: string,
): Promise<unknown> {
  const what = command === 'write_control_values' ? 'writeControlValues' : 'trimControlValues';
  if (entries.length === 0) return Promise.reject(new UAError('out_of_range', `${what}(): no controls given`));
  if ((range.start === undefined) !== (range.stop === undefined)) {
    // LUNA reads a range only when both ends are there, and quietly uses the selection otherwise.
    return Promise.reject(new UAError('out_of_range', `${what}(): give both start and stop, or neither for the selection`));
  }
  const controls: { control_uid: string; value: unknown }[] = [];
  for (const e of entries) {
    const uid = typeof e.control === 'string' ? e.control : e.control.uid.value;
    if (!uid) return Promise.reject(new UAError('unavailable', `${what}(): control uid not loaded; call control.load() first`));
    if (typeof e.value !== 'number' || !Number.isFinite(e.value)) return Promise.reject(new UAError('out_of_range', `${what}(): value must be a finite number`));
    controls.push({ control_uid: uid, value: float(e.value) });
  }
  const payload: Record<string, unknown> = { session_uid: sessionUid, context_type: contextType, controls };
  if (range.start !== undefined && range.stop !== undefined) {
    payload['start'] = requireTick(range.start, 'start');
    payload['stop'] = requireTick(range.stop, 'stop');
  }
  return client.raw.post(`/sessions/${sessionUid}/${command}`, payload);
}
