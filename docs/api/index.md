# Luna

## Classes

| Class | Description |
| ------ | ------ |
| [AddOn](classes/AddOn.md) | - |
| [AddOnInstance](classes/AddOnInstance.md) | One page of an installed Add On open in LUNA (fact 143): `/gui/add_ons/<id>/instances/<add_on_inst>`. LUNA gives every Add On page an `add_on_inst` in its URL; [Gui.thisInstance](classes/Gui.md#thisinstance) finds the page's own. A window keeps its instance while it exists, and a `show_with_session` window keeps it in the session, so it is the same after the session is closed and opened again: a page can key its own `session.storage` records by it. |
| [Assistant](classes/Assistant.md) | `/assistant`: whether UA Assistant is connected to LUNA. Preset recommendations need it (fact 121). Call `watch()` to follow it. |
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
| [CompiledClip](classes/CompiledClip.md) | - |
| [CompiledClips](classes/CompiledClips.md) | A playlist's compiled clips. Loading or watching turns on `enable_compiled_clips` first, since LUNA publishes nothing until a client asks (fact 116). The SDK never turns it off: the switch is shared by every client of the session. |
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
| [MidiDevice](classes/MidiDevice.md) | `/devices/<LUNA>/midi/<uid>`: a MIDI device LUNA sees, as its MIDI settings list it. Besides the real devices, LUNA lists `All` and `None`, whose settings read `null`; `isPhysical` is false for those two (fact 123). |
| [MidiDevices](classes/MidiDevices.md) | `/devices/<LUNA>/midi`: the MIDI devices LUNA sees. The folder is outside any session, so `watch()` it to follow devices plugged in or removed (fact 34). |
| [MidiInput](classes/MidiInput.md) | Live MIDI input from the MIDI devices LUNA sees (fact 125). Use this for MIDI input in an Add On, not Web MIDI (`navigator.requestMIDIAccess()`): LUNA's macOS web view has no Web MIDI, and this works the same inside LUNA and in a browser. |
| [MidiPort](classes/MidiPort.md) | `/devices/<LUNA>/midi/<uid>/input_ports/<n>` or `output_ports/<n>`: one of a MIDI device's ports. `uid` is the engine node MIDI from the device (an input port) or to it (an output port) passes through (fact 123). |
| [MockEngine](classes/MockEngine.md) | - |
| [MockPort](classes/MockPort.md) | One client connection to a [MockEngine](classes/MockEngine.md). |
| [Musical](classes/Musical.md) | The musical structure of one session. |
| [Node](classes/Node.md) | - |
| [NoSessionOpen](classes/NoSessionOpen.md) | No session is open in the engine. |
| [NotRunning](classes/NotRunning.md) | No engine answered at the address. Start LUNA and open a session. |
| [Output](classes/Output.md) | - |
| [Playlist](classes/Playlist.md) | - |
| [Plugin](classes/Plugin.md) | - |
| [Plugins](classes/Plugins.md) | An observable ordered collection with id lookup. |
| [Preferences](classes/Preferences.md) | `/preferences`: engine preferences as writable properties by name. |
| [Presets](classes/Presets.md) | - |
| [PresetSelection](classes/PresetSelection.md) | Created by [Presets.selection](classes/Presets.md#selection). |
| [QwertyMidi](classes/QwertyMidi.md) | - |
| [RecordTake](classes/RecordTake.md) | A take being recorded on one track. Read it from [Session.recordTakes](classes/Session.md#recordtakes); it is disposed when recording stops and LUNA turns it into a clip. |
| [RecordTakes](classes/RecordTakes.md) | The takes being recorded in a session, across every track: [Session.recordTakes](classes/Session.md#recordtakes). Empty while nothing records. `onChange` fires when a take starts or ends; follow a take's own props (`stop`, `notes`) for its progress. |
| [Render](classes/Render.md) | `/renders/<uid>`: a bounce or an export. `state` runs `created` -> `running` -> `completed` | `aborted`, and LUNA drops the node shortly after it settles, so latch anything you still need rather than reading it later (fact 44). |
| [Renders](classes/Renders.md) | An observable ordered collection with id lookup. |
| [RequestTimeout](classes/RequestTimeout.md) | The engine did not answer a request within the port's timeout. |
| [Scheduler](classes/Scheduler.md) | Coalesces change notifications. In a browser it flushes on the next animation frame with a timer fallback (hidden tabs suspend rAF); elsewhere on a macrotask. Tests call `flush()`. |
| [Secrets](classes/Secrets.md) | Per-Add-On secrets, at `luna.secrets`. Values are strings; names are 1 to 128 characters from `A-Z a-z 0-9 . _ -`. |
| [SendMidi](classes/SendMidi.md) | - |
| [Session](classes/Session.md) | - |
| [SessionPackage](classes/SessionPackage.md) | One session package as a live node. |
| [Sessions](classes/Sessions.md) | - |
| [SessionStorage](classes/SessionStorage.md) | `/sessions/<uid>/storage`: every Add On's session storage, by context. |
| [Shortcuts](classes/Shortcuts.md) | The standard shortcuts as an object: which command a key means, and running it. Most Add Ons only need [bindShortcuts](functions/bindShortcuts.md); use this directly to route keys from a listener the page already has, or to run a command from a menu. |
| [StorageContext](classes/StorageContext.md) | `/sessions/<uid>/storage/<context>`: one context's records. Get one with `session.storage.context(name)`. |
| [Store](classes/Store.md) | - |
| [Taper](classes/Taper.md) | Fader tapers: how LUNA maps a fader's 0..1 position to dB (fact 134). |
| [TempoEvent](classes/TempoEvent.md) | - |
| [Timeline](classes/Timeline.md) | Pure tick arithmetic over the current tempo map and time signatures. Every method reads the maps as they are now; [onChange](classes/Timeline.md#onchange) says when an answer may have moved. |
| [TimeSignature](classes/TimeSignature.md) | - |
| [Track](classes/Track.md) | - |
| [TrackPresetSelection](classes/TrackPresetSelection.md) | Created by [Presets.trackSelection](classes/Presets.md#trackselection). |
| [Transport](classes/Transport.md) | - |
| [Unsupported](classes/Unsupported.md) | The feature is not available on this engine (for example a headless engine has no `/gui`). |
| [Waveforms](classes/Waveforms.md) | A bounded cache of overview pages, keyed by source, analysis and page index. A short page (the end of the analysis, or growth in progress) is never cached, so a recording still being written is re-read until it settles. |
| [WebSocketPort](classes/WebSocketPort.md) | A connection to one engine. |
| [Workspace](classes/Workspace.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AddOnCategoryInfo](interfaces/AddOnCategoryInfo.md) | One Add On category: its `name`, as a manifest writes it, and what belongs in it. |
| [AudioDeviceInfo](interfaces/AudioDeviceInfo.md) | - |
| [AudioHealth](interfaces/AudioHealth.md) | Audio-path health as the engine reports it. |
| [AudioInput](interfaces/AudioInput.md) | A device input a track can record from, as [Client.audioInputs](classes/Client.md#audioinputs) lists it. |
| [BarBeat](interfaces/BarBeat.md) | A bar|beat position as the engine reports it in `location.bar_beat`, and as `timeline.barBeat()` returns it. `tick` is in **engine** ticks (the remainder within the beat), not display ticks; [formatBarBeat](functions/formatBarBeat.md) does the conversion. |
| [BounceOptions](interfaces/BounceOptions.md) | - |
| [Breakpoint](interfaces/Breakpoint.md) | - |
| [ChordSpec](interfaces/ChordSpec.md) | A chord to write with `musical.setChords`. |
| [ClipAudio](interfaces/ClipAudio.md) | - |
| [ClipLike](interfaces/ClipLike.md) | The clip fields placement needs. A [Clip](classes/Clip.md) satisfies it, as does a plain snapshot. |
| [ClipNote](interfaces/ClipNote.md) | One note for [Clip.addNotes](classes/Clip.md#addnotes). `tick` is relative to the clip start. |
| [ClipSnapshot](interfaces/ClipSnapshot.md) | A clip's state at one moment, as plain data: what a view draws from. |
| [ClockOptions](interfaces/ClockOptions.md) | - |
| [CompiledClipLike](interfaces/CompiledClipLike.md) | - |
| [CompiledClipSnapshot](interfaces/CompiledClipSnapshot.md) | A compiled clip's state at one moment, as plain data: what a view draws from. |
| [CompiledFade](interfaces/CompiledFade.md) | One fade of a compiled clip, as LUNA applies it (fact 116). Ticks are absolute. |
| [ConnectOptions](interfaces/ConnectOptions.md) | - |
| [ControlBinding](interfaces/ControlBinding.md) | What [bindRange](functions/bindRange.md) and [bindDrag](functions/bindDrag.md) return. |
| [CreateSessionOptions](interfaces/CreateSessionOptions.md) | - |
| [Destination](interfaces/Destination.md) | Where an output goes. `uid` is the assignment's, the handle [Output.unassign](classes/Output.md#unassign) takes. |
| [DragOptions](interfaces/DragOptions.md) | - |
| [Event](interfaces/Event.md) | One change pushed by the engine, normalised: a trailing `/value` is stripped, multi-updates are already expanded, and `operation` marks a child added or removed at `path`. |
| [ExportOptions](interfaces/ExportOptions.md) | - |
| [FileEntry](interfaces/FileEntry.md) | One entry of [Gui.listFiles](classes/Gui.md#listfiles): a file or folder directly inside the listed folder. |
| [Gesture](interfaces/Gesture.md) | - |
| [GestureOptions](interfaces/GestureOptions.md) | - |
| [GetOptions](interfaces/GetOptions.md) | Query parameters accepted by `get`, in camelCase. Booleans become `1`/`0` on the wire. See `hbsystem/networking/docs/operations.md`. |
| [ImportPathOptions](interfaces/ImportPathOptions.md) | - |
| [InsertClipOptions](interfaces/InsertClipOptions.md) | - |
| [List](interfaces/List.md) | An observable ordered collection with id lookup. |
| [Location](interfaces/Location.md) | The `location` property of a session. |
| [LocationOptions](interfaces/LocationOptions.md) | - |
| [MidiEvent](interfaces/MidiEvent.md) | One MIDI event to add to a clip. `tick` is relative to the clip start. |
| [MidiHost](interfaces/MidiHost.md) | What a MIDI edit needs to reach LUNA's edit context: the session it lives in, the playlist that holds the clip, and the clip's own start tick (the selection is in absolute ticks). |
| [MidiInputListenOptions](interfaces/MidiInputListenOptions.md) | Options for [MidiInput.listen](classes/MidiInput.md#listen). |
| [MidiInputMessage](interfaces/MidiInputMessage.md) | One message a MIDI device sent LUNA. |
| [MidiRow](interfaces/MidiRow.md) | One row of a clip's MIDI table: a single MIDI message at a clip-relative tick. |
| [MidiRowData](interfaces/MidiRowData.md) | The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40). |
| [MockEngineOptions](interfaces/MockEngineOptions.md) | - |
| [MockMidiRow](interfaces/MockMidiRow.md) | A row for [MockEngine.midiEdit](classes/MockEngine.md#midiedit). |
| [MockMidiSent](interfaces/MockMidiSent.md) | One live MIDI message the mock delivered, in [MockEngine.midiSent](classes/MockEngine.md#midisent). |
| [MockNodeSpec](interfaces/MockNodeSpec.md) | - |
| [MoveToFolderOptions](interfaces/MoveToFolderOptions.md) | - |
| [NestedFileEntry](interfaces/NestedFileEntry.md) | One entry of [Gui.listAllFiles](classes/Gui.md#listallfiles): a [FileEntry](interfaces/FileEntry.md) anywhere below the listed folder. |
| [NewBusOptions](interfaces/NewBusOptions.md) | - |
| [NewFolderOptions](interfaces/NewFolderOptions.md) | - |
| [NewNote](interfaces/NewNote.md) | One note for [Playlist.createNotes](classes/Playlist.md#createnotes). Ticks are absolute (session ticks), as LUNA's verb takes them, unlike the clip-relative ticks of the [Note](interfaces/Note.md)s it returns. There is no channel: LUNA's `create_note` writes every note on channel 0 (fact 111). For another channel, add the notes to a clip with [Clip.addNotes](classes/Clip.md#addnotes), which takes one. |
| [NewTrackFromPresetOptions](interfaces/NewTrackFromPresetOptions.md) | - |
| [NewTrackOptions](interfaces/NewTrackOptions.md) | - |
| [Note](interfaces/Note.md) | A note-on row paired with the note-off that ends it. |
| [OutputAssignment](interfaces/OutputAssignment.md) | One row of an output's `assignments` property, as LUNA publishes it. |
| [Overview](interfaces/Overview.md) | - |
| [OverviewInfo](interfaces/OverviewInfo.md) | What LUNA reports about one analysis: total pairs, and a digest that changes when the pairs do. |
| [OverviewOptions](interfaces/OverviewOptions.md) | - |
| [PairRange](interfaces/PairRange.md) | - |
| [ParsedChord](interfaces/ParsedChord.md) | A chord name split the way LUNA spells chords: root, type suffix, slash bass. |
| [PathDrop](interfaces/PathDrop.md) | Where a native drag is, in page pixels, and the absolute paths it carries. |
| [PathDropHandlers](interfaces/PathDropHandlers.md) | - |
| [PluginManifest](interfaces/PluginManifest.md) | - |
| [PluginQueryOptions](interfaces/PluginQueryOptions.md) | - |
| [PluginRequirement](interfaces/PluginRequirement.md) | One entry of an Add On manifest's `requires_plugins`, as LUNA reports it on [AddOn.requiresPlugins](classes/AddOn.md#requiresplugins) (fact 148). It is met when any of `plugin_id` is installed at `min_version` or later (any version when `''`). One plugin has a different id per format (AU, VST3, ...), so list each. `name` is what LUNA shows, since a plugin that is not installed has no name to look up. Unless `optional`, LUNA will not open the Add On while it is unmet. |
| [PluginRow](interfaces/PluginRow.md) | One plugin [Plugins.query](classes/Plugins.md#query) returned. |
| [PluginWindow](interfaces/PluginWindow.md) | One plugin editor window open in LUNA, from [Gui.pluginWindows](classes/Gui.md#pluginwindows). |
| [Port](interfaces/Port.md) | A connection to one engine. |
| [PresetQueryOptions](interfaces/PresetQueryOptions.md) | - |
| [PresetRecommendation](interfaces/PresetRecommendation.md) | One preset UA Assistant recommends for a search, best first (fact 121). |
| [PresetRow](interfaces/PresetRow.md) | - |
| [PresetSelectionOptions](interfaces/PresetSelectionOptions.md) | - |
| [PresetTagGroup](interfaces/PresetTagGroup.md) | A named group of a plugin's preset tags, for example Paradise's `TYPE`, `GENRE` and `DESCRIPTION`. LUNA keeps them as categories holding sub-categories holding tags (fact 120); a group is one sub-category. |
| [ProgressTask](interfaces/ProgressTask.md) | - |
| [Prop](interfaces/Prop.md) | A readable, observable value. `value` is `undefined` until the first load or push. |
| [QueryOptions](interfaces/QueryOptions.md) | - |
| [RangeOptions](interfaces/RangeOptions.md) | - |
| [RecordOptions](interfaces/RecordOptions.md) | - |
| [ReorderOptions](interfaces/ReorderOptions.md) | - |
| [SeekOptions](interfaces/SeekOptions.md) | - |
| [SelectedNotes](interfaces/SelectedNotes.md) | One playlist's selected notes as LUNA stores them: `[pitch, start, stop, rowid]` in absolute ticks. |
| [SelectionSnapshot](interfaces/SelectionSnapshot.md) | The six selection properties as LUNA holds them, for [Context.restore](classes/Context.md#restore). |
| [SendMidiTrackTarget](interfaces/SendMidiTrackTarget.md) | A track entry for [SendMidi.sendNoteToTracks](classes/SendMidi.md#sendnotetotracks). |
| [SessionPackageRow](interfaces/SessionPackageRow.md) | - |
| [SettleOptions](interfaces/SettleOptions.md) | - |
| [ShortcutsBinding](interfaces/ShortcutsBinding.md) | The listeners [bindShortcuts](functions/bindShortcuts.md) installed. |
| [ShortcutsOptions](interfaces/ShortcutsOptions.md) | - |
| [SocketLike](interfaces/SocketLike.md) | The subset of the WebSocket API this port uses; lets tests inject a fake. |
| [StorageEditOptions](interfaces/StorageEditOptions.md) | Options for an edit of session storage. |
| [SubscribeOptions](interfaces/SubscribeOptions.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [TaperMarksOptions](interfaces/TaperMarksOptions.md) | Options for [Taper.marks](classes/Taper.md#marks). |
| [TraceWaveformOptions](interfaces/TraceWaveformOptions.md) | - |
| [TrackPresetSelectionOptions](interfaces/TrackPresetSelectionOptions.md) | - |
| [TransactionOptions](interfaces/TransactionOptions.md) | - |
| [TransportLocation](interfaces/TransportLocation.md) | The `location` property of a session. |
| [UploadOptions](interfaces/UploadOptions.md) | - |
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
| [AddOnCategory](type-aliases/AddOnCategory.md) | A category name a manifest's `categories` can hold. |
| [AddOnInstalledFrom](type-aliases/AddOnInstalledFrom.md) | Where an installed Add On lives: see [AddOn.installedFrom](classes/AddOn.md#installedfrom). |
| [AddOnTarget](type-aliases/AddOnTarget.md) | - |
| [AlgType](type-aliases/AlgType.md) | LUNA's time-stretch algorithm for an audio clip (`alg_type`), passed verbatim. |
| [AutomationMode](type-aliases/AutomationMode.md) | - |
| [AutomationModeName](type-aliases/AutomationModeName.md) | - |
| [BusType](type-aliases/BusType.md) | - |
| [ClipType](type-aliases/ClipType.md) | - |
| [CommandHandler](type-aliases/CommandHandler.md) | - |
| [ContextType](type-aliases/ContextType.md) | - |
| [ControlType](type-aliases/ControlType.md) | - |
| [CrossfadeAlign](type-aliases/CrossfadeAlign.md) | Where a crossfade sits on the edit between two clips, for [Clip.crossfade](classes/Clip.md#crossfade). |
| [EventHandler](type-aliases/EventHandler.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [FadeShape](type-aliases/FadeShape.md) | LUNA's fade shapes. Another string is passed through as LUNA sent it. |
| [FolderMode](type-aliases/FolderMode.md) | A bus's folder mode (fact 136). `'summing'`: a folder track whose children's main outputs go to it, so it is their bus. `'container'`: a folder that only groups; its children route past it to the nearest summing folder above, else the master. `'none'`: an ordinary bus. |
| [GuiPage](type-aliases/GuiPage.md) | - |
| [InsertSlot](type-aliases/InsertSlot.md) | - |
| [KeyCombo](type-aliases/KeyCombo.md) | A key combination as `Modifier+...+Key`. Modifiers are `Mod` (Cmd on a Mac, Ctrl elsewhere), `Cmd`, `Ctrl`, `Alt` and `Shift`, and the ones named must be exactly the ones held. The key is a `KeyboardEvent.key` (`z`, case-insensitive) or `KeyboardEvent.code` (`Space`, `Numpad0`, `KeyZ`). |
| [LengthFollows](type-aliases/LengthFollows.md) | What a clip's length follows when the tempo changes (LUNA's `length_follows`): `'ticks'` keeps its musical length, `'time'` its length in seconds. Left out, the clip follows its track. |
| [LogFn](type-aliases/LogFn.md) | Where a port reports what it does: status changes, reconnect attempts, timeouts, and listeners that threw. The default sends `warn` and `error` to the console. |
| [LogLevel](type-aliases/LogLevel.md) | Severity of a [LogFn](type-aliases/LogFn.md) message. |
| [MidiInputTarget](type-aliases/MidiInputTarget.md) | Where [MidiInput.listen](classes/MidiInput.md#listen) listens: a device (its input port), an input port, or every device. |
| [MidiInputType](type-aliases/MidiInputType.md) | What a message is, from its status byte. A note-on with velocity 0 is a `noteOff`. `sysex` is a whole System Exclusive message, delivered only when asked for. |
| [MidiOutputTarget](type-aliases/MidiOutputTarget.md) | Where a `...ToOutput` method sends: a MIDI device (its output port), one of its output ports, or an output port's `uid`. |
| [Operation](type-aliases/Operation.md) | Structural change carried by an [Event](interfaces/Event.md). Absent for a property value change. |
| [OverviewKind](type-aliases/OverviewKind.md) | `fine` is `analysis/overview` (2.604 ms per pair), `coarse` is `analysis/overview_coarse` (12 fine pairs, 31.25 ms). Fact 72. |
| [PortStatus](type-aliases/PortStatus.md) | Connection state as reported by [Port.onStatus](interfaces/Port.md#onstatus). |
| [QwertyKeyEvent](type-aliases/QwertyKeyEvent.md) | The parts of a `KeyboardEvent` the keyboard reads. |
| [RecPlayMode](type-aliases/RecPlayMode.md) | - |
| [Releasable](type-aliases/Releasable.md) | Something [Bindings](classes/Bindings.md) can release: an unsubscribe function or an object with `dispose()`. |
| [SecretStorage](type-aliases/SecretStorage.md) | Where [Secrets](classes/Secrets.md) keeps values: the OS credential store, or page memory. |
| [SeekTarget](type-aliases/SeekTarget.md) | Where to seek: a tick, or a bar|beat|tick position (`beat` defaults to 1, `tick` to 0). |
| [ShortcutBindings](type-aliases/ShortcutBindings.md) | - |
| [ShortcutCommand](type-aliases/ShortcutCommand.md) | The commands the standard shortcuts cover. |
| [ShortcutKeyEvent](type-aliases/ShortcutKeyEvent.md) | The parts of a `KeyboardEvent` a binding matches on. |
| [ShortcutPlatform](type-aliases/ShortcutPlatform.md) | - |
| [SocketConstructor](type-aliases/SocketConstructor.md) | - |
| [SoloMode](type-aliases/SoloMode.md) | - |
| [SourceLookup](type-aliases/SourceLookup.md) | Anything that can resolve a source uid: `session.sources`, or a plain array. |
| [StatusListener](type-aliases/StatusListener.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [StemFormat](type-aliases/StemFormat.md) | - |
| [TaperName](type-aliases/TaperName.md) | A fader taper name as LUNA writes it in a control's `taper` property. |
| [TrackPresetCategory](type-aliases/TrackPresetCategory.md) | - |
| [TrackType](type-aliases/TrackType.md) | - |
| [TransactionMode](type-aliases/TransactionMode.md) | Which kind of [Session.transaction](classes/Session.md#transaction) is open: `'batch'` holds every command for one undo step and holds pushes until the commit; `'continuous'` keeps only the last command. |
| [Unsubscribe](type-aliases/Unsubscribe.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [Verb](type-aliases/Verb.md) | UANet verbs. |

## Variables

| Variable | Description |
| ------ | ------ |
| [ADD\_ON\_CATEGORIES](variables/ADD_ON_CATEGORIES.md) | Every Add On category, in the order the showcase lists them. |
| [AUTOMATION\_MODES](variables/AUTOMATION_MODES.md) | - |
| [COARSE\_PAIR\_NS](variables/COARSE_PAIR_NS.md) | Nanoseconds per coarse overview pair: 31.25 ms. |
| [COARSE\_PAIRS\_PER\_FINE](variables/COARSE_PAIRS_PER_FINE.md) | Fine pairs per coarse pair. |
| [consoleLog](variables/consoleLog.md) | The default [LogFn](type-aliases/LogFn.md): warnings and errors to the console, the rest dropped. |
| [CUE\_COUNT](variables/CUE_COUNT.md) | Four cue outputs per channel, `cue_0`..`cue_3`. |
| [DEFAULT\_LUNA\_PORT](variables/DEFAULT_LUNA_PORT.md) | - |
| [DEFAULT\_SHORTCUTS](variables/DEFAULT_SHORTCUTS.md) | LUNA's default shortcuts for the four commands (fact 79). Windows uses Ctrl where the Mac uses Cmd, which `Mod` covers. |
| [DISPLAY\_TICKS\_PER\_BEAT](variables/DISPLAY_TICKS_PER_BEAT.md) | Musical time units (EVIDENCE fact 16). |
| [EDIT\_SHORTCUTS](variables/EDIT_SHORTCUTS.md) | LUNA's default keys for its edit commands (fact 150): Cmd+A to select all, Cmd+X, Cmd+C, Cmd+V (Ctrl off the Mac), Backspace or Delete to clear, and Cmd+D for Duplicate Selection. Pass them as `bindings` to have [Shortcuts](classes/Shortcuts.md) run them; each acts on LUNA's edit selection, which `options.prepare` can point at what the page shows first (`session.selectTimeline`). |
| [EDIT\_TIMEOUT\_MS](variables/EDIT_TIMEOUT_MS.md) | How long [settle](functions/settle.md) waits by default for the model to reflect an edit. |
| [EIGHTH\_NOTE](variables/EIGHTH_NOTE.md) | - |
| [HALF\_NOTE](variables/HALF_NOTE.md) | - |
| [LUNA\_DEVICE\_UID](variables/LUNA_DEVICE_UID.md) | The uid of LUNA's own device under `/devices`, which holds its MIDI devices (fact 123). |
| [MAX\_SECRET\_BYTES](variables/MAX_SECRET_BYTES.md) | Largest secret value, in UTF-8 bytes (Windows Credential Manager's limit, applied everywhere). |
| [MAX\_SECRET\_NAME\_LENGTH](variables/MAX_SECRET_NAME_LENGTH.md) | Longest secret name, in characters. |
| [MAX\_SYSEX\_BYTES](variables/MAX_SYSEX_BYTES.md) | The largest SysEx LUNA sends (fact 140): its MIDI output's limit. |
| [OVERVIEW\_PAIR\_NS](variables/OVERVIEW_PAIR_NS.md) | Nanoseconds per fine overview pair: 125 samples at 48 kHz (fact 72). |
| [PLUGIN\_ERROR\_MISSING](variables/PLUGIN_ERROR_MISSING.md) | The engine reports a missing plugin with this error string. |
| [QUARTER\_NOTE](variables/QUARTER_NOTE.md) | - |
| [RECORD\_LOOP\_MARGIN\_TICKS](variables/RECORD_LOOP_MARGIN_TICKS.md) | How far past the punch point [Session.record](classes/Session.md#record) widens `loop_stop` when it has to. One bar of 4/4 at any tempo is plenty: the gate is on the punch point, not the take's end. |
| [SEND\_COUNT](variables/SEND_COUNT.md) | Eight sends per channel, `send_0`..`send_7`. |
| [SIXTEENTH\_NOTE](variables/SIXTEENTH_NOTE.md) | - |
| [TICKS\_PER\_BEAT](variables/TICKS_PER_BEAT.md) | - |
| [TICKS\_PER\_DISPLAY\_TICK](variables/TICKS_PER_DISPLAY_TICK.md) | - |
| [TRACK\_PRESET\_CATEGORIES](variables/TRACK_PRESET_CATEGORIES.md) | The categories LUNA's track preset browser offers. They are ordinary preset tags, which LUNA writes when a track preset is saved (fact 132). No category means all of them. |
| [VERSION](variables/VERSION.md) | SDK version, compiled in from package.json: major.minor.patch in source, and with the Bamboo build number as a fourth part in a shipped SDK, e.g. 0.1.0.1234 (0 for a local build). |
| [WAVEFORM\_PAGE](variables/WAVEFORM_PAGE.md) | Pairs per cached page; four pages cover a minute of fine pairs. |
| [WHOLE\_NOTE](variables/WHOLE_NOTE.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [addOnTarget](functions/addOnTarget.md) | The host LUNA loaded this Add On page in, from the `?target=` it puts on the page URL (fact 144): `'window'`, `'browser'`, `'editor'` or `'app'`. `undefined` outside LUNA and on a LUNA older than the parameter. Synchronous, so a page that lists several manifest `targets` can lay itself out for its host before it connects. LUNA reloads the page when the user moves it to another host, so it never changes while the page runs. |
| [audioNsAtTick](functions/audioNsAtTick.md) | The file offset (ns) that plays at a timeline tick inside a clip: the clip's audio start plus the tempo-map seconds between the clip start and the tick. Linear in seconds, not in ticks, so a tempo change inside the clip bends the mapping exactly as the engine does. |
| [automationModeOrdinal](functions/automationModeOrdinal.md) | Commands take the mode as an integer ordinal; the track property reports it as a string. |
| [beatsToTicks](functions/beatsToTicks.md) | Beats to ticks. |
| [bindClock](functions/bindClock.md) | Bind `el` to the transport's playhead clock. Reads [Transport.seconds](classes/Transport.md#seconds), so the session's tempo map must be loaded (`session.ready()` does that). Returns a release function that cancels the frame loop and the listeners. |
| [bindDrag](functions/bindDrag.md) | Bind a div or canvas knob (or fader, or one axis of an XY pad) to one control, or to several that move together. Dragging captures the pointer and moves the value by pointer travel; arrow, Page and Home/End keys nudge it; double-click resets it. The element becomes a focusable `role="slider"` whose `aria-valuenow` and `aria-valuetext` follow the control. Writes go to the controls' `normalized` view, and the first control's value is the one shown. |
| [bindGesture](functions/bindGesture.md) | Bracket every drag on `target` with `begin()`/`end()` on `controls` (one control, or all the controls one element drives). |
| [bindRange](functions/bindRange.md) | Bind a native `<input type="range">` to `control`: touch on press, write on `input`, follow LUNA outside a drag, settle on LUNA's value on release, double-click to reset. Keyboard changes the browser makes are one-shot writes, which the control brackets itself. |
| [bindShortcuts](functions/bindShortcuts.md) | Give a page LUNA's standard shortcuts for undo, redo, play and record, as a fallback behind its own key handling, when LUNA is not there to handle them. |
| [canDropPaths](functions/canDropPaths.md) | True when native path drops can be used: the page is in LUNA's webview, which publishes `window.lunaAPI.setAcceptsFileDrops`. False in a browser and in tests. |
| [clients](functions/clients.md) | Every [Client](classes/Client.md) this page has made and not closed, in creation order. A tooling hook: `ua-builder probe` waits on `Luna.clients().some((c) => c.connected)` to know an Add On's page has finished connecting before it reads the DOM. |
| [clipAudio](functions/clipAudio.md) | - |
| [clipTypeFrom](functions/clipTypeFrom.md) | The engine sends clip_type as 0/1/2 or as a string; normalise to the string form. |
| [compiledClipAudio](functions/compiledClipAudio.md) | Which audio one compiled segment plays, over the segment only, or `undefined` when there is nothing safe to draw (see [clipAudio](functions/clipAudio.md)). `clip` is the raw clip the segment is cut from (`playlist.clips.byId(segment.clipUid.value)`): it names the source. Map ticks with [audioNsAtTick](functions/audioNsAtTick.md) anchored at the segment, which also reaches into a crossfade's `fullStart`..`fullStop`. |
| [connect](functions/connect.md) | - |
| [decodeMessage](functions/decodeMessage.md) | Decode one frame. Tolerates an 8-byte `JSON` header (magic + length) and a trailing NUL, and returns `undefined` for anything unparseable so the receive loop survives a bad frame. |
| [decodeMidiData](functions/decodeMidiData.md) | Unpack the three MIDI bytes the engine packs into one number (fact 39). |
| [decodeMidiEvents](functions/decodeMidiEvents.md) | Turn one batch into messages, skipping anything that is not a channel message, or a SysEx when `sysex` is true. A SysEx is `[time_ms, 0xf0, [0xf0, ..., 0xf7]]` (fact 138). Exported for tests. |
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
| [isAddOnCategory](functions/isAddOnCategory.md) | True when `name` is one of [ADD\_ON\_CATEGORIES](variables/ADD_ON_CATEGORIES.md), written exactly (case included). |
| [isEmbeddedInLuna](functions/isEmbeddedInLuna.md) | True when the page was opened by LUNA (a `?port=` is on the URL). |
| [isLunaEnginePort](functions/isLunaEnginePort.md) | True when the page is talking to LUNA's own engine on its default port. |
| [joinPath](functions/joinPath.md) | Join path segments with single slashes. |
| [kindForScale](functions/kindForScale.md) | The analysis to draw at a zoom level: `coarse` once a pixel spans at least one coarse pair (31.25 ms), `fine` when zoomed closer. Below one fine pair per pixel the same pair repeats; neither analysis is PCM. |
| [listOf](functions/listOf.md) | A [List](interfaces/List.md) over a [Prop](interfaces/Prop.md) of arrays. |
| [locationOptions](functions/locationOptions.md) | `host` and `port` from the page URL, if present. |
| [midiByte](functions/midiByte.md) | A 7-bit MIDI value, or `out_of_range`. `min` is 1 for a velocity that must sound. |
| [normalizeChordName](functions/normalizeChordName.md) | LUNA stores `♭` and `♯` as ASCII `b` and `#` (fact 100); the SDK compares names the same way. |
| [onPathDrop](functions/onPathDrop.md) | Receive files dropped on the page as **absolute paths** (LUNA only). Resolves nothing and reads nothing: pass the paths to `session.importPath()`, which has the engine read them from disk. Returns an unsubscribe; once the last handler is gone, LUNA hands file drags back to the page's HTML `drop` events. |
| [pairNotes](functions/pairNotes.md) | Pair note-on rows with the next note-off of the same channel and pitch, in tick order. Pure, and exported because a page that draws its own lanes often wants it directly. |
| [pairNs](functions/pairNs.md) | Nanoseconds one pair of this analysis covers. |
| [pairRange](functions/pairRange.md) | The overview pairs covering `[startNs, stopNs)` of a source. Both are file offsets, never timeline ticks. |
| [parseChord](functions/parseChord.md) | Split a chord name into root, type and bass. `undefined` when it does not start with a note letter, since the ruler accepts any text (`N.C.`, `riff`). A lowercase root or bass is read as the note (`am7` is A minor 7, `bb` is B flat) and returned upper-cased, but only when what follows the root is empty or starts like a chord quality, so `bridge` and `chorus` stay text. Spaces around the slash are ignored. |
| [pluginVersionMeets](functions/pluginVersionMeets.md) | Whether plugin version `installed` meets `minVersion`, as LUNA compares them (fact 148): every dot-separated part as a number, missing parts as 0, so `'0.4.10'` meets `'0.4.3'` and `'0.4.3.1'` meets `'0.4.3'`. An empty `minVersion` is met by anything; an empty or malformed `installed` meets only that. |
| [propertyValue](functions/propertyValue.md) | Unwrap a property reply. A `get` on a property answers `{ value: X }` unless `flatvalue` was requested, in which case it answers `X` directly. |
| [requireTick](functions/requireTick.md) | Reject a non-integer tick before it reaches the wire: LUNA stores whatever it is given (fact 12). |
| [secondsToTicks](functions/secondsToTicks.md) | Seconds to ticks at a constant tempo. |
| [selectedNotes](functions/selectedNotes.md) | Decode LUNA's `selection_notes` (an array, or `null`, or garbage) into frozen rows. |
| [settle](functions/settle.md) | Poll `done` until it holds, or reject with `no_effect`. Socket replies and event frames land between the yields; with `refresh`, the node is re-read after a short grace and then periodically, covering both a batch transaction and an event lost on the wire. |
| [shallowEquals](functions/shallowEquals.md) | Equality used by cells: `===` for primitives, JSON shape for plain objects and arrays. |
| [splitPath](functions/splitPath.md) | Split `<node>/<prop>` into its node path and property name. |
| [stripValueSuffix](functions/stripValueSuffix.md) | Property updates arrive on `<node>/<prop>/value`; the model addresses `<node>/<prop>`. |
| [suggestAddOnCategories](functions/suggestAddOnCategories.md) | Categories that suit an Add On, best first, guessed from what it says about itself (its name, description, a prompt that asked for it). At most `max` (default 3); when nothing in the text points anywhere, `['Utility']`. A guess to confirm with the author, never to write into a manifest unasked. |
| [ticksToBeats](functions/ticksToBeats.md) | Ticks to beats (floating). |
| [ticksToSeconds](functions/ticksToSeconds.md) | Ticks to seconds at a constant tempo. |
| [toEvent](functions/toEvent.md) | Turn a decoded wire message into the normalised event the Store consumes. |
| [traceWaveform](functions/traceWaveform.md) | Add one channel's waveform to a path as LUNA fills it: for every run of drawable columns, one closed shape through the column centres, the top outline (`mid - axis - max * half`) left to right and the bottom outline (`mid + axis - min * half`) back, squared off at the run's outer edges. `NaN` columns break the shape. It only adds subpaths; call `beginPath()` before and `fill()` after, so several channels or clips fill in one go. |
| [waveformColumns](functions/waveformColumns.md) | Reduce a [WaveformRange](interfaces/WaveformRange.md) to one min/max per drawn column, per channel, the way LUNA's own timeline does: |
| [waveformLanes](functions/waveformLanes.md) | Split `height` pixels from `top` into one equal lane per channel, stacked in file order (left above right for stereo), each with a zero line and a full-scale half-height. `gap` pixels are kept clear at the top and bottom of every lane; LUNA keeps none. |
| [waveformPeak](functions/waveformPeak.md) | The loudest absolute value in a range, across every channel, in 0..1; 0 when the range is empty. To normalize a clip, pass `gain: 1 / peak` to [waveformColumns](functions/waveformColumns.md), taking the peak from the clip's whole range, not the visible columns, so the scale holds while scrolling. |
| [writable](functions/writable.md) | Wrap a [Prop](interfaces/Prop.md) with a setter to make a [WritableProp](interfaces/WritableProp.md). |
| [yieldTask](functions/yieldTask.md) | One macrotask later, through a `MessageChannel` where there is one. A background browser tab throttles timers to about one tick per second but never throttles messages, so a timer-only loop lands on its own timeout in a hidden page even though LUNA finished in milliseconds. |
