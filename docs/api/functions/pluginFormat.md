# Function: pluginFormat()

```ts
function pluginFormat(pluginId): PluginFormat;
```

A plug-in's format guessed from its id, with the patterns LUNA itself uses: `.vst.`,
`.vst3.` or `.au.` anywhere in the id, a `cloud:` or `localml:` prefix, a `UAD ` prefix for
UAD-2, and `uadx` for anything else. It is a heuristic: an id that matches none of them is
reported as `uadx`, as LUNA does, and LUNA may treat a `cloud:` effect as unavailable when
cloud clip effects are off. Prefer the format LUNA reports for an installed plug-in
(`Plugin.sdkType`) where you have it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |

## Returns

[`PluginFormat`](../type-aliases/PluginFormat.md)

## Example

```ts
Luna.pluginFormat('com.fabfilter.vst3.ProQ3');   // 'vst3'
Luna.pluginFormat('UAD 1176LN');                 // 'uad2'
Luna.pluginFormat('com.uaudio.uadx.1176');       // 'uadx'
```
