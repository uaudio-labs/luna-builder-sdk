# Luna

## Classes

| Class | Description |
| ------ | ------ |
| [AddOn](classes/AddOn.md) | - |
| [AudioSource](classes/AudioSource.md) | - |
| [Automation](classes/Automation.md) | An observable ordered collection with id lookup. |
| [Bindings](classes/Bindings.md) | - |
| [BreakpointNode](classes/BreakpointNode.md) | - |
| [Bus](classes/Bus.md) | - |
| [Cell](classes/Cell.md) | The concrete [Prop](interfaces/Prop.md): a value with a version stamp and listeners. The version lets the Store decide whether an incoming value is newer than a pending write. |
| [Channel](classes/Channel.md) | - |
| [Chord](classes/Chord.md) | - |
| [Chords](classes/Chords.md) | An observable ordered collection with id lookup. |
| [Client](classes/Client.md) | - |
| [Clip](classes/Clip.md) | - |
| [Collection](classes/Collection.md) | An observable ordered collection with id lookup. |
| [ConnectionLost](classes/ConnectionLost.md) | The connection dropped (or was closed) while a request was in flight, or a request was made while disconnected. |
| [Context](classes/Context.md) | - |
| [Control](classes/Control.md) | - |
| [Controls](classes/Controls.md) | An observable ordered collection with id lookup. |
| [Device](classes/Device.md) | `/devices/<uid>`: a hardware or virtual device with its own tracks, buses, inputs, outputs. |
| [Devices](classes/Devices.md) | An observable ordered collection with id lookup. |
| [Disposed](classes/Disposed.md) | The object was disposed: the engine removed its node (a deleted track, a closed session), or its owner was disposed. Its props stop updating and its commands refuse to run, so a stale reference cannot act on whatever takes its place. |
| [Drivers](classes/Drivers.md) | `/drivers`: what audio hardware the engine sees. |
| [Effect](classes/Effect.md) | - |
| [Error](classes/Error.md) | Errors thrown by the wire layer and everything above it. |
| [FloatLiteral](classes/FloatLiteral.md) | A number that must reach the engine as a JSON float literal. Some fields are parsed by token type: a breakpoint `value` written as `-6` is stored as 0, while `-6.0` is stored as -6 (fact 79). `JSON.stringify` writes every whole number without a fraction, so wrap the value and the codec writes `-6.0`. |
| [Gui](classes/Gui.md) | - |
| [GuiWindow](classes/GuiWindow.md) | - |
| [Job](classes/Job.md) | `/jobs/<uid>`: long-running engine jobs (lyric transcription, chord extraction, ...). `percentComplete` is 0..100. Terminal jobs are published and then removed, so latch the last snapshot if you need it. Only `cancel()` exists; there is no delete. |
| [Jobs](classes/Jobs.md) | An observable ordered collection with id lookup. |
| [KeySignature](classes/KeySignature.md) | - |
| [Marker](classes/Marker.md) | - |
| [Markers](classes/Markers.md) | An observable ordered collection with id lookup. |
| [Meter](classes/Meter.md) | - |
| [MidiClip](classes/MidiClip.md) | The MIDI of one clip, reached as `clip.midi`. Both lists notify once per frame, like every other [List](interfaces/List.md). An audio clip's table is empty. |
| [MockEngine](classes/MockEngine.md) | - |
| [MockPort](classes/MockPort.md) | One client connection to a [MockEngine](classes/MockEngine.md). |
| [Musical](classes/Musical.md) | The musical structure of one session. |
| [Node](classes/Node.md) | - |
| [NoSessionOpen](classes/NoSessionOpen.md) | No session is open in the engine. |
| [NotRunning](classes/NotRunning.md) | No engine answered at the address. Start LUNA, or pass `{ engine: 'wasm' }`. |
| [Output](classes/Output.md) | - |
| [Playlist](classes/Playlist.md) | - |
| [Plugin](classes/Plugin.md) | - |
| [Plugins](classes/Plugins.md) | An observable ordered collection with id lookup. |
| [Preferences](classes/Preferences.md) | `/preferences`: engine preferences as writable properties by name. |
| [Presets](classes/Presets.md) | - |
| [Render](classes/Render.md) | `/renders/<uid>`: a bounce or an export. `state` runs `created` -> `running` -> `completed` | `aborted`, and LUNA drops the node shortly after it settles, so latch anything you still need rather than reading it later (fact 44). |
| [Renders](classes/Renders.md) | An observable ordered collection with id lookup. |
| [RequestTimeout](classes/RequestTimeout.md) | The engine did not answer a request within the port's timeout. |
| [Scheduler](classes/Scheduler.md) | Coalesces change notifications. In a browser it flushes on the next animation frame with a timer fallback (hidden tabs suspend rAF); elsewhere on a macrotask. Tests call `flush()`. |
| [Session](classes/Session.md) | - |
| [SessionPackage](classes/SessionPackage.md) | One session package as a live node. |
| [Sessions](classes/Sessions.md) | - |
| [Shortcuts](classes/Shortcuts.md) | The standard shortcuts as an object: which command a key means, and running it. Most Add Ons only need [bindShortcuts](functions/bindShortcuts.md); use this directly to route keys from a listener the page already has, or to run a command from a menu. |
| [Store](classes/Store.md) | - |
| [TempoEvent](classes/TempoEvent.md) | - |
| [Timeline](classes/Timeline.md) | Pure tick arithmetic over the current tempo map and time signatures. Every method reads the maps as they are now; [onChange](classes/Timeline.md#onchange) says when an answer may have moved. |
| [TimeSignature](classes/TimeSignature.md) | - |
| [Track](classes/Track.md) | - |
| [Transport](classes/Transport.md) | - |
| [Unsupported](classes/Unsupported.md) | The feature is not available on this engine (for example the wasm engine has no licensing). |
| [WasmEngine](classes/WasmEngine.md) | A booted engine. Created by [bootWasmEngine](functions/bootWasmEngine.md); the [WasmPort](classes/WasmPort.md) talks through it. One engine per page: shutdown is terminal, reload the page to boot again. |
| [WasmPort](classes/WasmPort.md) | A connection to one engine. |
| [Waveforms](classes/Waveforms.md) | A bounded cache of overview pages, keyed by source, analysis and page index. A short page (the end of the analysis, or growth in progress) is never cached, so a recording still being written is re-read until it settles. |
| [WebSocketPort](classes/WebSocketPort.md) | A connection to one engine. |
| [Workspace](classes/Workspace.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AudioDeviceInfo](interfaces/AudioDeviceInfo.md) | - |
| [AudioHealth](interfaces/AudioHealth.md) | Audio-path health as the engine reports it. |
| [AudioInput](interfaces/AudioInput.md) | A device input a track can record from, as [Client.audioInputs](classes/Client.md#audioinputs) lists it. |
| [BarBeat](interfaces/BarBeat.md) | A bar|beat position as the engine reports it in `location.bar_beat`, and as `timeline.barBeat()` returns it. `tick` is in **engine** ticks (the remainder within the beat), not display ticks; [formatBarBeat](functions/formatBarBeat.md) does the conversion. |
| [BootOptions](interfaces/BootOptions.md) | - |
| [BounceOptions](interfaces/BounceOptions.md) | - |
| [Breakpoint](interfaces/Breakpoint.md) | - |
| [ChordSpec](interfaces/ChordSpec.md) | A chord to write with `musical.setChords`. |
| [ClipAudio](interfaces/ClipAudio.md) | - |
| [ClipLike](interfaces/ClipLike.md) | The clip fields placement needs. A [Clip](classes/Clip.md) satisfies it, as does a plain snapshot. |
| [ClipNote](interfaces/ClipNote.md) | One note for [Clip.addNotes](classes/Clip.md#addnotes). `tick` is relative to the clip start. |
| [ClipSnapshot](interfaces/ClipSnapshot.md) | A clip's state at one moment, as plain data: what a view draws from. |
| [ClockOptions](interfaces/ClockOptions.md) | - |
| [ConnectOptions](interfaces/ConnectOptions.md) | - |
| [ControlBinding](interfaces/ControlBinding.md) | What [bindRange](functions/bindRange.md) and [bindDrag](functions/bindDrag.md) return. |
| [CreateSessionOptions](interfaces/CreateSessionOptions.md) | - |
| [Destination](interfaces/Destination.md) | Where an output goes. `uid` is the assignment's, the handle [Output.unassign](classes/Output.md#unassign) takes. |
| [DragOptions](interfaces/DragOptions.md) | - |
| [Event](interfaces/Event.md) | One change pushed by the engine, normalised: a trailing `/value` is stripped, multi-updates are already expanded, and `operation` marks a child added or removed at `path`. |
| [ExportOptions](interfaces/ExportOptions.md) | - |
| [Gesture](interfaces/Gesture.md) | - |
| [GestureOptions](interfaces/GestureOptions.md) | - |
| [GetOptions](interfaces/GetOptions.md) | Query parameters accepted by `get`, in camelCase. Booleans become `1`/`0` on the wire. See `hbsystem/networking/docs/operations.md`. |
| [List](interfaces/List.md) | An observable ordered collection with id lookup. |
| [Location](interfaces/Location.md) | The `location` property of a session. |
| [LocationOptions](interfaces/LocationOptions.md) | - |
| [MidiEvent](interfaces/MidiEvent.md) | One MIDI event to add to a clip. `tick` is relative to the clip start. |
| [MidiHost](interfaces/MidiHost.md) | What a MIDI edit needs to reach LUNA's edit context: the session it lives in, the playlist that holds the clip, and the clip's own start tick (the selection is in absolute ticks). |
| [MidiRow](interfaces/MidiRow.md) | One row of a clip's MIDI table: a single MIDI message at a clip-relative tick. |
| [MidiRowData](interfaces/MidiRowData.md) | The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40). |
| [MockMidiRow](interfaces/MockMidiRow.md) | A row for [MockEngine.midiEdit](classes/MockEngine.md#midiedit). |
| [MockNodeSpec](interfaces/MockNodeSpec.md) | - |
| [NewBusOptions](interfaces/NewBusOptions.md) | - |
| [NewNote](interfaces/NewNote.md) | One note for [Playlist.createNotes](classes/Playlist.md#createnotes). Ticks are absolute, as LUNA's verb takes them. |
| [NewTrackOptions](interfaces/NewTrackOptions.md) | - |
| [Note](interfaces/Note.md) | A note-on row paired with the note-off that ends it. |
| [OutputAssignment](interfaces/OutputAssignment.md) | One row of an output's `assignments` property, as LUNA publishes it. |
| [Overview](interfaces/Overview.md) | - |
| [OverviewInfo](interfaces/OverviewInfo.md) | What LUNA reports about one analysis: total pairs, and a digest that changes when the pairs do. |
| [OverviewOptions](interfaces/OverviewOptions.md) | - |
| [PairRange](interfaces/PairRange.md) | - |
| [ParsedChord](interfaces/ParsedChord.md) | A chord name split the way LUNA spells chords: root, type suffix, slash bass. |
| [PluginManifest](interfaces/PluginManifest.md) | - |
| [Port](interfaces/Port.md) | A connection to one engine. |
| [PresetQueryOptions](interfaces/PresetQueryOptions.md) | - |
| [PresetRow](interfaces/PresetRow.md) | - |
| [ProgressTask](interfaces/ProgressTask.md) | - |
| [Prop](interfaces/Prop.md) | A readable, observable value. `value` is `undefined` until the first load or push. |
| [QueryOptions](interfaces/QueryOptions.md) | - |
| [RangeOptions](interfaces/RangeOptions.md) | - |
| [RecordOptions](interfaces/RecordOptions.md) | - |
| [SeekOptions](interfaces/SeekOptions.md) | - |
| [SelectedNotes](interfaces/SelectedNotes.md) | One playlist's selected notes as LUNA stores them: `[pitch, start, stop, rowid]` in absolute ticks. |
| [SelectionSnapshot](interfaces/SelectionSnapshot.md) | The six selection properties as LUNA holds them, for [Context.restore](classes/Context.md#restore). |
| [SessionPackageRow](interfaces/SessionPackageRow.md) | - |
| [SettleOptions](interfaces/SettleOptions.md) | - |
| [ShortcutsBinding](interfaces/ShortcutsBinding.md) | The listeners [bindShortcuts](functions/bindShortcuts.md) installed. |
| [ShortcutsOptions](interfaces/ShortcutsOptions.md) | - |
| [SocketLike](interfaces/SocketLike.md) | The subset of the WebSocket API this port uses; lets tests inject a fake. |
| [SubscribeOptions](interfaces/SubscribeOptions.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [TraceWaveformOptions](interfaces/TraceWaveformOptions.md) | - |
| [TransactionOptions](interfaces/TransactionOptions.md) | - |
| [TransportLocation](interfaces/TransportLocation.md) | The `location` property of a session. |
| [UploadOptions](interfaces/UploadOptions.md) | - |
| [WasmHooks](interfaces/WasmHooks.md) | The page-side hooks the engine calls (`globalThis.WasmDeviced`). |
| [WasmModule](interfaces/WasmModule.md) | The subset of the Emscripten module the SDK uses. |
| [WasmPortOptions](interfaces/WasmPortOptions.md) | - |
| [WaveformChannel](interfaces/WaveformChannel.md) | - |
| [WaveformColumns](interfaces/WaveformColumns.md) | - |
| [WaveformLane](interfaces/WaveformLane.md) | - |
| [WaveformPathTarget](interfaces/WaveformPathTarget.md) | The part of a canvas 2D context [traceWaveform](functions/traceWaveform.md) draws with; `CanvasRenderingContext2D` and `Path2D` both fit. |
| [WaveformRange](interfaces/WaveformRange.md) | - |
| [WaveformScale](interfaces/WaveformScale.md) | Options for [waveformColumns](functions/waveformColumns.md). |
| [WebSocketPortOptions](interfaces/WebSocketPortOptions.md) | - |
| [WireMessage](interfaces/WireMessage.md) | A message as it appears on the wire (JSON dialect), before normalisation. |
| [WritableProp](interfaces/WritableProp.md) | A [Prop](interfaces/Prop.md) that can be written. `set` is optimistic: `value` moves at once and rolls back on rejection. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AddOnTarget](type-aliases/AddOnTarget.md) | - |
| [AutomationMode](type-aliases/AutomationMode.md) | - |
| [AutomationModeName](type-aliases/AutomationModeName.md) | - |
| [BusType](type-aliases/BusType.md) | - |
| [ClipType](type-aliases/ClipType.md) | - |
| [CommandHandler](type-aliases/CommandHandler.md) | - |
| [ContextType](type-aliases/ContextType.md) | - |
| [ControlType](type-aliases/ControlType.md) | - |
| [Engine](type-aliases/Engine.md) | - |
| [EventHandler](type-aliases/EventHandler.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [FolderMode](type-aliases/FolderMode.md) | - |
| [GuiPage](type-aliases/GuiPage.md) | - |
| [InsertSlot](type-aliases/InsertSlot.md) | - |
| [KeyCombo](type-aliases/KeyCombo.md) | A key combination as `Modifier+...+Key`. Modifiers are `Mod` (Cmd on a Mac, Ctrl elsewhere), `Cmd`, `Ctrl`, `Alt` and `Shift`, and the ones named must be exactly the ones held. The key is a `KeyboardEvent.key` (`z`, case-insensitive) or `KeyboardEvent.code` (`Space`, `Numpad0`, `KeyZ`). |
| [LogFn](type-aliases/LogFn.md) | Where a port reports what it does: status changes, reconnect attempts, timeouts, and listeners that threw. The default sends `warn` and `error` to the console. |
| [LogLevel](type-aliases/LogLevel.md) | Severity of a [LogFn](type-aliases/LogFn.md) message. |
| [ModuleFactory](type-aliases/ModuleFactory.md) | - |
| [Operation](type-aliases/Operation.md) | Structural change carried by an [Event](interfaces/Event.md). Absent for a property value change. |
| [OverviewKind](type-aliases/OverviewKind.md) | `fine` is `analysis/overview` (2.604 ms per pair), `coarse` is `analysis/overview_coarse` (12 fine pairs, 31.25 ms). Fact 72. |
| [PortStatus](type-aliases/PortStatus.md) | Connection state as reported by [Port.onStatus](interfaces/Port.md#onstatus). |
| [RecPlayMode](type-aliases/RecPlayMode.md) | - |
| [Releasable](type-aliases/Releasable.md) | Something [Bindings](classes/Bindings.md) can release: an unsubscribe function or an object with `dispose()`. |
| [SeekTarget](type-aliases/SeekTarget.md) | Where to seek: a tick, or a bar|beat|tick position (`beat` defaults to 1, `tick` to 0). |
| [ShortcutBindings](type-aliases/ShortcutBindings.md) | - |
| [ShortcutCommand](type-aliases/ShortcutCommand.md) | The commands the standard shortcuts cover. |
| [ShortcutKeyEvent](type-aliases/ShortcutKeyEvent.md) | The parts of a `KeyboardEvent` a binding matches on. |
| [ShortcutPlatform](type-aliases/ShortcutPlatform.md) | - |
| [SocketConstructor](type-aliases/SocketConstructor.md) | - |
| [SoloMode](type-aliases/SoloMode.md) | - |
| [SourceLookup](type-aliases/SourceLookup.md) | Anything that can resolve a source uid: `session.sources`, or a plain array. |
| [StatusListener](type-aliases/StatusListener.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [StemFormat](type-aliases/StemFormat.md) | - |
| [TrackType](type-aliases/TrackType.md) | - |
| [Unsubscribe](type-aliases/Unsubscribe.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/ua-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [Verb](type-aliases/Verb.md) | UANet verbs. |
| [WasmState](type-aliases/WasmState.md) | Lifecycle states reported by the engine. |

## Variables

| Variable | Description |
| ------ | ------ |
| [AUTOMATION\_MODES](variables/AUTOMATION_MODES.md) | - |
| [COARSE\_PAIR\_NS](variables/COARSE_PAIR_NS.md) | Nanoseconds per coarse overview pair: 31.25 ms. |
| [COARSE\_PAIRS\_PER\_FINE](variables/COARSE_PAIRS_PER_FINE.md) | Fine pairs per coarse pair. |
| [consoleLog](variables/consoleLog.md) | The default [LogFn](type-aliases/LogFn.md): warnings and errors to the console, the rest dropped. |
| [CUE\_COUNT](variables/CUE_COUNT.md) | Four cue outputs per channel, `cue_0`..`cue_3`. |
| [DEFAULT\_LUNA\_PORT](variables/DEFAULT_LUNA_PORT.md) | - |
| [DEFAULT\_SHORTCUTS](variables/DEFAULT_SHORTCUTS.md) | LUNA's default shortcuts for the four commands (fact 79). Windows uses Ctrl where the Mac uses Cmd, which `Mod` covers. |
| [DISPLAY\_TICKS\_PER\_BEAT](variables/DISPLAY_TICKS_PER_BEAT.md) | Musical time units (EVIDENCE fact 16). |
| [EDIT\_TIMEOUT\_MS](variables/EDIT_TIMEOUT_MS.md) | How long [settle](functions/settle.md) waits by default for the model to reflect an edit. |
| [EIGHTH\_NOTE](variables/EIGHTH_NOTE.md) | - |
| [HALF\_NOTE](variables/HALF_NOTE.md) | - |
| [OVERVIEW\_PAIR\_NS](variables/OVERVIEW_PAIR_NS.md) | Nanoseconds per fine overview pair: 125 samples at 48 kHz (fact 72). |
| [PLUGIN\_ERROR\_MISSING](variables/PLUGIN_ERROR_MISSING.md) | The engine reports a missing plugin with this error string. |
| [QUARTER\_NOTE](variables/QUARTER_NOTE.md) | - |
| [RECORD\_LOOP\_MARGIN\_TICKS](variables/RECORD_LOOP_MARGIN_TICKS.md) | How far past the punch point [Session.record](classes/Session.md#record) widens `loop_stop` when it has to. One bar of 4/4 at any tempo is plenty: the gate is on the punch point, not the take's end. |
| [SEND\_COUNT](variables/SEND_COUNT.md) | Eight sends per channel, `send_0`..`send_7`. |
| [SIXTEENTH\_NOTE](variables/SIXTEENTH_NOTE.md) | - |
| [TICKS\_PER\_BEAT](variables/TICKS_PER_BEAT.md) | - |
| [TICKS\_PER\_DISPLAY\_TICK](variables/TICKS_PER_DISPLAY_TICK.md) | - |
| [VERSION](variables/VERSION.md) | SDK version, kept in sync with package.json by the build. |
| [WAVEFORM\_PAGE](variables/WAVEFORM_PAGE.md) | Pairs per cached page; four pages cover a minute of fine pairs. |
| [WHOLE\_NOTE](variables/WHOLE_NOTE.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [audioNsAtTick](functions/audioNsAtTick.md) | The file offset (ns) that plays at a timeline tick inside a clip: the clip's audio start plus the tempo-map seconds between the clip start and the tick. Linear in seconds, not in ticks, so a tempo change inside the clip bends the mapping exactly as the engine does. |
| [automationModeOrdinal](functions/automationModeOrdinal.md) | Commands take the mode as an integer ordinal; the track property reports it as a string. |
| [beatsToTicks](functions/beatsToTicks.md) | Beats to ticks. |
| [bindClock](functions/bindClock.md) | Bind `el` to the transport's playhead clock. Reads [Transport.seconds](classes/Transport.md#seconds), so the session's tempo map must be loaded (`session.ready()` does that). Returns a release function that cancels the frame loop and the listeners. |
| [bindDrag](functions/bindDrag.md) | Bind a div or canvas knob (or fader, or one axis of an XY pad) to one control, or to several that move together. Dragging captures the pointer and moves the value by pointer travel; arrow, Page and Home/End keys nudge it; double-click resets it. The element becomes a focusable `role="slider"` whose `aria-valuenow` and `aria-valuetext` follow the control. Writes go to the controls' `normalized` view, and the first control's value is the one shown. |
| [bindGesture](functions/bindGesture.md) | Bracket every drag on `target` with `begin()`/`end()` on `controls` (one control, or all the controls one element drives). |
| [bindRange](functions/bindRange.md) | Bind a native `<input type="range">` to `control`: touch on press, write on `input`, follow LUNA outside a drag, settle on LUNA's value on release, double-click to reset. Keyboard changes the browser makes are one-shot writes, which the control brackets itself. |
| [bindShortcuts](functions/bindShortcuts.md) | Give an Add On LUNA's standard shortcuts for undo, redo, play and record, as a fallback behind its own key handling. |
| [bootWasmEngine](functions/bootWasmEngine.md) | Load and boot the engine once per page. Resolves when the services report `running`. Rejects with `Luna.Error` code `engine_boot` on failure or timeout. |
| [clients](functions/clients.md) | Every [Client](classes/Client.md) this page has made and not closed, in creation order. A tooling hook: `ua-builder probe` waits on `Luna.clients().some((c) => c.connected)` to know an Add On's page has finished connecting before it reads the DOM. |
| [clipAudio](functions/clipAudio.md) | Which audio a clip plays, or `undefined` when there is nothing safe to draw: no source, or a render LUNA has named but not yet announced. In that second case draw the clip's outline rather than the unstretched original at the wrong scale. |
| [clipTypeFrom](functions/clipTypeFrom.md) | The engine sends clip_type as 0/1/2 or as a string; normalise to the string form. |
| [connect](functions/connect.md) | - |
| [decodeMessage](functions/decodeMessage.md) | Decode one frame. Tolerates an 8-byte `JSON` header (magic + length) and a trailing NUL, and returns `undefined` for anything unparseable so the receive loop survives a bad frame. |
| [decodeMidiData](functions/decodeMidiData.md) | Unpack the three MIDI bytes the engine packs into one number (fact 39). |
| [derived](functions/derived.md) | A read-only [Prop](interfaces/Prop.md) computed from other props. Recomputes lazily on read and notifies when any source notifies. With `distinct: true` it notifies only when the computed value actually moved ([shallowEquals](functions/shallowEquals.md)) — for a value carved out of a chatty source, such as the tempo on `location` pushes. |
| [encodeMidiData](functions/encodeMidiData.md) | Pack three MIDI bytes the way the engine's table stores them (fact 39). |
| [encodePayload](functions/encodePayload.md) | Encode a payload the way the engine parses it: JSON for everything. Strings are quoted so the engine can tell `"1234"` from `1234` (the ambiguity the deprecated String dialect suffers from). [FloatLiteral](classes/FloatLiteral.md)s are written as float literals. |
| [encodeRequest](functions/encodeRequest.md) | Build one request line. |
| [eventMatches](functions/eventMatches.md) | True when an event at `eventPath` belongs to a subscription on `subPath`. Prefix matching: the engine only pushes what was subscribed, so a wider subscription on the same connection is the only way a handler sees something deeper than it asked for. |
| [expandMulti](functions/expandMulti.md) | Expand a message into the individual updates it carries. A non-multi message expands to itself. Entries that cannot be decoded are dropped. |
| [float](functions/float.md) | Wrap `value` so it is sent as a float literal. See [FloatLiteral](classes/FloatLiteral.md). |
| [formatBarBeat](functions/formatBarBeat.md) | Format a [BarBeat](interfaces/BarBeat.md) as LUNA's counter shows it, `1|1|000`: it converts the engine-tick remainder to display ticks (960 per beat) and zero-pads them. Pass `location.bar_beat` or `timeline.barBeat(tick)` as they are; do not convert `tick` first. For a bare tick, `timeline.formatBarBeat(tick)` does both steps. |
| [formatMinSec](functions/formatMinSec.md) | Format seconds as a zero-padded `MM:SS` clock, flooring rather than rounding so a counting display never shows a time the playhead has not reached. Negative values clamp to `00:00`; `undefined` (an unloaded prop) gives a placeholder, like [formatBarBeat](functions/formatBarBeat.md). |
| [formatTimeSignature](functions/formatTimeSignature.md) | Format a time signature as `4/4`; `undefined` (an unloaded prop) gives a placeholder, like [formatBarBeat](functions/formatBarBeat.md). Pairs with `transport.timeSignature`. |
| [getOptionsToParams](functions/getOptionsToParams.md) | Convert [GetOptions](interfaces/GetOptions.md) to wire query parameters. |
| [hasNativeBridge](functions/hasNativeBridge.md) | True when LUNA's native webview bridge is present. |
| [isEmbeddedInLuna](functions/isEmbeddedInLuna.md) | True when the page was opened by LUNA (a `?port=` is on the URL). |
| [isLunaEnginePort](functions/isLunaEnginePort.md) | True when the page is talking to LUNA's own engine on its default port. |
| [joinPath](functions/joinPath.md) | Join path segments with single slashes. |
| [kindForScale](functions/kindForScale.md) | The analysis to draw at a zoom level: `coarse` once a pixel spans at least one coarse pair (31.25 ms), `fine` when zoomed closer. Below one fine pair per pixel the same pair repeats; neither analysis is PCM. |
| [listOf](functions/listOf.md) | A [List](interfaces/List.md) over a [Prop](interfaces/Prop.md) of arrays. |
| [locationOptions](functions/locationOptions.md) | `host` and `port` from the page URL, if present. |
| [midiByte](functions/midiByte.md) | A 7-bit MIDI value, or `out_of_range`. `min` is 1 for a velocity that must sound. |
| [normalizeChordName](functions/normalizeChordName.md) | LUNA stores `♭` and `♯` as ASCII `b` and `#` (fact 100); the SDK compares names the same way. |
| [pairNotes](functions/pairNotes.md) | Pair note-on rows with the next note-off of the same channel and pitch, in tick order. Pure, and exported because a page that draws its own lanes often wants it directly. |
| [pairNs](functions/pairNs.md) | Nanoseconds one pair of this analysis covers. |
| [pairRange](functions/pairRange.md) | The overview pairs covering `[startNs, stopNs)` of a source. Both are file offsets, never timeline ticks. |
| [parseChord](functions/parseChord.md) | Split a chord name into root, type and bass. `undefined` when it does not start with a note letter, since the ruler accepts any text (`N.C.`, `riff`). |
| [propertyValue](functions/propertyValue.md) | Unwrap a property reply. A `get` on a property answers `{ value: X }` unless `flatvalue` was requested, in which case it answers `X` directly. |
| [requireTick](functions/requireTick.md) | Reject a non-integer tick before it reaches the wire: LUNA stores whatever it is given (fact 12). |
| [secondsToTicks](functions/secondsToTicks.md) | Seconds to ticks at a constant tempo. |
| [selectedNotes](functions/selectedNotes.md) | Decode LUNA's `selection_notes` (an array, or `null`, or garbage) into frozen rows. |
| [settle](functions/settle.md) | Poll `done` until it holds, or reject with `no_effect`. Socket replies and event frames land between the yields; with `refresh`, the node is re-read after a short grace and then periodically, covering both a batch transaction and an event lost on the wire. |
| [shallowEquals](functions/shallowEquals.md) | Equality used by cells: `===` for primitives, JSON shape for plain objects and arrays. |
| [splitPath](functions/splitPath.md) | Split `<node>/<prop>` into its node path and property name. |
| [stripValueSuffix](functions/stripValueSuffix.md) | Property updates arrive on `<node>/<prop>/value`; the model addresses `<node>/<prop>`. |
| [ticksToBeats](functions/ticksToBeats.md) | Ticks to beats (floating). |
| [ticksToSeconds](functions/ticksToSeconds.md) | Ticks to seconds at a constant tempo. |
| [toEvent](functions/toEvent.md) | Turn a decoded wire message into the normalised event the Store consumes. |
| [traceWaveform](functions/traceWaveform.md) | Add one channel's waveform to a path as LUNA fills it: for every run of drawable columns, one closed shape through the column centres, the top outline (`mid - axis - max * half`) left to right and the bottom outline (`mid + axis - min * half`) back, squared off at the run's outer edges. `NaN` columns break the shape. It only adds subpaths; call `beginPath()` before and `fill()` after, so several channels or clips fill in one go. |
| [wasmUpdateToEvent](functions/wasmUpdateToEvent.md) | Turn one `onUpdate(path, json)` into a normalised event. Exported for tests. |
| [waveformColumns](functions/waveformColumns.md) | Reduce a [WaveformRange](interfaces/WaveformRange.md) to one min/max per drawn column, per channel, the way LUNA's own timeline does: |
| [waveformLanes](functions/waveformLanes.md) | Split `height` pixels from `top` into one equal lane per channel, stacked in file order (left above right for stereo), each with a zero line and a full-scale half-height. `gap` pixels are kept clear at the top and bottom of every lane; LUNA keeps none. |
| [waveformPeak](functions/waveformPeak.md) | The loudest absolute value in a range, across every channel, in 0..1; 0 when the range is empty. To normalize a clip, pass `gain: 1 / peak` to [waveformColumns](functions/waveformColumns.md), taking the peak from the clip's whole range, not the visible columns, so the scale holds while scrolling. |
| [writable](functions/writable.md) | Wrap a [Prop](interfaces/Prop.md) with a setter to make a [WritableProp](interfaces/WritableProp.md). |
| [yieldTask](functions/yieldTask.md) | One macrotask later, through a `MessageChannel` where there is one. A background browser tab throttles timers to about one tick per second but never throttles messages, so a timer-only loop lands on its own timeout in a hidden page even though LUNA finished in milliseconds. |
