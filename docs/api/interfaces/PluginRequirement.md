# Interface: PluginRequirement

One entry of an Add On manifest's `requires_plugins`, as LUNA reports it on
[AddOn.requiresPlugins](../classes/AddOn.md#requiresplugins) (fact 148). It is met when any of `plugin_id` is installed at
`min_version` or later (any version when `''`). One plugin has a different id per format (AU,
VST3, ...), so list each. `name` is what LUNA shows, since a plugin that is not installed has
no name to look up. Unless `optional`, LUNA will not open the Add On while it is unmet.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="min_version"></a> `min_version` | `string` |
| <a id="name"></a> `name` | `string` |
| <a id="optional"></a> `optional` | `boolean` |
| <a id="plugin_id"></a> `plugin_id` | `string`[] |
