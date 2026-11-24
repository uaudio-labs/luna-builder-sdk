# Type Alias: PluginFormat

```ts
type PluginFormat = "vst" | "vst3" | "au" | "aax" | "uad2" | "uadx" | "cloud" | "localml";
```

A plug-in format, as LUNA names its SDK types: third-party `vst`, `vst3`, `au` and `aax`,
UA's `uad2` and `uadx`, and the server-hosted `cloud` and `localml` clip effects. A plug-in's
reported format (`plugin.sdkType`, [PluginSdkType](PluginSdkType.md)) is one of these, or `''`.
