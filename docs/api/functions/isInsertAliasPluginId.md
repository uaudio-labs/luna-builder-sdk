# Function: isInsertAliasPluginId()

```ts
function isInsertAliasPluginId(pluginId): boolean;
```

Whether a plug-in id is one of LUNA's synthetic `alias.<slot>` ids rather than a real
plug-in. Today LUNA makes only `alias.console`, but it reads any `alias.<slot>` whose slot it
knows, and so does this.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pluginId` | `string` |

## Returns

`boolean`

## Example

```ts
Luna.isInsertAliasPluginId('alias.console');           // true
Luna.isInsertAliasPluginId('com.uaudio.uadx.1176');    // false
```
