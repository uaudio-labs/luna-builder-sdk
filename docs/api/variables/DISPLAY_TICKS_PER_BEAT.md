# Variable: DISPLAY\_TICKS\_PER\_BEAT

```ts
const DISPLAY_TICKS_PER_BEAT: 960 = 960;
```

Musical time units (EVIDENCE fact 16).

Every timeline position the engine exposes (`location.tick`, clip `start`/`stop`, loop points)
is in engine ticks. Display code usually wants display ticks (960 per beat).

## Example

```ts
const beats = location.tick / Luna.TICKS_PER_BEAT;
const displayTick = Math.floor((location.tick % Luna.TICKS_PER_BEAT) / Luna.TICKS_PER_DISPLAY_TICK);
const grid = Luna.triplet(Luna.THIRTY_SECOND_NOTE);   // note lengths, in engine ticks
```
