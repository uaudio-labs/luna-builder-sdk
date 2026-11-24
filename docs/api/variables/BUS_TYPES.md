# Variable: BUS\_TYPES

```ts
const BUS_TYPES: readonly BusType[];
```

The named [BusType](../type-aliases/BusType.md)s LUNA defines. Cue buses are not in it: LUNA numbers them
`cue_0` .. `cue_63` ([MAX\_CUE\_BUSES](MAX_CUE_BUSES.md)), which [parseBusType](../functions/parseBusType.md) accepts. `headphone`
is a device bus (Volt), not one a session holds.

## Example

```ts
Luna.BUS_TYPES.includes('aux');   // true
```
