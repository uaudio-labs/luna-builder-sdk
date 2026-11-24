# Luna

## Classes

| Class | Description |
| ------ | ------ |
| [ActiveAudioEngine](classes/ActiveAudioEngine.md) | The audio engine LUNA is running (the root's read-only `active_audio_engine`, fact 190): whether audio is on, which kind of engine, and which drivers it uses. Lets an Add On tell when audio is down. |
| [AddOn](classes/AddOn.md) | - |
| [AddOnInstance](classes/AddOnInstance.md) | One page of an installed Add On open in LUNA (fact 143): `/gui/add_ons/<id>/instances/<add_on_inst>`. LUNA gives every Add On page an `add_on_inst` in its URL; [Gui.thisInstance](classes/Gui.md#thisinstance) finds the page's own. A window keeps its instance while it exists, and a `show_with_session` window keeps it in the session, so it is the same after the session is closed and opened again: a page can key its own `session.storage` records by it. |
| [AnalysisNode](classes/AnalysisNode.md) | One analysis of a source. `count` and `md5` change when the analysis does: a recording's overview `count` grows as LUNA writes it (its `md5` stays `null` until the take is stored), and a finished analysis gets its digest (facts 205, 206). |
| [Assistant](classes/Assistant.md) | `/assistant`: whether UA Assistant is connected to LUNA. Preset recommendations need it (fact 121). Call `watch()` to follow it. |
| [AudioSource](classes/AudioSource.md) | - |
| [AutoGain](classes/AutoGain.md) | `/auto_gain`: the Auto Gain service. All of its properties are read-only. The service only exists when LUNA's Auto Gain feature is on; check [available](classes/AutoGain.md#available) first (fact 191). |
| [AutoGainChannel](classes/AutoGainChannel.md) | `/auto_gain/channels/<name>`: a channel Auto Gain is listening to. The node name is LUNA's own key; identify a channel by `sessionUid` and `channelUid` (fact 191). |
| [Automation](classes/Automation.md) | An observable ordered collection with id lookup. |
| [Bindings](classes/Bindings.md) | - |
| [BreakpointNode](classes/BreakpointNode.md) | - |
| [Bus](classes/Bus.md) | - |
| [Cell](classes/Cell.md) | The concrete [Prop](interfaces/Prop.md): a value with a version stamp and listeners. The version lets the Store decide whether an incoming value is newer than a pending write. |
| [Channel](classes/Channel.md) | - |
| [Chord](classes/Chord.md) | - |
| [ChordAnalysis](classes/ChordAnalysis.md) | `analysis/chord`: written by chord detection (`session.musical.chords.detect()`), next to the chords it puts on the ruler. |
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
| [DeviceInput](classes/DeviceInput.md) | `/devices/<device>/inputs/<uid>`: one input of an audio device, the thing a track's `inputNodeUid` points at (facts 76, 185). All of its properties are read-only. |
| [DeviceInputs](classes/DeviceInputs.md) | `/devices/<device>/inputs`: a device's inputs. `watch()` here is recursive by default, so a watched collection follows inputs being added and removed (hotplug) and every input's properties: `in_use`, and analysis results while an analysis is on (fact 185). |
| [DeviceOutput](classes/DeviceOutput.md) | `/devices/<device>/outputs/<uid>`: one output of an audio device (fact 189). Read-only. |
| [DeviceOutputs](classes/DeviceOutputs.md) | `/devices/<device>/outputs`: a device's outputs. `watch()` is recursive by default, like [DeviceInputs](classes/DeviceInputs.md). |
| [Devices](classes/Devices.md) | An observable ordered collection with id lookup. |
| [Disposed](classes/Disposed.md) | The object was disposed: the engine removed its node (a deleted track, a closed session), or its owner was disposed. Its props stop updating and its commands refuse to run, so a stale reference cannot act on whatever takes its place. |
| [Drivers](classes/Drivers.md) | `/drivers`: what audio hardware the engine sees. |
| [Effect](classes/Effect.md) | - |
| [Error](classes/Error.md) | Errors thrown by the wire layer and everything above it. |
| [ErrorNotice](classes/ErrorNotice.md) | - |
| [ErrorNotices](classes/ErrorNotices.md) | An observable ordered collection with id lookup. |
| [FloatLiteral](classes/FloatLiteral.md) | A number that must reach the engine as a JSON float literal. Some fields are parsed by token type: a breakpoint `value` written as `-6` is stored as 0, while `-6.0` is stored as -6 (fact 79). `JSON.stringify` writes every whole number without a fraction, so wrap the value and the codec writes `-6.0`. |
| [FolderTree](classes/FolderTree.md) | A snapshot of the folder hierarchy: rows in LUNA's order (each folder followed by everything inside it), the rows to draw under collapsed folders, selection expansion, and the folder a channel's main output sums into. Make one with [folderTree](functions/folderTree.md). |
| [Group](classes/Group.md) | One group. |
| [Groups](classes/Groups.md) | The session's groups. Not loaded by `session.ready()`: call [load](classes/Groups.md#load) first. |
| [Gui](classes/Gui.md) | - |
| [GuiWindow](classes/GuiWindow.md) | - |
| [InstrumentAnalysis](classes/InstrumentAnalysis.md) | `analysis/instrument`. |
| [Job](classes/Job.md) | `/jobs/<uid>`: long-running engine jobs (lyric transcription, chord extraction, ...). `percentComplete` is 0..100. LUNA publishes the terminal status and removes the node in the same turn (fact 200); [done](classes/Job.md#done) latches the ending for you. Only `cancel()` exists; there is no delete. A job you launch yourself is easier to follow through the `Luna.JobRun` its command returns (`session.musical.chords.detect()`, `session.lyrics.transcribe()`). |
| [JobRun](classes/JobRun.md) | One launched job, followed from the command that started it to its end: what `session.musical.chords.detect()` and `session.lyrics.transcribe()` return. Await it (or [done](classes/JobRun.md#done)) for the outcome; read [progress](classes/JobRun.md#progress) and [snapshot](classes/JobRun.md#snapshot) on the way. |
| [Jobs](classes/Jobs.md) | An observable ordered collection with id lookup. |
| [KeyAnalysis](classes/KeyAnalysis.md) | `analysis/key`. |
| [KeySignature](classes/KeySignature.md) | - |
| [Lyric](classes/Lyric.md) | - |
| [Lyrics](classes/Lyrics.md) | An observable ordered collection with id lookup. |
| [Marker](classes/Marker.md) | - |
| [Markers](classes/Markers.md) | An observable ordered collection with id lookup. |
| [Meter](classes/Meter.md) | - |
| [MidiClip](classes/MidiClip.md) | The MIDI of one clip, reached as `clip.midi`. Both lists notify once per frame, like every other [List](interfaces/List.md). An audio clip's table is empty. |
| [MidiDevice](classes/MidiDevice.md) | `/devices/<LUNA>/midi/<uid>`: a MIDI device LUNA sees, as its MIDI settings list it. Besides the real devices, LUNA lists `All` and `None`, whose settings read `null`; `isPhysical` is false for those two (fact 123). |
| [MidiDevices](classes/MidiDevices.md) | `/devices/<LUNA>/midi`: the MIDI devices LUNA sees. The folder is outside any session, so `watch()` it to follow devices plugged in or removed (fact 34). |
| [MidiInput](classes/MidiInput.md) | Live MIDI input from the MIDI devices LUNA sees (fact 125). Use this for MIDI input in an Add On, not Web MIDI (`navigator.requestMIDIAccess()`): LUNA's macOS web view has no Web MIDI, and this works the same inside LUNA and in a browser. |
| [MidiOutputAssignment](classes/MidiOutputAssignment.md) | One assignment row. |
| [MidiOutputs](classes/MidiOutputs.md) | A track's MIDI output assignments. Under a session that called `ready()` they follow LUNA; call [load](classes/MidiOutputs.md#load) once to read them. |
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
| [PreferenceContext](classes/PreferenceContext.md) | - |
| [Preferences](classes/Preferences.md) | `/preferences`: engine preferences as writable properties by name. |
| [Presets](classes/Presets.md) | - |
| [PresetSelection](classes/PresetSelection.md) | Created by [Presets.selection](classes/Presets.md#selection). |
| [QwertyMidi](classes/QwertyMidi.md) | - |
| [RecentSessions](classes/RecentSessions.md) | The live list [Workspace.recentList](classes/Workspace.md#recentlist) answers. `byId` takes a package uid with or without dashes. |
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
| [SourceAnalysis](classes/SourceAnalysis.md) | `source.analysis`: every analysis LUNA keeps for one source. |
| [SourceUsage](classes/SourceUsage.md) | An observable ordered collection with id lookup. |
| [StorageContext](classes/StorageContext.md) | `/sessions/<uid>/storage/<context>`: one context's records. Get one with `session.storage.context(name)`. |
| [Store](classes/Store.md) | - |
| [Taper](classes/Taper.md) | Fader tapers: how LUNA maps a fader's 0..1 position to dB (fact 134). |
| [TempoAnalysis](classes/TempoAnalysis.md) | `analysis/tempo`. |
| [TempoEvent](classes/TempoEvent.md) | - |
| [Timeline](classes/Timeline.md) | Pure tick arithmetic over the current tempo map and time signatures. Every method reads the maps as they are now; [onChange](classes/Timeline.md#onchange) says when an answer may have moved. |
| [TimeSignature](classes/TimeSignature.md) | - |
| [Track](classes/Track.md) | - |
| [TrackPresetSelection](classes/TrackPresetSelection.md) | Created by [Presets.trackSelection](classes/Presets.md#trackselection). |
| [TransientAnalysis](classes/TransientAnalysis.md) | `analysis/transients`, read a page at a time like the overview. |
| [Transport](classes/Transport.md) | - |
| [Unsupported](classes/Unsupported.md) | The feature is not available on this engine (for example a headless engine has no `/gui`). |
| [Warp](classes/Warp.md) | One warp marker node. |
| [Warps](classes/Warps.md) | The `warps` folder of a clip. |
| [Waveforms](classes/Waveforms.md) | A bounded cache of overview pages, keyed by source, analysis and page index. A short page (the end of the analysis, or growth in progress) is never cached, so a recording still being written is re-read until it settles. |
| [WebSocketPort](classes/WebSocketPort.md) | A connection to one engine. |
| [Workspace](classes/Workspace.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ActiveAudioEngineInfo](interfaces/ActiveAudioEngineInfo.md) | The value of the root's `active_audio_engine` property (fact 190). |
| [AddLyricOptions](interfaces/AddLyricOptions.md) | Options for [Lyrics.add](classes/Lyrics.md#add). |
| [AddOnCategoryInfo](interfaces/AddOnCategoryInfo.md) | One Add On category: its `name`, as a manifest writes it, and what belongs in it. |
| [AffectedTracksOptions](interfaces/AffectedTracksOptions.md) | - |
| [AudioDeviceInfo](interfaces/AudioDeviceInfo.md) | - |
| [AudioHealth](interfaces/AudioHealth.md) | Audio-path health as the engine reports it. |
| [AudioInput](interfaces/AudioInput.md) | A device input a track can record from, as [Client.audioInputs](classes/Client.md#audioinputs) lists it. |
| [AutoGainStartOptions](interfaces/AutoGainStartOptions.md) | Options for [AutoGain.start](classes/AutoGain.md#start). |
| [BarBeat](interfaces/BarBeat.md) | A bar|beat position as the engine reports it in `location.bar_beat`, and as `timeline.barBeat()` returns it. `tick` is in **engine** ticks (the remainder within the beat), not display ticks; [formatBarBeat](functions/formatBarBeat.md) does the conversion. |
| [BounceOptions](interfaces/BounceOptions.md) | - |
| [Breakpoint](interfaces/Breakpoint.md) | - |
| [ChordAnalysisResult](interfaces/ChordAnalysisResult.md) | `analysis/chord`: what chord detection found in the source (fact 207). |
| [ChordSegment](interfaces/ChordSegment.md) | One detected chord over a stretch of the source. |
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
| [ControlValue](interfaces/ControlValue.md) | One control and its value for [Context.writeControlValues](classes/Context.md#writecontrolvalues) / [Context.trimControlValues](classes/Context.md#trimcontrolvalues). |
| [ControlValueRange](interfaces/ControlValueRange.md) | The tick range of a write or trim: `[start, stop)`. Give both or neither; with neither, LUNA uses the context's selection (fact 227). |
| [CreateFromTemplateOptions](interfaces/CreateFromTemplateOptions.md) | - |
| [CreateSessionOptions](interfaces/CreateSessionOptions.md) | - |
| [Destination](interfaces/Destination.md) | Where an output goes. `uid` is the assignment's, the handle [Output.unassign](classes/Output.md#unassign) takes. |
| [DragOptions](interfaces/DragOptions.md) | - |
| [DragStartLike](interfaces/DragStartLike.md) | The minimal drag event this needs; a DOM `DragEvent` is one. |
| [Event](interfaces/Event.md) | One change pushed by the engine, normalised: a trailing `/value` is stripped, multi-updates are already expanded, and `operation` marks a child added or removed at `path`. |
| [ExportOptions](interfaces/ExportOptions.md) | - |
| [ExtractionOptions](interfaces/ExtractionOptions.md) | What a chord detection or lyric transcription works on. |
| [FileEntry](interfaces/FileEntry.md) | One entry of [Gui.listFiles](classes/Gui.md#listfiles): a file or folder directly inside the listed folder. |
| [FolderAnomaly](interfaces/FolderAnomaly.md) | One anomaly in a [FolderTree](classes/FolderTree.md). |
| [FolderChannel](interfaces/FolderChannel.md) | What a tree is built from: a [Track](classes/Track.md) or [Bus](classes/Bus.md), or anything shaped like one. Only a channel with a `folderMode` that is `summing` or `container` is a folder. |
| [FolderRow](interfaces/FolderRow.md) | One row of a [FolderTree](classes/FolderTree.md). |
| [Gesture](interfaces/Gesture.md) | - |
| [GestureOptions](interfaces/GestureOptions.md) | - |
| [GetOptions](interfaces/GetOptions.md) | Query parameters accepted by `get`, in camelCase. Booleans become `1`/`0` on the wire. See `hbsystem/networking/docs/operations.md`. |
| [ImportedFile](interfaces/ImportedFile.md) | A MIDI or video file copied into a session's package by [Session.importPath](classes/Session.md#importpath). Only the file is added: no track or clip is made (fact 163). A MIDI file is filed in the package's `midi` folder, a video file, with its extension, in `video`. |
| [ImportPathOptions](interfaces/ImportPathOptions.md) | - |
| [InsertClipOptions](interfaces/InsertClipOptions.md) | - |
| [InstrumentAnalysisResult](interfaces/InstrumentAnalysisResult.md) | `analysis/instrument` (fact 207). |
| [JobCriteria](interfaces/JobCriteria.md) | What a launch is matched on (fact 201). |
| [JobResult](interfaces/JobResult.md) | How a job that did what it was asked ended. |
| [JobRunOptions](interfaces/JobRunOptions.md) | How long a [JobRun](classes/JobRun.md) waits: for LUNA to start the job, and for it to finish. |
| [JobSnapshot](interfaces/JobSnapshot.md) | A job as LUNA last reported it. Frozen; safe to keep. |
| [KeyAnalysisResult](interfaces/KeyAnalysisResult.md) | `analysis/key`: the detector's key guesses (fact 207). |
| [KeyCandidate](interfaces/KeyCandidate.md) | A key guess, best first. |
| [List](interfaces/List.md) | An observable ordered collection with id lookup. |
| [Location](interfaces/Location.md) | The `location` property of a session. |
| [LocationOptions](interfaces/LocationOptions.md) | - |
| [LyricProviders](interfaces/LyricProviders.md) | The lyric transcription services LUNA offers (`/lyric_transcription`, fact 204). |
| [LyricWord](interfaces/LyricWord.md) | One word of a lyric line. `offset` and `length` are in the line's units, from its start. |
| [MidiEvent](interfaces/MidiEvent.md) | One MIDI event to add to a clip. `tick` is relative to the clip start. |
| [MidiHost](interfaces/MidiHost.md) | What a MIDI edit needs to reach LUNA's edit context: the session it lives in, the playlist that holds the clip, and the clip's own start tick (the selection is in absolute ticks). |
| [MidiInputListenOptions](interfaces/MidiInputListenOptions.md) | Options for [MidiInput.listen](classes/MidiInput.md#listen). |
| [MidiInputMessage](interfaces/MidiInputMessage.md) | One message a MIDI device sent LUNA. |
| [MidiRow](interfaces/MidiRow.md) | One row of a clip's MIDI table: a single MIDI message at a clip-relative tick. |
| [MidiRowData](interfaces/MidiRowData.md) | The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40). |
| [MockEngineOptions](interfaces/MockEngineOptions.md) | - |
| [MockJobPlan](interfaces/MockJobPlan.md) | How [MockEngine.startJob](classes/MockEngine.md#startjob) ends the next job; see [MockEngine.planNextJob](classes/MockEngine.md#plannextjob). |
| [MockMidiRow](interfaces/MockMidiRow.md) | A row for [MockEngine.midiEdit](classes/MockEngine.md#midiedit). |
| [MockMidiSent](interfaces/MockMidiSent.md) | One live MIDI message the mock delivered, in [MockEngine.midiSent](classes/MockEngine.md#midisent). |
| [MockNodeSpec](interfaces/MockNodeSpec.md) | - |
| [MoveToFolderOptions](interfaces/MoveToFolderOptions.md) | - |
| [NestedFileEntry](interfaces/NestedFileEntry.md) | One entry of [Gui.listAllFiles](classes/Gui.md#listallfiles): a [FileEntry](interfaces/FileEntry.md) anywhere below the listed folder. |
| [NewBusOptions](interfaces/NewBusOptions.md) | - |
| [NewFolderOptions](interfaces/NewFolderOptions.md) | - |
| [NewGroupOptions](interfaces/NewGroupOptions.md) | - |
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
| [ProgressSuppression](interfaces/ProgressSuppression.md) | One held suppression. [release](interfaces/ProgressSuppression.md#release) is idempotent and never rejects for a handle LUNA already dropped. |
| [ProgressTask](interfaces/ProgressTask.md) | - |
| [Prop](interfaces/Prop.md) | A readable, observable value. `value` is `undefined` until the first load or push. |
| [QueryOptions](interfaces/QueryOptions.md) | - |
| [RangeOptions](interfaces/RangeOptions.md) | - |
| [RecentSessionRow](interfaces/RecentSessionRow.md) | A [Workspace.recentList](classes/Workspace.md#recentlist) row: the package, and the open session showing it, if any. |
| [RecordOptions](interfaces/RecordOptions.md) | - |
| [ReorderOptions](interfaces/ReorderOptions.md) | - |
| [RollDuration](interfaces/RollDuration.md) | A pre- or post-roll length: whole bars, then beats, then engine ticks, counted in the session's time signatures where the roll falls. |
| [SeekOptions](interfaces/SeekOptions.md) | - |
| [SelectedNotes](interfaces/SelectedNotes.md) | One playlist's selected notes as LUNA stores them: `[pitch, start, stop, rowid]` in absolute ticks. |
| [SelectionSnapshot](interfaces/SelectionSnapshot.md) | The six selection properties as LUNA holds them, for [Context.restore](classes/Context.md#restore). |
| [SendMidiTrackTarget](interfaces/SendMidiTrackTarget.md) | A track entry for [SendMidi.sendNoteToTracks](classes/SendMidi.md#sendnotetotracks). |
| [SessionPackageRow](interfaces/SessionPackageRow.md) | - |
| [SettleOptions](interfaces/SettleOptions.md) | - |
| [SetWarpOptions](interfaces/SetWarpOptions.md) | Options for [Warps.set](classes/Warps.md#set). |
| [ShortcutsBinding](interfaces/ShortcutsBinding.md) | The listeners [bindShortcuts](functions/bindShortcuts.md) installed. |
| [ShortcutsOptions](interfaces/ShortcutsOptions.md) | - |
| [SocketLike](interfaces/SocketLike.md) | The subset of the WebSocket API this port uses; lets tests inject a fake. |
| [SourceUsageEntry](interfaces/SourceUsageEntry.md) | Every use of one file. |
| [SourceUse](interfaces/SourceUse.md) | One clip's use of one file. |
| [StorageEditOptions](interfaces/StorageEditOptions.md) | Options for an edit of session storage. |
| [SubscribeOptions](interfaces/SubscribeOptions.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [SuppressProgressOptions](interfaces/SuppressProgressOptions.md) | - |
| [TaperMarksOptions](interfaces/TaperMarksOptions.md) | Options for [Taper.marks](classes/Taper.md#marks). |
| [TemplateQueryOptions](interfaces/TemplateQueryOptions.md) | Filters for [Workspace.templates](classes/Workspace.md#templates). |
| [TempoAnalysisResult](interfaces/TempoAnalysisResult.md) | `analysis/tempo` (fact 207). |
| [TempoCandidate](interfaces/TempoCandidate.md) | A tempo guess, best first. |
| [TraceWaveformOptions](interfaces/TraceWaveformOptions.md) | - |
| [TrackPresetPlugin](interfaces/TrackPresetPlugin.md) | One plugin a track preset uses, from [Presets.trackPresetPlugins](classes/Presets.md#trackpresetplugins). |
| [TrackPresetSelectionOptions](interfaces/TrackPresetSelectionOptions.md) | - |
| [TransactionOptions](interfaces/TransactionOptions.md) | - |
| [TranscribeOptions](interfaces/TranscribeOptions.md) | Options for [Lyrics.transcribe](classes/Lyrics.md#transcribe). |
| [TransientAnalysisResult](interfaces/TransientAnalysisResult.md) | One page of `analysis/transients` (fact 207). |
| [TransportLocation](interfaces/TransportLocation.md) | The `location` property of a session. |
| [UnusedMedia](interfaces/UnusedMedia.md) | The answer of [Workspace.unusedMedia](classes/Workspace.md#unusedmedia) and [Workspace.deleteUnusedMedia](classes/Workspace.md#deleteunusedmedia). |
| [UploadOptions](interfaces/UploadOptions.md) | - |
| [VisibleRowsOptions](interfaces/VisibleRowsOptions.md) | Options for [FolderTree.visibleRows](classes/FolderTree.md#visiblerows). |
| [WarpMarker](interfaces/WarpMarker.md) | One warp marker as plain data, for [Warps.markers](classes/Warps.md#markers). |
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
| [AnalysisKind](type-aliases/AnalysisKind.md) | The analysis node names LUNA uses (fact 205). |
| [AutoGainStatus](type-aliases/AutoGainStatus.md) | `/auto_gain`'s `status` (fact 191). `done_listening`, `overload_error` and `low_signal_error` end a pass; `stopped` is the idle state. |
| [AutoGainTarget](type-aliases/AutoGainTarget.md) | A track (or any channel with an input) Auto Gain can run on: its session and its uid. |
| [AutomationMode](type-aliases/AutomationMode.md) | - |
| [AutomationModeName](type-aliases/AutomationModeName.md) | - |
| [BusType](type-aliases/BusType.md) | - |
| [ChannelRef](type-aliases/ChannelRef.md) | A track, a bus, or its uid: anything with an `id`, or the id itself. |
| [ClipType](type-aliases/ClipType.md) | - |
| [CommandHandler](type-aliases/CommandHandler.md) | - |
| [ContextType](type-aliases/ContextType.md) | - |
| [ControlType](type-aliases/ControlType.md) | A control's `control_type`: one LUNA defines ([CONTROL\_TYPES](variables/CONTROL_TYPES.md)), or a newer one. |
| [CrossfadeAlign](type-aliases/CrossfadeAlign.md) | Where a crossfade sits on the edit between two clips, for [Clip.crossfade](classes/Clip.md#crossfade). |
| [ErrorCode](type-aliases/ErrorCode.md) | One of the [ErrorCodes](variables/ErrorCodes.md) values. `UAError.code` stays a `string`, since LUNA defines more. |
| [ErrorNoticeLevel](type-aliases/ErrorNoticeLevel.md) | How serious a notice is. |
| [EventHandler](type-aliases/EventHandler.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [FadeShape](type-aliases/FadeShape.md) | LUNA's fade shapes. Another string is passed through as LUNA sent it. |
| [FolderAnomalyKind](type-aliases/FolderAnomalyKind.md) | What was wrong with a channel's `folderUid`. |
| [FolderMode](type-aliases/FolderMode.md) | A bus's folder mode (fact 136). `'summing'`: a folder track whose children's main outputs go to it, so it is their bus. `'container'`: a folder that only groups; its children route past it to the nearest summing folder above, else the master. `'none'`: an ordinary bus. |
| [GroupAttribute](type-aliases/GroupAttribute.md) | What a group links: timeline edits, mix moves, plugin changes, send changes. |
| [GuiPage](type-aliases/GuiPage.md) | A page a LUNA window shows. `lunaplay` is reported while LUNA Play shows but cannot be set: [Gui.setPage](classes/Gui.md#setpage) takes a [SettablePage](type-aliases/SettablePage.md) (fact 236). |
| [InputAnalysisKind](type-aliases/InputAnalysisKind.md) | A live analysis LUNA can run on a device input (fact 186). The value is the prefix of the engine's `<kind>_analysis_enabled` switch. |
| [InsertSlot](type-aliases/InsertSlot.md) | An insert slot's name, as LUNA writes it in `insert_type` and in the effect's path. `'instrument'` is an instrument track's instrument slot (`effects/instrument`), ahead of the `effect_N` inserts. [isRecordFxSlot](functions/isRecordFxSlot.md) and [insertSlotForAlias](functions/insertSlotForAlias.md) help with the rest. |
| [KeptReason](type-aliases/KeptReason.md) | Why LUNA keeps a file that [Workspace.unusedMedia](classes/Workspace.md#unusedmedia) does not offer to remove. |
| [KeyCombo](type-aliases/KeyCombo.md) | A key combination as `Modifier+...+Key`. Modifiers are `Mod` (Cmd on a Mac, Ctrl elsewhere), `Cmd`, `Ctrl`, `Alt` and `Shift`, and the ones named must be exactly the ones held. The key is a `KeyboardEvent.key` (`z`, case-insensitive) or `KeyboardEvent.code` (`Space`, `Numpad0`, `KeyZ`). |
| [KnownControlType](type-aliases/KnownControlType.md) | One of [CONTROL\_TYPES](variables/CONTROL_TYPES.md). |
| [KnownStemFormat](type-aliases/KnownStemFormat.md) | One of [STEM\_FORMATS](variables/STEM_FORMATS.md). |
| [LengthFollows](type-aliases/LengthFollows.md) | What a clip's length follows when the tempo changes (LUNA's `length_follows`): `'ticks'` keeps its musical length, `'time'` its length in seconds. Left out, the clip follows its track. |
| [LogFn](type-aliases/LogFn.md) | Where a port reports what it does: status changes, reconnect attempts, timeouts, and listeners that threw. The default sends `warn` and `error` to the console. |
| [LogLevel](type-aliases/LogLevel.md) | Severity of a [LogFn](type-aliases/LogFn.md) message. |
| [MidiInputTarget](type-aliases/MidiInputTarget.md) | Where [MidiInput.listen](classes/MidiInput.md#listen) listens: a device (its input port), an input port, or every device. |
| [MidiInputType](type-aliases/MidiInputType.md) | What a message is, from its status byte. A note-on with velocity 0 is a `noteOff`. `sysex` is a whole System Exclusive message, delivered only when asked for. |
| [MidiOperation](type-aliases/MidiOperation.md) | One MIDI operation. Ranges are LUNA's; anything outside them is refused before it is sent. |
| [MidiOutputDestination](type-aliases/MidiOutputDestination.md) | One assignment's destination. `uid` is a track's, a bus's or an effect's; `name` a MIDI device's. |
| [MidiOutputTarget](type-aliases/MidiOutputTarget.md) | Where a `...ToOutput` method sends: a MIDI device (its output port), one of its output ports, or an output port's `uid`. |
| [MidiRoute](type-aliases/MidiRoute.md) | One route for [MidiOutputs.set](classes/MidiOutputs.md#set): to a track or a bus (by object or uid), or to a MIDI device by its name (`luna.midiDevices` lists them). `channel` is stored as given: LUNA's own menu writes 0 for all channels and 1-16 for one channel (fact 220). |
| [NewSessionType](type-aliases/NewSessionType.md) | The kind of session package `new_session` makes. LUNA's own list; `'default'` is an ordinary session, `'standalone'` one kept in a standalone sessions subfolder named by [CreateSessionOptions.standaloneId](interfaces/CreateSessionOptions.md#standaloneid). |
| [Operation](type-aliases/Operation.md) | Structural change carried by an [Event](interfaces/Event.md). Absent for a property value change. |
| [OverviewKind](type-aliases/OverviewKind.md) | `fine` is `analysis/overview` (2.604 ms per pair), `coarse` is `analysis/overview_coarse` (12 fine pairs, 31.25 ms). Fact 72. |
| [PluginFormat](type-aliases/PluginFormat.md) | A plug-in format, as LUNA names its SDK types: third-party `vst`, `vst3`, `au` and `aax`, UA's `uad2` and `uadx`, and the server-hosted `cloud` and `localml` clip effects. A plug-in's reported format (`plugin.sdkType`, [PluginSdkType](type-aliases/PluginSdkType.md)) is one of these, or `''`. |
| [PluginSdkType](type-aliases/PluginSdkType.md) | A plugin's format as LUNA reports it (`sdk_type`, fact 177): a [PluginFormat](type-aliases/PluginFormat.md), or `''` when LUNA cannot tell (a `cloud:` plugin while cloud clip effects are off). |
| [PortStatus](type-aliases/PortStatus.md) | Connection state as reported by [Port.onStatus](interfaces/Port.md#onstatus). |
| [PostRecordCommand](type-aliases/PostRecordCommand.md) | - |
| [PropKey](type-aliases/PropKey.md) | The names of a member's fields that are props, for [Collection.onAnyChange](classes/Collection.md#onanychange). |
| [QwertyKeyEvent](type-aliases/QwertyKeyEvent.md) | The parts of a `KeyboardEvent` the keyboard reads. |
| [RecPlayMode](type-aliases/RecPlayMode.md) | - |
| [Releasable](type-aliases/Releasable.md) | Something [Bindings](classes/Bindings.md) can release: an unsubscribe function or an object with `dispose()`. |
| [SecretStorage](type-aliases/SecretStorage.md) | Where [Secrets](classes/Secrets.md) keeps values: the OS credential store, or page memory. |
| [SeekTarget](type-aliases/SeekTarget.md) | Where to seek: a tick, or a bar|beat|tick position (`beat` defaults to 1, `tick` to 0). |
| [SessionType](type-aliases/SessionType.md) | One of [SESSION\_TYPES](variables/SESSION_TYPES.md). |
| [SettablePage](type-aliases/SettablePage.md) | The pages [Gui.setPage](classes/Gui.md#setpage) can switch a window to (fact 236). |
| [ShortcutBindings](type-aliases/ShortcutBindings.md) | - |
| [ShortcutCommand](type-aliases/ShortcutCommand.md) | The commands the standard shortcuts cover. |
| [ShortcutKeyEvent](type-aliases/ShortcutKeyEvent.md) | The parts of a `KeyboardEvent` a binding matches on. |
| [ShortcutPlatform](type-aliases/ShortcutPlatform.md) | - |
| [SocketConstructor](type-aliases/SocketConstructor.md) | - |
| [SoloMode](type-aliases/SoloMode.md) | How soloing a track treats the others (fact 157): `'latching'` adds it to what is soloed, `'exclusive'` unsolos the rest (LUNA does that only inside a touch, fact 78). |
| [SourceDragItems](type-aliases/SourceDragItems.md) | What [startSourceDrag](functions/startSourceDrag.md) drags: absolute paths, or a session's sources. |
| [SourceLookup](type-aliases/SourceLookup.md) | Anything that can resolve a source uid: `session.sources`, or a plain array. |
| [StatusListener](type-aliases/StatusListener.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [StemFormat](type-aliases/StemFormat.md) | - |
| [TaperName](type-aliases/TaperName.md) | A fader taper name as LUNA writes it in a control's `taper` property. |
| [TrackPresetCategory](type-aliases/TrackPresetCategory.md) | - |
| [TrackType](type-aliases/TrackType.md) | - |
| [TransactionMode](type-aliases/TransactionMode.md) | Which kind of [Session.transaction](classes/Session.md#transaction) is open: `'batch'` holds every command for one undo step and holds pushes until the commit; `'continuous'` keeps only the last command. |
| [Unsubscribe](type-aliases/Unsubscribe.md) | The Luna namespace. Everything public lives here; `import { Luna } from '@uaudio/luna-builder-sdk'` or, from a script tag, `globalThis.Luna`. |
| [Verb](type-aliases/Verb.md) | UANet verbs. |
| [WarpType](type-aliases/WarpType.md) | Who placed a warp marker: the user (0 on the wire) or LUNA's own analysis (1). |

## Variables

| Variable | Description |
| ------ | ------ |
| [ADD\_ON\_CATEGORIES](variables/ADD_ON_CATEGORIES.md) | Every Add On category, in the order the showcase lists them. |
| [AUTOMATION\_MODES](variables/AUTOMATION_MODES.md) | - |
| [BUS\_TYPES](variables/BUS_TYPES.md) | The named [BusType](type-aliases/BusType.md)s LUNA defines. Cue buses are not in it: LUNA numbers them `cue_0` .. `cue_63` ([MAX\_CUE\_BUSES](variables/MAX_CUE_BUSES.md)), which [parseBusType](functions/parseBusType.md) accepts. `headphone` is a device bus (Volt), not one a session holds. |
| [COARSE\_PAIR\_NS](variables/COARSE_PAIR_NS.md) | Nanoseconds per coarse overview pair: 31.25 ms. |
| [COARSE\_PAIRS\_PER\_FINE](variables/COARSE_PAIRS_PER_FINE.md) | Fine pairs per coarse pair. |
| [consoleLog](variables/consoleLog.md) | The default [LogFn](type-aliases/LogFn.md): warnings and errors to the console, the rest dropped. |
| [CONTROL\_TYPES](variables/CONTROL_TYPES.md) | Every control type LUNA defines, as it writes them in `control_type` (`UA::ControlTypeToString`). The list mirrors LUNA's and must track it; [ControlType](type-aliases/ControlType.md) stays open (`| string`) so a type a later LUNA adds still reads. |
| [CUE\_COUNT](variables/CUE_COUNT.md) | Four cue outputs per channel, `cue_0`..`cue_3`. |
| [DEFAULT\_LUNA\_PORT](variables/DEFAULT_LUNA_PORT.md) | - |
| [DEFAULT\_SHORTCUTS](variables/DEFAULT_SHORTCUTS.md) | LUNA's default shortcuts for the four commands (fact 79). Windows uses Ctrl where the Mac uses Cmd, which `Mod` covers. |
| [DISPLAY\_TICKS\_PER\_BEAT](variables/DISPLAY_TICKS_PER_BEAT.md) | Musical time units (EVIDENCE fact 16). |
| [EDIT\_SHORTCUTS](variables/EDIT_SHORTCUTS.md) | LUNA's default keys for its edit commands (fact 150): Cmd+A to select all, Cmd+X, Cmd+C, Cmd+V (Ctrl off the Mac), Backspace or Delete to clear, and Cmd+D for Duplicate Selection. Pass them as `bindings` to have [Shortcuts](classes/Shortcuts.md) run them; each acts on LUNA's edit selection, which `options.prepare` can point at what the page shows first (`session.selectTimeline`). |
| [EDIT\_TIMEOUT\_MS](variables/EDIT_TIMEOUT_MS.md) | How long [settle](functions/settle.md) waits by default for the model to reflect an edit. |
| [EIGHTH\_NOTE](variables/EIGHTH_NOTE.md) | - |
| [ErrorCodes](variables/ErrorCodes.md) | Codes a `Luna.Error` can carry, to compare `error.code` against instead of a string literal. The `uasrv.*`, `device.*` and `mixer.*` ones are LUNA's own error strings, passed through unchanged; the rest are the SDK's fixed codes. The engine list is the subset the SDK documents (docs/EVIDENCE.md); LUNA defines more, and an unlisted code still arrives unchanged in `error.code`. |
| [FOLDER\_MODES](variables/FOLDER_MODES.md) | Every [FolderMode](type-aliases/FolderMode.md) (fact 136): `none` is an ordinary bus, `summing` and `container` are folders. |
| [GROUP\_ATTRIBUTES](variables/GROUP_ATTRIBUTES.md) | The attributes in LUNA's own order, which is how it writes `group_attributes` (fact 215). |
| [HALF\_NOTE](variables/HALF_NOTE.md) | - |
| [HIDDEN\_SESSION\_TYPES](variables/HIDDEN_SESSION_TYPES.md) | The session types an Add On listing the user's sessions should leave out: LUNA's undo history packages and the packages that hold track presets, which the user never opens as sessions. |
| [INPUT\_ANALYSIS\_KINDS](variables/INPUT_ANALYSIS_KINDS.md) | The analysis kinds, in a stable order. |
| [INSERT\_ALIAS\_PREFIX](variables/INSERT_ALIAS_PREFIX.md) | The prefix of LUNA's synthetic alias plug-in ids. LUNA shows an extension slot inside an ordinary effect chain as a plug-in id `alias.<slot>`: a channel's console plug-in (LUNA Channel, a summing console) appears among its `effect_N` inserts as `alias.console`. |
| [LUNA\_CHANNEL\_PLUGIN\_ID](variables/LUNA_CHANNEL_PLUGIN_ID.md) | LUNA Channel's plug-in id. |
| [LUNA\_DEVICE\_UID](variables/LUNA_DEVICE_UID.md) | The uid of LUNA's own device under `/devices`, which holds its MIDI devices (fact 123). |
| [LUNA\_EXTENSION\_PLUGIN\_IDS](variables/LUNA_EXTENSION_PLUGIN_IDS.md) | The plug-in ids of LUNA's extensions: plug-ins LUNA hosts as part of itself (the summing consoles, tape, the sampler, the hardware insert, LUNA Channel), whose window is LUNA's own. This list mirrors LUNA's and must track it: an extension added in a later LUNA is not in it until the SDK is updated. |
| [MAX\_CUE\_BUSES](variables/MAX_CUE_BUSES.md) | LUNA's cue buses: `cue_0` .. `cue_63`. |
| [MAX\_SECRET\_BYTES](variables/MAX_SECRET_BYTES.md) | Largest secret value, in UTF-8 bytes (Windows Credential Manager's limit, applied everywhere). |
| [MAX\_SECRET\_NAME\_LENGTH](variables/MAX_SECRET_NAME_LENGTH.md) | Longest secret name, in characters. |
| [MAX\_SYSEX\_BYTES](variables/MAX_SYSEX_BYTES.md) | The largest SysEx LUNA sends (fact 140): its MIDI output's limit. |
| [NEG\_INFINITY\_DB](variables/NEG_INFINITY_DB.md) | LUNA's "-infinity" gain in dB: at or below it, [dbToGain](functions/dbToGain.md) answers exactly 0 (fact 228). |
| [ONE\_TWENTY\_EIGHTH\_NOTE](variables/ONE_TWENTY_EIGHTH_NOTE.md) | - |
| [OVERVIEW\_PAIR\_NS](variables/OVERVIEW_PAIR_NS.md) | Nanoseconds per fine overview pair: 125 samples at 48 kHz (fact 72). |
| [PLUGIN\_ERROR\_MISSING](variables/PLUGIN_ERROR_MISSING.md) | The engine reports a missing plugin with this error string. |
| [POST\_RECORD\_COMMANDS](variables/POST_RECORD_COMMANDS.md) | The commands LUNA can run on a take once it is recorded (fact 233). |
| [PROGRESS\_SUPPRESSION\_MAX\_MS](variables/PROGRESS_SUPPRESSION_MAX_MS.md) | How long a suppression lasts at most unless [SuppressProgressOptions.maxMs](interfaces/SuppressProgressOptions.md#maxms) says otherwise. |
| [QUARTER\_NOTE](variables/QUARTER_NOTE.md) | - |
| [RECORD\_LOOP\_MARGIN\_TICKS](variables/RECORD_LOOP_MARGIN_TICKS.md) | How far past the punch point [Session.record](classes/Session.md#record) widens `loop_stop` when it has to. One bar of 4/4 at any tempo is plenty: the gate is on the punch point, not the take's end. |
| [SEND\_COUNT](variables/SEND_COUNT.md) | Eight sends per channel, `send_0`..`send_7`. |
| [SESSION\_TYPES](variables/SESSION_TYPES.md) | Session package types, in LUNA's order: a package's `session_type` is this index in a `/workspace/query` row (a template is 3, fact 151) and this string on a session or package node. `multi` is no longer made, `history` and `track_preset` are LUNA's own packages (see [HIDDEN\_SESSION\_TYPES](variables/HIDDEN_SESSION_TYPES.md)). |
| [SIXTEENTH\_NOTE](variables/SIXTEENTH_NOTE.md) | - |
| [SIXTY\_FOURTH\_NOTE](variables/SIXTY_FOURTH_NOTE.md) | - |
| [SourceOrigin](variables/SourceOrigin.md) | Where a source file came from: LUNA's `origin` numbers (fact 239). Only the renderings are kept outside the package's `audio/` folder. |
| [STEM\_FORMATS](variables/STEM_FORMATS.md) | The stem formats LUNA's enum publishes, in its spelling. A channel in a LUNA session is `mono` or `stereo`; the rest are its multichannel formats (`2_1`, `lcr`, ..., `9_1_6`). |
| [THIRTY\_SECOND\_NOTE](variables/THIRTY_SECOND_NOTE.md) | - |
| [TICKS\_PER\_BEAT](variables/TICKS_PER_BEAT.md) | - |
| [TICKS\_PER\_DISPLAY\_TICK](variables/TICKS_PER_DISPLAY_TICK.md) | - |
| [TRACK\_PRESET\_CATEGORIES](variables/TRACK_PRESET_CATEGORIES.md) | The categories LUNA's track preset browser offers. They are ordinary preset tags, which LUNA writes when a track preset is saved (fact 132). No category means all of them. |
| [TRACK\_TYPES](variables/TRACK_TYPES.md) | Every [TrackType](type-aliases/TrackType.md) LUNA defines. `click` and `count_in` are LUNA's system tracks, and `bus` a track that stands for a bus; `audio`, `instrument`, `midi_matrix` and `video` are what `session.newTrack()` makes. |
| [VERSION](variables/VERSION.md) | SDK version, compiled in from package.json: major.minor.patch in source, and with the Bamboo build number as a fourth part in a shipped SDK, e.g. 0.1.0.1234 (0 for a local build). |
| [WARP\_TRANSIENT\_ZONE\_NS](variables/WARP_TRANSIENT_ZONE_NS.md) | LUNA's warp transient zone (feature key `warp_transient_zone_size`, 30 ms by default): a new marker whose source point is this close to an existing one's reuses it (fact 230). |
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
| [clipGainAt](functions/clipGainAt.md) | The gain in dB at `tick` (clip-relative ticks) from a clip gain lane, the way LUNA's clip compiler evaluates it (fact 228): linear in dB between breakpoints, so 0 dB and -6 dB read -3 dB half way; the first and last values hold outside the end points, with no slope carried past them; two breakpoints at one tick are a step, the later one winning from that tick on. `undefined` for an empty lane: LUNA then plays the clip's static `gain`. |
| [clipTypeFrom](functions/clipTypeFrom.md) | The engine sends clip_type as 0/1/2 or as a string; normalise to the string form. |
| [compiledClipAudio](functions/compiledClipAudio.md) | Which audio one compiled segment plays, over the segment only, or `undefined` when there is nothing safe to draw (see [clipAudio](functions/clipAudio.md)). `clip` is the raw clip the segment is cut from (`playlist.clips.byId(segment.clipUid.value)`): it names the source. Map ticks with [audioNsAtTick](functions/audioNsAtTick.md) anchored at the segment, which also reaches into a crossfade's `fullStart`..`fullStop`. |
| [connect](functions/connect.md) | - |
| [dbToGain](functions/dbToGain.md) | Decibels as a linear gain: `10 ** (db / 20)`, with LUNA's hard zero at or below [NEG\_INFINITY\_DB](variables/NEG_INFINITY_DB.md) (fact 228). `-Infinity` is 0. |
| [decodeMessage](functions/decodeMessage.md) | Decode one frame. Tolerates an 8-byte `JSON` header (magic + length) and a trailing NUL, and returns `undefined` for anything unparseable so the receive loop survives a bad frame. |
| [decodeMidiData](functions/decodeMidiData.md) | Unpack the three MIDI bytes the engine packs into one number (fact 39). |
| [decodeMidiEvents](functions/decodeMidiEvents.md) | Turn one batch into messages, skipping anything that is not a channel message, or a SysEx when `sysex` is true. A SysEx is `[time_ms, 0xf0, [0xf0, ..., 0xf7]]` (fact 138). Exported for tests. |
| [derived](functions/derived.md) | A read-only [Prop](interfaces/Prop.md) computed from other props. Recomputes lazily on read and notifies when any source notifies. With `distinct: true` it notifies only when the computed value actually moved ([shallowEquals](functions/shallowEquals.md)) — for a value carved out of a chatty source, such as the tempo on `location` pushes. |
| [dotted](functions/dotted.md) | The dotted length of a note: one and a half times it. Takes and gives engine ticks, so it composes with the note constants for a grid or a quantize value. |
| [encodeMidiData](functions/encodeMidiData.md) | Pack three MIDI bytes the way the engine's table stores them (fact 39). |
| [encodePayload](functions/encodePayload.md) | Encode a payload the way the engine parses it: JSON for everything. Strings are quoted so the engine can tell `"1234"` from `1234` (the ambiguity the deprecated String dialect suffers from). [FloatLiteral](classes/FloatLiteral.md)s are written as float literals. |
| [encodeRequest](functions/encodeRequest.md) | Build one request line. |
| [eventMatches](functions/eventMatches.md) | True when an event at `eventPath` belongs to a subscription on `subPath`. Prefix matching: the engine only pushes what was subscribed, so a wider subscription on the same connection is the only way a handler sees something deeper than it asked for. |
| [expandMulti](functions/expandMulti.md) | Expand a message into the individual updates it carries. A non-multi message expands to itself. Entries that cannot be decoded are dropped. |
| [fileUrl](functions/fileUrl.md) | `file://` URL of an absolute POSIX or Windows path, percent-encoded per segment. |
| [float](functions/float.md) | Wrap `value` so it is sent as a float literal. See [FloatLiteral](classes/FloatLiteral.md). |
| [folderTree](functions/folderTree.md) | Build the folder tree of a session's tracks and buses, or of a list of channels. |
| [formatBarBeat](functions/formatBarBeat.md) | Format a [BarBeat](interfaces/BarBeat.md) as LUNA's counter shows it, `1|1|000`: it converts the engine-tick remainder to display ticks (960 per beat) and zero-pads them. Pass `location.bar_beat` or `timeline.barBeat(tick)` as they are; do not convert `tick` first. For a bare tick, `timeline.formatBarBeat(tick)` does both steps. |
| [formatMinSec](functions/formatMinSec.md) | Format seconds as a zero-padded `MM:SS` clock, flooring rather than rounding so a counting display never shows a time the playhead has not reached. Negative values clamp to `00:00`; `undefined` (an unloaded prop) gives a placeholder, like [formatBarBeat](functions/formatBarBeat.md). |
| [formatRollDuration](functions/formatRollDuration.md) | Write a roll length in LUNA's form for `transport.preRoll.set()` or `postRoll.set()`. Omitted parts are 0. Rejects with `out_of_range` for a negative or non-integer part. |
| [formatTimeSignature](functions/formatTimeSignature.md) | Format a time signature as `4/4`; `undefined` (an unloaded prop) gives a placeholder, like [formatBarBeat](functions/formatBarBeat.md). Pairs with `transport.timeSignature`. |
| [gainToDb](functions/gainToDb.md) | A linear gain as decibels: `20 * log10(gain)`. Silence (0, or anything not above it) is `-Infinity`. |
| [getOptionsToParams](functions/getOptionsToParams.md) | Convert [GetOptions](interfaces/GetOptions.md) to wire query parameters. |
| [hasNativeBridge](functions/hasNativeBridge.md) | True when LUNA's native webview bridge is present. |
| [insertSlotForAlias](functions/insertSlotForAlias.md) | The slot an alias plug-in id stands for, so a chain's `alias.console` entry can be shown as the channel's console slot: `alias.console` gives `'console'`. Any other id, an alias included whose slot LUNA does not know, gives `undefined`. |
| [isAddOnCategory](functions/isAddOnCategory.md) | True when `name` is one of [ADD\_ON\_CATEGORIES](variables/ADD_ON_CATEGORIES.md), written exactly (case included). |
| [isEmbeddedInLuna](functions/isEmbeddedInLuna.md) | True when the page was opened by LUNA (a `?port=` is on the URL). |
| [isHiddenSessionType](functions/isHiddenSessionType.md) | Whether a `session_type` (string or index) is one of [HIDDEN\_SESSION\_TYPES](variables/HIDDEN_SESSION_TYPES.md). |
| [isInsertAliasPluginId](functions/isInsertAliasPluginId.md) | Whether a plug-in id is one of LUNA's synthetic `alias.<slot>` ids rather than a real plug-in. Today LUNA makes only `alias.console`, but it reads any `alias.<slot>` whose slot it knows, and so does this. |
| [isLunaEnginePort](functions/isLunaEnginePort.md) | True when the page is talking to LUNA's own engine on its default port. |
| [isLunaExtensionPluginId](functions/isLunaExtensionPluginId.md) | Whether a plug-in id is one of [LUNA\_EXTENSION\_PLUGIN\_IDS](variables/LUNA_EXTENSION_PLUGIN_IDS.md). The test is by exact id, so the list must track LUNA's. |
| [isRecordFxSlot](functions/isRecordFxSlot.md) | Whether a slot is one of the record FX slots (`record_fx_0`, `record_fx_1`, ...): the inserts LUNA prints into a recording, as opposed to the `effect_N` playback inserts. |
| [isTerminalJobStatus](functions/isTerminalJobStatus.md) | Status values after which nothing more happens to a job. |
| [joinPath](functions/joinPath.md) | Join path segments with single slashes. |
| [kindForScale](functions/kindForScale.md) | The analysis to draw at a zoom level: `coarse` once a pixel spans at least one coarse pair (31.25 ms), `fine` when zoomed closer. Below one fine pair per pixel the same pair repeats; neither analysis is PCM. |
| [listOf](functions/listOf.md) | A [List](interfaces/List.md) over a [Prop](interfaces/Prop.md) of arrays. |
| [locationOptions](functions/locationOptions.md) | `host` and `port` from the page URL, if present. |
| [midiByte](functions/midiByte.md) | A 7-bit MIDI value, or `out_of_range`. `min` is 1 for a velocity that must sound. |
| [normalizeChordName](functions/normalizeChordName.md) | LUNA stores `♭` and `♯` as ASCII `b` and `#` (fact 100); the SDK compares names the same way. |
| [normalizePackageUid](functions/normalizePackageUid.md) | A package uid in the form LUNA keeps it: dashes stripped (as `open_session` does), lower case. |
| [onPathDrop](functions/onPathDrop.md) | Receive files dropped on the page as **absolute paths** (LUNA only). Resolves nothing and reads nothing: pass the paths to `session.importPath()`, which has the engine read them from disk. Returns an unsubscribe; once the last handler is gone, LUNA hands file drags back to the page's HTML `drop` events. |
| [pairNotes](functions/pairNotes.md) | Pair note-on rows with the next note-off of the same channel and pitch, in tick order. Pure, and exported because a page that draws its own lanes often wants it directly. |
| [pairNs](functions/pairNs.md) | Nanoseconds one pair of this analysis covers. |
| [pairRange](functions/pairRange.md) | The overview pairs covering `[startNs, stopNs)` of a source. Both are file offsets, never timeline ticks. |
| [parseBusType](functions/parseBusType.md) | A `bus_type` value as a [BusType](type-aliases/BusType.md): one of [BUS\_TYPES](variables/BUS_TYPES.md), or a cue bus `cue_N` with N below [MAX\_CUE\_BUSES](variables/MAX_CUE_BUSES.md). Anything else is `undefined`. |
| [parseChord](functions/parseChord.md) | Split a chord name into root, type and bass. `undefined` when it does not start with a note letter, since the ruler accepts any text (`N.C.`, `riff`). A lowercase root or bass is read as the note (`am7` is A minor 7, `bb` is B flat) and returned upper-cased, but only when what follows the root is empty or starts like a chord quality, so `bridge` and `chorus` stay text. Spaces around the slash are ignored. |
| [parseControlType](functions/parseControlType.md) | A `control_type` value as one of [CONTROL\_TYPES](variables/CONTROL_TYPES.md), or `undefined`. |
| [parseFolderMode](functions/parseFolderMode.md) | A `folder_mode` value as a [FolderMode](type-aliases/FolderMode.md), or `undefined`. A mode that has not arrived yet is `undefined` too, which is not a folder: test for one with `Bus.isFolder`, not with `mode !== 'none'`. |
| [parseRollDuration](functions/parseRollDuration.md) | Read a roll string, `"bars,beats,ticks"`, as LUNA stores `pre_roll` and `post_roll` (fact 156). `undefined` for anything else, which is what a session that never set its roll holds; LUNA then uses no roll. |
| [parseSessionType](functions/parseSessionType.md) | A `session_type` value as a [SessionType](type-aliases/SessionType.md): the string, or its index in [SESSION\_TYPES](variables/SESSION_TYPES.md) as a workspace query row carries it. Anything else is `undefined`. |
| [parseStemFormat](functions/parseStemFormat.md) | A `stem_format` value as one of [STEM\_FORMATS](variables/STEM_FORMATS.md), or `undefined`. |
| [parseTrackType](functions/parseTrackType.md) | A `track_type` value as a [TrackType](type-aliases/TrackType.md), or `undefined` when LUNA would not publish it. |
| [pluginFormat](functions/pluginFormat.md) | A plug-in's format guessed from its id, with the patterns LUNA itself uses: `.vst.`, `.vst3.` or `.au.` anywhere in the id, a `cloud:` or `localml:` prefix, a `UAD ` prefix for UAD-2, and `uadx` for anything else. It is a heuristic: an id that matches none of them is reported as `uadx`, as LUNA does, and LUNA may treat a `cloud:` effect as unavailable when cloud clip effects are off. Prefer the format LUNA reports for an installed plug-in (`Plugin.sdkType`) where you have it. |
| [pluginVersionMeets](functions/pluginVersionMeets.md) | Whether plugin version `installed` meets `minVersion`, as LUNA compares them (fact 148): every dot-separated part as a number, missing parts as 0, so `'0.4.10'` meets `'0.4.3'` and `'0.4.3.1'` meets `'0.4.3'`. An empty `minVersion` is met by anything; an empty or malformed `installed` meets only that. |
| [propertyValue](functions/propertyValue.md) | Unwrap a property reply. A `get` on a property answers `{ value: X }` unless `flatvalue` was requested, in which case it answers `X` directly. |
| [requireTick](functions/requireTick.md) | Reject a non-integer tick before it reaches the wire: LUNA stores whatever it is given (fact 12). |
| [secondsToTicks](functions/secondsToTicks.md) | Seconds to ticks at a constant tempo. |
| [selectedNotes](functions/selectedNotes.md) | Decode LUNA's `selection_notes` (an array, or `null`, or garbage) into frozen rows. |
| [settle](functions/settle.md) | Poll `done` until it holds, or reject with `no_effect`. Socket replies and event frames land between the yields; with `refresh`, the node is re-read after a short grace and then periodically, covering both a batch transaction and an event lost on the wire. |
| [shallowEquals](functions/shallowEquals.md) | Equality used by cells: `===` for primitives, JSON shape for plain objects and arrays. |
| [sourceDisplayName](functions/sourceDisplayName.md) | `name` unless it is blank or the file's own uid (fact 238), else `undefined`. |
| [sourceFilePath](functions/sourceFilePath.md) | The path of a source file inside its session package (fact 239). |
| [splitPath](functions/splitPath.md) | Split `<node>/<prop>` into its node path and property name. |
| [startSourceDrag](functions/startSourceDrag.md) | Fill a `dragstart` event with session files so LUNA's timeline can take the drop (fact 241). Synchronous, as `dragstart` must be: a source's path comes from the session's package path, so call `session.ready()` first. Answers the paths dragged. |
| [stripValueSuffix](functions/stripValueSuffix.md) | Property updates arrive on `<node>/<prop>/value`; the model addresses `<node>/<prop>`. |
| [suggestAddOnCategories](functions/suggestAddOnCategories.md) | Categories that suit an Add On, best first, guessed from what it says about itself (its name, description, a prompt that asked for it). At most `max` (default 3); when nothing in the text points anywhere, `['Utility']`. A guess to confirm with the author, never to write into a manifest unasked. |
| [ticksToBeats](functions/ticksToBeats.md) | Ticks to beats (floating). |
| [ticksToSeconds](functions/ticksToSeconds.md) | Ticks to seconds at a constant tempo. |
| [toEvent](functions/toEvent.md) | Turn a decoded wire message into the normalised event the Store consumes. |
| [traceWaveform](functions/traceWaveform.md) | Add one channel's waveform to a path as LUNA fills it: for every run of drawable columns, one closed shape through the column centres, the top outline (`mid - axis - max * half`) left to right and the bottom outline (`mid + axis - min * half`) back, squared off at the run's outer edges. `NaN` columns break the shape. It only adds subpaths; call `beginPath()` before and `fill()` after, so several channels or clips fill in one go. |
| [triplet](functions/triplet.md) | The triplet length of a note: two thirds of it, so three fill the time of two. Takes and gives engine ticks (whole numbers for every note constant here, 128th included). |
| [waveformColumns](functions/waveformColumns.md) | Reduce a [WaveformRange](interfaces/WaveformRange.md) to one min/max per drawn column, per channel, the way LUNA's own timeline does: |
| [waveformLanes](functions/waveformLanes.md) | Split `height` pixels from `top` into one equal lane per channel, stacked in file order (left above right for stereo), each with a zero line and a full-scale half-height. `gap` pixels are kept clear at the top and bottom of every lane; LUNA keeps none. |
| [waveformPeak](functions/waveformPeak.md) | The loudest absolute value in a range, across every channel, in 0..1; 0 when the range is empty. To normalize a clip, pass `gain: 1 / peak` to [waveformColumns](functions/waveformColumns.md), taking the peak from the clip's whole range, not the visible columns, so the scale holds while scrolling. |
| [writable](functions/writable.md) | Wrap a [Prop](interfaces/Prop.md) with a setter to make a [WritableProp](interfaces/WritableProp.md). |
| [yieldTask](functions/yieldTask.md) | One macrotask later, through a `MessageChannel` where there is one. A background browser tab throttles timers to about one tick per second but never throttles messages, so a timer-only loop lands on its own timeout in a hidden page even though LUNA finished in milliseconds. |
