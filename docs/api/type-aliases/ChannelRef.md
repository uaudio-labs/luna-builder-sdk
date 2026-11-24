# Type Alias: ChannelRef

```ts
type ChannelRef = 
  | {
  id: string;
}
  | string;
```

A track, a bus, or its uid: anything with an `id`, or the id itself.

## Example

```ts
await group.addMembers([vocal, 'bus_7']);
```
