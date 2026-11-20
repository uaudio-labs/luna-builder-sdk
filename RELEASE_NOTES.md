# Release Notes

What changed in each release of `@uaudio/luna-builder-sdk` and the `ua-luna-builder` plugin
it carries, in brief. `CHANGELOG.md` has the detail.

## 3.1.2 Beta 4 — 2026-11-20

- The docs now explain that LUNA 3.1.2 keeps an Add On's secrets, allowed servers and web
  storage for its install, not its `id`: an update starts with none, and removing the Add On
  deletes its secrets (docs/MANIFEST.md, "What an install keeps").
- `ua-builder install --force` on Windows updates the installed copy in place, so a reinstall
  keeps the Add On's secrets, allowed servers and web storage.
- `Luna.MockEngine` serves media files on LUNA 3.1.2's install host
  (`ua-content://<id>_t<token>/...`); `engine.installTokens` pins the token.

## 3.1.2 Beta 3 — 2026-11-19

- A new `"Education"` Add On category, for Add Ons that teach music or LUNA; `ua-builder` accepts
  it and `Luna.suggestAddOnCategories()` can suggest it.

## 3.1.2 Beta 2 — 2026-11-18

- `session.recordTakes` follows the takes LUNA is recording before they become clips: an audio
  take's waveform as it grows, a MIDI take's notes as they are played.
- `session.selectTimeline` points LUNA's edit selection at a range of tracks, so the context's
  `selectAll`, `cut`, `copy`, `paste`, `clear` and `duplicate` act on it; `Luna.Shortcuts` can
  bind LUNA's edit keys in a page with `Luna.EDIT_SHORTCUTS` (off by default).
- `Luna.MockEngine` models takes being recorded and the timeline edit commands.
- New `examples/server.html` shows an Add On calling a web server it lists in `network`.
- The SDK now comes with the Supplemental Terms for LUNA Builder SDK alongside the Apache
  License; using it means agreeing to both.

## 3.1.2 Beta 1 — 2026-11-17

- **Breaking:** inside LUNA an Add On page now reaches only the servers its new manifest
  `network` field lists and the user allows; `Luna.AddOn.network` and `networkAllowed` read them
  back. An Add On that calls a web API or loads from a CDN must list it. Needs a LUNA with the
  change.
- **Breaking:** `Luna.AddOn.target` is replaced by `Luna.AddOn.targets`, default first; a page's
  current host is still `luna.gui.thisInstance()`'s `target`. See `CHANGELOG.md`.
- **Breaking:** `luna.gui.removeImportedAddOn` is now `luna.gui.removeAddOn`, following LUNA's
  renamed `/gui` `remove_add_on` command.
- **Breaking:** LUNA's Add On Marketplace is now the Add On Showcase: its `/gui` paths moved to
  `/gui/showcase/...`, its DEV key is `add_ons_showcase`, and `Luna.MockEngine.marketplace` is
  now `Luna.MockEngine.showcase`. See `CHANGELOG.md`.
- New Add Ons declare `min_luna_version` `3.1.2`; an older LUNA will not open them.
- New manifest `requires_plugins` names the plugins an Add On goes with, and the version it
  needs. LUNA lists the Add On disabled, with the plugin it needs, and will not open it while
  one is missing or too old; an `optional` one only adds the note. `Luna.AddOn.requiresPlugins`
  and `luna.plugins.unmetRequirements()` let a page check the same. Needs a LUNA with the change.
- New manifest `targets` lets the user move an Add On between window, browser and editor from
  its header, and `Luna.addOnTarget()` tells a page which host it was loaded in. Needs a LUNA
  with the change.
- New manifest `min_width`, `min_height`, `max_width` and `max_height` set a window Add On's size
  limits; `Luna.AddOn` reads them back.
- Every Add On page now knows its own instance: `luna.gui.thisInstance()` gives its size, and
  `resize()` lets a window Add On set its own size. A `show_with_session` window's size and
  open state are now saved with the session. Needs a LUNA with the change.
- A session keeps its app Add On: it reopens on it, or with it on the toolbar when you had
  moved to the Timeline or Mixer. Needs a LUNA with the change.
- New manifest `categories` says where the Showcase lists an Add On. `ua-builder` checks the
  names, suggests some when there are none, and `new --categories` writes them;
  `Luna.AddOn.categories` reads them back from LUNA.
- New manifest `unload_on_close` unloads a window, browser or editor Add On's page when it is
  closed, so it reopens fresh instead of running on hidden.
- **MIDI SysEx:** `Luna.MidiInput` delivers whole SysEx messages from hardware (`onSysEx`, or
  `sysex: true` in `listen`), a clip's `MidiRow` has `sysex`, and
  `SendMidi.sendSysExToOutput()` sends one out of a MIDI port; needs a LUNA with SysEx. New
  example `examples/sysex.html`, a small SysEx librarian.
- `clip.midi.moveEvents()` moves a clip's non-note MIDI rows (SysEx, CC, program change, pitch
  bend, aftertouch) in one undo step. Needs a LUNA with the change.
- New `docs/DRAWING.md`: how to draw meters and playheads that keep up while LUNA plays. The
  examples' meters and playheads no longer stutter inside LUNA.
- **Fixed:** a plugin reloaded into a slot now starts at its defaults and powered on, instead
  of coming back with the old plugin's values or power state. Needs a LUNA with the change.
- **Fixed:** whole-number writes to a plugin's continuous parameters (`real.set(-3)`) are no
  longer refused or ignored by LUNA.

## 3.1.1 Beta 2 — 2026-11-03

- **Breaking:** `session.newTrack()` now resolves to the new `Luna.Track[]` and
  `session.insertClip()` to the new `Luna.Clip`, loaded, instead of LUNA's raw reply. Use
  `const [track] = await session.newTrack(...)` and `track.id` / `clip.id`. Inside a batch
  transaction both resolve at once, with props filled in at the commit.
- **Breaking:** tempo reads (`tempoAt`, `timeline.seconds`, `tickAtSeconds`) throw
  `unavailable` until the tempo map has loaded, instead of silently assuming 120 BPM. New
  `timeline.tempoLoaded` says when they can answer. To follow tempo edits, use
  `timeline.onChange`; `transport.tempo` follows only the playhead.
- `session.insertClip()` can set a clip's `layer`, what its length follows on a tempo change
  (`lengthFollows`) and its time-stretch algorithm (`algType`), or copy another clip
  (`copyOf`).
- **Fader tapers:** new `Luna.Taper` and `control.taper` give LUNA's own dB ↔ fader-position
  tables and the dB values its mixer draws hash marks at, following LUNA when a summing console
  changes a fader's taper. `Luna.MockEngine` uses the same tables, so mock faders rest at
  0.7818 (was 0.78).
- **Folder tracks:** `session.newFolder()` makes a summing or container folder track,
  `session.moveToFolder()` moves tracks and folders in and out, `bus.setFolderMode()` changes
  a folder's mode, and `session.folders` / `session.folderContents()` read the hierarchy. New
  example `examples/folders.html`.
- **Track order:** `session.channelsInOrder` lists tracks and buses in LUNA's order, and
  `session.reorder()` moves them; new example `examples/order.html`. `Luna.MockEngine` now
  numbers `order` as LUNA does, across tracks and buses together.
- `docs/FILES.md` shows how to add a file to the session as a source without putting a clip on
  the timeline (`session.uploadFile` or `session.importPath`), and place it later.
- **Fixed:** `effect.in` read plugins as bypassed while they were IN and processing (and
  bypassed ones as IN). It now follows LUNA's bypass polarity; `effect.setIn()` was already
  right.

## 3.1.1 Beta 1 — 2026-10-30

- **Breaking:** `session.preferences` is now `session.storage`, with records and fields in place of
  preferences and properties (`context.records`, `add`/`set`/`remove`/`value(record, field, ...)`),
  so rename your calls; it needs a LUNA with session storage, existing sessions keep their data, and
  `CHANGELOG.md` has the full table.
- The SDK's version now follows LUNA's: 3.1.1 is the SDK for LUNA 3.1.1.
- New blessed folders, the folders the user lets every Add On read: `luna.gui.blessedFolders`,
  `addBlessedFolder` (LUNA asks the user), `removeBlessedFolder`, and `listAllFiles` for everything
  below a folder in one call.
- Folders picked with `chooseFolders()` or dropped on an Add On can be listed only after the user
  allows it in LUNA's prompt.
- `luna.gui.serveMediaFile` serves any file in a blessed folder, and MIDI files anywhere.
- New `luna.gui.installAddOn` installs Add Ons from LUNA's marketplace, a GitHub repo or a Google
  Drive, iCloud Drive or Dropbox link, and `removeImportedAddOn` forgets a saved link.
- New `luna.gui.uninstallAddOn` asks the user to remove an installed Add On.
- `luna.gui.addOns` items have `version` and `installedFrom`.
- New track presets: `luna.presets.trackSelection`, `session.newTrackFromPreset`, `track.loadPreset`
  and `track.presetName`, including instrument plugins' presets.
- New `luna.plugins.query` and `effect.validPlugins()` list the plugins LUNA offers for a slot.
- New `effect.openEditor()`, `closeEditor()` and `editorOpen` open, close and follow a plugin's
  window in LUNA.
- New manifest `fixed_size` gives a window Add On a size the user cannot change.
- New manifest `run_hidden` keeps an Add On's page running at full speed while it is hidden.
- `ua-builder install` sets up LUNA's Add Ons folder once for every user on the computer, and on
  Windows that folder moves to `%ProgramData%\Universal Audio\LUNA\Add Ons`.
- A session storage `set` of a value with `undefined` keys resolves at once instead of waiting 4 s
  and rejecting with `no_effect`.
- New `docs/FILES-GUIDE.md` walks through getting files in and out of an Add On.

## 0.2.1 — 2026-10-22

- `luna.gui.listFiles` now lists only folders the user picked with `chooseFolders()` or dropped
  on the Add On, and rejects any other path with `uasrv.not_permitted`.
- New optional `description` manifest field, shown by LUNA and read as `description` on
  `luna.gui.addOns`; `ua-builder new --description` writes it.

## 0.2.0 — 2026-10-21

- New `Luna.SendMidi` and `Luna.QwertyMidi` play MIDI on a track live without writing to a clip.
- New `luna.midiDevices` lists LUNA's MIDI devices and their ports; `Luna.SendMidi` and
  `Luna.QwertyMidi` can send out of a device's MIDI out.
- New `Luna.MidiInput` receives live MIDI from MIDI hardware; use it instead of Web MIDI, which
  LUNA's web view does not have.
- New preset selection: `luna.presets` searches by tags, reads tag groups, asks UA Assistant for
  recommendations, and `slot.loadPreset` loads one.
- New `playlist.compiledClips` gives what each lane actually plays, with its fades and crossfades.
- New clip and fade editing (move, duplicate, split, slip, mute, heal, fades, crossfades, fade
  curves), each one undo step, plus a `docs/CLIPS.md` guide, an `edit-clips` skill and an
  `examples/clip-editor.html` example.
- New `session.preferences` keeps an Add On's settings with the session.
- New `luna.gui.serveMediaFile` gives a URL to play a local audio or video file by its path.
- New `session.musical.keySignatureAt` and `session.transactionMode`.
- Note edits work inside batch transactions, and a continuous transaction replaces each take
  rather than leaving it behind.
- `Luna.MockEngine` matches LUNA for `create_note`, `insert_clip` and key signatures.
- `npm install` of a scaffolded Add On works with npm 10 and on Windows.

## 0.1.1 — 2026-10-15

- New `luna.secrets` keeps API keys and tokens in the OS keychain, scoped to the Add On.
- New `ua-builder new --template add-on-typescript` scaffolds a TypeScript Add On, and
  `@uaudio/luna-builder-sdk/global` types the `Luna` global.
- `ua-builder pack` leaves out sources, source maps and build configs, and refuses to pack a
  page whose local scripts or stylesheets are missing.
- Inside LUNA, keys an Add On page does not handle now reach LUNA's own shortcuts, so
  `Luna.bindShortcuts` installs nothing there.
- New Add Ons declare `min_luna_version` `3.1.1`; an older LUNA will not open them.
- Manifests write the display name as `title` again, which every LUNA release reads.
- Add On ids are case-insensitive and should be lowercase; each id gets its own web storage.
- The wire types (`Luna.Port`, `Luna.Event` and others) are types again in the declarations.
- `session.newBus()` resolves only once the bus's properties are loaded.

## 0.1.0 — 2026-10-12

- Versions follow the builds UA Connect publishes: `0.1.0.<build number>`, with build `0` for
  a local build, instead of `0.1.0-alpha.N`. No API changes.
- The SDK feedback line agents write now carries the SDK version:
  `LUNA BUILDER SDK FEEDBACK: <version>`.

## 0.1.0-alpha.9 — 2026-10-09

- The SDK no longer comes from a GitHub clone: run `npm ci` in the SDK folder you were given,
  and add the plugin marketplace from that folder. No API changes.

## 0.1.0-alpha.8 — 2026-10-09

- New `luna.gui.listFiles(path)` lists a folder's files and folders as LUNA sees the disk, in
  LUNA's own natural order, and `luna.gui.chooseFolders()` opens LUNA's native folder dialog.
  Both need a LUNA that has the commands; an older one rejects them with `Luna.Unsupported`.
  `Luna.MockEngine` models both.
- New example `browse.html` ("Folder browser (Builder)") browses folders, imports an audio file
  onto a new track at the playhead, and drags audio rows onto LUNA's timeline.

## 0.1.0-alpha.7 — 2026-10-08

- The manifest's `title` is now `name`, and `Luna.AddOn.title` is now `Luna.AddOn.name`.
  LUNA and `ua-builder` still accept `title` in a manifest; rename it when convenient.
  `ua-builder new` takes `--name` (`--title` still works).
- New `docs/FILES.md`: the two ways a user's file reaches an Add On. A `File` the page can
  decode comes from `<input type="file">` or an HTML drop and goes into the session with
  `session.uploadFile()`; a path from `luna.gui.chooseFiles()` or the new `Luna.onPathDrop()`
  is for the new `session.importPath()`, which has LUNA copy the file without it passing
  through the page.
- In LUNA 3.1.0.4589 on macOS a file picker opens nothing and path drops stop after an Add On
  window is reopened; `docs/FILES.md` says what to offer instead.
- Added `luna.gui.available()`; without LUNA's UI (headless or wasm) `luna.gui` commands now
  fail at once with `Luna.Unsupported`.
- Fixed `session.uploadFile()` timing out when the same audio was already in the session.
- New example `files.html` tries every file route inside LUNA; `ua-builder probe` can drop and
  pick files (`LunaProbe`) and fake LUNA's path drops (`--luna-bridge`).

## 0.1.0-alpha.6 — 2026-10-06

- `ua-builder pack` makes a `.lunaaddon` zip file again. Double-click it to install the Add On
  in LUNA, where it lands as a plain folder. Sharing by hand is just zipping the Add On folder
  and renaming the `.zip` to `.lunaaddon`.

## 0.1.0-alpha.5 — 2026-10-02

- Added the `"editor"` Add On target, docked under LUNA's Timeline in place of the Clip Editor, with `ua-builder new --target editor`.
- Added `session.newBus()` to create an aux bus in one undo step.
- Added `clip.addNotes()` to add several MIDI notes in one undo step.
- Added `timeline.formatBarBeat()`, `timeline.onChange()`, and `marker.barBeat` and `marker.seconds` props that follow the tempo map.
- Browser and app Add Ons no longer need `width` and `height` in their manifest.
- `ua-builder new` and `install` refuse an Add On whose `id` or `title` is already installed.
- `ua-builder pack` leaves dotfiles and OS metadata files out of the bundle.
- Fixed `Luna.connect()` hanging under Node 22 when LUNA is not running.
- Documented that the SDK does not stream audio or MIDI, and that Add Ons use Web MIDI for live MIDI.

## 0.1.0-alpha.4 — 2026-10-01

- Added `Transport.setPlayStart()` to move the play start without collapsing the loop range.
- Added `session.musical.chords` for LUNA's Chord ruler, with `addChord`, `setChords`,
  `clearChords` and `Luna.parseChord()`.
- Added `session.focusedTrack` for the track the user is working on.
- Added manifest `floating` and `show_with_session` options for window Add Ons, and support
  for `target: "browser"` Add Ons, with matching `ua-builder new` flags.
- Added `Luna.connect({ engine: 'mock' })` and `?engine=mock` for running a page on an
  in-memory engine, and `ua-builder probe --mock` and `--screenshot`.
- Members added to a loaded collection now notify only once their properties are read, and
  `luna.settled()` also waits for reads in flight.
- Documented LUNA's per-target Add Ons submenus.

## 0.1.0-alpha.3 — 2026-09-30

- `ua-builder pack` now produces a `.lunaaddon` bundle instead of a zip, matching LUNA's
  installer.
- Added `luna.presets` to query a plugin's presets and `setPlugin({ presetUid })` to add a
  plugin already on a preset.
- Added typed `transport.tempo` and `transport.timeSignature` Props, `Luna.formatTimeSignature()`
  and a `{ distinct: true }` option for `Luna.derived`.
- Added `ua-builder probe` for scripted checks of a served Add On in headless Chrome, and
  `ua-builder serve` moves to the next free port when its port is busy.
- `luna.settled()` flushes change notifications immediately, making test waits deterministic.
- `Luna.MockEngine` re-derives a control's other views when one is written, as LUNA does.
- Fixed `npx ua-builder` failing with "Permission denied" in a fresh scaffold; the CLI and
  `ua-builder doctor` now restore the bin's executable bit.

## 0.1.0-alpha.2 — 2026-09-29

- Added `Transport.seconds`, `Luna.formatMinSec()` and `Luna.bindClock()` for building
  smooth playback time displays.
- `Luna.MockEngine` re-reports `location` on engine-side play-start writes and carries
  fractional `min_sec` seconds, matching the wasm engine.
- The agent skills, the scaffold README and `docs/llms.txt` now ask agents to end with a
  `UA BUILDER SDK FEEDBACK:` prompt when the SDK could support their workflow better.
- Fixed the scaffolded Add On's install (vite declared for vitest 5, SDK path relative so
  moved folders keep working); `ua-builder doctor` now flags npm older than 11 and creates
  LUNA's Add Ons folder when missing.
