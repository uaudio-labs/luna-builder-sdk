# The SDK against next_gen's client (HBH-36711)

What next_gen's LUNA client (`hbgui/next_gen/shared/uanet-clients/src/uaservices`) reaches on
the wire that the SDK's typed surface does not, and what to do about each. Surveyed 2026-11-23,
area by area, against the SDK at `dev/jwalther/HBH-36711-PortMissingNextGenClientSupport`
(with `session.lyrics`, `workspace.templates()` and `sessions.createFromTemplate()` already in).
UA Connect (`uaconnect/`) and the assistant (`uaassistant/`) are out of scope.

`luna.raw`, and each node's untyped `property(name)` / `command(name)`, can reach anything below.
None of that counts as coverage: a row is covered only by a typed, documented member.

Classes:
- **port**: an Add On would reasonably need it; goes into the SDK with mock support, a fact in
  `docs/EVIDENCE.md`, tests and docs.
- **skip**: internal to next_gen or LUNA's own pages, or modelled differently in the SDK (the
  note says how).
- **design**: needs a decision first (listed at the end).

Sizes: S (an afternoon), M (a day or two), L (more).

## Status (2026-11-23)

Every **port** row below is now in the SDK, except two the server showed to be wrong or absent:
session-wide automation record (deviced has none; each channel has a read-only flag, fact 164)
and input spectrum (left with the design items). Facts 153-231 record each behaviour.
`ua-builder selftest` (DEVELOPING.md, "Self-test against a LUNA build") exercises them: on
LUNA 3.1.3.10758 42 checks pass and 2 skip (`tracks.plugin.sdkType`, because that build
publishes no `sdk_type`; `tracks.gui.pluginWindow`, which is opt-in), and the facts it exercises are marked verified from that run. Measured differences
from LUNA's own descriptions and from next_gen are in the facts: `duplicate_tracks`'
`before_uid` places the copy after that channel (166); `templates({ factory: false })` is
filtered client-side (162); a rename can be undone by a late push and is re-read (165).

The decisions at the end are made (2026-11-23); the rows they settled are reclassed, and the
ones left **design** are follow-ups.

## Already covered

About 150 capabilities, not listed row by row: sessions and the workspace (list, open, create,
templates, close, focus, query, recent), transport (play, record, loop, locate, count-in and
roll flags, sync), undo/redo and transactions, markers, chords, tempo map, time and key
signatures (set), lyrics (read), contexts and selection, tracks and buses (identity, colour,
comments, order, folders, arm, input, automation mode on tracks), controls (value, real,
normalized, touch, defaults, automation lanes and breakpoints), outputs and meters, effect slots
(load, in/bypass, presets, plug-in windows), playlists and clips (create, select, insert, move,
split, trim, fades, crossfades, layers, MIDI notes and tables), compiled clips and waveforms,
record takes, renders and bounces, jobs (list, cancel), presets (query, tags, recommendations,
load), plug-ins and their requirements, session storage, secrets, MIDI sending and devices,
`/gui` navigation, dialogs, tasks, Add On instances.

## Gaps

### Sessions, transport, musical data

| Feature | Wire | Class | Size | Note |
|---|---|---|---|---|
| Lyrics editing | post `set_lyric {rowid \| location, text}`, `delete_lyric {rowid}` | port | S | Mirror `Chord.rename/moveTo/delete`. `location` in ticks for a ruler line. |
| Delete a time / key signature | post `delete_time_signature {bar}`, `delete_key_signature {tick}` | port | S | Completes `musical`'s set-only API. |
| Session settings | set `tempo_percent`, `enable_tempo_percent`, `pre_roll`, `post_roll` (strings), `click_during_play/record/count_in`, `merge_midi`, `automation_recording`, `solo_mode` | port | S | Plain property sets; the roll strings' format needs a fact. |
| Timeline scroll | `contexts/<ct>/timeline_view_start_tick` (ticks, r/w) | port | S | Pairs with the covered `pixelsPerTick`. |
| Session groups | `/sessions/<s>/groups/<uid>` (name, `group_attributes` CSV, order, members); post `new_group`, `delete_group`, `add_/remove_group_members`, `group_change_order`, `group_affected_tracks` | port | M | No read model or commands today, though the node exists (fact 25). |
| Video sync (read) | `/sessions/<s>/video/sync/*` (ticks, ns and seconds) | design | M | For an Add On that draws a synced video window. Ported, then removed in review to keep it out of this release; `session.video` (`src/model/video.ts`, its mock and the `structure.video` self-test check) can be restored from de514e4. Facts 221-222 stand. |
| Import MIDI or video by path | post `/workspace/import_file {type: midi \| video, ...}` | port | S–M | `importPath` hard-codes audio; the return type for MIDI needs settling. |
| `rec_play_mode`, `tempo_established` writes | set | skip | — | Enum undocumented; `tempo_established` drives first-take tempo detection, which is LUNA's own flow (decision 4). |
| Seek with the linked selection | set play/loop + selection when `link_edit_and_play` | design | S | The SDK leaves the selection alone on purpose. |
| Command enabled state | `/sessions/<s>/<cmd>/enabled` | port | M | Done: `node.commandEnabled(name)`, a `Prop<boolean>`; a context's commands live under `commands/` (fact 234). |
| `/errors` feed | subscribe `/errors` | port | S | Done, read-only: `luna.errors` (fact 235). An Add On may not add or dismiss LUNA's notices. |
| `new_session` extras, `open_in`, `is_plugin_used`, `ui_surface`, standalone sessions, `/initialized`, feature keys, edit a time signature row in place | — | skip | — | Product plumbing, analytics, or modelled through commands instead. |

### Tracks, buses, folders, effects

| Feature | Wire | Class | Size | Note |
|---|---|---|---|---|
| Rename keeping the name | set `name` with request parameter `name_modified=true` | port | S | Without it a later `loadPreset` replaces the name. Check how a `set` carries parameters. |
| Insert power | ctx post `set_inserts_power {channel_uid, inserts, value}` | port | S | Sibling of `Effect.setIn`; fans out over the mix group. |
| Move or copy an insert | root post `/move_insert {source_uid, destination_uid, copy}` | port | S | Carries state, automation and preset. Guard against console ↔ `effect_N` moves, which LUNA does not refuse. |
| Delete a bus; delete a folder with its contents | post `delete_bus {bus_uid}`, `buses/delete_folder_with_contents {bus_uid}` | port | S | Closes the create-without-delete hole for `newBus` / `newFolder` (fact 136). |
| Delete playlists | post `delete_playlists {playlist_uid[], delete_unused?}` | port | S | `delete_unused` inverts the list (the ones to keep). |
| Duplicate track | post `duplicate_tracks {..., before_uid}` | port | S | Partial today: no `before`, and it doesn't resolve to the new `Track`. |
| Automation mode on buses | post `set_automode_on_tracks` with bus uids | port | S | Move `setAutomationMode` from `Track` to `Channel`. |
| Create tracks from inputs | post `new_tracks_from_inputs {input_uids, record_enable, auto_gain, stem_format}` | port | S | A common recording setup; the brochure needs it. |
| MIDI output routing | `tracks/<t>/midi_output_assignments/*`; ctx post `set_midi_output_assignments` | port | M | Destinations: track, bus, effect, device (writes: track and device). |
| Folder tree helpers | pure (`folder_uid`, `order`) | port | S–M | Forest, visible rows under collapsed folders, the summing folder a channel routes to. |
| Clip effects | `clips/<c>/effects/clip_effect_N`; post `add_/remove_/move_clip_effect`, `set_clip_effect_enabled`, `set_clip_fx_bypass`, `clear_clip_effects`, `add_playlist_clip_effect`, `set_playlist_clip_fx_bypass` | design | L | Behind LUNA's `enable_clip_effects` feature key; at most 8 per clip. Port once the key ships on. |
| Auto Gain | `/auto_gain` (status, peaks); post `start_auto_gain {duration in s}`, `stop_auto_gain`; track `supports_auto_gain` | port | M | A whole service; LUNA Play's input setup. |
| Track spectrum | set `spectrum_analysis_enabled`, subscribe `spectrum` (dB bins) | design | M | Costs engine compute: needs reference counting; absent on older builds. |
| `instrument_determined`, `post_record_commands` | set | port | S | Done: `track.instrumentDetermined` (read-only) and `track.postRecordCommands` (typed list, fact 233). |
| Device buses (monitor section) | `/devices/<d>/buses/*` | design | L | Apollo / Volt / Rio hardware; hardware-specific tapers. |
| `color_modified`, legacy meter binding, bus plug-in by property write, console tracking gate | — | skip | — | LUNA-side flags, legacy paths, LUNA Play entry logic. |

### Editing, automation, analysis

| Feature | Wire | Class | Size | Note |
|---|---|---|---|---|
| Write or trim a control over a range | post `write_control_values` / `trim_control_values {controls[], start?, stop?}` | port | S–M | LUNA adds anchor breakpoints at the edges. |
| Clip-gain automation | `clips/<c>/controls/<gain>` with the existing breakpoint commands | port | M | Model the clip's controls; port the gain evaluator (`gain-evaluation.ts`). |
| Cross-track move | post `move_clips {playlists: [{source, destination}], move_automation}` | port | S | `moveClips` covers same-track only. |
| Warp markers | `clips/<c>/warps/*` (start ticks, source_start ns); post `set_warp`, `delete_warp`, `remove_tce` | port | M | `commit_tce` / `revert_tce` render destructively: design. |
| MIDI selection operations | ctx post `midi_operation` (velocity, duration, legato, reverse, transpose, invert) | port | S | The SDK already models the note selection it acts on. |
| Jobs: wait for a launched job | `/jobs` (removed in the turn it goes terminal; launch replies carry no job uid) | port | M | `Job.done()`, correlate a launch, latch the terminal state. Needed by every analysis below. |
| Chord detection | ctx post `extract_chords {clip_uid?}` (job `chord_extraction`) | port | S | Results land in `session.chords`. After the jobs helper. |
| Lyric transcription | ctx post `extract_lyrics {clip_uid?, provider?}`; `/lyric_transcription` providers | port | S | Results land in `session.lyrics`. After the jobs helper. |
| Per-source analysis results | `/workspace/sessions/<pkg>/audio/<src>/analysis/{key,tempo,instrument,transients,chord}` | port | M | Plus the overview `count` / `md5` as watched props, so a growing recording needn't poll. |
| Per-source tempo / lyrics files | `analysis/tempo/file/data`, `analysis/lyrics/file/data` (seconds) | design | M | Formats unprobed; the lyrics file may duplicate `session.lyrics`. |
| Tempo detection | ctx post `extract_tempo {mode: new_from_* \| apply_index \| done}`; results on the command node | design | L | Follow-up: `session.musical.detectTempo()` (detection methods are `detect…`, DESIGN.md). |
| Stem separation | ctx post `separate_stems`; `/stem_separation` providers, progress | design | L | Held for now (decision 5): model downloads, long-running, feature-keyed. |
| Insert a clip at a time | `insert_clip {location, duration}` in ns | design | S | The SDK places in ticks; convert in the SDK or forward. |
| Spot range, trim's drag-only fields, multi-control breakpoint batches, `get_automode_on_tracks`, engine analytics | — | skip | — | Covered another way or LUNA's own UI. |

### Devices and inputs

| Feature | Wire | Class | Size | Note |
|---|---|---|---|---|
| Watchable inputs | `/devices/*/inputs/*` (name, type, stem_format, channel index, device channels, in_use, io_desc) | port | M | `luna.audioInputs()` is a one-shot read without hotplug or `in_use` changes; becomes `Device.inputs`. |
| Input analyses | set `<kind>_analysis_enabled`; subscribe `signal_level_peak`, `tempo`, `instrument`, `stereo_detect`, `spectrum` | port | M | Record-readiness, live tempo, instrument detection. Shared engine state: restore on dispose. |
| Device outputs | `/devices/<d>/outputs/*` (name, io_type, stem_format) | port | S–M | For routing and output pickers. |
| Active audio engine (read) | `/active_audio_engine` | port | S | Lets an Add On tell when audio is down. |
| Audio device selection | set `/preferences/audio_device_prefs` | skip | — | Read-only (decision 4): it changes the user's device globally. |
| `io_desc` write | set | skip | — | Read-only (decision 4): it re-points an input to other hardware channels. |
| Jack detect, Volt / Apollo detection, Mixer Helper, webcam | — | skip | — | Hardware onboarding or browser-only. |

### Workspace, presets, preferences

| Feature | Wire | Class | Size | Note |
|---|---|---|---|---|
| Add On preferences | post `/preferences/init_preference {context, preference}`; set `/preferences/<ctx>/<pref>` | port | M | Done: `luna.preferences.context(name)`, any context, documented as shared and unprotected (fact 232). Review asked for it not to be Add On specific. |
| Tag a session; find templates by tag | post `/workspace/add_tag`; `templates({ tag, factory })` | port | S | Factory template uids are restamped at build time, so tags are steadier. |
| Preset favourite, description | set `.../presets/<uid>/favorite`; preset `description` | port | S | `PresetRow.favorite` is read-only today. |
| A track preset's plug-ins | GET `/workspace/sessions/<preset>` `plugins` | port | S | Check requirements before `loadPreset`. |
| Track preset onto a bus | post `/presets/devices/track/load {is_bus}` | port | S | `Bus.loadPreset`. |
| Plug-in format | `/plugins/<id>` `sdk_type` | port | S | The server is the reliable source. |
| LUNA's own preset browser queries | `/presets/queries/*`, `preset_browser_toggle` | design | M | Mirrors LUNA's browser state. |
| LUNA preference contexts (`instrument_type`, `device_input`, `next_gen`) | — | skip | — | LUNA's and next_gen's own state. |

### `/gui`, definitions, helpers

| Feature | Wire | Class | Size | Note |
|---|---|---|---|---|
| Plug-in window in another window | `show_plugin {context_type}` | port | S | An Add On in an alt window can't target it today. |
| Progress suppression | post `add_/remove_progress_suppression` | port | M | For Add Ons with their own progress UI; app-wide, needs a watchdog. |
| Session storage path | `/gui/session_storage_path` | port | S | Read-only. |
| Save dialog release name | `release_save_dialog` (SDK) vs `release_file_chooser` (next_gen) | port | S | Verify which LUNA honours. |
| dB ↔ linear gain | pure | port | S | `Taper.toDb` is fader position, not gain. |
| Tick constants | pure (32nd–128th, dotted, triplet) | port | S | For grid and quantize Add Ons. |
| Insert slot helpers, LUNA extension ids, plug-in format from id | pure | port | S | `'instrument'` slot, `alias.console` → `console`, extension detection. |
| Runtime enums and error codes | pure (track, bus, folder, stem, session types; `ControlType`; `uasrv.*`) | port | S | Value lists for validation and docs. |
| Previous page, `catalog` / `universe` pages, `restore_session_page`, `show_luna_play_session` | — | skip | — | LUNA Play and LUNA's own navigation (decision 2). `gui.setPage()` now waits for the page and takes `SettablePage` (fact 236). |
| OAuth window, AAF import | `open_authorization`, `create_session_from_aaf` | skip | — | Not now (decision 7). AAF import is houston-only, so absent on wasm. |
| Set page with a route, dashboard and account commands, `can_open_ua_connect`, web-client owner, next_gen utils | — | skip | — | LUNA's own pages and next_gen internals. |

## Decisions (made 2026-11-23)

1. Add On preferences: yes, as a generic `luna.preferences.context(name)`; contexts are shared and
   unprotected, and the docs say so (changed in review from an Add On scoped `forAddOn(id)`).
2. Navigation: `gui.setPage()` waits until the window shows the page; no
   `showLunaPlaySession()`, previous page or Catalog, which are LUNA Play's and LUNA's own.
3. Clip effects: still open; find out whether `enable_clip_effects` is on in shipping builds.
   Optional parts of LUNA follow the existing `available(): Promise<boolean>` pattern (DESIGN.md);
   no feature-key reader.
4. Global or analysis writes: audio device and `io_desc` read-only; `rec_play_mode` and
   `tempo_established` skipped; `instrument_determined` read-only; `post_record_commands`
   ported as a typed list.
5. Long-running analysis: tempo detection is a follow-up (`detectTempo()`); stem separation held.
6. Shapes: `node.commandEnabled()` and read-only `luna.errors` done; spectrum streams a follow-up.
7. OAuth window and AAF import: not ported.
