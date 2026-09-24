# Type Alias: SourceLookup

```ts
type SourceLookup = 
  | {
  byId: AudioSource | undefined;
}
  | readonly AudioSource[];
```

Anything that can resolve a source uid: `session.sources`, or a plain array.
