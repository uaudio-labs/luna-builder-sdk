# Type Alias: InsertSlot

```ts
type InsertSlot = 
  | "console"
  | "instrument"
  | "reserved_0"
  | `effect_${number}`
  | `record_fx_${number}`
  | "sidechain_filter"
  | string & object;
```

An insert slot's name, as LUNA writes it in `insert_type` and in the effect's path.
`'instrument'` is an instrument track's instrument slot (`effects/instrument`), ahead of the
`effect_N` inserts. [isRecordFxSlot](../functions/isRecordFxSlot.md) and [insertSlotForAlias](../functions/insertSlotForAlias.md) help with the rest.
