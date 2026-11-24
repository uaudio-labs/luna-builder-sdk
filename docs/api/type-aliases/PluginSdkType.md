# Type Alias: PluginSdkType

```ts
type PluginSdkType = PluginFormat | "";
```

A plugin's format as LUNA reports it (`sdk_type`, fact 177): a [PluginFormat](PluginFormat.md), or `''`
when LUNA cannot tell (a `cloud:` plugin while cloud clip effects are off).
