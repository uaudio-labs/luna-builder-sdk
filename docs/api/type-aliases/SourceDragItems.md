# Type Alias: SourceDragItems

```ts
type SourceDragItems = 
  | {
  path: string | readonly string[];
}
  | {
  session: Session;
  source:   | AudioSource
     | string
     | ReadonlyArray<AudioSource | string>;
};
```

What [startSourceDrag](../functions/startSourceDrag.md) drags: absolute paths, or a session's sources.
