# Type Alias: GuiPage

```ts
type GuiPage = 
  | "mixer"
  | "timeline"
  | "home"
  | "addon"
  | "dashboard"
  | "catalog"
  | "universe"
  | "lunaplay"
  | string & object;
```

A page a LUNA window shows. `lunaplay` is reported while LUNA Play shows but cannot be set:
[Gui.setPage](../classes/Gui.md#setpage) takes a [SettablePage](SettablePage.md) (fact 236).
