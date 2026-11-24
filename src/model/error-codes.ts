/**
 * Codes a `Luna.Error` can carry, to compare `error.code` against instead of
 * a string literal. The `uasrv.*`, `device.*` and `mixer.*` ones are LUNA's own error strings,
 * passed through unchanged; the rest are the SDK's fixed codes. The engine list is the subset
 * the SDK documents (docs/EVIDENCE.md); LUNA defines more, and an unlisted code still arrives
 * unchanged in `error.code`.
 *
 * @example
 * try {
 *   await session.moveToFolder([track], someBus);
 * } catch (e) {
 *   if (e instanceof Luna.Error && e.code === Luna.ErrorCodes.INVALID_VALUE) showHint('Not a folder');
 *   else throw e;
 * }
 */
export const ErrorCodes = {
  // LUNA's UANet server
  /** A property name the node does not have. */
  INVALID_PROPERTY: 'uasrv.invalid_property',
  /** A value the command or property refuses (an unknown uid, a range, a bad mode). */
  INVALID_VALUE: 'uasrv.invalid_value',
  /** No node or command at the path: often an older LUNA without the feature. */
  INVALID_OBJECT: 'uasrv.invalid_object',
  /** A value of the wrong type. */
  INVALID_TYPE: 'uasrv.invalid_type',
  /** A write to a read-only property. */
  READ_ONLY: 'uasrv.read_only',
  /** A command missing a required field. */
  MISSING_FIELD: 'uasrv.missing_field',
  /** A file or folder could not be read or written. */
  FILESYSTEM_ERROR: 'uasrv.filesystem_error',
  /** LUNA is busy with the same kind of request; try again later. */
  TOO_MANY_REQUESTS: 'uasrv.too_many_requests',
  /** LUNA is busy with another step; try again. */
  SOFTWARE_BUSY: 'uasrv.software_busy',
  /** What the request names is not installed (an Add On, an app, LUNA itself for an "open in LUNA"). */
  NOT_INSTALLED: 'uasrv.not_installed',
  /** The user has not allowed it (for example a folder `list_files` was not granted). */
  NOT_PERMITTED: 'uasrv.not_permitted',
  /** The command exists but is not implemented on this engine. */
  NOT_IMPLEMENTED: 'uasrv.not_implemented',
  /** LUNA's catch-all. */
  DEFAULT_ERROR: 'uasrv.default_error',

  // LUNA's session engine
  /** The session database refused the change (for example a `folder_uid` that is not a folder). */
  DATABASE_ERROR: 'device.database_error',
  /** A file the session needs could not be found or read. */
  DEVICE_FILESYSTEM_ERROR: 'device.filesystem_error',
  /** An output assignment names a bus that no longer exists. */
  MISSING_BUS: 'device.missing_bus',
  /** An assignment names an input that does not exist. */
  MISSING_INPUT: 'device.missing_input',
  /** An assignment names an output that does not exist. */
  MISSING_OUTPUT: 'device.missing_output',
  /** The session cannot be written (read-only). */
  SESSION_NOT_WRITABLE: 'device.session_not_writable',
  /** An edit that needs a selection was given none. */
  NO_SELECTION: 'device.no_selection',
  /** An edit range that is empty or reversed. */
  INVALID_RANGE: 'device.invalid_range',

  // LUNA's mixer
  /** A slot's `plugin_error` when its plug-in is not installed (`Luna.PLUGIN_ERROR_MISSING`). */
  MISSING_PLUGIN: 'mixer.missing_plug-in',

  // The SDK's own (see the `Luna.Error` subclasses)
  /** No LUNA answered: `Luna.NotRunning`. */
  NOT_RUNNING: 'not_running',
  /** A request was not answered in time: `Luna.RequestTimeout`. */
  TIMEOUT: 'timeout',
  /** The connection dropped: `Luna.ConnectionLost`. */
  DISCONNECTED: 'disconnected',
  /** The engine lacks the feature: `Luna.Unsupported`. */
  UNSUPPORTED: 'unsupported',
  /** No session is open: `Luna.NoSessionOpen`. */
  NO_SESSION: 'no_session',
  /** The object's node was removed: `Luna.Disposed`. */
  DISPOSED: 'disposed',
  /** An argument the SDK refuses before sending anything. */
  OUT_OF_RANGE: 'out_of_range',
} as const;

/** One of the {@link ErrorCodes} values. `UAError.code` stays a `string`, since LUNA defines more. */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
