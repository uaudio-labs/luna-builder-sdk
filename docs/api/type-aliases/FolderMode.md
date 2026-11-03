# Type Alias: FolderMode

```ts
type FolderMode = "none" | "summing" | "container";
```

A bus's folder mode (fact 136). `'summing'`: a folder track whose children's main outputs go
to it, so it is their bus. `'container'`: a folder that only groups; its children route past
it to the nearest summing folder above, else the master. `'none'`: an ordinary bus.
