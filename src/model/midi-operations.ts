/**
 * LUNA's MIDI operations (its MIDI Operations panel): one edit applied to every note the
 * edit context selects, posted as the context command `midi_operation` (fact 158). Run them
 * with `session.context.midiOperation(op)`.
 *
 * What they act on follows the context's `focus`: with `notes`, the selected notes; with
 * `timeline`, every note of the selected MIDI tracks inside the selected range; with
 * `playlist`, every note of the clips lying wholly inside the range on the selected
 * playlists. Notes are first clipped to the clip that plays them.
 *
 * @example
 * await session.context.selectNotes(playlist.id, rows);
 * await session.context.midiOperation({ type: 'transpose', semitones: 12 });
 * await session.context.midiOperation({ type: 'velocityPercent', percent: 80 });
 */
import { UAError } from '../wire/errors';
import { TICKS_PER_BEAT, TICKS_PER_DISPLAY_TICK } from './ticks';

/** One MIDI operation. Ranges are LUNA's; anything outside them is refused before it is sent. */
export type MidiOperation =
  /** Set every note's velocity, 1-127. */
  | { type: 'velocity'; value: number }
  /** Scale every velocity by `percent`, 1-200, clamped to 1-127. */
  | { type: 'velocityPercent'; percent: number }
  /**
   * Make every note this long, counted from its start through the time signatures: whole
   * bars, beats and engine ticks (fewer than a beat, in whole display ticks). Omitted parts
   * are 0.
   */
  | { type: 'duration'; bars?: number; beats?: number; ticks?: number }
  /** Scale every length by `percent` (1 or more; 50 halves, 200 doubles). */
  | { type: 'durationPercent'; percent: number }
  /** Scale every length by exactly `numerator / denominator`, rounded to the nearest tick (`1/3` and back round-trips). */
  | { type: 'durationScale'; numerator: number; denominator: number }
  /** Stretch each note to the next note start in its clip, or to the next beat. */
  | { type: 'legato' }
  /** Make every note 100 display ticks long. */
  | { type: 'staccato' }
  /** Mirror the notes' timing inside the selected range. */
  | { type: 'reverse' }
  /** Move every pitch by `semitones`, -24 to 24, clamped to 0-127. */
  | { type: 'transpose'; semitones: number }
  /**
   * Mirror the pitches: `'range'` (default) around the middle of the lowest and highest,
   * `'first'` around the first note, `'root'` around the scale root nearest the middle. With
   * `scale`, in scale degrees rather than semitones: `root` 0-11 (C = 0) and `mask`, a 12-bit
   * pitch-class set (bit N = pitch class N) that includes the root; `'root'` needs one.
   */
  | { type: 'invert'; around?: 'range' | 'first' | 'root'; scale?: { root: number; mask: number } };

function integer(value: unknown, min: number, max: number, what: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new UAError('out_of_range', `midiOperation(): ${what} must be an integer ${min}${max === Infinity ? ' or more' : `-${max}`}`);
  }
  return value;
}

/**
 * @internal The `midi_operation` object for a {@link MidiOperation}. LUNA's own GUI always
 * sends `value` and `value_str`, so this does too.
 */
export function midiOperationPayload(op: MidiOperation): Record<string, unknown> {
  const wire = (operation: string, value = 0, valueStr = ''): Record<string, unknown> => ({ operation, value, value_str: valueStr });
  switch (op?.type) {
    case 'velocity':
      return wire('velocity', integer(op.value, 1, 127, 'value'));
    case 'velocityPercent':
      return wire('velocity_percent', integer(op.percent, 1, 200, 'percent'));
    case 'duration': {
      const bars = integer(op.bars ?? 0, 0, Infinity, 'bars');
      const beats = integer(op.beats ?? 0, 0, Infinity, 'beats');
      const ticks = integer(op.ticks ?? 0, 0, TICKS_PER_BEAT - 1, 'ticks');
      if (ticks % TICKS_PER_DISPLAY_TICK !== 0) throw new UAError('out_of_range', 'midiOperation(): duration ticks must be whole display ticks (multiples of Luna.TICKS_PER_DISPLAY_TICK)');
      if (bars === 0 && beats === 0 && ticks === 0) throw new UAError('out_of_range', 'midiOperation(): a duration needs a length');
      // LUNA reads `bar|beat|tick` with the tick part in display ticks (fact 158).
      return wire('duration', 0, `${bars}|${beats}|${ticks / TICKS_PER_DISPLAY_TICK}`);
    }
    case 'durationPercent':
      return wire('duration_percent', integer(op.percent, 1, Infinity, 'percent'));
    case 'durationScale': {
      const num = integer(op.numerator, 1, Infinity, 'numerator');
      const den = integer(op.denominator, 1, Infinity, 'denominator');
      // The rounded percent travels too, for a LUNA without the exact path (fact 158).
      return wire('duration_percent', Math.max(1, Math.round((100 * num) / den)), `${num}/${den}`);
    }
    case 'legato':
      return wire('legato');
    case 'staccato':
      return wire('staccato');
    case 'reverse':
      return wire('reverse_time');
    case 'transpose':
      return wire('transpose', integer(op.semitones, -24, 24, 'semitones'));
    case 'invert': {
      const around = op.around ?? 'range';
      const name = { range: 'invert_notes', first: 'invert_notes_first', root: 'invert_notes_root' }[around];
      if (!name) throw new UAError('out_of_range', "midiOperation(): invert's around must be 'range', 'first' or 'root'");
      const out = wire(name);
      if (op.scale !== undefined) {
        const root = integer(op.scale.root, 0, 11, 'scale.root');
        const mask = integer(op.scale.mask, 1, 4095, 'scale.mask');
        if ((mask & (1 << root)) === 0) throw new UAError('out_of_range', 'midiOperation(): scale.mask must include scale.root');
        out['scale_root'] = root;
        out['scale_mask'] = mask;
      } else if (around === 'root') {
        throw new UAError('out_of_range', "midiOperation(): invert around 'root' needs a scale");
      }
      return out;
    }
    default:
      throw new UAError('out_of_range', `midiOperation(): unknown operation ${JSON.stringify((op as { type?: unknown } | undefined)?.type)}`);
  }
}
