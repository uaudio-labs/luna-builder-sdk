# Type Alias: SoloMode

```ts
type SoloMode = "latching" | "exclusive";
```

How soloing a track treats the others (fact 157): `'latching'` adds it to what is soloed,
`'exclusive'` unsolos the rest (LUNA does that only inside a touch, fact 78).
