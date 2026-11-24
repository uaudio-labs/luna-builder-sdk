---
name: edit-clips
description: Build or fix a LUNA Add On that draws a timeline of clips, waveforms, MIDI notes or fades, or that lets the user move, trim, split, fade or crossfade clips. Use for any clip or fade display or editing work, before writing the code.
---

# Draw and edit clips and fades

Clip and fade work goes wrong quietly: LUNA answers success to edits it ignores (fact 71), and
the raw clip list is not what plays. Read `docs/CLIPS.md` first; each step below names the
section that explains it. `examples/clip-editor.html` is a complete, tested editor to copy
from.

## Steps

1. **Load what plays.** For each lane, `await lane.clips.load()` and
   `await lane.compiledClips.load()`. Draw, hit-test and select **segments** from
   `lane.compiledClips.inOrder()`, never `lane.clips` (CLIPS.md §1). Follow
   `lane.clips.onChange`, `lane.compiledClips.onChange` and each segment's props.
2. **Draw audio** with `Luna.compiledClipAudio(timeline, seg, clip, session.sources)` and
   `Luna.audioNsAtTick(timeline, seg, audio, tick)`. When it returns `undefined` while
   `seg.needsRender.value` is true, keep the waveform you drew last for that clip and span.
   Colour by `track.color`. Draw MIDI clips' notes from `clip.midi.notes` (§2).
   While recording, draw each track's take in progress from `session.recordTakes` (§10): an
   audio take's `take.audio` like a clip's, a MIDI take's `take.notes` (a held note runs to
   `take.stop`).
3. **Draw fades** in a second pass over all segments, fade-in rising, fade-out falling, a
   crossfade as two crossing ramps (§3). No fades on MIDI or video clips.
4. **Select** the clicked segment, `{ clipUid, start }`, not the clip (§4).
5. **Edit** with the segment verbs where clips can overlap: `seg.move(toTick, { copy })` for a
   drag (LUNA splits or trims the clip beneath, fact 119), `seg.crossfade(next, ...)` /
   `seg.removeCrossfade(next)` at an edit (fact 117). Clip verbs for the rest:
   `setFadeIn`/`setFadeOut`/`removeFadeIn`/`removeFadeOut`, `split`, `slip`, `setMuted`,
   `trim`; `session.setFadeCurve(fades, ...)`; `lane.heal`/`addFades`/`deleteFades` (§5-7).
   Each resolves once LUNA shows the change; do not post raw commands for these.
6. **Interaction** (§8): hit-test the model, one edit in flight, keep a drag's preview until
   its result is painted, keep the view's start as a tick, and draw pointers as SVG images
   (inside LUNA `w-resize`/`e-resize` show nothing, fact 118).
7. **Test** on `Luna.MockEngine` (it models compiled clips, per-piece renders, fades, the
   move split/trim), waiting on `engine.settled()`, `luna.settled()` and the page's own state,
   and make each test fail once without its fix (§9; skills/test-add-on).
8. **Verify on LUNA** (skills/verify-add-on): with a clip on top over the middle of another,
   drag each piece, crossfade both edits, and watch for flicker. Remove the renderings your
   checks created once `session.sources` stops growing.

## Pitfalls that cost a round trip

- `clip.move` moves the clip's whole span, so a clip on top of it moves too.
- `setFadeIn(len, { shape })` on an existing fade takes two undo steps (shape is applied
  only at creation).
- `lane.heal(start, stop)` includes a clip that starts exactly at `stop`.
- `addFades` and `clip.slip` work only on a track's active playlist.
- A raw `luna.raw.set` is not echoed to its writer: write through SDK props.
- `seg.reportsFades.value === false` means the LUNA cannot say, not that there are none.
- Redrawing the canvas on each `transport.location` push stutters inside LUNA while it plays
  (docs/DRAWING.md): draw the playhead as its own element over the canvas, moved by
  `translateX`, and redraw the canvas only when the scene or view changes.

## SDK feedback

If part of this workflow was harder than the SDK should make it, end your reply with the line
`LUNA BUILDER SDK IMPROVEMENT: <version>` (the `ua-builder` row of `ua-builder doctor`), followed
by a prompt that can be used to update the SDK to support the improved workflow.

Then ask the user whether to send the improvement to Universal Audio, and say that sending
it needs a GitHub account. If they agree, run
`ua-builder feedback improvement --title "<one-line summary>" --body-file -` with the prompt on
stdin (add `--luna-version <x.y.z>` when you know it). It opens a prefilled issue in their
browser for them to check and submit. A bug or feature request the user wants to report goes
the same way, as `ua-builder feedback bug` or `ua-builder feedback feature`.
