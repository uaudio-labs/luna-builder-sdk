# Function: bindDrag()

```ts
function bindDrag(
   el, 
   controls, 
   options): ControlBinding;
```

Bind a div or canvas knob (or fader, or one axis of an XY pad) to one control, or to several
that move together. Dragging captures the pointer and moves the value by pointer travel;
arrow, Page and Home/End keys nudge it; double-click resets it. The element becomes a
focusable `role="slider"` whose `aria-valuenow` and `aria-valuetext` follow the control.
Writes go to the controls' `normalized` view, and the first control's value is the one shown.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `el` | `HTMLElement` |
| `controls` | \| [`Control`](../classes/Control.md) \| readonly [`Control`](../classes/Control.md)[] |
| `options` | [`DragOptions`](../interfaces/DragOptions.md) |

## Returns

[`ControlBinding`](../interfaces/ControlBinding.md)

## Example

```ts
const knob = document.createElement('div');
Luna.bindDrag(knob, track.pan, {
  label: 'Pan',
  axis: 'both',
  pixelsPerUnit: 160,
  render: (v) => knob.style.setProperty('--turn', `${(v - 0.5) * 300}deg`),
});

// a stereo bus's two pans on one knob
Luna.bindDrag(knob, bus.main.pans, { render });
```
