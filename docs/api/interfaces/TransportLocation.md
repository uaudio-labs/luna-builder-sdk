# Interface: TransportLocation

The `location` property of a session.

## Extends

- [`Location`](Location.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="bar_beat"></a> `bar_beat?` | [`BarBeat`](BarBeat.md) | - | [`Location`](Location.md).[`bar_beat`](Location.md#bar_beat) |
| <a id="min_sec"></a> `min_sec?` | `object` | The playhead as LUNA's own MIN:SEC counter shows it: whole `minutes`, and `seconds` within the minute (fact 96). Present on the engine's `location` pushes. On the wasm engine `seconds` is fractional (a push read `0.52625`); native LUNA's precision is not yet re-measured, so floor it for display (`Luna.formatMinSec` does). For wall-clock seconds derived from the tick, use [Transport.seconds](../classes/Transport.md#seconds). | - |
| `min_sec.minutes` | `number` | - | - |
| `min_sec.seconds` | `number` | - | - |
| <a id="playing"></a> `playing?` | `boolean` | - | - |
| <a id="tempo"></a> `tempo?` | `number` | - | - |
| <a id="tick"></a> `tick` | `number` | - | [`Location`](Location.md).[`tick`](Location.md#tick) |
| <a id="time_signature"></a> `time_signature?` | `object` | - | - |
| `time_signature.denominator` | `number` | - | - |
| `time_signature.numerator` | `number` | - | - |
