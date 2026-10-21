/**
 * Live MIDI: play a message on a track now, the way a MIDI keyboard would, through
 * `/sessions/send_midi` and `/sessions/send_midi_all_notes_off` (fact 108). Nothing is written to
 * a clip; to add notes to a clip use {@link Clip.addNotes}. A track that is not record-enabled
 * still plays what it is sent, and `record_enabled` also hands the message to LUNA's record
 * input, so record-enabled tracks hear (and record) it too.
 *
 * The `...ToOutput` methods send to a MIDI device's output port instead, straight out to the
 * hardware (fact 124).
 *
 * Every value is checked first: a byte out of range rejects with `out_of_range` instead of
 * reaching LUNA, which would take it unchecked.
 *
 * @example
 * const midi = new Luna.SendMidi(luna);
 * await midi.sendMidiNote(session.uid, track.id, 60, 100, true);  // note-on, middle C
 * await midi.sendMidiNote(session.uid, track.id, 60, 0, false);   // note-off
 * await midi.sendAllNotesOff();                                   // panic
 */
import type { Client } from '../client/client';
import { UAError } from '../wire/errors';
import { midiByte } from './settle';
import { MidiDevice, MidiPort } from './system';

const STATUS_NOTE_OFF = 0x80;
const STATUS_NOTE_ON = 0x90;
const STATUS_CONTROL_CHANGE = 0xb0;
const STATUS_PROGRAM_CHANGE = 0xc0;

const CC_BANK_SELECT_MSB = 0;
const CC_BANK_SELECT_LSB = 32;

/** A track entry for {@link SendMidi.sendNoteToTracks}. */
export interface SendMidiTrackTarget {
  trackUid: string;
  /** Also hand the event to LUNA's record input. Default `false`. */
  recordEnable?: boolean;
}

/**
 * Where a `...ToOutput` method sends: a MIDI device (its output port), one of its output ports,
 * or an output port's `uid`.
 */
export type MidiOutputTarget = MidiDevice | MidiPort | string;

function outputPortUid(target: MidiOutputTarget): string {
  if (typeof target === 'string') {
    if (!target) throw new UAError('invalid_value', 'output port uid must not be empty');
    return target;
  }
  const port = target instanceof MidiDevice ? target.outputPort : target;
  if (!port) throw new UAError('not_found', `MIDI device ${(target as MidiDevice).name.value ?? target.id} has no output port`, { path: target.path });
  if (!(port instanceof MidiPort) || !port.isOutput) throw new UAError('invalid_value', `${port.path} is an input port; MIDI can only be sent to an output port`, { path: port.path });
  const uid = port.uid.value;
  if (!uid) throw new UAError('not_found', `${port.path} has no uid loaded; load luna.midiDevices first`, { path: port.path });
  return uid;
}

function statusByte(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0x80 || value > 0xff) {
    throw new UAError('out_of_range', 'status byte must be an integer 0x80-0xff');
  }
  return value;
}

function channelOf(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 15) {
    throw new UAError('out_of_range', 'channel must be an integer 0-15');
  }
  return value;
}

/** Run `build` and turn a validation throw into a rejection, so every method fails the same way. */
function checked<T>(build: () => T, then: (value: T) => Promise<void>): Promise<void> {
  let value: T;
  try {
    value = build();
  } catch (e) {
    return Promise.reject(e);
  }
  return then(value);
}

export class SendMidi {
  constructor(
    /** @internal */
    readonly client: Client,
  ) {}

  /**
   * Send a note-on or note-off on channel 1 to one track. It also hands the note to LUNA's
   * record input (`record_enabled`), so record-enabled tracks hear it too.
   *
   * @example
   * await midi.sendMidiNote(session.uid, track.id, 60, 100, true);  // note-on
   * await midi.sendMidiNote(session.uid, track.id, 60, 0, false);   // note-off
   */
  sendMidiNote(sessionUid: string, trackUid: string, note: number, velocity: number, noteOn: boolean): Promise<void> {
    return this.sendMidi(sessionUid, trackUid, noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF, note, velocity);
  }

  /**
   * Send any 3-byte MIDI message to one track: pitch bend, channel pressure and anything else
   * not wrapped here. The channel is in the status byte's low nibble.
   *
   * @example
   * await midi.sendMidi(session.uid, track.id, 0xe0, 0x00, 0x40);  // pitch bend centre
   */
  sendMidi(sessionUid: string, trackUid: string, byte0: number, byte1: number, byte2: number): Promise<void> {
    return checked(
      () => ({ session_uid: sessionUid, track_uid: trackUid, byte_0: statusByte(byte0), byte_1: midiByte(byte1, 'data byte 1'), byte_2: midiByte(byte2, 'data byte 2'), record_enabled: true }),
      (payload) => this.post('send_midi', payload),
    );
  }

  /**
   * Send the same note-on or note-off to several tracks. LUNA's own multi-track form delivers
   * the note but answers `uasrv.invalid_property` every time (fact 109), so this sends one
   * message per track instead, and hands the note to the record input once when any entry
   * asks for it, which is what LUNA's form does.
   *
   * @example
   * await midi.sendNoteToTracks(session.uid, [
   *   { trackUid: piano.id, recordEnable: true },
   *   { trackUid: pad.id },
   * ], 60, 100, true);
   */
  sendNoteToTracks(sessionUid: string, tracks: ReadonlyArray<SendMidiTrackTarget>, note: number, velocity: number, noteOn: boolean): Promise<void> {
    return checked(
      () => {
        if (!tracks.length) throw new UAError('out_of_range', 'sendNoteToTracks(): give at least one track');
        const bytes = { byte_0: noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF, byte_1: midiByte(note, 'note'), byte_2: midiByte(velocity, 'velocity') };
        const recordAt = tracks.findIndex((t) => t.recordEnable === true);
        return tracks.map((t, i) => ({ session_uid: sessionUid, track_uid: t.trackUid, ...bytes, record_enabled: i === recordAt }));
      },
      async (payloads) => {
        await Promise.all(payloads.map((p) => this.post('send_midi', p)));
      },
    );
  }

  /**
   * Send a Control Change to a track.
   *
   * @param controller CC number, 0-127 (7 volume, 10 pan, 64 sustain).
   * @param value CC value, 0-127.
   * @param channel MIDI channel, 0-15. Default 0.
   *
   * @example
   * await midi.sendController(session.uid, track.id, 64, 127);  // sustain down
   */
  sendController(sessionUid: string, trackUid: string, controller: number, value: number, channel = 0): Promise<void> {
    return checked(
      () => STATUS_CONTROL_CHANGE | channelOf(channel),
      (status) => this.sendMidi(sessionUid, trackUid, status, controller, value),
    );
  }

  /**
   * Send a Program Change to a track, after Bank Select MSB and LSB (CC 0 and CC 32) when
   * either bank is given; the one left out is sent as 0. The messages go in order, one at a
   * time, so another sender on the same track could land between them.
   *
   * @example
   * await midi.sendProgramChange(session.uid, track.id, 0);         // program only
   * await midi.sendProgramChange(session.uid, track.id, 5, 0, 12);  // bank 0/12, program 5
   */
  sendProgramChange(sessionUid: string, trackUid: string, program: number, bankMSB?: number, bankLSB?: number): Promise<void> {
    return checked(
      () => {
        midiByte(program, 'program');
        if (bankMSB !== undefined) midiByte(bankMSB, 'bankMSB');
        if (bankLSB !== undefined) midiByte(bankLSB, 'bankLSB');
        return bankMSB !== undefined || bankLSB !== undefined;
      },
      async (needsBank) => {
        if (needsBank) {
          await this.sendMidi(sessionUid, trackUid, STATUS_CONTROL_CHANGE, CC_BANK_SELECT_MSB, bankMSB ?? 0);
          await this.sendMidi(sessionUid, trackUid, STATUS_CONTROL_CHANGE, CC_BANK_SELECT_LSB, bankLSB ?? 0);
        }
        await this.sendMidi(sessionUid, trackUid, STATUS_PROGRAM_CHANGE, program, 0);
      },
    );
  }

  /**
   * Panic: send All Notes Off to every MIDI-capable track and connected MIDI device, in every
   * session.
   *
   * @example
   * await midi.sendAllNotesOff();
   */
  async sendAllNotesOff(): Promise<void> {
    await this.client.raw.post('/sessions/send_midi_all_notes_off', {});
  }

  /**
   * Send a note-on or note-off on channel 1 to a MIDI input source by name, as though it came
   * from that device, bypassing track routing. It goes into LUNA, not out to the device; to
   * play the hardware use {@link sendNoteToOutput}. LUNA answers success for a name it does not
   * know (fact 108), so a typo fails silently.
   *
   * @example
   * await midi.sendDeviceNote('IAC Driver Bus 1', 60, 100, true);
   */
  sendDeviceNote(midiInputSource: string, note: number, velocity: number, noteOn: boolean): Promise<void> {
    return checked(
      () => ({ midi_input_source: midiInputSource, byte_0: noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF, byte_1: midiByte(note, 'note'), byte_2: midiByte(velocity, 'velocity') }),
      (payload) => this.post('send_midi', payload),
    );
  }

  /**
   * Send any 3-byte MIDI message out of a MIDI device's output port, to the hardware rather
   * than a track (fact 124). The channel is in the status byte's low nibble. LUNA answers
   * success whatever the uid, so a port that has gone (the device was unplugged, or LUNA
   * restarted and gave it a new uid) fails silently: look the device up by name each session.
   *
   * @example
   * await luna.midiDevices.load();
   * const synth = luna.midiDevices.items.find((d) => d.name.value === 'Volt 876');
   * if (synth?.outputPort) await midi.sendMidiToOutput(synth, 0xe0, 0x00, 0x40);  // pitch bend centre
   */
  sendMidiToOutput(output: MidiOutputTarget, byte0: number, byte1: number, byte2: number): Promise<void> {
    return checked(
      () => ({ midi_input_source: outputPortUid(output), byte_0: statusByte(byte0), byte_1: midiByte(byte1, 'data byte 1'), byte_2: midiByte(byte2, 'data byte 2') }),
      (payload) => this.post('send_midi', payload),
    );
  }

  /**
   * Send a note-on or note-off out of a MIDI device's output port.
   *
   * @param channel MIDI channel, 0-15. Default 0.
   *
   * @example
   * await midi.sendNoteToOutput(synth, 60, 100, true);  // note-on, middle C
   * await midi.sendNoteToOutput(synth, 60, 0, false);   // note-off
   */
  sendNoteToOutput(output: MidiOutputTarget, note: number, velocity: number, noteOn: boolean, channel = 0): Promise<void> {
    return checked(
      () => (noteOn ? STATUS_NOTE_ON : STATUS_NOTE_OFF) | channelOf(channel),
      (status) => this.sendMidiToOutput(output, status, note, velocity),
    );
  }

  /**
   * Send a Control Change out of a MIDI device's output port.
   *
   * @param controller CC number, 0-127 (7 volume, 10 pan, 64 sustain).
   * @param value CC value, 0-127.
   * @param channel MIDI channel, 0-15. Default 0.
   *
   * @example
   * await midi.sendControllerToOutput(synth, 7, 100);  // volume
   */
  sendControllerToOutput(output: MidiOutputTarget, controller: number, value: number, channel = 0): Promise<void> {
    return checked(
      () => STATUS_CONTROL_CHANGE | channelOf(channel),
      (status) => this.sendMidiToOutput(output, status, controller, value),
    );
  }

  /**
   * Send a Program Change out of a MIDI device's output port, after Bank Select MSB and LSB
   * (CC 0 and CC 32) when either bank is given; the one left out is sent as 0.
   *
   * @param channel MIDI channel, 0-15. Default 0.
   *
   * @example
   * await midi.sendProgramChangeToOutput(synth, 5, 0, 12);  // bank 0/12, program 5
   */
  sendProgramChangeToOutput(output: MidiOutputTarget, program: number, bankMSB?: number, bankLSB?: number, channel = 0): Promise<void> {
    return checked(
      () => {
        midiByte(program, 'program');
        if (bankMSB !== undefined) midiByte(bankMSB, 'bankMSB');
        if (bankLSB !== undefined) midiByte(bankLSB, 'bankLSB');
        return { uid: outputPortUid(output), channel: channelOf(channel), needsBank: bankMSB !== undefined || bankLSB !== undefined };
      },
      async ({ uid, channel: ch, needsBank }) => {
        if (needsBank) {
          await this.sendMidiToOutput(uid, STATUS_CONTROL_CHANGE | ch, CC_BANK_SELECT_MSB, bankMSB ?? 0);
          await this.sendMidiToOutput(uid, STATUS_CONTROL_CHANGE | ch, CC_BANK_SELECT_LSB, bankLSB ?? 0);
        }
        await this.sendMidiToOutput(uid, STATUS_PROGRAM_CHANGE | ch, program, 0);
      },
    );
  }

  private async post(command: string, payload: Record<string, unknown>): Promise<void> {
    await this.client.raw.post(`/sessions/${command}`, payload);
  }
}
