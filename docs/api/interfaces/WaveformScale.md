# Interface: WaveformScale

Options for [waveformColumns](../functions/waveformColumns.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="gain"></a> `gain?` | `readonly` | `number` | Linear multiplier on every value, clipped to -1..1; default 1. Must be finite and > 0. LUNA multiplies by its waveform zoom and the clip's gain: `session.context.waveformZoom.value * 10 ** (clip.gain.value / 20)`. |
