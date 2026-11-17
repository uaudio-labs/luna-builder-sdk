# Drawing at playback rate

While LUNA plays, some values change many times a second: every meter (about 30 updates a
second each) and `transport.location` (about 35). An Add On that redraws on each of them can
look fine in Chrome and still stutter inside LUNA, where the page runs in the macOS system web
view (WebKit). WebKit rasterises repaints in one GPU process shared by every page in LUNA, and
a page that repaints a large area at playback rate saturates it (fact 145). What a user then
sees: choppy meters, a jerky playhead, sluggish clicks, and only while playing.

Measured on a 22-track session: a mixer page that set each meter bar's `height` and redrew
its timeline canvas to move the playhead fell to about 8 frames a second in LUNA, with meters
stepping every 110-130 ms, while the same page held 60 in Chrome. Moving both by transforms
alone brought it back to 60 with meters stepping every 33 ms, LUNA's own rate.

## The rules

1. **Move things with `transform`, never with layout.** Changing `height`, `width`, `top`,
   `left`, `bottom` or `right` makes the browser lay out and repaint; changing `transform`
   only moves an already painted layer. Give the moving element `will-change: transform`.
2. **Keep the playhead off the canvas.** Draw the scene (ruler, clips, waveforms) on the
   canvas, and put the playhead in its own element over it, moved by `translateX`. Redraw the
   canvas only when what it shows changes: an edit, a zoom, a scroll, the view paging along.
3. **Redraw at most once per frame.** `onChange` listeners already run once per animation
   frame however many pushes arrived, so draw from the listener and add no timers. When
   several props feed one canvas, schedule the redraw with `requestAnimationFrame` and skip
   it if one is already scheduled.
4. **Write the DOM only when the value moved.** `if (el.textContent !== text) el.textContent
   = text;` for counters and readouts; a rewrite that changes nothing can still repaint.
5. **Listen only to what is shown.** `meter.onChange` subscribes the meter while it has a
   listener; release it when the strip goes away (`Luna.Bindings` does this).

## A meter bar

A single colour bar can scale (`scaleY(level)` with `transform-origin: bottom`). A bar with a colour ramp (green, amber, red) cannot, or the ramp
would squash, so it slides a window over a full-height ramp instead: the outer `<i>` moves down
by the unlit share and its `<u>` moves back up by the same, so the colours stay put.

```html
<div class="meter"><i><u></u></i><b></b></div>
<style>
  .meter { position: relative; width: 6px; height: 160px; overflow: hidden; background: #26262c; }
  .meter i, .meter u, .meter b { position: absolute; inset: 0; transform: translateY(100%); will-change: transform; }
  .meter i { overflow: hidden; }
  .meter u { transform: translateY(-100%); background: linear-gradient(to top, #3fae5a 0 70%, #e6c25a 70% 90%, #d44 90%); }
  .meter b::after { content: ''; position: absolute; left: 0; right: 0; top: -1px; height: 1px; background: #eee; } /* peak line */
</style>
```

```js
const [bar, peak] = [meterEl.querySelector('i'), meterEl.querySelector('b')];
const unlit = (l) => `${((1 - Math.min(1, l)) * 100).toFixed(1)}%`;
bindings.add(track.meter.onChange(() => {
  const off = unlit(track.meter.max);
  bar.style.transform = `translateY(${off})`;
  bar.firstChild.style.transform = `translateY(-${off})`;
}));
// A held peak line moves the same way: peak.style.transform = `translateY(${unlit(held)})`.
```

`examples/mixer.html` has the full version: a bar per stream, a held peak line and the clip
light. `examples/sends.html` scales a single-colour bar with `scaleX`.

## A playhead

```html
<div class="tl" style="position: relative">
  <canvas id="timeline"></canvas>
  <div id="playhead" hidden style="position: absolute; top: 0; bottom: 0; left: 0; width: 2px;
       background: #ff5a5a; pointer-events: none; will-change: transform"></div>
</div>
```

```js
function placePlayhead() {
  const tick = session.transport.location.value?.tick;
  const shown = tick !== undefined && tick >= view.start && tick <= view.end;
  playhead.hidden = !shown;
  if (shown) playhead.style.transform = `translateX(${((tick - view.start) / (view.end - view.start)) * canvas.clientWidth}px)`;
}
session.transport.location.onChange(placePlayhead);  // never a canvas redraw
// Call placePlayhead() at the end of the canvas redraw too, so a zoom or scroll moves it.
```

`examples/arrangement.html`, `examples/clip-editor.html` and `examples/ruler.html` do this.
A view that follows the playhead redraws the canvas only when it pages along.

## Measuring inside LUNA

Check in LUNA, with the largest session you have, while it plays. Chrome numbers do not carry
over.

- **CPU:** in Activity Monitor (or `ps -Ao pid,%cpu,comm | grep WebKit.GPU`), the
  `com.apple.WebKit.GPU` process LUNA started should sit well below 100% while playing and
  near 0 when stopped. Pinned near 100% means a repaint is running at playback rate.
- **Frame rate:** count `requestAnimationFrame` callbacks for a few seconds; about 60 a second
  is smooth, and a page that drops only while playing is repainting too much.
- **Bisect:** hide one part of the page at a time (`display: none`) while playing and watch the
  GPU process; the part whose removal brings it down is the one to move to transforms.
