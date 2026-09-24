# Function: bindGesture()

```ts
function bindGesture(
   target, 
   controls, 
   options): Gesture;
```

Bracket every drag on `target` with `begin()`/`end()` on `controls` (one control, or all
the controls one element drives).

Only the primary button starts a drag, and a second pointer pressed during a drag is
ignored. The drag ends on the first of `pointerup` or `pointercancel` (on the element or
anywhere in its window), `lostpointercapture`, or the window's `blur`, and each control is
released exactly once.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | `EventTarget` |
| `controls` | \| [`Control`](../classes/Control.md) \| readonly [`Control`](../classes/Control.md)[] |
| `options` | [`GestureOptions`](../interfaces/GestureOptions.md) |

## Returns

[`Gesture`](../interfaces/Gesture.md)

## Example

```ts
const gesture = Luna.bindGesture(slider, control, {
  onEnd: () => { slider.value = String(control.normalized.value ?? 0); },
});
slider.addEventListener('input', () => control.normalized.set(Number(slider.value)));
// later
gesture.dispose();
```
