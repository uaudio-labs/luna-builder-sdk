# Drawing and editing clips and fades

How to build an Add On that shows a timeline of clips and lets the user edit them and their
fades, the way LUNA does. Every rule here comes from a mistake that is easy to make and that
LUNA does not report: an edit LUNA ignores still answers success (fact 71). Read this before
writing any clip or fade code. `examples/clip-editor.html` puts all of it together, and
`examples/arrangement.html` is the read-only version.

## 1. Draw what plays: compiled clips, not clips

Clips on a playlist overlap: a clip on a higher layer hides the part of the one beneath it. So
`playlist.clips` is not what the user hears or what LUNA's timeline shows. LUNA resolves the
overlaps into **compiled clips**, segments that never overlap, and publishes them once a
client asks (fact 116):

```js
await lane.compiledClips.load();              // turns LUNA's publishing on for this lane
for (const seg of lane.compiledClips.inOrder()) {
  const clip = lane.clips.byId(seg.clipUid.value);   // the clip this piece is cut from
  seg.start.value, seg.stop.value;                   // ticks: what shows
  seg.fullStart.value, seg.fullStop.value;           // widened by any crossfade
  seg.fadeIn.value, seg.fadeOut.value;               // { start, stop, shape, curvature, crossfade, contributorClipUid } or undefined
}
lane.compiledClips.ofClip(clip.id);           // the pieces of one clip: none if hidden, several if split by one on top
```

- A clip with another clip on top of its middle shows as **two pieces**. Draw, hit-test and
  select pieces.
- `items` is in the order LUNA made them, not time order: use `inOrder()`.
- A LUNA that does not report fades has `seg.reportsFades.value === false`: draw no fades,
  offer no fade editing. Do not read that as "no fades".

## 2. Draw the right audio

Use `Luna.compiledClipAudio(timeline, seg, clip, session.sources)`, never `clipAudio(clip)`,
for a piece, and map ticks with `Luna.audioNsAtTick(timeline, seg, audio, tick)` anchored at
the piece.

- LUNA plays many clips from a **rendering**, not their file: when time-stretched, when they
  have clip effects, and when the file's sample rate differs from the engine's (a 48 kHz file
  on a 44.1 kHz engine). It renders **each piece separately**: a clip split by another on top
  has one rendering per piece, and the clip's own `renderSourceUid` names only one. Each
  piece's own rendering is `seg.renderSourceUid`; `compiledClipAudio` takes care of it.
- After an edit that changes a rendered piece (a crossfade, a trim), LUNA drops its
  rendering and names a new one 30-60 ms later. In that gap `seg.needsRender.value` is true
  and `compiledClipAudio` returns `undefined`. **Keep drawing the waveform you drew last for
  that clip over the same span** until the new rendering arrives, as LUNA's timeline does.
  Drawing an outline instead flickers; drawing the original file is wrong (wrong scale).
- `undefined` with nothing to hold means draw an outline, never silence.
- A rendering appears in `session.sources` seconds after it is named. A new upload's overview
  takes time too: redraw when `session.sources` changes.
- Colour waveforms (and MIDI notes) with the track's colour: `track.color.value` is
  `0xAARRGGBB`, so `rgb((c >>> 16) & 255, (c >>> 8) & 255, c & 255)`.
- A MIDI clip has no audio. Draw its notes: `await clip.midi.ready()`, then
  `clip.midi.notes.items` (clip-relative ticks; add `clip.start.value`), and redraw on
  `clip.midi.notes.onChange`. Scale pitch to the clip's own range so all its pieces agree.

## 3. Draw fades on top of everything

- Paint every segment's background and waveform first, then all fades and handles in a second
  pass. A crossfade reaches past the edit into the neighbour; painting it with its own
  segment lets the next segment cover that half.
- A fade-in ramp rises, a fade-out ramp falls, a crossfade is both crossing over the edit.
  Check the direction in drag previews too.
- Shade what a plain fade silences; draw a crossfade as its two ramps without shading, or the
  two halves' shading hides the audio.
- `fade.start`/`fade.stop` are absolute ticks. Fades only exist on **audio** clips.

## 4. Select pieces, not clips

A click in LUNA selects the piece that was clicked: its range, not the clip's. Where another
clip lies on top, highlighting the whole clip, or acting on it, is wrong. Keep the selection as
`{ clipUid, start }` of the piece and find it again with `lane.compiledClips.ofClip(uid)`
after each edit (an edit can move it). A piece that lands somewhere new after a move or copy
is what should stay selected.

## 5. Move what shows

| You want | Use | Why |
|---|---|---|
| Drag a clip, as LUNA does | `seg.move(toTick, { copy })` | Moves the piece; resolves to it at its new place (fact 119) |
| Move a clip whose whole span is free | `clip.move(toTick)` | Moves everything inside the clip's span, **including a clip lying on top of it** |
| Copy a piece after itself | `seg.move(seg.stop.value, { copy: true })` | `clip.duplicate()` copies the whole span |

When a piece of a clip that carries on under another clip moves, LUNA **splits** the clip at
the piece's edge if the clip shows again further along (the piece moves as a new clip, the
rest stays), and **trims** it to the piece if the rest is hidden (same clip, moved). Expect a
new clip uid after a move; select by what `move` returns.

## 6. Fades and crossfades

```js
await clip.setFadeIn(Luna.QUARTER_NOTE, { shape: 'equal_power' });   // at the clip's own start
await clip.setFadeOut(Luna.HALF_NOTE);
await left.crossfade(right, Luna.EIGHTH_NOTE, { align: 'center' });   // segments either side of an edit
await left.removeCrossfade(right);
await session.setFadeCurve([seg.fadeIn.value], { shape: 'linear', curvature: 0.3 });
await lane.addFades({ startTick, stopTick, lengthNs: 10e6 });          // every clip in a range
await lane.deleteFades(startTick, stopTick);
```

- **Crossfade between segments**, `seg.crossfade(next, ...)`, where `next.start === seg.stop`.
  That covers butted clips and overlapping ones: a clip on top over the middle of another
  meets it at two edits, where it begins and where it ends, and each takes its own crossfade.
  LUNA measures the offsets from the edit you hear, not from either clip's edge (fact 117).
  `clip.crossfade(next)` only handles butted clips.
- LUNA does not check that each clip's audio reaches past the edit by the part of the fade on
  the other side. Keep crossfades within the audio there is.
- A fade's **shape** set by `set_fade` applies only when the fade is created; the SDK sends a
  second command to change an existing one (two undo steps). `setFadeCurve` sets shape and
  curvature (-1..1) of existing fades absolutely; pass both halves of a crossfade.
- **Audio clips only.** LUNA answers a fade on a MIDI or video clip with success and changes
  nothing; the SDK refuses with `unavailable`. Give MIDI clips no fade handles or settings.
- `addFades` reaches the lane through its track, so only a track's **active** playlist.
- `deleteFades(start, stop)` removes fades lying wholly inside the range, looking only at
  segments that overlap it: to remove a crossfade wholly before or after its edit, the range
  must still cross the edit. `removeCrossfade` does that.

## 7. Other clip edits

- `clip.split(ticks)` cuts at ticks inside the clip; a crossfade at a cut is dropped, a
  fade-out moves to the last piece. `lane.split(ticks)` cuts every clip on the lane.
- `lane.heal(start, stop)` joins pieces that carry on in their source. `stop` is
  **inclusive**: a clip starting exactly at `stop` that continues the same audio is joined
  too.
- `clip.slip(byNs)`: positive moves the audio later (an earlier part of the file plays at the
  clip start). The step is one engine sample. Only on the track's active playlist; a slip past
  the start of the file is refused, past its end LUNA ignores it (`no_effect`).
- `clip.setMuted(bool)`, `clip.gain.set(dB)`, `clip.name.set(...)` write the clip directly,
  one undo step each. Write through the SDK's props: a raw `set` is not echoed to the writer,
  so its own model would not change. LUNA refuses a `set` of several properties at once.
- Commands that act on LUNA's selection (move, slip, heal) move the user's selection; the SDK
  puts it back.
- Select all, cut, copy, paste, clear and duplicate act on LUNA's selection as the user's keys do:
  `session.selectTimeline({ tracks, startTick, stopTick })` first (tracks, their playlists and
  focus `timeline`), then `session.context.cut()` and the rest. Paste lands at the range start
  and selects what it pasted; duplicate lands at the range end; `selectAll()` widens the range
  to everything on the selected tracks (fact 150). For keys, pass
  `Luna.EDIT_SHORTCUTS` and a `prepare` that calls `selectTimeline` to `Luna.Shortcuts`.

## 8. An interactive editor

- **Hit-test against the model**, not against the last painted frame: the frame can trail an
  edit while waveforms load, and a click then lands on where a clip used to be.
- **One edit at a time.** Each SDK edit resolves once LUNA shows it; block new gestures until
  then and show a busy pointer.
- **Keep a drag's preview up until the edit's result is painted.** Dropping it on release
  repaints the old state, and the clip snaps back for a frame or two.
- **Keep the view's start as a tick**, not a fraction of the content length: an edit that makes
  the session longer would otherwise slide the whole view. Move the scroll bar to follow.
- **Pointers**: inside LUNA, `w-resize`/`e-resize` are not drawn (fact 118). Draw edge, fade
  and crossfade pointers as small SVG images (`cursor: url("data:image/svg+xml,...") x y,
  fallback`).
- Put the crossfade handle on the edit, one per edit, drawn by the segment on its left; fade
  handles at a clip's own start and end only.
- Snap to the grid, but turn it off in tests that drag less than a grid step.

## 9. Testing it

- `Luna.MockEngine` models compiled clips, per-piece renders, fades, crossfades at edits, and
  the move split/trim. `new Luna.MockEngine({ compiledClipFades: false })` is a LUNA without
  fade data.
- Wait with `await engine.settled(); await luna.settled();` before asserting, and wait for the
  page's own state (its busy flag, what is under the pointer) rather than a fixed delay.
- A test should fail without the fix: run it once against the old code.
- To test a take in progress, arm a track and set `session.transport.recordEnabled` from the
  page's client; `engine.recordProgress(sessionUid, stopTick)` moves every take on and
  `engine.recordMidi(sessionUid, trackUid, events)` plays MIDI into one.
- Setting a clip property on the mock recompiles its lane; to imitate a state of LUNA's
  compiled clips (such as the render gap), set the compiled clip's properties alone.
- Then check against a running LUNA (skills/verify-add-on). Edits that touch rendered clips
  leave renderings behind: wait until `session.sources` stops growing, then remove the ones
  your test created.

## 10. Takes being recorded

A take is not on the playlist until recording stops. To draw it as it records, as LUNA's
timeline does, read `session.recordTakes` (fact 149):

- `session.recordTakes.forTrack(track)` is the track's take in progress, or none. Redraw on
  `session.recordTakes.onChange` (a take starts or ends) and on the take's `stop`.
- An audio take's `take.audio` is the file being written: draw it with `waves.range(audio.source,
  audio.startNs, audio.stopNs, kind)` and `Luna.audioNsAtTick(timeline, take, audio, tick)`,
  as a clip. Only full pages are cached, so each redraw reads the newest bins.
- A MIDI take's `take.notes` (ticks from `take.start`) grows as notes are played; a note with no
  `stopTick` is still held, so draw it to `take.stop.value`.
- When recording stops the take is disposed and the clip appears on the playlist; stop drawing
  the take then, and the clip takes its place.

```js
const take = session.recordTakes.forTrack(track)[0];
if (take?.audio) draw(await waves.range(take.audio.source, take.audio.startNs, take.audio.stopNs, 'coarse'));
else if (take?.isMidi) for (const n of take.notes.items) bar(take.start.value + n.startTick, take.start.value + (n.stopTick ?? take.stop.value - take.start.value), n.pitch);
```

## Checklist

- [ ] Lanes drawn from `compiledClips`, in `inOrder()`, with `compiledClipAudio`.
- [ ] The last waveform held while `needsRender` and no rendering.
- [ ] Fades drawn after all segments; directions right; crossfades as two ramps.
- [ ] Selection is a piece; drags use `seg.move`; crossfades use `seg.crossfade`.
- [ ] No fade handles or settings on MIDI clips; notes drawn instead.
- [ ] Preview held until painted; view start in ticks; SVG pointers.
- [ ] Takes being recorded drawn from `session.recordTakes`, if the page shows recording.
- [ ] Tested on the mock, the test failing without the fix, and checked on LUNA.
