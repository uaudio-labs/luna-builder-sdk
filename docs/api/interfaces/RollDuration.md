# Interface: RollDuration

A pre- or post-roll length: whole bars, then beats, then engine ticks, counted in the
session's time signatures where the roll falls.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="bars"></a> `bars` | `number` | - |
| <a id="beats"></a> `beats` | `number` | - |
| <a id="ticks"></a> `ticks` | `number` | Engine ticks (`Luna.TICKS_PER_BEAT` to a beat), as LUNA stores them. |
