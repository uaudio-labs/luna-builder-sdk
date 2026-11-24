# Variable: ErrorCodes

```ts
const ErrorCodes: object;
```

Codes a `Luna.Error` can carry, to compare `error.code` against instead of
a string literal. The `uasrv.*`, `device.*` and `mixer.*` ones are LUNA's own error strings,
passed through unchanged; the rest are the SDK's fixed codes. The engine list is the subset
the SDK documents (docs/EVIDENCE.md); LUNA defines more, and an unlisted code still arrives
unchanged in `error.code`.

## Type Declaration

| Name | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="database_error"></a> `DATABASE_ERROR` | `"device.database_error"` | `'device.database_error'` | The session database refused the change (for example a `folder_uid` that is not a folder). |
| <a id="default_error"></a> `DEFAULT_ERROR` | `"uasrv.default_error"` | `'uasrv.default_error'` | LUNA's catch-all. |
| <a id="device_filesystem_error"></a> `DEVICE_FILESYSTEM_ERROR` | `"device.filesystem_error"` | `'device.filesystem_error'` | A file the session needs could not be found or read. |
| <a id="disconnected"></a> `DISCONNECTED` | `"disconnected"` | `'disconnected'` | The connection dropped: `Luna.ConnectionLost`. |
| <a id="disposed"></a> `DISPOSED` | `"disposed"` | `'disposed'` | The object's node was removed: `Luna.Disposed`. |
| <a id="filesystem_error"></a> `FILESYSTEM_ERROR` | `"uasrv.filesystem_error"` | `'uasrv.filesystem_error'` | A file or folder could not be read or written. |
| <a id="invalid_object"></a> `INVALID_OBJECT` | `"uasrv.invalid_object"` | `'uasrv.invalid_object'` | No node or command at the path: often an older LUNA without the feature. |
| <a id="invalid_property"></a> `INVALID_PROPERTY` | `"uasrv.invalid_property"` | `'uasrv.invalid_property'` | A property name the node does not have. |
| <a id="invalid_range"></a> `INVALID_RANGE` | `"device.invalid_range"` | `'device.invalid_range'` | An edit range that is empty or reversed. |
| <a id="invalid_type"></a> `INVALID_TYPE` | `"uasrv.invalid_type"` | `'uasrv.invalid_type'` | A value of the wrong type. |
| <a id="invalid_value"></a> `INVALID_VALUE` | `"uasrv.invalid_value"` | `'uasrv.invalid_value'` | A value the command or property refuses (an unknown uid, a range, a bad mode). |
| <a id="missing_bus"></a> `MISSING_BUS` | `"device.missing_bus"` | `'device.missing_bus'` | An output assignment names a bus that no longer exists. |
| <a id="missing_field"></a> `MISSING_FIELD` | `"uasrv.missing_field"` | `'uasrv.missing_field'` | A command missing a required field. |
| <a id="missing_input"></a> `MISSING_INPUT` | `"device.missing_input"` | `'device.missing_input'` | An assignment names an input that does not exist. |
| <a id="missing_output"></a> `MISSING_OUTPUT` | `"device.missing_output"` | `'device.missing_output'` | An assignment names an output that does not exist. |
| <a id="missing_plugin"></a> `MISSING_PLUGIN` | `"mixer.missing_plug-in"` | `'mixer.missing_plug-in'` | A slot's `plugin_error` when its plug-in is not installed (`Luna.PLUGIN_ERROR_MISSING`). |
| <a id="no_selection"></a> `NO_SELECTION` | `"device.no_selection"` | `'device.no_selection'` | An edit that needs a selection was given none. |
| <a id="no_session"></a> `NO_SESSION` | `"no_session"` | `'no_session'` | No session is open: `Luna.NoSessionOpen`. |
| <a id="not_implemented"></a> `NOT_IMPLEMENTED` | `"uasrv.not_implemented"` | `'uasrv.not_implemented'` | The command exists but is not implemented on this engine. |
| <a id="not_installed"></a> `NOT_INSTALLED` | `"uasrv.not_installed"` | `'uasrv.not_installed'` | What the request names is not installed (an Add On, an app, LUNA itself for an "open in LUNA"). |
| <a id="not_permitted"></a> `NOT_PERMITTED` | `"uasrv.not_permitted"` | `'uasrv.not_permitted'` | The user has not allowed it (for example a folder `list_files` was not granted). |
| <a id="not_running"></a> `NOT_RUNNING` | `"not_running"` | `'not_running'` | No LUNA answered: `Luna.NotRunning`. |
| <a id="out_of_range"></a> `OUT_OF_RANGE` | `"out_of_range"` | `'out_of_range'` | An argument the SDK refuses before sending anything. |
| <a id="read_only"></a> `READ_ONLY` | `"uasrv.read_only"` | `'uasrv.read_only'` | A write to a read-only property. |
| <a id="session_not_writable"></a> `SESSION_NOT_WRITABLE` | `"device.session_not_writable"` | `'device.session_not_writable'` | The session cannot be written (read-only). |
| <a id="software_busy"></a> `SOFTWARE_BUSY` | `"uasrv.software_busy"` | `'uasrv.software_busy'` | LUNA is busy with another step; try again. |
| <a id="timeout"></a> `TIMEOUT` | `"timeout"` | `'timeout'` | A request was not answered in time: `Luna.RequestTimeout`. |
| <a id="too_many_requests"></a> `TOO_MANY_REQUESTS` | `"uasrv.too_many_requests"` | `'uasrv.too_many_requests'` | LUNA is busy with the same kind of request; try again later. |
| <a id="unsupported"></a> `UNSUPPORTED` | `"unsupported"` | `'unsupported'` | The engine lacks the feature: `Luna.Unsupported`. |

## Example

```ts
try {
  await session.moveToFolder([track], someBus);
} catch (e) {
  if (e instanceof Luna.Error && e.code === Luna.ErrorCodes.INVALID_VALUE) showHint('Not a folder');
  else throw e;
}
```
