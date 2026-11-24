# Variable: LUNA\_EXTENSION\_PLUGIN\_IDS

```ts
const LUNA_EXTENSION_PLUGIN_IDS: readonly string[];
```

The plug-in ids of LUNA's extensions: plug-ins LUNA hosts as part of itself (the summing
consoles, tape, the sampler, the hardware insert, LUNA Channel), whose window is LUNA's own.
This list mirrors LUNA's and must track it: an extension added in a later LUNA is not in it
until the SDK is updated.
