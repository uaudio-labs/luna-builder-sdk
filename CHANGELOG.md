# Changelog

Versions of `@uaudio/luna-builder-sdk` and the `ua-luna-builder` plugin it carries.

## Unreleased

Changed (breaking)
- `luna.gui.removeImportedAddOn(id)` is now `luna.gui.removeAddOn(id)`, and posts LUNA's
  renamed `/gui` `remove_add_on` command. It takes the same argument and behaves the same;
  rename your calls.

Added
- Manifest `unload_on_close` (boolean, default `false`) for `"window"`, `"browser"` and
  `"editor"` Add Ons: with `true` closing the Add On unloads its page, releasing a microphone,
  audio or timers it held, and opening it again loads the page fresh. Closing is the window's
  close button or menu toggle, a `show_with_session` window's session closing, and the
  secondary browser or editor panel closing or moving on; Hide Floating Windows and
  minimizing only hide the page. `ua-builder` rejects a non-boolean, and
  `Luna.AddOn.unloadOnClose` reads it. Needs a LUNA that reads the field; an older one ignores
  it and keeps the page loaded.
- MIDI SysEx, on LUNA builds that have it. `Luna.MidiInput` delivers whole SysEx messages from
  hardware: `input.onSysEx(device, (bytes) => ...)`, or `sysex: true` in `listen`'s options
  for `type: 'sysex'` messages in order with the rest. Handlers that do not ask never see one
  (fact 138). A clip's `MidiRow` has `sysex`, the message of a SysEx row (fact 139).
  `SendMidi.sendSysExToOutput(device, bytes)` sends one out of a MIDI output port, and checks it
  first: `0xf0`, data bytes 0-127, `0xf7`, at most `Luna.MAX_SYSEX_BYTES` (fact 140).
  `Luna.MockEngine.receiveMidi` takes a SysEx message, and `midiEdit` a `sysex` row.
  `examples/sysex.html` is a small SysEx librarian: log, hex dump, send hex, a `.syx` file or an
  Identity Request, with the reply decoded.
- `clip.midi.moveEvents(rows, byTicks)` moves MIDI rows other than notes (SysEx, CC, program
  change, pitch bend, aftertouch) by row id, in one post and one undo entry, keeping each row's
  id and bytes (fact 141). It refuses a note row, a row not in the clip, a fractional offset and
  a move before the clip's MIDI origin before sending anything. Needs a LUNA with the
  `move_midi_events` command; an older one answers with an error. `Luna.MockEngine` models it.

## 3.1.1 Beta 2

Changed (breaking)
- `session.newTrack()` resolves to the new tracks, a `Luna.Track[]` (one per `count`), listed in
  `session.tracks` with their properties loaded, instead of LUNA's raw reply. There is no need
  to diff `session.tracks` or find the track by name. Replace `reply.uid` with
  `const [track] = await session.newTrack(...)` and `track.id`.
- `session.insertClip()` resolves to the new `Luna.Clip`, listed in its playlist's `clips` with
  its properties loaded, instead of LUNA's raw `{ uid }`. Replace `reply.uid` with `clip.id`.
- Inside a batch `session.transaction()`, LUNA holds the new tracks and clips back until the
  commit, so both resolve at once to objects whose `id` is set and whose props read
  `undefined` until then. They are the same objects `session.tracks` and `playlist.clips` list
  afterwards, so `newTrack` then `insertClip({ trackUid: track.id })` still makes one undo entry
  (fact 135).
- `timeline.tempoAt()`, `timeline.seconds()`, `timeline.tickAtSeconds()`,
  `musical.tempoAt()` and `Luna.audioNsAtTick()` throw `Luna.Error` with code `unavailable`
  while the tempo map is not loaded, instead of answering at 120 BPM. A tempo event whose BPM
  has not been read yet no longer counts as 120 either. A page that read them before
  `session.ready()` got a wrong tempo with no warning, and planned clip lengths from it; await
  `session.ready()` (which `luna.session()` does) or check `timeline.tempoLoaded`.
  `marker.seconds` reads `undefined` until then, and `Luna.compiledClipAudio()` gives
  `undefined` (an outline) for a stretched clip on an older LUNA.

Changed
- `Luna.MockEngine` numbers `order` as LUNA does: one 1..N across tracks and buses together
  (it counted each from 0), folders followed by their contents, renumbered after a delete, and
  it answers `change_order` (fact 137). A test that compared `order` values may need new ones.
- `Luna.MockEngine` maps faders through LUNA's real tapers instead of its own stand-in, and
  honours a control's `taper`. Mock faders now rest at 0 dB = 0.7818… normalized (was 0.78),
  and normalized 0 is -144 dB (was -96). A test that compared with those numbers should use
  `Luna.Taper.named('+12').toNormalized(db)` instead (fact 134).

Added
- Folder tracks (fact 136). `session.newFolder({ name, mode, stemFormat, folderUid })` makes
  a folder track in one undo step and resolves to it, a `Luna.Bus` whose `isFolder` is true:
  `mode: 'summing'` (the default) makes it the bus for what is inside it, `'container'` only
  groups. `session.moveToFolder(items, folder, { after })` moves tracks and buses (folders with
  their contents) into a folder, or to the root with `null`, just after `after` or first, and
  resolves once the folders and the order show it; a folder's contents stay inside it even when
  they are listed too. `bus.setFolderMode(mode)` changes
  a folder's mode, or turns an aux bus into a folder and back. `session.folders` lists the
  folders and `session.folderContents(folder)` what is directly inside one (or at the root),
  in LUNA's order. `session.newTrack({ folderUid })` already placed new tracks in a folder.
  LUNA reroutes main outputs as things move: to the nearest summing folder, else the master.
  New types `Luna.NewFolderOptions` and `Luna.MoveToFolderOptions`. `Luna.MockEngine` models
  all of it, apart from the order.
- `session.channelsInOrder`: every track and bus in LUNA's order. One `order` runs 1..N
  across tracks and buses together, each folder followed by what is inside it (fact 137);
  `tracksInOrder` is the same order without the buses.
- `session.reorder(items, { after })` moves tracks and buses (a folder with its contents) to
  just after `after`, or first, in one undo step, and resolves once the new order shows. It
  never changes folder. LUNA ignores an unknown id without an error, so `reorder` rejects one
  with `out_of_range` before posting. New type `Luna.ReorderOptions`.
- `examples/order.html`: every track and bus in LUNA's order with its `order` number,
  rearranged by drag and drop, in and out of folders. Click, Cmd/Ctrl-click (gaps allowed) and
  Shift-click select; the selection drops above or below any row, or inside a folder, as one
  block in one undo entry (`session.moveToFolder()`). Below a folder's last row the pointer's
  left-right position picks in the folder or after it. ▲/▼ step one row, and rows flash when
  LUNA renumbers them.
- `examples/folders.html`: the session as a tree of folders, with forms to make a folder and
  a track inside one, a "Move to…" and ▲/▼ on every row, a mode picker on every folder, and
  where each main output goes.
- `timeline.tempoLoaded`: whether the tempo map has an event with a loaded BPM, so the
  conversions above can answer. `timeline.onChange` fires when it becomes true.
- `session.insertClip()` options `layer`, `lengthFollows` (`'ticks'` or `'time'`), `algType`
  (LUNA's time-stretch algorithm, such as `'varispeed'` or `'ua_stretch'`) and `copyOf` (a
  `Luna.Clip` to copy, with its gain, fades, warps and MIDI). With `copyOf`, `sourceUid`,
  `sourceStartNs`, `sourceStopNs` and `name` default to that clip's (fact 135). New types
  `Luna.InsertClipOptions`, `Luna.LengthFollows` and `Luna.AlgType`.
- `Luna.MockEngine` answers `new_track` with `{ uid }` (an array for `count`) as LUNA does,
  instead of `{ track_uid }`; models `insert_clip`'s `layer` (default: above the clips it
  overlaps), `length_follows`, `alg_type` and `clip_uid`; and answers `get_clip_info` with the
  clip's `playlist_uid` and `track_uid`.
- `Luna.Taper`: LUNA's fader tapers, the tables that map a fader's 0..1 position to dB.
  `toNormalized(db)` and `toDb(normalized)` convert as LUNA does, and `marks()` (or
  `marks({ compact: true })` for a short fader) gives the dB values LUNA's mixer draws hash marks
  at, so a page can draw a fader scale that matches LUNA. `Luna.Taper.named(name)` gives one
  by name (`+12`, `+18`, `+6`, `+0`, `API`, `+12Neve`, `preamp`, `volt_monitor_gain`); an
  empty or unknown name gives `+12`, as in LUNA (fact 134).
- `control.taper`: the taper a gain-type control (gain, gain trim, input trims) uses, `null` on
  pans, switches and plugin parameters. It changes when LUNA swaps it, as it does when a
  summing console goes on a bus input (API Summing makes that bus's faders `API`; on the master
  bus, every fader's). LUNA keeps the dB and moves the fader, so redraw from `normalized`.
- `docs/FILES.md`: "Add a file to the session without a clip". `session.uploadFile()` (a
  `File`) and `session.importPath()` (a path) add an audio source listed in `session.sources`
  without putting a clip on the timeline; place it later with `session.insertClip()`.
  `session.importFile()` differs: it runs LUNA's File > Import, which always makes a clip.

Fixed
- `effect.in` read the bypass control's polarity the wrong way round, so a plugin that was IN
  and processing read as bypassed, and a bypassed one as IN. It now reads it as LUNA's mixer
  does: when `bypassControlActiveLow` is true a nonzero value is IN; when it is false or
  `null`, zero is IN. `effect.setIn()` was not affected. `Luna.MockEngine` had the same
  inversion and now loads a plugin IN with LUNA's raw value, and `set_inserts_in_out` applies
  the polarity as LUNA does, so a test that wrote the bypass control's raw value directly
  may need its value flipped (fact 29).
- `examples/files.html` no longer leaves an unhandled rejection when a session it is switching
  to fails to load (closed in LUNA, or the connection dropped); it shows the error instead.

## 3.1.1 Beta 1

The SDK's version now follows LUNA's: this is the SDK for LUNA 3.1.1. Versions before it
(up to 0.2.1) used their own numbering.

Changed (breaking)
- Session preferences are now **session storage**, to keep them apart from LUNA's own
  preferences (`luna.preferences`) and to say what they hold: an Add On's data, not only its
  settings. The three levels are now context, record and field (fact 129):

  | Before (0.2.x) | Now |
  |---|---|
  | `session.preferences` (`Luna.SessionPreferences`) | `session.storage` (`Luna.SessionStorage`) |
  | `session.preferences.context(name)` (`Luna.PreferenceContext`) | `session.storage.context(name)` (`Luna.StorageContext`) |
  | `context.preferences` (names of its preferences) | `context.records` |
  | `add(preference, property, value?, options?)` | `add(record, field, value?, options?)` |
  | `set(preference, property, value, options?)` | `set(record, field, value, options?)` |
  | `remove(preference, property?, options?)` | `remove(record, field?, options?)` |
  | `value(preference, property)`, `clear(options?)` | unchanged |
  | `Luna.PreferenceEditOptions` | `Luna.StorageEditOptions` |
  | `/sessions/<uid>/preferences/<context>/<preference>/<property>` | `/sessions/<uid>/storage/<context>/<record>/<field>` |
  | `add_preference`, `set_preference`, `remove_preference` with `{ context, preference, property }` | `add_field`, `set_field`, `remove_field` with `{ context, record, field }` |

  The methods take the same arguments in the same order, so moving an Add On is a rename:
  `session.preferences` becomes `session.storage`, and `.preferences` on a context becomes
  `.records`. Code that posts the commands with `luna.raw` also renames the path, the
  commands and the `preference` and `property` arguments.

  **Data is kept.** LUNA renames what a session already stored the first time it opens the
  session, so an Add On finds its data under the same context, record and field names, and
  undoable edits made before still undo.

  **LUNA versions.** This SDK needs a LUNA with session storage. A LUNA built with session
  preferences, or an older one, has no `storage` node: `load()` still resolves and finds
  nothing (fact 10), and `add` rejects with `uasrv.invalid_object` (fact 11). An Add On that
  must also run there catches that rejection and falls back, for example to `localStorage`.

Fixed
- A session storage `set` (in 0.2.x, a session preferences `set`) whose value has a key set to
  `undefined`, such as `{ cursor: undefined }`, waited 4 s and then rejected with `no_effect`,
  although LUNA had stored it. LUNA keeps values as JSON, which drops such keys, so the SDK
  waited for a value LUNA could never show. It now compares with the value as JSON and resolves
  at once. An Add On that saves in a queue, one write after another, was held up 4 s per such
  write, and lost what was still queued when the session closed. `Luna.MockEngine` now keeps
  storage values as JSON too, as LUNA does (fact 129).

Changed
- macOS: when the LUNA Add Ons folder (`/Library/Application Support/Universal Audio/LUNA/Add
  Ons`) is missing or not writable, `ua-builder install` asks once for an administrator password
  and sets it up for every user on the Mac, as LUNA now does: owned by root, group
  `staff`, with an inherited ACL that lets every local account add, change and remove Add Ons.
  After that no install needs a password. `ua-builder doctor` reports a folder that still needs
  it, and the setup installer sets it up the same way instead of handing it to one user.
- Windows: LUNA's Add Ons folder moves to `%ProgramData%\Universal Audio\LUNA\Add Ons`, one
  folder for every account on the PC, matching LUNA. When it is missing or not set up for every
  user, `ua-builder install` shows one UAC prompt and grants every local account Modify on it,
  inherited, as LUNA does; after that no install needs one. `ua-builder doctor` reports a
  folder that still needs it and no longer creates it, and the setup installer leaves it to
  LUNA. Add Ons in the old `%LOCALAPPDATA%\Universal Audio\LUNA\Add Ons` are not moved:
  reinstall them.
- `luna.gui.serveMediaFile(addOnId, path)` serves **any** file in a blessed folder, whatever its
  type (JSON, text, images, PDFs as well as media), so a page can load everything in a folder
  the user let Add Ons read. Hidden files below the blessed folder (`.git`, `.env`) and links
  that lead out of it are not served; outside the blessed folders only audio, video and MIDI
  are, as before (fact 133). Needs a LUNA with blessed folders; an older one serves media only.
- Picking a folder with `luna.gui.chooseFolders()` or dropping one on an Add On no longer lets
  `listFiles` read it at once: LUNA first asks the user ("Allow Add Ons to Read a Folder"),
  once for all the folders. With DON'T ALLOW the page still gets the paths, for `importPath`,
  but `listFiles` refuses them with `uasrv.not_permitted`; check `luna.gui.blessedFolders`.
  The mock's `blessAnswer` answers for the dialog too (fact 133).
- The folders `listFiles` may read are now called the **blessed folders**. LUNA lists them in
  Settings > Add Ons > FOLDERS, where the user adds them (a folder dialog or a drop) and
  removes them one at a time; FORGET FOLDERS is gone (fact 133).
- `luna.gui.serveMediaFile(addOnId, path)` serves MIDI files too: `.mid` and `.midi` that
  start with a Standard MIDI File header (`MThd`), on a LUNA built with it. Read the bytes with
  `XMLHttpRequest` and parse them; a media element does not play MIDI (fact 114).

Added
- `luna.gui.blessedFolders` (with `luna.gui.watchBlessedFolders()`): the folders the user lets
  every Add On read, as absolute paths, following LUNA (fact 133).
- `luna.gui.addBlessedFolder(path)` asks the user to let every Add On read a folder; LUNA shows
  its own prompt, with DON'T ALLOW as the default, and the answer arrives in
  `blessedFolders`. It rejects with `uasrv.not_permitted`, without asking, for a disk's root,
  the home folder or a folder holding it, `~/Library`, or a folder the user refused earlier in
  the session. `luna.gui.removeBlessedFolder(path)` removes one without asking.
- `luna.gui.listAllFiles(path)` lists everything below a blessed folder in one call: each
  folder followed by its contents, every entry with its `relativePath`, hidden entries left
  out and links to folders not followed. `truncated` is true past LUNA's 10,000-entry limit
  or 5 seconds of reading.
  New type `Luna.NestedFileEntry`.
- `examples/files.html` has a second tab, **Folders**: a Finder-style window over the blessed
  folders, with a sidebar tree of `blessedFolders` and the folders inside them, back, forward, up and a path bar, each
  entry's kind, a "not available" view for a folder that is gone or no longer blessed (with
  "Ask LUNA for access…", or "Remove from Blessed Folders" for one that is gone), a ✕ that
  removes a blessed folder after a second click (`removeBlessedFolder()`), and Import for audio files onto a new track at the playhead. The
  File routes demo is the first tab, unchanged.
- `Luna.MockEngine` models the blessed folders: `blessAnswer`, `blessRequests`, `listLimit`,
  the `/gui/add_ons` `blessed_folders` property, and serving any file in one.
- Manifest `fixed_size` (boolean, default `false`) for `"window"` Add Ons: with `true` the
  window always opens at the manifest's `width` and `height` and has no resize controls (no
  resizable edges, no maximize button, and on macOS a greyed-out zoom and full-screen button).
  LUNA keeps restoring its position but not a saved size or full screen. `ua-builder` rejects a
  non-boolean, and `Luna.AddOn.fixedSize` reads it. Needs a LUNA that reads the field; an older
  one ignores it and the window stays resizable.
- Manifest `run_hidden` (boolean, default `false`), for any target: with `true` LUNA keeps the
  page running at full speed while it is hidden (another page in front, its window closed,
  LUNA covered) instead of slowing its timers and suspending it. For Add Ons that keep time,
  such as a sequencer. `ua-builder` rejects a non-boolean, and `Luna.AddOn.runHidden` reads it.
  Needs a LUNA that reads the field; an older one ignores it and the page sleeps when hidden.
- Track presets, as LUNA's New Track From Preset browser offers them (fact 132).
  `luna.presets.trackSelection({ category })` is a live selection over track presets by
  category (`Luna.TRACK_PRESET_CATEGORIES`: Audio, Instrument, Bus, Multi-Track, or `null` for
  all), tags and search text; with all or Instrument it also lists installed instrument
  plugins' presets, marked `isInstrumentPreset` and named with their plugin (`pluginId`,
  `pluginName`), so a track can be made from a synth patch.
  `session.newTrackFromPreset(row)` makes the track (or tracks) in one undo step and resolves
  to them; `track.loadPreset(row)` replaces a track's preset, as the track header's PRESETS >
  Assign does; `track.presetUid` and `track.presetName` say which preset it has.
  `luna.presets.query` takes `includeInstrumentPresets`, and `luna.presets.trackTagGroups()`
  gives the tag groups. `examples/track-presets.html` is the whole flow.
- `luna.gui.installAddOn({ id })` or `({ url })` installs Add Ons as LUNA's Settings > Add Ons
  > MARKETPLACE does: by marketplace package or Add On id, from the latest release of a
  public GitHub repo, which LUNA lists in its marketplace and installs, or from a Google
  Drive, iCloud Drive or Dropbox share link to a `.lunaaddon` shared with anyone who has the
  link. A link that installs is saved, and LUNA's marketplace lists it from then on.
  `luna.gui.removeImportedAddOn(id)` forgets one. LUNA asks the user to
  confirm; the call resolves as LUNA starts, so watch `luna.gui.addOns` for the result. Needs
  a LUNA with its Add On marketplace; another rejects with `Luna.Unsupported` (fact 128).
  `Luna.MockEngine` models it: `marketplace`, `installingPackages`, `importedPackages`,
  `addOnInstalls`.
- `luna.gui.uninstallAddOn(id)` asks the user to remove an installed Add On. LUNA shows its
  own prompt, so a page cannot remove one silently; on approval LUNA closes the Add On,
  deletes its folder (with any Add On installed in the same folder) and rescans. A
  `ua-builder install` symlink loses only the link, never the project. Add Ons built into
  LUNA are refused. Resolves as the prompt opens, so watch `luna.gui.addOns` for the result.
  An older LUNA rejects with `Luna.Unsupported` (fact 130). `Luna.MockEngine` models it:
  `builtInAddOns`, `uninstallAnswer`, `addOnUninstalls`.
- `addOn.version` (the manifest's) and `addOn.installedFrom` (`'folder'`, `'link'` or
  `'built_in'`) on `luna.gui.addOns`, so a page can offer an update when a newer release is out
  and offer Remove only where `uninstallAddOn` allows it. `version` follows a replace.
  `undefined` on an older LUNA (fact 131).
- `luna.plugins.query()` asks LUNA for installed plugins by search text, categories and
  favorites, and with `insertType` (and a channel) only those that slot takes.
  `effect.validPlugins()` does that for one slot: what LUNA's plugins browser offers there, an
  instrument slot listing instruments, an effect slot effects that run in the channel's
  format. LUNA decides; the SDK filters nothing. Needs a LUNA with `/plugins/query`; an older
  one rejects with `Luna.Unsupported` (fact 127).
- `examples/inserts.html` picks plugins that way: a target slot (the next empty one, a given
  effect slot, or the instrument slot), search text, a category and Favorites, and the list is
  what LUNA offers that slot on that channel. On an older LUNA it falls back to the catalog.
- Plugin editor windows (fact 126): `effect.openEditor()` and `effect.closeEditor()` open and
  close the plugin's window in LUNA, as clicking it in LUNA's mixer does, and resolve once
  LUNA shows the change; `effect.editorOpen` follows the window, whoever opens or closes it.
  Without an `Effect`: `luna.gui.showPlugin(channelUid, slot)`, `luna.gui.hidePlugin(...)` and
  `luna.gui.pluginWindows`. `session.ready()` now also follows `/gui/plugin_windows`. Needs
  a LUNA that has them; an older one rejects with `Luna.Unsupported`, and `editorOpen` stays
  `undefined` there.
  `examples/inserts.html` shows it: click a plugin's name to show or hide its window, and the
  name stays lit while the window is open.

Documentation
- Session storage: a context is any name without `/`, not only the Add On's id. The docs
  now show an Add On using one context per kind of data (`com.example.seq.tracks`), a
  record per item and a field per part, instead of one record in one value (fact 129).
- `docs/FILES-GUIDE.md`, a walkthrough of getting files in and out of an Add On: picking,
  dropping, folders and media by path, with recipes, a common-mistakes table and testing
  notes. `docs/FILES.md` points to it.

## 0.2.1

Changed
- `luna.gui.listFiles(path)` lists only folders the user gave LUNA, and the folders inside
  them: one picked with `chooseFolders()` or dropped on an Add On (`Luna.onPathDrop()`). Any
  other path rejects with code `uasrv.not_permitted`, before LUNA looks at it, so a page can no
  longer walk the disk and then serve or import what it finds. LUNA keeps the folders across
  restarts, at most 64, until the user clicks FORGET FOLDERS in Settings > Add Ons (fact 106).
  `Luna.MockEngine` models it: `grantedFolders`, `grantFolder()`, and `show_folder_dialog`
  grants what it picks. `examples/browse.html` explains a refusal and opens a dropped folder.

Added
- Optional `description` manifest field: what the Add On does, as a string or an array of
  strings that LUNA concatenates with no separator (write `\n` in the text for a new line), so
  long text can span lines of JSON. `ua-builder install` / `pack` reject any other value. LUNA
  reports it as the `description` property under `/gui/add_ons/<id>`, read as `description` on
  `luna.gui.addOns` items (`''` when the manifest has none). `ua-builder new --description "Text"`
  writes it; without the flag it is left out. In the `add_ons` shape a top-level `description`
  is the default for every entry without its own, as `manufacturer` is.

## 0.2.0

Added
- `luna.midiDevices`: the MIDI devices LUNA sees, as `Luna.MidiDevice` nodes with `name`,
  `midiDeviceType`, output lateness, MIDI clock settings and the last note and controller
  received (fact 123). LUNA lists `All` and `None` beside the real devices; `isPhysical` is
  false for those two. `watch()` it to follow devices plugged in or removed; its `onChange` also
  fires when a new device's name and ports arrive, which LUNA sends just after the device.
  `Luna.LUNA_DEVICE_UID` is LUNA's own device. `Luna.MockEngine.addMidiDevice` adds one.
- `midiDevice.inputPorts` / `outputPorts` (and `inputPort` / `outputPort`, the first of each):
  `Luna.MidiPort` nodes whose `uid` is the engine node MIDI from or to the device passes
  through. They need a LUNA that publishes MIDI ports; on an older one both lists are empty.
  A device with no MIDI out has no output port.
- `Luna.SendMidi` sends to MIDI hardware: `sendNoteToOutput`, `sendControllerToOutput`,
  `sendProgramChangeToOutput` and `sendMidiToOutput` (any 3 bytes) take a `Luna.MidiDevice`, one of
  its output ports, or a port uid, and send out of that device's MIDI out (fact 124). Notes,
  controllers and program changes take a channel. `Luna.MockEngine.midiSent` records them with
  `outputPortUid`.
- `Luna.QwertyMidi.handleKeyDownToOutput(e, device, channel?)` plays the computer keyboard out of
  a MIDI device's output port; `handleKeyUp` and `releaseAll` send each note-off where its
  note-on went.
- `Luna.MidiInput` receives live MIDI from MIDI hardware: `listen(target, handler)` takes a
  `Luna.MidiDevice`, one of its input ports, or `'all'`, and calls the handler with each channel
  message (`type`, `status`, `channel`, `data1`, `data2`, `time`, `port`) until the returned
  function is called. `onNote` and `onControlChange` filter; `onGap` reports missed batches.
  Needs a LUNA that publishes `midi_events` on MIDI input ports (fact 125); MIDI the Add On
  sends is not echoed. `Luna.MockEngine.receiveMidi` plays a device's MIDI in tests.
- Preset selection, as LUNA's plugin pages offer it (facts 120-122). `luna.presets.query` takes
  `tags` (all of them, or any with `matchAnyTag`) and `withTags`, which puts each preset's tags
  on its row. `luna.presets.tagGroups(pluginId)` reads the plugin's tag groups (for example
  Paradise's `TYPE`, `GENRE`, `DESCRIPTION`). `luna.presets.recommend(pluginId, text)` asks UA
  Assistant for the presets that best match free text, with `uid`, `name` and `score`.
  `luna.assistant.enabled` says whether UA Assistant is connected, which recommendations need.
  `slot.loadPreset(uid)` loads a preset onto the plugin already in a slot.
- `luna.presets.selection(pluginId)`: a live `Luna.PresetSelection` with writable `search`,
  `tags` and `matchAnyTag`, and `presets`, `recommendations` and `groups` that follow them.
  Typing is debounced, a reply that a newer request overtook is dropped, and recommendations
  keep only presets carrying the selected tags. `examples/presets.html` shows it with a search
  box, tag chips and one-click loading.
- `Luna.MockEngine`: `addPreset(..., { tags })`, `addPresetTagGroup`, `setAssistantEnabled`,
  `setPresetRecommendations`, and the `preset_recommendations` and per-plugin `load` commands.
- `docs/CLIPS.md`: drawing and editing clips, waveforms, MIDI notes, fades and crossfades as
  LUNA does, with every pitfall measured while building `examples/clip-editor.html`, and the
  `edit-clips` skill that walks an agent through it. `docs/llms.txt` points agents at both and
  no longer suggests drawing raw clips; `test-add-on` and `verify-add-on` say how to make a
  test prove something and how to leave a session clean after edits that render.
- `playlist.compiledClips`: what a lane actually plays, as `Luna.CompiledClip` segments that
  never overlap, because LUNA has already given each stretch to the clip on the highest layer
  (fact 116). Loading it asks LUNA to publish them for that lane. Each segment has `clipUid`,
  `start`/`stop`, its own `sourceStart`/`sourceStop`, the crossfade-widened
  `fullStart`/`fullStop`, and `fadeIn`/`fadeOut` (`{ uid, start, stop, shape, curvature,
  crossfade, contributorClipUid }`, or `undefined`). `inOrder()` and `ofClip(uid)` sort them by
  time. On a LUNA that does not report fades, `reportsFades` is false.
- Clip editing, each one undo step (fact 117): `clip.move(toTick, { copy })`,
  `clip.duplicate()`, `clip.split(ticks)`, `clip.slip(byNs)` (moves the audio inside the clip),
  `clip.setMuted(muted)`; on a lane, `playlist.split(ticks)` and `playlist.heal(start, stop)`.
  Selection-based commands put the user's selection back afterwards.
- Fade editing (fact 117): `clip.setFadeIn`/`setFadeOut(lengthTicks, { shape })`,
  `clip.crossfade(next, lengthTicks, { align, shape })` (centred, before or after the edit),
  `clip.removeFadeIn`/`removeFadeOut`/`removeCrossfade(next)`,
  `session.setFadeCurve(fades, { shape, curvature, reset })`, and on a lane
  `playlist.addFades({ startTick, stopTick, lengthNs, shape })` and `playlist.deleteFades(start, stop)`.
  `Luna.MockEngine` models them all.
- `context.select` also takes `playlistUids` and `focus`.
- `Luna.compiledClipAudio` draws each piece of a time-stretched clip from its own render.
  LUNA renders every compiled piece separately, so the clip's render covered only its first
  piece, and a later piece (a stretched clip with another clip over its middle) drew nothing
  (fact 116). Compiled clips gain `renderSourceUid`, `renderSourceStart` and
  `renderSourceStop`; on a LUNA that does not report them, later pieces draw as outlines.
- `clip.slip` refuses with `out_of_range` a slip later than the source has audio for, which
  LUNA would answer as a success and ignore (fact 117).
- `Luna.compiledClipAudio(timeline, segment, clip, sources)`: the audio one segment plays,
  for drawing its waveform with `Luna.audioNsAtTick` anchored at the segment.
- `examples/clip-editor.html`: multi-track clip and fade editing over the compiled clips. Drag
  a clip to move it, its edges to trim it, its corner handles for fades and the handle on an
  edit for a crossfade; a panel covers split, duplicate, mute, slip, heal, layering, fade shape
  and curve, and whole-lane fades.
- `Luna.MockEngine` publishes compiled clips once a client turns them on;
  `new Luna.MockEngine({ compiledClipFades: false })` models a LUNA without the fade data.

- `session.transactionMode`: `'batch'`, `'continuous'`, or `undefined` outside a transaction;
  the `Luna.TransactionMode` type.
- `Luna.SendMidi`: plays MIDI on a track live, the way a keyboard would, without writing to a
  clip (fact 108): `sendMidiNote`, `sendMidi` (any 3 bytes), `sendController`, `sendProgramChange` (with bank
  select), `sendNoteToTracks`, `sendDeviceNote` and `sendAllNotesOff`. A value out of range
  rejects with `out_of_range` before anything is sent. `sendNoteToTracks` sends one message per
  track, because LUNA's multi-track form reports an error even when it worked (fact 109).
- `Luna.QwertyMidi`: the computer keyboard as a MIDI keyboard (A-; and W-P play notes, Z/X
  step the octave, C/V the velocity). `octave` and `velocity` are
  props; handled keys are claimed with `preventDefault()` so LUNA does not also act on them;
  keys pressed with Cmd, Ctrl or Alt, or typed into a text field, are left alone; `releaseAll()`
  sends the note-offs a lost focus swallows.
- `Luna.MockEngine` accepts `send_midi` and `send_midi_all_notes_off`, and records what it
  delivered in `engine.midiSent`.
- `luna.gui.serveMediaFile(addOnId, path)`: the URL your Add On's page plays or reads a
  local audio or video file from, given its path from `chooseFiles`, a path drop, or a path
  saved in `session.preferences` (fact 114). Only real media is served, to that Add On only;
  on macOS the URL supports byte ranges, so video seeks without reading the whole file.
  `Luna.MockEngine` models it with `engine.mediaFiles` and records `engine.mediaServed`.
- `session.preferences`: settings an Add On keeps with the session, so they come back when it
  is opened again (fact 110). `session.preferences.context('com.example.my-add-on')` gives a
  `Luna.PreferenceContext` with `add`, `set`, `remove`, `clear` and `value(preference,
  property)`, a live prop of any JSON value. Edits stay out of the undo history unless
  `{ undoable: true }`. `Luna.MockEngine` models the three commands.
- `session.musical.keySignatureAt(tick)`: the key signature in effect at a tick.
- `Luna.MockEngine.addMidiClip(sessionUid, trackUid, { startTick, stopTick })`: an empty MIDI
  clip for tests, since `insertClip` cannot make one.

Changed
- The docs and skills now say to use `Luna.MidiInput` for live MIDI input, not Web MIDI
  (`navigator.requestMIDIAccess()`), which LUNA's macOS web view does not have. `docs/RECIPES.md`
  has a thirteenth prompt, a MIDI monitor built on it.
- `examples/clip-editor.html` selects the piece of a clip that was clicked, as LUNA does,
  rather than the whole clip: where another clip lies on top, only the clicked piece is
  highlighted, Duplicate copies that piece, and crossfade and curve controls act on its edits.
- Compiled clips gain `needsRender`, and `Luna.compiledClipAudio` returns `undefined` for a
  piece that plays a rendering LUNA is still making, instead of the original file at the wrong
  scale (fact 116). Both example timelines hold a piece's last waveform while its new
  rendering is made, so drawing a crossfade no longer shows the old waveform, then the
  original, then the new one.
- `examples/clip-editor.html` no longer flickers after an edit: a drag's preview stays up
  until the edit's result is painted, where the clip used to snap back to where it was for a
  frame or two, and the view keeps its start when an edit lengthens the session instead of
  sliding sideways. `examples/arrangement.html` keeps its view the same way when LUNA's edits
  lengthen the session.
- `compiledClip.crossfade(next, lengthTicks, { align, shape })` and
  `compiledClip.removeCrossfade(next)` crossfade the segments either side of an edit, which
  also covers overlapping clips: a clip on top over the middle of another crossfades where it
  begins and where it ends (fact 117). `examples/clip-editor.html` puts a crossfade handle on
  every edit between audio clips, butted or overlapping, and its crossfade buttons use the
  selected clip's next edit.
- `compiledClip.move(toTick, { copy })` moves what shows of a clip, as dragging it in LUNA
  does (fact 119): a clip that carries on under another is split at that edge when it shows
  again, and trimmed to it when the rest is hidden; a clip lying on top stays put. Resolves
  to the moved piece. `examples/clip-editor.html` drags pieces this way; before, dragging a
  clip moved its hidden parts and any clip on top of it too. The mock models it.
- `examples/arrangement.html` and `examples/clip-editor.html` draw a MIDI clip's notes: a bar
  per note in the track colour, pitch scaled to the clip's own range, velocity as opacity,
  muted notes faint, following note edits made in LUNA.
- `clip.setFadeIn`, `setFadeOut` and `crossfade` reject a MIDI or video clip with `unavailable`:
  LUNA fades audio clips only, and answers a fade on any other with success and no change
  (fact 117). `examples/clip-editor.html` gives such clips no fade handles or fade settings.
- `examples/clip-editor.html` shows what a drag or click would do: a hand over a clip (closed
  while dragging), bracket pointers where it trims, ramp and cross pointers over the fade-in,
  fade-out and crossfade handles, a text cursor over empty lane space and a busy pointer while
  LUNA answers, each with a tooltip.
- `examples/arrangement.html` and `examples/clip-editor.html` draw fades after every segment,
  so the half of a crossfade that reaches past the edit is no longer painted over by the next
  segment, and draw a crossfade as its two crossing ramps without shading.
- `examples/arrangement.html` and `examples/clip-editor.html` fill waveforms in the track's
  colour (`channel.color`), following a recolour live; a muted clip is drawn faded.
- `examples/arrangement.html` draws each lane's compiled clips, so a clip on top hides the
  one beneath, and draws their fades and crossfades.
- `midi.deleteNotes`, `midi.setMuted` and `midi.setVelocities` run inside a batch
  `session.transaction()` instead of refusing with `busy`, so rewriting a clip's notes
  (`deleteNotes` then `clip.addNotes`) is one undo step (fact 74). LUNA holds a batch's pushes
  until the commit, so they no longer wait for the lists to change inside one.
- A continuous `session.transaction(name, fn, { continuous: true })` now asks LUNA to notify
  the undo that replaces each step. Without it, rows a step's undo deleted stayed visible to
  every client, so repeated `createNotes` left every take behind (fact 115).
- `lane.createNotes` runs inside a continuous transaction, where each call replaces the last
  take: one undo step for a regenerated preview. Inside a batch it still refuses, now naming
  `clip.addNotes` as the alternative.
- `session.musical.setKeySignature` checks its arguments (`out_of_range` for a value outside
  -7..7, a non-boolean `isMinor` or a non-integer tick) and resolves to the key signature once
  LUNA lists it, instead of to the raw reply. One already at that tick is rewritten in place
  (fact 113).
- `Luna.parseChord` reads a lowercase root or bass as the note (`am7`, `f#m/c#`) and ignores
  spaces around the slash (`C / E`). Words such as `bridge` and `chorus` are still text.

Fixed
- `sendDeviceNote` documentation: a device name feeds the note into LUNA as that device's input;
  it does not play the device.
- `Luna.MockEngine` now follows LUNA's `create_note` (fact 111): it takes session ticks,
  writes each note into the clip under its note-on rather than the lane's first MIDI clip,
  makes a bar-aligned clip named after the track when there is none, and puts session ticks
  in the selection. MIDI row ids are unique across a session's clips, as in LUNA.
- `Luna.MockEngine` refuses an `insert_clip` with no `source_uid` with
  `uasrv.invalid_property`, as LUNA does (fact 112); before, a sourceless MIDI clip succeeded
  on the mock only. `set_key_signature` now writes a row instead of doing nothing.
- Docs: `createNotes` writes every note on channel 0 (LUNA's `create_note` has no channel; use
  `clip.addNotes` with `channel`), and rejects with `no_effect` when its notes land in two
  clips. `insertClip` needs a source for every clip type.
- `npm install` in a scaffolded Add On no longer runs the installed SDK's `prepare` script or
  resolves its dev dependencies: the distributed SDK's `package.json` ships without `scripts`
  and `devDependencies`. Before, the install failed building sources that do not ship (`tsup`
  not found), and npm 10 crashed even with `--ignore-scripts`.
- Scaffolds install with npm 10 (Node.js 22's): `ua-builder new` writes an `.npmrc` with
  `legacy-peer-deps=true`, which avoids npm 10's crash on vitest's peer dependencies
  (`Cannot read properties of null (reading 'edgesOut')`). npm 11 is no longer needed.
- `ua-builder new` writes the template's `.gitignore` again: `npm pack` left it, and an
  `.npmrc`, out of the package, so the templates now store them as `gitignore` and `npmrc`.
- Windows: `ua-builder test` runs the Add On's vitest with node instead of spawning
  `npx.cmd`, which Node.js refuses without a shell (`EINVAL`). `ua-builder doctor` no longer
  prints Node's DEP0190 warning.
- Windows: `npm run build` generates the plugin (`sync-plugin.mjs` never ran its main there),
  and `check:plugin` and the examples test handle Windows paths.

## 0.1.1

Added
- `luna.secrets.get(name)`, `set(name, value)` and `delete(name)`: API keys and tokens in the
  OS credential store (the macOS login keychain, Windows Credential Manager), scoped by LUNA
  to the Add On's `id` and readable only by the Add On's own page (fact 107).
  `luna.secrets.storage` is `'keychain'` inside a LUNA that supports it and `'memory'`
  elsewhere, where values last until the page reloads. `Luna.Secrets`, `Luna.SecretStorage`,
  `Luna.MAX_SECRET_NAME_LENGTH` (128) and `Luna.MAX_SECRET_BYTES` (2560).
- docs/MANIFEST.md has a "Secrets" section; the create-add-on and verify-add-on skills now
  check that no secret is kept in web storage or in the Add On's files.
- `ua-builder new --template add-on-typescript`: a TypeScript scaffold. Vite builds `src/`
  into one classic script, `dist/main.js`, that the page loads after the vendored SDK, since
  Windows blocks module scripts under `file://`. React or any other bundled library goes in
  the same way (the scaffold's README says how). `npm run pack` builds, then packs.
- `@uaudio/luna-builder-sdk/global`: types the `Luna` global for code that reads it instead of
  importing the SDK. Add it to tsconfig `"types"`; `Luna.connect()` and `Luna.Session` both
  resolve. The agent plugin ships it as `sdk/global.d.ts`, replacing `sdk/luna.global.d.ts`.
- `ua-builder pack --source-maps` keeps source maps, which are now left out by default.

Changed
- Inside LUNA, keys an Add On page does not `preventDefault()` now go on to LUNA's own
  shortcuts, the user's remappings included, in page and window Add Ons alike.
  `Luna.bindShortcuts` therefore installs nothing inside LUNA and keeps working as before
  outside it; `ShortcutsBinding.installed` says which.
- `min_luna_version` in the templates and the examples is now `3.1.1`, the first LUNA that
  checks it. A LUNA older than an Add On's `min_luna_version` will not open the Add On and
  lists it disabled in the Add Ons menu with the version it needs (docs/MANIFEST.md).
- `ua-builder pack` leaves out what the page never loads: TypeScript and JSX sources, source
  maps, `tsconfig.json` and bundler configs, and the top-level `src/` when one of those configs
  is there. It refuses to pack when a page loads a local script or stylesheet that is missing
  (an unbuilt `dist/`) or left out, and warns about a module script.
- `ua-builder new` lists the templates when `--template` names none of them.
- `ua-builder new`, the template and the examples write the manifest's display name as
  `title` again, not `name`. LUNA releases that predate `name` read only `title` and drop an
  entry without it; newer releases read either. `ua-builder install` and `pack` no longer
  warn that `title` is deprecated, still accept `name`, and warn when an entry has both and
  they differ.
- Add On ids compare without regard to case, as LUNA now treats them, and on macOS each Add On
  page gets its own origin, and so its own web storage, named by its id. `ua-builder` warns
  about an id with capitals and treats ids that differ only in case as clashing; write ids in
  lowercase (docs/MANIFEST.md).

Fixed
- `Luna.Port`, `Luna.Event`, `Luna.Unsubscribe` and the other wire types (`PortStatus`,
  `EventHandler`, `GetOptions`, `SubscribeOptions`, `StatusListener`, `Operation`, `Verb`,
  `WireMessage`, `LogFn`, `LogLevel`, `WebSocketPortOptions`, `SocketLike`,
  `SocketConstructor`, `MockNodeSpec`, `CommandHandler`, `MockMidiRow`, `MockEngineOptions`)
  are types again in the declarations. They were declared as values, so using one as a type
  failed to compile, and `Luna.Event` silently meant the DOM's `Event`.
- `session.newBus()` resolves once the bus's properties are loaded. It resolved as soon as the
  bus was listed, which, when LUNA's `added` push came before the read of its properties
  (fact 7), gave a bus whose `name`, `busType` and `stemFormat` were still `undefined`.

## 0.1.0

Changed
- Versions now follow the builds UA Connect publishes. The source carries `major.minor.patch`
  (`0.1.0`) with no prerelease tag, and each shipped SDK adds the Bamboo build number as a
  fourth part, for example `0.1.0.1234`, in `package.json`, `Luna.VERSION`, the plugin
  manifests, the catalogs and the `sdk_version` of scaffolded Add Ons. A local build uses
  build number `0`. Whether a build is for internal use or for external developers is set by
  where it is deployed, not by the version. No API or CLI changes.
- The skills, the scaffold README and `llms.txt` now ask agents to put the SDK version on the
  feedback line, as `LUNA BUILDER SDK FEEDBACK: <version>`, taken from the `ua-builder`
  row of `ua-builder doctor`, so feedback can be matched to the build it came from.

## 0.1.0-alpha.9

Changed
- The SDK is no longer cloned from GitHub; it comes as a folder (for example, inside the LUNA
  Add On Builder installer). `README.md` now starts setup with `npm ci` in that folder, and a
  plugin marketplace is added from the folder instead of a clone. No API, CLI or plugin
  changes.

## 0.1.0-alpha.8

Added
- `luna.gui.listFiles(path)`: the files and folders directly inside a folder, as LUNA sees the
  disk, each `{ name, path, isDirectory }` (`Luna.FileEntry`). Hidden entries are left out and
  the rest are in natural order like LUNA's own browsers: case ignored, `take2` before
  `take10`. Rejects `uasrv.filesystem_error` when nothing is
  there and `uasrv.invalid_value` for a relative path or a file (fact 106).
- `luna.gui.chooseFolders({ title?, allowMultiple?, defaultPath? })`: LUNA's native folder
  dialog, resolving to absolute folder paths or `[]` if cancelled.
- Both need a LUNA that has the commands; an older one rejects them with `Luna.Unsupported`.
- `Luna.MockEngine` models both: `engine.folders` is the disk `listFiles` reads, and
  `nextDialogFiles` is what `chooseFolders` selects.
- `examples/browse.html` ("Folder browser (Builder)"): browse folders with `listFiles` and
  start from LUNA's folder dialog. Import copies an audio file in with `importPath` and puts
  it on a new track at the playhead (`newTrack` + `insertClip` in one transaction); audio rows
  can also be dragged onto LUNA's timeline, carrying the file's `file://` URL and path.

## 0.1.0-alpha.7

Added
- `docs/FILES.md`: the two ways a user's file reaches an Add On. The **File route**
  (`<input type="file">`, HTML drop, `session.uploadFile`) works in LUNA, a browser and on the
  wasm engine, and is the one to use when the page needs the audio. The **path route**
  (`luna.gui.chooseFiles`, `Luna.onPathDrop`, `session.importPath`) is a LUNA optimization:
  the engine reads the file from disk, and the page cannot read the paths.
- `session.importPath(path, { name?, timeoutMs? })`: the engine copies a file it can read into
  the session as a new source (`local_copy`), resolving to the listed `AudioSource`. No clip,
  no `/gui` needed.
- `Luna.onPathDrop(handler | { drop, dragOver?, dragLeave? })` and `Luna.canDropPaths()`: files
  dropped on the page inside LUNA, as absolute paths. Publishes the `window.lunaHost`
  callbacks LUNA calls and opts in to native drops; the returned unsubscribe hands drags back
  to HTML `drop` events. Throws `Luna.Unsupported` outside LUNA.
- `luna.gui.available()`: whether the engine has LUNA's `/gui` (absent on headless and wasm
  engines).
- `new Luna.MockEngine({ gui: false })` (and `MockEngine.demo({ gui: false })`): a mock without
  `/gui`.
- `examples/files.html` ("File routes (Builder)"): the four ways a file arrives (file picker,
  HTML drop, native path drop, LUNA's dialog) side by side, logging every event; the check to
  run inside LUNA.
- `ua-builder probe` gives every page `LunaProbe.dropFiles(files, selector)` and
  `LunaProbe.chooseFiles(selector, files)`, which deliver real `File`s (`'name.wav'` is a short
  sine WAV that decodes), and `--luna-bridge` fakes LUNA's native bridge so
  `LunaProbe.dropPaths(paths)` reaches `Luna.onPathDrop`.
- Optional `manufacturer` manifest field: who makes the Add On, shown by LUNA in the
  MANUFACTURER column of Settings > Add Ons. `ua-builder new --manufacturer "Name"` writes it,
  and `ua-builder install` / `pack` reject a non-string value. The examples set it. In the `add_ons` shape a top-level
  `manufacturer` is the default for every entry without its own. LUNA reports
  it as the `manufacturer` property under `/gui/add_ons/<id>`, read as `manufacturer` on
  `luna.gui.addOns` items (`''` when the manifest has none).

Changed
- The manifest's `title` is now `name`. LUNA still reads `title` when `name` is absent, and
  `ua-builder` accepts it with a warning to rename it; `name` wins when both are present. The
  templates and examples write `name`. LUNA publishes it as the `name` property under
  `/gui/add_ons/<id>`, so `Luna.AddOn.title` is now `Luna.AddOn.name` (breaking; a LUNA that
  predates the rename still publishes `title`, which `luna.gui.addOns` items no longer read).
- `ua-builder new --name "Name"` sets the manifest's `name`; `--title` still works as an
  alias. Clash messages from `new` and `install` say `name` instead of `title`.
- Without `/gui`, every `luna.gui` command and `session.importFile` reject at once with
  `Luna.Unsupported` instead of posting to a missing node (a `chooseFiles` used to wait out
  its 10-minute timeout).
- `session.uploadFile` of a file whose bytes are already in the session resolves to that
  source. LUNA files identical bytes once and answers `end` with the existing source's uid;
  the SDK waited for the new uid instead and failed with `no_effect` after 30 s.
- `session.uploadFile` takes the name from a `File` made in another realm (an iframe, a test
  DOM) instead of refusing it for having no name.
- `luna.gui.chooseFiles`, `session.importFile` and `session.uploadFile` document which route
  they belong to: `chooseFiles` returns paths only the engine can read.
- The agent skills, the scaffold README and `docs/llms.txt` now ask agents to end with
  `LUNA BUILDER SDK FEEDBACK:` instead of `UA BUILDER SDK FEEDBACK:` when the SDK could
  support their workflow better.

## 0.1.0-alpha.6

Changed
- `ua-builder pack` writes a `.lunaaddon` **zip file** again, holding the Add On folder
  (`<folder>/manifest.json`), instead of a `.lunaaddon` bundle folder. Opening one in LUNA
  (double-click on macOS or Windows) installs the Add On as a plain folder in LUNA's Add Ons
  folder, with no `.lunaaddon` extension. To share an Add On by hand, zip its folder and rename
  the `.zip` to `.lunaaddon`. The zip is written in Node, so it needs neither `zip` nor
  PowerShell, and keeps dotfiles and OS metadata files out as before. A `.lunaaddon` bundle
  folder from an earlier pack must be repacked; Add Ons already installed from one keep
  working.

## 0.1.0-alpha.5

Added
- `"editor"` Add On target: the editor panel docked under LUNA's Timeline, in place of the
  Clip Editor and at its height, listed under **Add Ons > Editors**. `ua-builder new --target
  editor` scaffolds one, `install` and `pack` accept it, and `AddOnTarget` includes `'editor'`.
  Needs a LUNA with editor Add On support; earlier builds open an `"editor"` entry as a window,
  and drop it for lack of a size.
- `session.newBus({ name, stemFormat })`: creates an aux bus (stereo unless told otherwise) in
  one undo step and resolves to the `Luna.Bus` once it is listed. `session.newTrack` makes
  tracks only.
- `timeline.formatBarBeat(tick)`: a tick as LUNA's bar|beat counter shows it (`5|3|240`), in
  one call.
- `timeline.onChange(listener)`: called when a tempo event or time signature is added, removed
  or edited.
- `marker.barBeat` and `marker.seconds`: derived props for a marker's position that follow the
  marker and the tempo map, so a marker list needs no tempo or time-signature listeners.
- `clip.addNotes(notes)`: adds several notes to a MIDI clip as one undo step. Each
  `Luna.ClipNote` gives `pitch`, a clip-relative `tick`, `lengthTicks` and optional `velocity`
  (default 100) and `channel` (default 0); all are checked before anything is sent.
  `clip.addNote` now goes through it.

Changed
- `ua-builder new` and `ua-builder install` refuse an Add On whose `id` or `title` (ignoring
  case) is already used by an Add On in LUNA's Add Ons folder, since LUNA needs both unique.
  Reinstalling the same Add On is not a clash. `UA_ADDONS_FOLDER` overrides the folder.
- Docs and skills say the SDK does not stream audio or MIDI, and that an Add On receives live
  MIDI with Web MIDI (`navigator.requestMIDIAccess()`) and sends it however it likes.
- `width` and `height` are required only for a `"window"` Add On. `ua-builder install` and
  `pack` accept a browser or app entry without them, and `ua-builder new --target browser|app`
  leaves out `width`, `height`, `floating` and `show_with_session`, none of which those targets
  use. Needs a LUNA that keeps a browser or app entry with no size; earlier builds drop it.
- `ua-builder install` and `new` name the menu LUNA lists the Add On in: **Add Ons >
  Windows**, **Browsers** or **Apps**, not the Window or View menu.
- `ua-builder new` rejects an unknown `--target`.

Fixed
- `Luna.connect()` no longer hangs under Node 22 when nothing is listening. Node's built-in
  `WebSocket` reports a refused connection with an `error` and no `close`, which the SDK
  waited for; an attempt now ends on either, and the handshake is bounded by
  `requestTimeoutMs`, rejecting with `NotRunning`. Fact 101.
- `ua-builder pack` leaves dotfiles (`.DS_Store`, `._*`, `.git`, `.gitignore`, `.env`, editor
  folders) and Windows metadata files (`Thumbs.db`, `desktop.ini`) out of the `.lunaaddon`
  bundle at every depth, and says how many it left out. It copied them all before.
- Docs: `BarBeat.tick` (from `timeline.barBeat()` and `location.bar_beat`) is engine ticks,
  and `Luna.formatBarBeat` converts it to display ticks. The docs said "display tick", which
  led to converting twice.

## 0.1.0-alpha.4

Measured against a LUNA 1.0.0.0 Debug build from the 3.x branch (facts 90 and 100 in
`docs/EVIDENCE.md`). The `floating`, `show_with_session` and browser-target manifest
behaviour needs a LUNA that reads those fields.

Added
- `Transport.setPlayStart(to, { sync })`: move the play start alone, to a tick or a
  `{ bar, beat, tick }`, leaving the loop range where it is (`seek()` collapses it, as LUNA's
  locate does). Resolves once LUNA shows the move; while playing, the playhead jumps as
  `sync` says. Fact 90.
- Manifest `target: "browser"` is now shown by LUNA: a panel in the secondary browser beside
  the Timeline and Mixer, chosen from the Add Ons menu (choosing it again closes it), and by
  `Luna.AddOn.show()`. Which one is showing is saved with the session and restored when it
  reopens. `ua-builder new --target browser` scaffolds one. Needs a LUNA that
  shows browser Add Ons; earlier builds list them but open nothing.
- `session.musical.chords`: LUNA's Chord ruler as a live `Luna.Chords` collection (`sorted`,
  `at(tick)`) of `Luna.Chord` (`location`, `name`, `parsed`; `rename`, `moveTo`, `delete`).
  `musical.addChord(tick, name)`, `musical.setChords(chords, { replaceRange })` (a whole
  progression as one undo entry) and `musical.clearChords()`. `Luna.parseChord('Am7/G')`
  gives `{ root, type, bass }`. `Luna.MockEngine` models the verbs and adds
  `engine.addChord(sessionUid, tick, name)` for a chord typed in LUNA. Fact 100.
- `session.focusedTrack`: a `Prop<Track>` for the track the user is working on. It is the main
  context's `lastSelectedTrack`, else the first selected track, else the first visible track.
  It notifies only when the answer moves to another track.
- `Collection.membersReady()`: resolves once every member the engine added has its properties.
- `Luna.connect({ engine: 'mock', setup })` and `?engine=mock` on the page URL: an in-memory
  `Luna.MockEngine`, filled by `setup`, else by a page-defined `globalThis.LunaMockSetup`, else
  by `Luna.MockEngine.demo()` (one session with four tracks). `luna.mock` is the engine, and
  `MockPort.engine` is now public.
- `ua-builder probe --mock [fixture.js]`: probes a real page with no LUNA running. The fixture
  is installed before any page script runs. `--screenshot <file.png>` saves the page once it
  is ready and has painted two animation frames.
- `Store.readsSettled()`, `Store.pendingReads` and `Store.hasProperties(nodePath)`.
- Manifest `floating` (boolean, default `true`) for `"window"` Add Ons: the window floats with
  LUNA's plugin windows (above LUNA while it is active, hidden by Hide Floating Windows), or
  with `false` is an ordinary window. `ua-builder new` writes `"floating": true`;
  `--no-floating` writes `false`. `readManifest()` rejects a non-boolean. `Luna.AddOn.floating`
  reads it from `/gui/add_ons/<id>`. Needs a LUNA that reads the field; earlier builds ignore it.
- Manifest `show_with_session` (boolean, default `false`) for `"window"` Add Ons: with `true`
  the window is hidden and its menu item disabled while no session is open, and the window
  comes back when one opens if the user had it open. `ua-builder new` writes `false`;
  `--show-with-session` writes `true`. `readManifest()` rejects a non-boolean.
  `Luna.AddOn.showWithSession` reads it. Needs a LUNA that reads the field.

Changed
- LUNA's Add Ons menu now holds one submenu per target (Apps, Browsers, Windows); Windows
  lists `show_with_session` Add Ons first. Browser Add Ons are listed on every page, disabled
  off the Timeline and Mixer. See `docs/MANIFEST.md` (`target`).
- A member a loaded collection learns of from an `added` push (native LUNA sends no data with
  one, fact 7) is still in `items` at once. Its `onChange` now waits until the SDK's read of
  the member lands, so listeners never see it with empty props. Removals still notify at once.
- `luna.settled()` also waits for reads in flight, repeating flush-then-read until both are
  quiet. After `await engine.settled(); await luna.settled();` a clip or track another client
  just added has its values.
- `ua-builder probe` opens a blank tab, then navigates it, so it can install scripts first.
- The `ua-luna-builder` plugin manifests and marketplace catalog name
  `https://github.com/uaudio-labs/luna-builder-sdk` as the repository.

## 0.1.0-alpha.3

Facts 97-99 in `docs/EVIDENCE.md`: the preset query and `set_inserts` preset fields are
verified from deviced source; the MockEngine control-view tapers are documented stand-ins.

Changed
- `ua-builder pack` produces a `<name>.lunaaddon` bundle (a folder with the extension, shown
  as a package in the macOS Finder) instead of a zip, matching LUNA's bundle-only installer.
  The copy is pure Node, so the zip/PowerShell split is gone; `--out` gains the `.lunaaddon`
  extension when it is missing, and a bundle inside the Add On folder is never packed into the
  next one. Install by dropping the bundle into LUNA's Add Ons folder; a previously shipped
  `.zip` must be repacked.

Added
- `luna.presets` (`Luna.Presets`): `query({ pluginId | deviceTypeId, search?, favorite?,
  limit? })` over `post /presets/query` (fact 98), returning rows decoded from LUNA's
  columnar reply, and `find(pluginId, name)` for the exact-name match, preferring a user preset over a
  factory one of the same name.
- `Effect.setPlugin(pluginId, { presetUid })`: a `presetUid` from `luna.presets.find()` rides
  in the same `set_inserts` entry, so LUNA adds the plugin already on that preset, state and
  preset identity applied in one undo step (fact 99); `presetName` alone still only labels the
  effect. `Luna.MockEngine.addPreset()` seeds a preset library that answers
  `/presets/query` columnar with 0/1 flags, and `set_inserts` stores `preset_name`/`preset_uid`
  on the slot (a known uid takes the library's name).
- `ua-builder probe <url> [--expr <js>] [--wait <js>] [--settle <ms>]`: open a served page in
  headless Chrome, wait until a `Luna` client on it is connected and its focused session is
  ready (the new `Luna.clients()` registry of open clients, a tooling hook; `--wait`
  overrides), let the DOM hold still for one quiet period (default 250 ms, bounded so a
  playing clock cannot stall it; `--settle 0` skips), evaluate an expression against the live
  DOM and print JSON — the scriptable half of a two-client "the page must follow" check, with
  no hand-rolled CDP boilerplate, no `--dump-dom` race, and no placeholder reads from a
  scaffold still binding its session. Every wait is gated on the real page having loaded (the
  tab's initial blank document satisfies any DOM condition), a page still in its
  `Luna.connect()` retry loop counts as not ready, a wait that never passes prints
  `timed out ... waiting for: <condition>` plus what the page shows, and a page whose vendored
  SDK predates `Luna.clients()` gets a warning instead of a silent wrong read. The
  verify-add-on skill uses it.
- `ua-builder serve` on a busy port now walks to the next free port with a notice (stale
  serves from other sessions are common); an explicit `--port` fails with a clear message and
  an `lsof` hint instead of a bare EADDRINUSE stack.
- `luna.settled()` now flushes pending change notifications immediately instead of waiting
  for the next animation frame (or its 100 ms fallback), so the test idiom
  `await engine.settled(); await luna.settled();` is deterministic and prompt in any
  environment. QUICKSTART's testing section and the test-add-on skill now spell out the
  timing rules: values read current after `engine.settled()`, listeners land on
  `luna.settled()`, an unchanged value fires no `onChange`, and the first value a prop
  receives does fire.
- `transport.tempo` and `transport.timeSignature`: typed Props carved out of the `location`
  pushes (the tempo and meter in effect at the playhead), notifying only when the value moves
  rather than on every playhead push. `Luna.formatTimeSignature` formats the meter as `4/4`
  (placeholder `-/-`), pairing with `formatBarBeat`; `Luna.derived` gained a
  `{ distinct: true }` option that skips notifications when the computed value is unchanged.
- `Luna.MockEngine` fidelity: writing one view of a control (`value`, `real_value`,
  `normalized_value`, `string_value`) re-derives the other three and pushes them to every
  client, the writer included (fact 97), so a test that sets `gain.real` can assert on
  `gain.display` the way the UI renders it. The tapers and formats are documented stand-ins
  (faders −96..0..+12 dB around normalized 0.78, pans `L<n>`/`C`/`R<n>`, switches snapping to
  their steps), not LUNA's own.

Fixed
- `npx ua-builder` in a freshly scaffolded project could die with "Permission denied" —
  the plugin sync copied `sdk/cli.js` (the plugin's bin) without its executable bit, and zip
  extractions drop the bit too. The sync now chmods the copy, `check:plugin` gates on it, the
  CLI restores its own bit whenever it is run via `node .../cli.js`, `ua-builder doctor`
  reports and heals the project's installed bin, and the scaffold README documents the
  one-time `node node_modules/.bin/ua-builder doctor` recovery.

## 0.1.0-alpha.2

Measured against the wasm LUNA engine (fact 96 in `docs/EVIDENCE.md`, 2026-09-29); native
LUNA's `min_sec` precision is an open check for the live lane.

Added
- `Transport.seconds`: the playhead in wall-clock seconds, `transport.tick` converted through
  the session's tempo map. Safe on any session from `luna.session()` (the tempo map loads with
  `session.ready()`); read earlier it throws `unavailable` instead of converting at a guessed
  tempo. `TransportLocation.min_sec` is documented (fact 96): present on `location` pushes,
  its `seconds` fractional on the wasm engine (measured); floor it for display.
- `Luna.formatMinSec(seconds, { fraction })`: a zero-padded `MM:SS` clock as a companion to
  `formatBarBeat`, with optional fractional digits, flooring rather than rounding and clamping
  negatives to zero.
- `Luna.bindClock(el, transport, { render, bindings })`: a smooth playback clock. The engine
  pushes `location` only several times a second, so the binding anchors on each push (the push
  stays authoritative) and interpolates with requestAnimationFrame while `transport.playing`,
  cancels on stop, and returns a release function. Default paint is
  `formatMinSec(seconds, { fraction: 1 })` into `el.textContent`.
- `Luna.MockEngine` fidelity: an engine-side `setValue('play_start', ...)` on a stopped session
  re-reports `location` the way a client-side set does (fact 90), and `locationAt` now carries
  `min_sec` integrated from the session's tempo map (fact 96).
- Every skill, the scaffold README and `docs/llms.txt` ask an agent that hits a workflow the
  SDK could support better to end its reply with `UA BUILDER SDK FEEDBACK:` followed by a
  prompt that could be used to update the SDK for that workflow.

Fixed
- The scaffold declares `vite` (vitest 5's peer dependency) so a fresh Add On installs, and
  the SDK's `file:` spec is written relative to the Add On so a moved folder keeps installing.
  The README notes the Node 24 / npm 11 requirement.
- `ua-builder doctor` reports the npm version, with a note when it is older than 11 (npm 10
  crashes in arborist on the scaffold), and creates LUNA's Add Ons folder when it is missing.

## 0.1.0-alpha.1

Measured against LUNA 3.0.0.15776 (facts 82-92 in `docs/EVIDENCE.md`).

Changed (breaking)
- The namespace is `Luna`, not `UA`: `import { Luna } from '@uaudio/luna-builder-sdk'`, `Luna.connect()`,
  and `globalThis.Luna` from a script tag. The script-tag bundle is `luna.global.js` (was
  `ua.global.js`). To move an existing Add On: rename `UA` to `Luna` in its scripts, point its
  `<script src>` at `vendor/luna.global.js`, and rename the vendored file (`ua-builder pack`
  then keeps it current). Environment variables keep their `UA_` prefix.
- `Track.inputMonitor` is a `WritableProp<boolean>` (was a read-only `Prop<string>`): LUNA's
  `input_monitor` is the track's on/off monitor switch, not a mode. Code that compared it with
  a string such as `'auto'` no longer type-checks; compare with `true`/`false`, and turn it on
  with `inputMonitor.set(true)`. That write rejects with `uasrv.invalid_value` while the
  record mute preference is on and no Apollo is active.
- `Transport.seek()` now sets the play start and both loop marks, as LUNA's own locate and
  Return To Zero do, so a drawn loop range becomes an empty one at the target; call `setLoop()`
  after seeking to keep a range. It resolves once the playhead is there, and while playing it
  now jumps at once (`sync_playback`) instead of only moving the next play start.

Changed
- Licensed under the Apache License, Version 2.0 (was proprietary and unlicensed). The package
  and the plugin each carry `LICENSE` and a `NOTICE`; every manifest's `license` is `Apache-2.0`.
- The repo ships the SDK source instead of a packed artifact: `dist/` and the generated agent
  plugin are built by `npm ci` (a new `prepare` script) with Node.js 22 or newer. Distributed
  SDK packages still arrive built.

Fixed
- Sends: `Output.unassign()` and `retarget()` delete by the assignment uid; they sent the bus
  uid, which LUNA rejects. New `destinations` (each with its `uid`, `busUid`, `name`,
  `busType`, `error`) and `destination`; `busUid` is derived from them, since LUNA's own
  `bus_uid` is always null. Routing calls resolve once the model shows the change;
  `retarget()` joins a caller's `transaction()`; `moveTo()` checks the slot is 0-7.
- Pan: stereo channels and sends use `pan_left`/`pan_right`. `Output.pan` is the left pan on
  stereo; new `pans`, `panLeft`, `panRight`, `stereo`.
- Automation: breakpoint values go on the wire as float literals; LUNA stored a whole
  number such as -6 as 0. `insert`, `setValue`, `move` and `clear` resolve once the lane
  shows the edit and refuse fractional ticks.
- Plugins: a slot counts as loaded by its instance id (`plugin_name` can stay null).
  `setPlugin()` and `channel.insert()` resolve once loaded and reject with the slot's
  `plugin_error`. New `Effect.params` leaves out the parameters a cleared plugin leaves
  behind; new `Effect.loaded`, `Effect.instanceId`, `Control.initialized`.
- Bounce: a render posted straight after a selection write used the previous selection;
  `Context.select()` now reads the selection back before resolving.
- Clip delete and trim, marker add, rename, move, recolor, comment and delete, and
  `session.deleteTracks()` resolve once the change is visible, and reject with `no_effect`
  when LUNA answers without acting.
- Store: a read answered late no longer overwrites a newer push; a refused write rolls back
  to the last value LUNA confirmed; a read's child lists count only as deep as it asked; a
  watch whose first load failed can be retried; a closed Store subscribes to nothing.
- `session.transaction()` called inside another runs in the open batch instead of nesting.

Added
- `Luna.waveformColumns(range, width, nsAt, { gain })` reduces a `WaveformRange` to one min/max
  per drawn column per channel the way LUNA's timeline does (fact 93): the loudest pairs each
  column covers, every column touching the zero line, columns between pairs interpolated when
  zoomed in, linear values times `gain` clipped to full scale, and `NaN` where no pair lies.
  `Luna.waveformLanes(channels, top, height)` stacks one lane per channel in file order, and
  `Luna.traceWaveform(ctx, channel, lane, x0)` adds LUNA's filled outline to a canvas path,
  with a 0.5 px axis so silence draws a thin line. Together they draw a stereo clip as two
  lanes, as LUNA does, instead of one folded shape that looks mono. `Luna.waveformPeak(range)`
  gives the loudest value in a range, for normalizing.
- `Musical.setTempoInEffectAt(bpm, tick)` changes the tempo in effect at a tick the way LUNA's
  tempo field does, by writing that tempo event's `tempo` (now a `WritableProp`), verified live; new
  `Musical.tempoEventAt(tick)` finds it (fact 95).
- `Context.waveformZoom` is LUNA's waveform zoom for the window (1 by default, x2 per Zoom In
  Waveform), read from the new `Context.settings`; multiply it into the `gain` above to draw at
  LUNA's height. LUNA saves it with a delay, so it can lag the screen (fact 94).
- `Luna.bindRange(input, control)` binds an `<input type="range">` to a control in one call:
  touch on press, a write per `input` (the input's `min`..`max` mapped onto 0..1, or units with
  `view: 'real'`), release once however the drag ends, LUNA's value followed except mid-drag
  and settled on at release, double-click to `resetToDefault()`.
- `Luna.bindDrag(element, controls, { render })` does the same for a div or canvas knob or
  fader: pointer capture, travel to value (`axis`, `pixelsPerUnit`), arrow, Page and Home/End
  keys, double-click reset, and `role="slider"` with `aria-valuenow`/`aria-valuetext`.
- `Luna.Bindings` groups a page's listeners and bindings: `on(prop, fn)`, `add(off)`,
  `clear()`, `dispose()`. Bindings made with `{ bindings }` hold it while dragged, and
  `whenIdle(render)` runs a rebuild now or once when the last drag ends. `bindGesture` takes
  `bindings` too.
- `Control.resetToDefault()`: puts any control back to LUNA's own default
  (`set_control_default_value`), touch-bracketed so it is one undo step. Use it for
  double-click-to-reset instead of hard-coding a default; controls expose no default value.
- `Transport.seek({ bar, beat, tick })` seeks to a musical position through the session's
  timeline; `seek({ bar: 1 })` is the downbeat of bar 1 even when tick 0 is not. New
  `{ sync: 'now' | 'next_bar' | 'loop_end' }` option for a seek during playback.
- `Transport.returnToZero()`: LUNA's Return To Zero, to the arrangement start (tick 0 until
  set). New `Transport.arrangementStart`.
- `Track.inputMonitoring`: whether LUNA is monitoring the track's input right now
  (`input_monitor_state`, read-only). It can be true while the switch is off, for an armed
  track that is stopped or punched in.
- `Luna.float()` / `Luna.FloatLiteral` for float fields on the raw wire; `Luna.encodePayload`.
- `Luna.Disposed`, `node.disposed` and `node.onDispose()`: commands on a removed object reject
  instead of acting on whatever replaced it. Collections dispose removed members at once.
- `Clip.snapshot()`, `Clip.layer`, `Clip.muted`; `Meter.streams`, `Meter.max`.
- `Luna.connect({ log })`: status changes, reconnects, timeouts and listener errors.
- `Luna.MockEngine`: LUNA's routing model, four cue buses, the stereo pan layout, the 3.0 insert
  slots, plugin load and ghost parameters, bare-integer breakpoints stored as 0;
  `engine.addBus()` and `engine.overrideCommand()`.
- `ua-builder tree [path]`: the shape of any node, or a snapshot of the nodes the SDK builds
  on (`docs/tree/luna-3.0.0.15776.json`).
- The `verify-add-on` skill: prove an Add On against LUNA from a second client and check the
  undo queue. `add-feature` now points at `ua-builder tree` and the wire traps.
- A live lane for the mixer (`tests/live/mixer.test.ts`).

## 0.1.0-alpha.0

First alpha: the wire layer, store and `UA.connect`; the session, transport, track, control,
bus, playlist, clip, MIDI, automation, render and recording models; `UA.MockEngine`; the
in-page wasm engine transport; the `ua-builder` CLI; five skills and the `ua-luna-builder`
agent plugin.
