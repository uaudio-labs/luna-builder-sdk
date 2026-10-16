/**
 * The computer keyboard as a MIDI keyboard: turns key presses into live notes through
 * {@link SendMidi}, with an octave and a velocity the user steps with keys.
 *
 * Key layout (piano-style, two rows):
 *
 *     White keys: A S D F G H J K L ;
 *     Black keys: W E   T Y U   O P
 *
 * Z and X step the octave up and down (0-9, default 4, so A is C4 = 48), C and V the velocity
 * (1-127 in steps of 8, default 100).
 *
 * Octave and velocity are props. A handled key is claimed with `preventDefault()`, because inside LUNA a
 * key the page leaves alone also runs LUNA's own shortcut (fact 81). And a key pressed with
 * Cmd, Ctrl or Alt, or typed into a text field, is left alone, so Cmd+Z stays undo.
 *
 * A note-off is only sent on keyup, and a page that loses focus with a key down never gets
 * one, so release held notes on `blur`.
 *
 * @example
 * const qwerty = new Luna.QwertyMidi(new Luna.SendMidi(luna));
 * document.addEventListener('keydown', (e) => qwerty.handleKeyDown(e, session.uid, track.id));
 * document.addEventListener('keyup', (e) => qwerty.handleKeyUp(e));
 * window.addEventListener('blur', () => qwerty.releaseAll());
 * qwerty.octave.onChange(() => (label.textContent = `Octave ${qwerty.octave.value}`));
 */
import { Cell, writable, type WritableProp } from '../store/prop';
import type { SendMidi } from './send-midi';

const NOTE_OFFSETS: Readonly<Record<string, number>> = {
  A: 0,
  W: 1,
  S: 2,
  E: 3,
  D: 4,
  F: 5,
  T: 6,
  G: 7,
  Y: 8,
  H: 9,
  U: 10,
  J: 11,
  K: 12,
  O: 13,
  L: 14,
  P: 15,
  ';': 16,
};

const OCTAVE_MIN = 0;
const OCTAVE_MAX = 9;
const VELOCITY_STEP = 8;
const VELOCITY_MIN = 1;
const VELOCITY_MAX = 127;

/** The parts of a `KeyboardEvent` the keyboard reads. */
export type QwertyKeyEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'preventDefault'> & Partial<Pick<KeyboardEvent, 'target' | 'isComposing'>>;

interface HeldNote {
  note: number;
  sessionUid: string;
  trackUid: string;
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, Math.round(v)));

/** True for a target that consumes typed keys: a text input, textarea, select or editable. */
function isEditable(target: EventTarget | null | undefined): boolean {
  const el = target as { tagName?: string; type?: string; isContentEditable?: boolean } | null | undefined;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (el.type ?? 'text').toLowerCase();
  return !['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit'].includes(type);
}

const keyOf = (e: Pick<KeyboardEvent, 'key'>): string => (e.key.length === 1 ? e.key.toUpperCase() : e.key);

export class QwertyMidi {
  /** The octave the note keys play, 0-9. A is C in this octave. `set` clamps. */
  readonly octave: WritableProp<number>;
  /** The note-on velocity, 1-127. `set` clamps. */
  readonly velocity: WritableProp<number>;

  private readonly octaveCell: Cell<number>;
  private readonly velocityCell: Cell<number>;
  /** Held notes by key: suppresses key repeat and sends the right note-off on keyup. */
  private readonly heldNotes = new Map<string, HeldNote>();

  constructor(private readonly sendMidi: SendMidi) {
    const scheduler = sendMidi.client.store.scheduler;
    this.octaveCell = new Cell<number>(scheduler, 4);
    this.velocityCell = new Cell<number>(scheduler, 100);
    this.octave = writable(this.octaveCell, async (v) => void this.octaveCell.update(clamp(v, OCTAVE_MIN, OCTAVE_MAX)));
    this.velocity = writable(this.velocityCell, async (v) => void this.velocityCell.update(clamp(v, VELOCITY_MIN, VELOCITY_MAX)));
  }

  /**
   * Handle a keydown. Returns true, having called `preventDefault()`, when the key was a note
   * or a control key; a repeat of a held note key is claimed but not replayed.
   *
   * @example
   * document.addEventListener('keydown', (e) => qwerty.handleKeyDown(e, session.uid, track.id));
   */
  handleKeyDown(e: QwertyKeyEvent, sessionUid: string, trackUid: string): boolean {
    if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing || isEditable(e.target)) return false;
    const key = keyOf(e);
    const octave = this.octaveCell.value ?? 4;
    const velocity = this.velocityCell.value ?? 100;

    switch (key) {
      case 'Z':
        this.octaveCell.update(Math.min(OCTAVE_MAX, octave + 1));
        e.preventDefault();
        return true;
      case 'X':
        this.octaveCell.update(Math.max(OCTAVE_MIN, octave - 1));
        e.preventDefault();
        return true;
      case 'C':
        this.velocityCell.update(Math.min(VELOCITY_MAX, velocity + VELOCITY_STEP));
        e.preventDefault();
        return true;
      case 'V':
        this.velocityCell.update(Math.max(VELOCITY_MIN, velocity - VELOCITY_STEP));
        e.preventDefault();
        return true;
    }

    const offset = NOTE_OFFSETS[key];
    if (offset === undefined) return false;
    e.preventDefault();
    if (this.heldNotes.has(key)) return true; // key repeat

    const note = octave * 12 + offset;
    this.heldNotes.set(key, { note, sessionUid, trackUid });
    void this.sendMidi.sendMidiNote(sessionUid, trackUid, note, velocity, true).catch(warn);
    return true;
  }

  /**
   * Handle a keyup. Returns true, having called `preventDefault()`, when it released a held
   * note. The note-off goes to the track and pitch the note-on went to, even if the octave
   * changed while it was held.
   *
   * @example
   * document.addEventListener('keyup', (e) => qwerty.handleKeyUp(e));
   */
  handleKeyUp(e: Pick<KeyboardEvent, 'key' | 'preventDefault'>): boolean {
    const key = keyOf(e);
    const held = this.heldNotes.get(key);
    if (held === undefined) return false;
    this.heldNotes.delete(key);
    e.preventDefault();
    void this.sendMidi.sendMidiNote(held.sessionUid, held.trackUid, held.note, 0, false).catch(warn);
    return true;
  }

  /**
   * Send a note-off for every held note. Call it when the page loses focus, which swallows
   * the keyups.
   *
   * @example
   * window.addEventListener('blur', () => qwerty.releaseAll());
   */
  releaseAll(): void {
    const held = [...this.heldNotes.values()];
    this.heldNotes.clear();
    for (const h of held) void this.sendMidi.sendMidiNote(h.sessionUid, h.trackUid, h.note, 0, false).catch(warn);
  }

  /** Forget held notes without sending note-offs, after the connection was replaced. */
  resetConnection(): void {
    this.heldNotes.clear();
  }

  /** Release every held note and forget them. */
  destroy(): void {
    this.releaseAll();
  }
}

function warn(error: unknown): void {
  console.warn('Luna.QwertyMidi send failed:', error);
}
