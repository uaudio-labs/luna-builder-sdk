# LUNA Add On ideas

Eleven things to ask a coding agent for, with the `ua-luna-builder` plugin installed and
LUNA running. They work in Claude Code or Codex.

Paste one into your agent. Every prompt but the second works in whatever session you have
open; the second creates a session of its own, the way LUNA's factory templates do
("Songwriter"), and LUNA is single-session, so the agent will ask before it closes the one
you have open. Prompts 3, 4 and 6–11 want a session with a few audio tracks and clips in it;
prompt 5 makes itself a MIDI clip if you have none; prompt 6 arms a track and rolls the
transport, and asks first. Plugins are named by category so the agent picks from what you
have licensed.

1. **Hello, LUNA.**
   > Build a LUNA Add On with one big button that mutes and unmutes the main output and
   > shows its current state, even when someone toggles it in LUNA. Install it and tell me
   > where to find it in LUNA's menus.

2. **Songwriter.**
   > Create a new session called "Songwriter" with a mono Vocal track, a stereo Piano
   > track and a stereo Acoustic Guitar track. Put a compressor and a plate reverb on the
   > vocal and an EQ on the guitar, using plugins I have licensed. Then build a LUNA Add
   > On with one strip per track (fader, meter, mute, solo), the vocal compressor's
   > input, output and ratio, and the reverb's decay and mix as knobs that show LUNA's own
   > readouts. Verify it and install it.

3. **Arrangement view.**
   > Build a LUNA Add On that draws my open session as a timeline: one lane per track, a
   > bar|beat ruler through the tempo map, every clip as a block with its name and its
   > waveform drawn from LUNA's overview data at the current zoom, and the playhead. It
   > must follow LUNA without a refresh: when I trim, move, rename or delete a clip in
   > LUNA, or import audio, the page updates by itself. Where LUNA has no analysis for a
   > source, draw the clip's outline and say so; never draw silence. Prove the live follow
   > from a second client, put back anything it changed, and install it.

4. **Markers and clips.**
   > Build a LUNA Add On that lists every marker and every clip in my session with its
   > position in bars|beats and minutes:seconds computed by the SDK, and shows the
   > playhead the same way next to LUNA's own readout so I can see they agree. Clicking a
   > marker or a clip moves the playhead there. From the page I can add a marker at the
   > playhead, rename it, nudge it a bar either way and delete it; and rename a clip,
   > nudge it a beat either way, trim a beat off its end and delete it. Each of those is
   > one undo entry, and whatever I had selected in LUNA is still selected afterwards.
   > Add an "Outline" button that puts a marker named after each clip at its start,
   > skipping positions that already have a marker, all as a single undo entry. Verify
   > from a second client, including one Undo reversing each action, and put everything
   > back.

5. **Piano roll and velocities.**
   > Build a page with a live piano roll over a MIDI clip I pick from my session, following
   > every note edit made in LUNA without a refresh. If the session has no MIDI clip, add
   > an instrument track and write a bar of notes to work on, and tell me you did. Add a
   > "Scale velocities" control that multiplies every note's velocity in the clip by a
   > percentage as a single undo entry, and a "Mute notes below" velocity threshold, also
   > one undo entry. Whatever I had selected in LUNA must still be selected afterwards.
   > Verify from a second client, including one Undo reversing each action.

6. **Tracking panel.**
   > Build a LUNA Add On for tracking on one track I choose: show its input (pick from
   > LUNA's audio inputs), its arm and monitoring state, LUNA's record button and count-in,
   > and a Punch button that records for a number of bars from a start bar I type, then
   > lists the finished take with its waveform. Add a drop zone: drop an audio file on it
   > and it uploads to LUNA with a progress bar and lands as a clip at the playhead on
   > that track; a .mid file becomes a MIDI clip. Ask me before arming or rolling the
   > transport, never record onto any other track, and disarm when done. Verify each
   > result from a second client.

7. **Auto-pan.**
   > Build a LUNA Add On called "Auto-pan": pick a track, a range in bars, a rate in
   > beats per cycle and a depth from 0 to 1, and it writes pan automation (both pan
   > lanes on a stereo track) that sweeps left and right across that range as one undo
   > entry, replacing whatever breakpoints were in the range. Draw the lanes live so they
   > follow breakpoints I drag in LUNA, let me nudge a breakpoint's time or value on the
   > page and delete one with a click, one undo entry each, and show and set the track's
   > automation mode. Verify from a second client that the breakpoints LUNA stores match
   > what the page drew, and that one Undo removes the sweep.

8. **Cue and send mixer.**
   > Build a LUNA Add On with a headphone mix and an effects send for every track.
   > Headphones: each track's CUE 1 level and pan with pre-fader and mute. Effects: each
   > track's first send with level, pre-fader, enable, its meter and where it goes, and a
   > picker that routes the send to any bus in the session or clears it, one undo entry
   > per change. If there is no effects bus, offer to create one called "FX" with a reverb
   > on it. A second client must follow a level change and a route change, and you must
   > put the routing back the way you found it after verifying.

9. **Scenes.**
   > Build a LUNA Add On called "Scenes" for whatever session is open: it captures every
   > channel's fader, pan, mute and solo and every insert parameter into a named scene,
   > lists the scenes with what differs from the current mix, and recalls one as a single
   > undo entry. Scenes persist across reopening the add-on. Test it on a session with a
   > few plugins loaded.

10. **Session report.**
    > Write a Node script that prints a report of my open session: tracks and buses with
    > their levels, inserts, automation mode and how many breakpoints each fader and pan
    > lane holds; every send that is routed and where it goes; the tempo map and time
    > signatures; each marker's name and position in bars|beats and seconds; each clip's
    > position and length, and for a MIDI clip its note count and pitch range; and every
    > render LUNA currently lists with its state. Read-only: it must not change anything.
    > Then run it and show me the output.

11. **Stems.**
    > Build a LUNA Add On called "Stems" that bounces every track in my session to its own
    > file from one click, one render after another, over the whole song or a bar range I
    > type: show each stem's progress and time remaining while it renders, let me abort
    > one, and when they finish list the new sources with their lengths. Then add an
    > "Export mix" button that runs LUNA's own export of the main bus and shows me where
    > the file went. Verify from a second client that the renders LUNA lists match the
    > page and that a bounce added nothing to my session but its sources.

Each of these ends with the agent serving the page or running the script, proving it against
LUNA from a second client, and for an add-on handing you a folder to symlink into LUNA's Add
Ons directory (the first install may need one `sudo` command, which the agent will give you
rather than run).

Two things to know before you ask: an agent cannot open LUNA's Window menu, so it will ask
you to confirm the add-on appears there; and prompt 2 leaves its session open and saved.

## What each one leans on

Pointers for an agent that wants the shortest path. The API reference is `docs/api/`, and
`docs/QUICKSTART.md` covers the basics of every one of these.

| Prompt | The SDK it wants |
|---|---|
| 1 Hello | `session.master.mute`, `examples/addon/` as the starting point |
| 2 Songwriter | `luna.sessions.create`, `session.newTrack`, `channel.insert`, `luna.plugins`, `effect.controls` |
| 3 Arrangement | `session.playlists`, `Luna.clipAudio`, `Luna.Waveforms`, `Luna.audioNsAtTick`, `Luna.kindForScale`, `Luna.waveformColumns`, `Luna.waveformLanes`, `session.musical.timeline`; `examples/arrangement.html` |
| 4 Markers and clips | `session.markers`, `clip.trim`, `session.moveClips`, `session.transaction`, `context.snapshot`/`restore`; `examples/editor.html` |
| 5 Piano roll | `clip.midi.notes`, `midi.setVelocities`, `midi.setMuted`, `midi.deleteNotes`; `examples/pianoroll.html`, `examples/editor.html` |
| 6 Tracking | `luna.audioInputs`, `session.record`, `track.recordEnabled`, `session.uploadFile`, `session.importFile`; `examples/import.html` |
| 7 Auto-pan | `control.automation` (`insert`/`clear`/`move`/`setValue`), `track.setAutomationMode`; `examples/automation.html` |
| 8 Sends | `channel.outputs` (`assign`/`unassign`/`retarget`/`moveTo`), `output.controls`, `output.meter`; `examples/sends.html` |
| 9 Scenes | `channel.controls`, `effect.controls`, `session.transaction`, browser `localStorage` |
| 10 Report | every read-only surface, plus `luna.renders`; the `check-*.mjs` scripts are the model |
| 11 Stems | `session.bounce`, `session.exportMain`, `render.progress`, `render.done`, `render.abort`; `examples/jobs.html` |

## Proving it

Every one of these asks the agent to verify against LUNA rather than assert. Three lanes:

- **No LUNA**: `Luna.MockEngine` fixtures, which is what `ua-builder new` scaffolds and what
  `skills/test-add-on` covers.
- **Against LUNA**: the `check-*.mjs` scripts in `examples/` each open two connections and
  prove that one client sees what the other did. They are the pattern to copy for "verify
  from a second client".
- **In LUNA**: `ua-builder install` symlinks the Add On into LUNA's Add Ons folder; LUNA
  rescans, so no restart is needed.

Anything the agent changes in the session, it should put back — and say what it could not,
because the wire cannot drop an undo entry.
