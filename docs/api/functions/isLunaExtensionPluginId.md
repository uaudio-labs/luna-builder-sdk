# Function: isLunaExtensionPluginId()

```ts
function isLunaExtensionPluginId(pluginId): boolean;
```

Whether a plug-in id is one of [LUNA\_EXTENSION\_PLUGIN\_IDS](../variables/LUNA_EXTENSION_PLUGIN_IDS.md). The test is by exact id,
so the list must track LUNA's.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |

## Returns

`boolean`

## Example

```ts
Luna.isLunaExtensionPluginId('uaudio_luna_channel');    // true
Luna.isLunaExtensionPluginId('com.uaudio.uadx.1176');   // false
const plugins = slots.filter((e) => !Luna.isLunaExtensionPluginId(e.pluginId.value ?? ''));
```
