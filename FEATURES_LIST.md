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

## Props and collections

- Every value is a `Prop`: read `.value`, follow `.onChange`, write `.set()` with rollback when
  LUNA refuses.
- Every list is a `Collection` with `items`, `byId`, `onChange` and `load`.
- Derived props (`Luna.derived`) computed from other props.
- `Luna.settle` waits for an edit to show in the model; `luna.settled()` waits for change
  notifications.
- Removed objects are disposed, with `onDispose` and a `Luna.Disposed` error for their commands.

## Sessions

- List, open and create sessions, and follow the focused one.
- Read the session's name, undo state and change count; undo, redo and save.
- Group many edits into one undo step with `session.transaction()`, or a live gesture with
  `{ continuous: true }`.
- List recent sessions in the workspace.

## Transport

- Play, stop, record, seek, return to zero and set the play start.
- Set the loop range and turn looping on and off.
- Follow the playhead in ticks and seconds, with the tempo and time signature at the playhead.
- Draw a smooth playback clock (`Luna.bindClock`) and format time as bar|beat, min:sec or a
  time signature.

## Tracks, buses and mixing

- List tracks in order, the master bus and aux buses; find the track the user is working on.
- Create and delete tracks and buses.
- Read and set track name, type, colour and record enable.
- Gain, pan, mute and solo as controls with real, normalized and display values, and reset to
  default.
- Stereo pans (left and right) as well as mono pan.
- Meters that subscribe only while something watches them.
- Sends: assign, unassign, retarget and move, and read where each send goes.
- Bind sliders, knobs and drag gestures to controls so each user edit is one undo step and one
  automation pass (`Luna.bindRange`, `Luna.bindDrag`, `Luna.bindGesture`).
- Keep listeners and bindings for rebuilt UI together with `Luna.Bindings`, and rebuild only
  when no drag is in progress.

## Automation

- Insert, move, revalue and clear automation breakpoints on any control.
- Set a track's automation mode.

## Clips and sources

- List a lane's clips with their positions in ticks and source offsets in nanoseconds.
- Insert, trim, move, split, slip, mute, duplicate, heal and delete clips, each one undo step.
- Compiled clips: what each lane actually plays once overlapping clips are resolved.
- Fades and crossfades on audio clips, with fade shapes and curves.
- Take lanes: make new playlists and switch the active one.
- Select a range across tracks, then duplicate, nudge, move or copy what is selected.

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

## Live MIDI

- Play MIDI on a track without writing to a clip (`Luna.SendMidi`): notes, controllers,
  program changes and all notes off.
- Play the computer keyboard as a MIDI keyboard (`Luna.QwertyMidi`), with octave and velocity
  keys.
- List LUNA's MIDI devices and their ports, and follow hot-plugging (`luna.midiDevices`).
- Send MIDI out of a device's MIDI out to hardware.
- Receive live MIDI from hardware (`Luna.MidiInput`): every message, or only notes or
  controllers, from one device or all of them.

## Recording

- List audio device inputs.
- Record a whole pass on a track in one call and get the finished take back.

## Effects and plugins

- List installed plugins, find them by name or category, and query LUNA for search text,
  categories, favorites and what a given slot accepts.
- Insert a plugin, clear a slot and bypass it.
- Read and write a plugin's parameters as controls.
- Open and close a plugin's window in LUNA, and follow whether it is open.

## Presets

- Search a plugin's presets by name and tags, and read its tag groups.
- Ask UA Assistant to recommend presets for a description.
- A live preset selection for a search box, tag chips and recommendations together.
- Load a preset onto a slot, or add a plugin already on a preset.
- Track presets: browse by category, tags and search, including installed instruments' presets.
- Make a new track from a track preset, replace a track's preset, and see which preset a track
  has.

## Markers, tempo, key and chords

- Add, rename, move and delete markers, with bar|beat and seconds that follow the tempo map.
- Set tempo, time signature and key signature, and read the key in effect at any tick.
- Read and write LUNA's Chord ruler, and parse chord symbols (`Luna.parseChord`).
- Convert between ticks, bars and beats, and seconds through the tempo map.

## Files

- Get a user's file into the page with a file picker or an HTML drop, and upload it to the
  session.
- Open LUNA's file and folder dialogs, and receive files dropped from the desktop as paths.
- Import a file by its path, as a source or with a clip, without it passing through the page.
- List the files in folders the user picked or dropped, one level or everything below
  (`luna.gui.listFiles`, `luna.gui.listAllFiles`).
- Blessed folders the user lets every Add On read: follow them (`luna.gui.blessedFolders`), ask
  for one (`luna.gui.addBlessedFolder`, LUNA asks the user) or remove one.
- Play or read a local file by its path (`luna.gui.serveMediaFile`): any file in a blessed
  folder, elsewhere audio, video or MIDI.

## Bounce and export

- Bounce channels over a range, or run LUNA's main-bus export.
- Follow a render's progress, wait for it, and abort or delete it.

## Storage and secrets

- Keep an Add On's data with the session in session storage (`session.storage`), with
  undoable or non-undoable edits.
- Keep API keys and tokens in the OS keychain, scoped to the Add On (`luna.secrets`).
- Read LUNA's own preferences.

## LUNA's UI and Add Ons

- Switch LUNA's page, open a URL and reveal a path in Finder or Explorer.
- Show a task with progress in LUNA.
- List installed Add Ons with their version and where each was installed from.
- Install Add Ons from LUNA's marketplace, a GitHub repo or a share link, and ask the user to
  uninstall one.

## Add On types and manifest

- Window, editor (docked under the Timeline), browser and app Add Ons.
- Floating windows and windows that open with the session.
- A manifest with name, description, size and the minimum LUNA version the Add On needs.
- Windows of a fixed size (`fixed_size`), and pages that keep running while hidden
  (`run_hidden`).

## Escape hatch

- Get, set, post and subscribe to any engine path with `luna.raw`.
- Read any untyped property or call any command on a node.

## Errors

- Every error is a `Luna.Error` with a `code`, including LUNA's own error strings.

## Testing

- `Luna.MockEngine`, an in-memory LUNA for fast unit tests, with the requests, touches and
  transactions it saw.
- Inject failures and engine-side changes, and wait deterministically for pushes and
  notifications.
- Run a served page headless and check what it renders, on LUNA or the mock, with screenshots
  (`ua-builder probe`).

## `ua-builder` CLI

- `new`: scaffold an Add On, in JavaScript or TypeScript (`--template add-on-typescript`).
- `serve`: serve an Add On for a browser, moving to a free port when needed.
- `test`: run an Add On's tests.
- `install`: link an Add On into LUNA's Add Ons folder.
- `pack`: build a `.lunaaddon` file to share, leaving out sources and build files.
- `probe`: check a served page in headless Chrome.
- `doctor`: check the setup and print the SDK version.
- `tree`: print or snapshot the shape of LUNA's nodes.

## Agent plugin and docs

- A `ua-luna-builder` plugin for Claude Code and Codex with skills to create an Add On, add a
  feature, test, verify against LUNA, debug a connection and edit clips.
- Typed API reference, a quickstart, and guides for files, clips, the manifest, the protocol
  and recipes.
- Example pages for an arrangement view, clip editor, mixer, inserts, presets, track presets,
  sends, automation, ruler, bounce and export, files, folder browsing, import, MIDI input,
  piano roll and secrets.
