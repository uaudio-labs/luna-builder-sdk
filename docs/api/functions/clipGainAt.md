# Function: clipGainAt()

```ts
function clipGainAt(breakpoints, tick): number | undefined;
```

The gain in dB at `tick` (clip-relative ticks) from a clip gain lane, the way LUNA's clip
compiler evaluates it (fact 228): linear in dB between breakpoints, so 0 dB and -6 dB read
-3 dB half way; the first and last values hold outside the end points, with no slope carried
past them; two breakpoints at one tick are a step, the later one winning from that tick on.
`undefined` for an empty lane: LUNA then plays the clip's static `gain`.

Breakpoints are sorted by tick here, so `automation.breakpoints` or any order will do.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `breakpoints` | readonly [`Breakpoint`](../interfaces/Breakpoint.md)[] |
| `tick` | `number` |

## Returns

`number` \| `undefined`

## Example

```ts
Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 960, value: -6 }], 480); // -3
Luna.clipGainAt([{ tick: 0, value: 0 }, { tick: 960, value: -6 }], 5000); // -6, held
Luna.clipGainAt([], 0);                                                    // undefined
```
