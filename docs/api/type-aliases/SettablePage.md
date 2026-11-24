# Type Alias: SettablePage

```ts
type SettablePage = 
  | "mixer"
  | "timeline"
  | "home"
  | "addon"
  | "dashboard"
  | "catalog"
  | "universe";
```

The pages [Gui.setPage](../classes/Gui.md#setpage) can switch a window to (fact 236). `catalog` and `universe`
are in the main window only, and only in LUNA builds that have them; elsewhere LUNA
answers `uasrv.not_implemented`.
