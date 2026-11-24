/**
 * @hidden What the self-test's checks share: test audio, tracks and clips made in the runner's
 * session, and a wait helper. Everything here is made in that session, which the runner closes.
 */
import { TICKS_PER_BEAT } from '../../src/model/ticks';
import type { AudioSource } from '../../src/model/audio-source';
import type { Clip } from '../../src/model/clip';
import type { Track } from '../../src/model/track';
import type { CheckContext } from './runner';

/** One whole note in engine ticks (4/4). */
export const BAR = TICKS_PER_BEAT * 4;

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Resolve once `cond()` holds, or fail with `what` after `ms`. */
export async function waitFor(cond: () => boolean | Promise<boolean>, what: string, ms = 10_000): Promise<void> {
  const deadline = Date.now() + ms;
  for (;;) {
    if (await cond()) return;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(100);
  }
}

/** A mono 16-bit 48 kHz WAV of quiet noise, `seconds` long. */
export function noiseWav(seconds: number): Uint8Array {
  const n = 48000 * seconds;
  const bytes = new Uint8Array(44 + n * 2);
  const v = new DataView(bytes.buffer);
  const text = (at: number, s: string): void => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 48000, true);
  v.setUint32(28, 96000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); text(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round((Math.random() - 0.5) * 2000), true);
  return bytes;
}

/** A minimal standard MIDI file: one track, middle C for a beat. */
export function tinyMidiFile(): Uint8Array {
  const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0];
  const events = [0x00, 0x90, 60, 100, 0x83, 0x60, 0x80, 60, 0, 0x00, 0xff, 0x2f, 0x00];
  const track = [0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, events.length, ...events];
  return new Uint8Array([...header, ...track]);
}

let counter = 0;
/** A name no other check in the run uses. */
export function uniqueName(prefix: string): string {
  counter += 1;
  return `${prefix} ${counter}`;
}

/** A new audio track in the runner's session. */
export async function newAudioTrack(ctx: CheckContext, name = uniqueName('Self-test audio')): Promise<Track> {
  const [track] = await ctx.session.newTrack({ name, makeNameUnique: true });
  if (!track) throw new Error('newTrack made no track');
  return track;
}

/** A new instrument (MIDI) track in the runner's session. */
export async function newMidiTrack(ctx: CheckContext, name = uniqueName('Self-test MIDI')): Promise<Track> {
  const [track] = await ctx.session.newTrack({ name, trackType: 'instrument', stemFormat: 'stereo', makeNameUnique: true });
  if (!track) throw new Error('newTrack made no track');
  return track;
}

const sources = new WeakMap<object, Promise<AudioSource>>();
/** The run's test audio, uploaded once per session. */
export function testAudio(ctx: CheckContext): Promise<AudioSource> {
  let source = sources.get(ctx.session);
  if (!source) {
    source = ctx.session.uploadFile({ bytes: noiseWav(4), name: 'sdk-selftest.wav' });
    sources.set(ctx.session, source);
  }
  return source;
}

/** An audio clip of the test audio on a new track, from bar 1 to bar 3. */
export async function audioClip(ctx: CheckContext): Promise<{ track: Track; clip: Clip; source: AudioSource }> {
  const source = await testAudio(ctx);
  const track = await newAudioTrack(ctx);
  const clip = await ctx.session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: BAR * 2 });
  return { track, clip, source };
}
