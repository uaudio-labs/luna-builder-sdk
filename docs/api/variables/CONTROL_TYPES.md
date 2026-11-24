# Variable: CONTROL\_TYPES

```ts
const CONTROL_TYPES: readonly ["gain", "pan", "pan_left", "pan_right", "mute", "record_mute", "solo", "solo_safe", "parameter", "audio_source", "pre_fader", "enabled", "gain_trim", "input_trim_left", "input_trim_right", "input_trim_invert_left", "input_trim_invert_right", "input_trim_mono", "input_trim_invert_mono", "input_trim_link", "sidechain_input_trim", "latency_offset", "mix_to_mono", "preamp_gain", "preamp_hiz", "preamp_invert", "preamp_48v", "preamp_limitor", "preamp_compressor", "preamp_max_compressor", "preamp_tone", "preamp_pad", "preamp_low_cut"];
```

Every control type LUNA defines, as it writes them in `control_type` (`UA::ControlTypeToString`).
The list mirrors LUNA's and must track it; [ControlType](../type-aliases/ControlType.md) stays open (`| string`) so a
type a later LUNA adds still reads.

## Example

```ts
Luna.CONTROL_TYPES.includes(control.controlType.value as Luna.KnownControlType);
```
