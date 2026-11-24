# Function: parseControlType()

```ts
function parseControlType(value): 
  | "gain"
  | "gain_trim"
  | "input_trim_left"
  | "input_trim_right"
  | "input_trim_mono"
  | "sidechain_input_trim"
  | "enabled"
  | "record_mute"
  | "parameter"
  | "mute"
  | "pan_left"
  | "pan_right"
  | "pan"
  | "solo"
  | "pre_fader"
  | "solo_safe"
  | "audio_source"
  | "input_trim_invert_left"
  | "input_trim_invert_right"
  | "input_trim_invert_mono"
  | "input_trim_link"
  | "latency_offset"
  | "mix_to_mono"
  | "preamp_gain"
  | "preamp_hiz"
  | "preamp_invert"
  | "preamp_48v"
  | "preamp_limitor"
  | "preamp_compressor"
  | "preamp_max_compressor"
  | "preamp_tone"
  | "preamp_pad"
  | "preamp_low_cut"
  | undefined;
```

A `control_type` value as one of [CONTROL\_TYPES](../variables/CONTROL_TYPES.md), or `undefined`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

  \| `"gain"`
  \| `"gain_trim"`
  \| `"input_trim_left"`
  \| `"input_trim_right"`
  \| `"input_trim_mono"`
  \| `"sidechain_input_trim"`
  \| `"enabled"`
  \| `"record_mute"`
  \| `"parameter"`
  \| `"mute"`
  \| `"pan_left"`
  \| `"pan_right"`
  \| `"pan"`
  \| `"solo"`
  \| `"pre_fader"`
  \| `"solo_safe"`
  \| `"audio_source"`
  \| `"input_trim_invert_left"`
  \| `"input_trim_invert_right"`
  \| `"input_trim_invert_mono"`
  \| `"input_trim_link"`
  \| `"latency_offset"`
  \| `"mix_to_mono"`
  \| `"preamp_gain"`
  \| `"preamp_hiz"`
  \| `"preamp_invert"`
  \| `"preamp_48v"`
  \| `"preamp_limitor"`
  \| `"preamp_compressor"`
  \| `"preamp_max_compressor"`
  \| `"preamp_tone"`
  \| `"preamp_pad"`
  \| `"preamp_low_cut"`
  \| `undefined`

## Example

```ts
Luna.parseControlType('preamp_gain');   // 'preamp_gain'
Luna.parseControlType('volume');        // undefined
```
