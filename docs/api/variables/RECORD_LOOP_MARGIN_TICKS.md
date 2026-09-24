# Variable: RECORD\_LOOP\_MARGIN\_TICKS

```ts
const RECORD_LOOP_MARGIN_TICKS: number;
```

How far past the punch point [Session.record](../classes/Session.md#record) widens `loop_stop` when it has to.
One bar of 4/4 at any tempo is plenty: the gate is on the punch point, not the take's end.
