# Interface: BarBeat

A bar|beat position as the engine reports it in `location.bar_beat`, and as
`timeline.barBeat()` returns it. `tick` is in **engine** ticks (the remainder within the
beat), not display ticks; [formatBarBeat](../functions/formatBarBeat.md) does the conversion.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bar"></a> `bar` | `number` | - |
| <a id="beat"></a> `beat` | `number` | 1-based beat within the bar. |
| <a id="tick"></a> `tick` | `number` | Engine ticks into the beat, `0 <= tick < TICKS_PER_BEAT` (for a quarter-note beat). |
