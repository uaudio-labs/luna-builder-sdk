# Interface: NewGroupOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="attributes"></a> `attributes` | readonly [`GroupAttribute`](../type-aliases/GroupAttribute.md)[] | At least one. |
| <a id="makenameunique"></a> `makeNameUnique?` | `boolean` | Number the name when another group has it, as LUNA's own menu does. Default false. |
| <a id="members"></a> `members?` | readonly [`ChannelRef`](../type-aliases/ChannelRef.md)[] | Tracks and buses to put in it. |
| <a id="name"></a> `name?` | `string` | Default: LUNA's localized `New Group`. |
