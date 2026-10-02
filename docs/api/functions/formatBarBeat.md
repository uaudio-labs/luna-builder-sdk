# Function: formatBarBeat()

```ts
function formatBarBeat(bb): string;
```

Format a [BarBeat](../interfaces/BarBeat.md) as LUNA's counter shows it, `1|1|000`: it converts the engine-tick
remainder to display ticks (960 per beat) and zero-pads them. Pass `location.bar_beat` or
`timeline.barBeat(tick)` as they are; do not convert `tick` first. For a bare tick,
`timeline.formatBarBeat(tick)` does both steps.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bb` | [`BarBeat`](../interfaces/BarBeat.md) \| `undefined` |

## Returns

`string`

## Example

```ts
Luna.formatBarBeat(t.location.value?.bar_beat);                 // "2|2|120"
Luna.formatBarBeat(session.musical.timeline.barBeat(tick));     // same as timeline.formatBarBeat(tick)
```
