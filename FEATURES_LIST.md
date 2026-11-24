# Features

What `@uaudio/luna-builder-sdk` and the `ua-luna-builder` plugin it carries can do, by area.
`RELEASE_NOTES.md` says when each arrived; `docs/QUICKSTART.md` shows how to use them.

## Connecting

- Connect to LUNA from inside LUNA or from a browser on the same machine with `Luna.connect()`.
- Reconnect automatically, with a `luna.status` prop to show the connection state.
- Run a page on an in-memory engine with no LUNA (`{ engine: 'mock' }` or `?engine=mock`).
- Tell whether a page runs inside LUNA (`Luna.isEmbeddedInLuna()`) and whether LUNA's UI is
  there (`luna.gui.available()`).
- Make LUNA's undo, redo, play and record shortcuts work outside LUNA with `Luna.bindShortcuts`.
- Opt in to LUNA's edit keys (Cmd+A, Cmd+X/C/V, Backspace or Delete, Cmd+D) with
  `Luna.EDIT_SHORTCUTS`,
  pointing the selection at what the page shows first.

## Props and collections

- Every value is a `Prop`: read `.value`, follow `.onChange`, write `.set()` with rollback when
  LUNA refuses.
- Every list is a `Collection` with `items`, `byId`, `onChange` and `load`, and
  `onAnyChange` to follow members and chosen props of every member with one listener.
- Derived props (`Luna.derived`) computed from other props.
- `Luna.settle` waits for an edit to show in the model; `luna.settled()` waits for change
  notifications.
- Removed objects are disposed, with `onDispose` and a `Luna.Disposed` error for their commands.

## Sessions

- List, open and create sessions, and follow the focused one.
- Read the session's name, undo state and change count; undo, redo and save.
- Group many edits into one undo step with `session.transaction()`, or a live gesture with
  `{ continuous: true }`.
- List recent sessions in the workspace, also as a live list that marks the open ones
  (`luna.workspace.recentList`).
- Wait for a session to open (`luna.session({ wait: true })`), with a timeout instead of a hang.
- Find an open session by its package uid, and open a package or switch to it if it is already
  open (`luna.sessions.byPackageUid`, `openOrFocus`).
- The open session's own package (`session.package()`).
- Create a session from a session template, and list the templates on disk, by tag too.
- Tag a session package.
- Read and edit a session's lyrics: lines typed on the lyric ruler and lines transcribed from a
  recording, with their words.
- Session settings as props: pre- and post-roll, the click during play, record and count-in,
  varispeed and MIDI merge.
- Import a MIDI or video file into the session by path.
- Groups: list, create, reorder and delete mix, edit, plugin and send groups, change their
  members, and ask which tracks an edit to one affects.
- Follow whether LUNA would take a command now (`node.commandEnabled()`), as its menus grey out.

## Transport

- Play, stop, record, seek, return to zero and set the play start.
- Set the loop range and turn looping on and off.
- Follow the playhead in ticks and seconds, with the tempo and time signature at the playhead.
- Draw a smooth playback clock (`Luna.bindClock`) and format time as bar|beat, min:sec or a
  time signature.
- Write varispeed (`transport.tempoPercent`) and the solo mode.

## Tracks, buses and mixing

- List tracks in order, the master bus and aux buses; find the track the user is working on.
- List tracks and buses together in LUNA's order, and reorder them.
- Create and delete tracks and buses; creating one hands back the new track or bus.
- Folder tracks: create summing or container folders, create tracks inside a folder, move
  tracks and folders between folders, change a folder's mode, and read the hierarchy.
- Read and set track name, type, colour and record enable.
- Gain, pan, mute and solo as controls with real, normalized and display values, and reset to
  default.
- Stereo pans (left and right) as well as mono pan.
- Fader tapers (`Luna.Taper`, `control.taper`): LUNA's dB ↔ fader-position tables and hash-mark
  dB values, following LUNA when a summing console changes a fader's taper.
- Meters that subscribe only while something watches them.
- Sends: assign, unassign, retarget and move, and read where each send goes.
- Bind sliders, knobs and drag gestures to controls so each user edit is one undo step and one
  automation pass (`Luna.bindRange`, `Luna.bindDrag`, `Luna.bindGesture`).
- Keep listeners and bindings for rebuilt UI together with `Luna.Bindings`, and rebuild only
  when no drag is in progress.
- Rename a track as LUNA's own rename does, and duplicate one to get the new track.
- Delete a bus, or a folder with everything in it, and apply a track preset to a bus.
- Make tracks from device inputs.
- Route a track's MIDI to another track, a bus, an effect slot or a MIDI device.
- Read the folder hierarchy as rows (`Luna.folderTree()`), with collapsed rows, descendants and
  the folder a channel sums into.
- Convert between linear gain and dB, and value lists and parsers for LUNA's track, bus, folder,
  stem, session and control types.

## Automation

- Insert, move, revalue and clear automation breakpoints on any control.
- Set a track's automation mode.
- Write or trim a control's automation over a range, keeping the curve either side.
- Clip gain and its automation, evaluated as LUNA does.
- Set a bus's automation mode.

## Clips and sources

- List a lane's clips with their positions in ticks and source offsets in nanoseconds.
- Insert, trim, move, split, slip, mute, duplicate, heal and delete clips, each one undo step;
  inserting hands back the new clip, and can set its layer, what its length follows on a tempo
  change, its time-stretch algorithm, or copy another clip.
- Compiled clips: what each lane actually plays once overlapping clips are resolved.
- Fades and crossfades on audio clips, with fade shapes and curves.
- Take lanes: make new playlists and switch the active one.
- Select a range across tracks, then duplicate, nudge, move or copy what is selected.
- Point LUNA's selection at a range of tracks on the timeline (`session.selectTimeline`) and
  select all of it, cut, copy, paste, clear or duplicate it as LUNA's own keys do.
- Warp markers: list, set and delete a clip's markers, and remove its time stretch.
- Move clips to another track.
- Delete playlist versions, or a track's unused ones.

## Waveforms

- Read a source's waveform overview, paged and cached (`Luna.Waveforms`).
- Find which audio a clip or compiled clip plays, including LUNA's renderings of stretched or
  processed clips.
- Draw waveforms as LUNA does: one min/max per pixel per channel, a lane per channel, LUNA's
  outline, waveform zoom and clip gain, and the peak to normalize to.

## MIDI clips

- Read a MIDI clip's notes and events as live lists.
- Add one note or many in one undo step, and add raw MIDI.
- Set velocities, mute notes and delete notes, each one undo step, with LUNA's selection put
  back.
- Create notes on a lane, making the clip when none is under them.
- Read a clip's SysEx rows with their whole message (`MidiRow.sysex`).
- Move SysEx and controller rows by row id, one undo step (`midi.moveEvents`).
- Run LUNA's MIDI operations on what is selected: velocity, duration, legato, staccato,
  reverse, transpose and invert (`session.context.midiOperation()`).

## Live MIDI

- Play MIDI on a track without writing to a clip (`Luna.SendMidi`): notes, controllers,
  program changes and all notes off.
- Play the computer keyboard as a MIDI keyboard (`Luna.QwertyMidi`), with octave and velocity
  keys.
- List LUNA's MIDI devices and their ports, and follow hot-plugging (`luna.midiDevices`).
- Send MIDI out of a device's MIDI out to hardware.
- Receive live MIDI from hardware (`Luna.MidiInput`): every message, or only notes or
  controllers, from one device or all of them.
- MIDI SysEx: receive whole SysEx messages from hardware (`MidiInput.onSysEx`) and send them
  out of a device's MIDI out (`SendMidi.sendSysExToOutput`).

## Recording

- List audio device inputs.
- Record a whole pass on a track in one call and get the finished take back.
- Follow the takes being recorded on every armed track (`session.recordTakes`): an audio take's
  growing waveform, a MIDI take's notes as they are played.
- Choose what LUNA runs on each take a track records (lyric and chord extraction), and read the
  instrument LUNA detected.
- Devices' inputs and outputs as live lists, with whether each input is in use.
- Hold an input's live analysis (level, tempo, instrument, stereo) and read its result.
- Auto Gain: start and stop it on tracks and follow its progress.
- Read the active audio engine.

## Effects and plugins

- List installed plugins, find them by name or category, and query LUNA for search text,
  categories, favorites and what a given slot accepts.
- Insert a plugin, clear a slot and bypass it.
- Read and write a plugin's parameters as controls.
- Open and close a plugin's window in LUNA, and follow whether it is open.
- Power an insert on or off, and move or copy one with its state to another slot.
- Read a plugin's format, and helpers for insert slots and LUNA's own extensions.

## Presets

- Search a plugin's presets by name and tags, and read its tag groups.
- Ask UA Assistant to recommend presets for a description.
- A live preset selection for a search box, tag chips and recommendations together.
- Load a preset onto a slot, or add a plugin already on a preset.
- Track presets: browse by category, tags and search, including installed instruments' presets.
- Make a new track from a track preset, replace a track's preset, and see which preset a track
  has.
- Mark presets favorites, read their descriptions, and list the plugins a track preset uses.

## Markers, tempo, key and chords

- Add, rename, move and delete markers, with bar|beat and seconds that follow the tempo map.
- Set tempo, time signature and key signature, and read the key in effect at any tick.
- Read and write LUNA's Chord ruler, and parse chord symbols (`Luna.parseChord`).
- Convert between ticks, bars and beats, and seconds through the tempo map; reads report a
  tempo map that has not loaded instead of assuming a tempo, and a change event follows tempo edits.

## Analysis

- Run LUNA's chord detection and lyric transcription on a clip, as awaitable jobs with progress
  and cancel.
- Read what LUNA analysed about a source: key, tempo, instrument, transients and chords, with
  counts that follow a growing analysis.

## Files

- Get a user's file into the page with a file picker or an HTML drop, and upload it to the
  session.
- Open LUNA's file and folder dialogs, and receive files dropped from the desktop as paths.
- Import a file by its path without it passing through the page.
- Add a file to the session as an audio source without inserting a clip
  (`session.uploadFile` for a `File`, `session.importPath` for a path), and place it later
  with `session.insertClip`; or run LUNA's own File > Import, which makes a clip
  (`session.importFile`).
- List the files in folders the user picked or dropped, one level or everything below
  (`luna.gui.listFiles`, `luna.gui.listAllFiles`).
- Blessed folders the user lets every Add On read: follow them (`luna.gui.blessedFolders`), ask
  for one (`luna.gui.addBlessedFolder`, LUNA asks the user) or remove one.
- A session's own files: load them in one call (`session.loadSources`), show a name LUNA did
  not leave as the uid (`displayName`), find each file on disk (`session.sourcePath`,
  `source.filePath`, `source.reveal`), tell renderings apart (`isRender`, `origin`), and see
  which tracks use each one (`session.sourceUsage`).
- Drag a session file from the page onto LUNA's timeline (`Luna.startSourceDrag`).
- List the unused files LUNA would remove and why the others are kept, then remove them
  (`luna.workspace.unusedMedia`, `deleteUnusedMedia`).
- Play or read a local file by its path (`luna.gui.serveMediaFile`): any file in a blessed
  folder, elsewhere audio, video or MIDI.

## Bounce and export

- Bounce channels over a range, or run LUNA's main-bus export.
- Follow a render's progress, wait for it, and abort or delete it.

## Storage and secrets

- Keep an Add On's data with the session in session storage (`session.storage`), with
  undoable or non-undoable edits.
- Keep API keys and tokens in the OS keychain, scoped to the Add On's install (`luna.secrets`).
- Read LUNA's own preferences.
- Keep small JSON values across sessions and launches in a preference context
  (`luna.preferences.context()`). Contexts are shared, not private to an Add On.

## LUNA's UI and Add Ons

- Switch LUNA's page, open a URL and reveal a path in Finder or Explorer.
- Show a task with progress in LUNA.
- List installed Add Ons with their version and where each was installed from.
- Install Add Ons from LUNA's showcase, a GitHub repo or a share link, and ask the user to
  uninstall one.
- Switch LUNA's window to a page and wait until it shows (`luna.gui.setPage()`).
- Hold back LUNA's progress dialog while a page draws its own.
- Read LUNA's error notices (`luna.errors`).

## Add On types and manifest

- Window, editor (docked under the Timeline), browser and app Add Ons.
- Add Ons the user can move between window, browser and editor (`targets`), read back as
  `Luna.AddOn.targets`, with `Luna.addOnTarget()` naming the host a page was loaded in.
- Floating windows and windows that open with the session.
- A manifest with name, description, size and the minimum LUNA version the Add On needs.
- Plugins an Add On needs (`requires_plugins`, with a minimum version, optional or not): LUNA
  will not open it without them and says what is missing; `Luna.AddOn.requiresPlugins` and
  `luna.plugins.unmetRequirements()` let a page check the same.
- Window size limits (`min_width`, `min_height`, `max_width`, `max_height`), and a page that
  reads and sets its own window's size (`luna.gui.thisInstance()`, `resize()`).
- `show_with_session` windows whose size and open state are saved with each session, and
  app Add Ons a session keeps and reopens with.
- Windows of a fixed size (`fixed_size`), pages that keep running while hidden
  (`run_hidden`), and pages unloaded when closed (`unload_on_close`).
- Showcase categories (`categories`), checked against `Luna.ADD_ON_CATEGORIES`, with
  `Luna.suggestAddOnCategories()` guessing them from a description.
- Servers an Add On may reach (`network`), allowed by the user and read back as
  `Luna.AddOn.network` and `Luna.AddOn.networkAllowed`; a page reaches nothing else.

## Escape hatch

- Get, set, post and subscribe to any engine path with `luna.raw`.
- Read any untyped property or call any command on a node.

## Errors

- Every error is a `Luna.Error` with a `code`, including LUNA's own error strings.
- `Luna.ErrorCodes` lists the codes to compare `error.code` against.

## Testing

- `Luna.MockEngine`, an in-memory LUNA for fast unit tests, with the requests, touches and
  transactions it saw.
- Inject failures and engine-side changes, and wait deterministically for pushes and
  notifications.
- Run a served page headless and check what it renders, on LUNA or the mock, with screenshots
  (`ua-builder probe`).
- Mock jobs, groups, lyrics, warps, devices' inputs and outputs, Auto Gain and preference files
  in `Luna.MockEngine`.

## `ua-builder` CLI

- `new`: scaffold an Add On, in JavaScript or TypeScript (`--template add-on-typescript`).
- `serve`: serve an Add On for a browser, moving to a free port when needed.
- `test`: run an Add On's tests.
- `install`: link an Add On into LUNA's Add Ons folder.
- `pack`: build a `.lunaaddon` file to share, leaving out sources and build files.
- `probe`: check a served page in headless Chrome.
- `doctor`: check the setup and print the SDK version.
- `tree`: print or snapshot the shape of LUNA's nodes.
- `feedback`: open a prefilled improvement, bug, feature request or feedback issue for UA.

## Agent plugin and docs

- A `ua-luna-builder` plugin for Claude Code and Codex with skills to create an Add On, add a
  feature, test, verify against LUNA, debug a connection and edit clips.
- Coding agents offer to send the SDK improvements they note to UA as issues.
- Typed API reference, a quickstart, and guides for files, clips, the manifest, the protocol
  and recipes.
- Example pages for an arrangement view, clip editor, mixer, inserts, presets, track presets,
  sends, automation, ruler, bounce and export, files, folder browsing, import, MIDI input,
  piano roll, SysEx and secrets.
