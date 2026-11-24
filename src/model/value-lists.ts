/**
 * Runtime value lists and parsers for the string properties LUNA publishes: track, bus,
 * folder-mode, stem-format, session and control types (fact 181). Each list mirrors LUNA's own enum and
 * must track it. A parser returns the value when LUNA would publish it and `undefined` for
 * anything else (an unknown string, `null`, a number), so a page can validate what it reads,
 * fill a menu, or check user input before sending it.
 */
import type { BusType, FolderMode } from './bus';
import { CONTROL_TYPES, type KnownControlType } from './control';
import type { TrackType } from './track';

/**
 * Every {@link TrackType} LUNA defines. `click` and `count_in` are LUNA's system tracks, and
 * `bus` a track that stands for a bus; `audio`, `instrument`, `midi_matrix` and `video` are what
 * `session.newTrack()` makes.
 *
 * @example
 * const menu = Luna.TRACK_TYPES.filter((t) => t !== 'click' && t !== 'count_in');
 */
export const TRACK_TYPES: readonly TrackType[] = ['audio', 'instrument', 'midi_matrix', 'bus', 'click', 'count_in', 'multi_output', 'video'];

/**
 * A `track_type` value as a {@link TrackType}, or `undefined` when LUNA would not publish it.
 *
 * @example
 * Luna.parseTrackType('instrument');   // 'instrument'
 * Luna.parseTrackType('Audio');        // undefined
 */
export function parseTrackType(value: unknown): TrackType | undefined {
  return (TRACK_TYPES as readonly unknown[]).includes(value) ? (value as TrackType) : undefined;
}

/** LUNA's cue buses: `cue_0` .. `cue_63`. */
export const MAX_CUE_BUSES = 64;

/**
 * The named {@link BusType}s LUNA defines. Cue buses are not in it: LUNA numbers them
 * `cue_0` .. `cue_63` ({@link MAX_CUE_BUSES}), which {@link parseBusType} accepts. `headphone`
 * is a device bus (Volt), not one a session holds.
 *
 * @example
 * Luna.BUS_TYPES.includes('aux');   // true
 */
export const BUS_TYPES: readonly BusType[] = ['master', 'aux', 'input', 'talkback', 'loopback', 'headphone'];

/**
 * A `bus_type` value as a {@link BusType}: one of {@link BUS_TYPES}, or a cue bus `cue_N` with
 * N below {@link MAX_CUE_BUSES}. Anything else is `undefined`.
 *
 * @example
 * Luna.parseBusType('cue_2');    // 'cue_2'
 * Luna.parseBusType('cue_64');   // undefined
 */
export function parseBusType(value: unknown): BusType | undefined {
  if ((BUS_TYPES as readonly unknown[]).includes(value)) return value as BusType;
  if (typeof value !== 'string') return undefined;
  const m = /^cue_(0|[1-9]\d*)$/.exec(value);
  return m && Number(m[1]) < MAX_CUE_BUSES ? (value as BusType) : undefined;
}

/**
 * Every {@link FolderMode} (fact 136): `none` is an ordinary bus, `summing` and `container`
 * are folders.
 *
 * @example
 * for (const mode of Luna.FOLDER_MODES) select.add(new Option(mode));
 */
export const FOLDER_MODES: readonly FolderMode[] = ['none', 'summing', 'container'];

/**
 * A `folder_mode` value as a {@link FolderMode}, or `undefined`. A mode that has not arrived
 * yet is `undefined` too, which is not a folder: test for one with `Bus.isFolder`, not with
 * `mode !== 'none'`.
 *
 * @example
 * Luna.parseFolderMode('summing');   // 'summing'
 * Luna.parseFolderMode(2);           // undefined
 */
export function parseFolderMode(value: unknown): FolderMode | undefined {
  return (FOLDER_MODES as readonly unknown[]).includes(value) ? (value as FolderMode) : undefined;
}

/**
 * The stem formats LUNA's enum publishes, in its spelling. A channel in a LUNA session is
 * `mono` or `stereo`; the rest are its multichannel formats (`2_1`, `lcr`, ..., `9_1_6`).
 *
 * @example
 * Luna.STEM_FORMATS.slice(0, 2);   // ['mono', 'stereo']
 */
export const STEM_FORMATS = ['mono', 'stereo', '2_1', 'lcr', 'lcrs', 'quad', '5_1', '6_1', '7_1', '5_1_4', '7_1_4', '9_1_6'] as const;

/** One of {@link STEM_FORMATS}. */
export type KnownStemFormat = (typeof STEM_FORMATS)[number];

/**
 * A `stem_format` value as one of {@link STEM_FORMATS}, or `undefined`.
 *
 * @example
 * Luna.parseStemFormat('stereo');      // 'stereo'
 * Luna.parseStemFormat('mid-side');    // undefined
 */
export function parseStemFormat(value: unknown): KnownStemFormat | undefined {
  return (STEM_FORMATS as readonly unknown[]).includes(value) ? (value as KnownStemFormat) : undefined;
}

/**
 * Session package types, in LUNA's order: a package's `session_type` is this index in a
 * `/workspace/query` row (a template is 3, fact 151) and this string on a session or package
 * node. `multi` is no longer made, `history` and `track_preset` are LUNA's own packages (see
 * {@link HIDDEN_SESSION_TYPES}).
 *
 * @example
 * Luna.SESSION_TYPES[3];   // 'template'
 */
export const SESSION_TYPES = ['default', 'multi', 'history', 'template', 'track_preset', 'device_mixer', 'volt', 'standalone'] as const;

/** One of {@link SESSION_TYPES}. */
export type SessionType = (typeof SESSION_TYPES)[number];

/**
 * A `session_type` value as a {@link SessionType}: the string, or its index in
 * {@link SESSION_TYPES} as a workspace query row carries it. Anything else is `undefined`.
 *
 * @example
 * Luna.parseSessionType(3);              // 'template'
 * Luna.parseSessionType('track_preset'); // 'track_preset'
 * Luna.parseSessionType(8);              // undefined
 */
export function parseSessionType(value: unknown): SessionType | undefined {
  if (typeof value === 'number') return Number.isInteger(value) ? SESSION_TYPES[value] : undefined;
  return (SESSION_TYPES as readonly unknown[]).includes(value) ? (value as SessionType) : undefined;
}

/**
 * The session types an Add On listing the user's sessions should leave out: LUNA's undo
 * history packages and the packages that hold track presets, which the user never opens as
 * sessions.
 *
 * @example
 * const shown = rows.filter((row) => !Luna.isHiddenSessionType(row.sessionType));
 */
export const HIDDEN_SESSION_TYPES: readonly SessionType[] = ['history', 'track_preset'];

/**
 * Whether a `session_type` (string or index) is one of {@link HIDDEN_SESSION_TYPES}.
 *
 * @example
 * Luna.isHiddenSessionType(2);           // true, 'history'
 * Luna.isHiddenSessionType('default');   // false
 */
export function isHiddenSessionType(value: unknown): boolean {
  const type = parseSessionType(value);
  return type !== undefined && HIDDEN_SESSION_TYPES.includes(type);
}

/**
 * A `control_type` value as one of {@link CONTROL_TYPES}, or `undefined`.
 *
 * @example
 * Luna.parseControlType('preamp_gain');   // 'preamp_gain'
 * Luna.parseControlType('volume');        // undefined
 */
export function parseControlType(value: unknown): KnownControlType | undefined {
  return (CONTROL_TYPES as readonly unknown[]).includes(value) ? (value as KnownControlType) : undefined;
}
