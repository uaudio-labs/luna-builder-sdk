# Function: bindRange()

```ts
function bindRange(
   input, 
   control, 
   options): ControlBinding;
```

Bind a native `<input type="range">` to `control`: touch on press, write on `input`, follow
LUNA outside a drag, settle on LUNA's value on release, double-click to reset. Keyboard
changes the browser makes are one-shot writes, which the control brackets itself.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `HTMLInputElement` |
| `control` | [`Control`](../classes/Control.md) |
| `options` | [`RangeOptions`](../interfaces/RangeOptions.md) |

## Returns

[`ControlBinding`](../interfaces/ControlBinding.md)

## Example

```ts
const fader = document.createElement('input');
fader.type = 'range';
fader.min = '0'; fader.max = '1000';
Luna.bindRange(fader, track.gain, {
  onBegin: () => strip.classList.add('adjusting'),
  onEnd: () => strip.classList.remove('adjusting'),
});

// units instead: a trim input from -20 to +20 dB
Luna.bindRange(trim, track.gainTrim, { view: 'real' });
```
