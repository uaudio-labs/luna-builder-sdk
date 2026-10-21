# Interface: PresetTagGroup

A named group of a plugin's preset tags, for example Paradise's `TYPE`, `GENRE` and
`DESCRIPTION`. LUNA keeps them as categories holding sub-categories holding tags (fact 120);
a group is one sub-category.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="category"></a> `category` | `string` | The category it sits in, for example `Default`. |
| <a id="categoryuid"></a> `categoryUid` | `string` | - |
| <a id="name"></a> `name` | `string` | The sub-category name, for example `GENRE`. |
| <a id="tags"></a> `tags` | `string`[] | Tags in LUNA's order. |
| <a id="uid"></a> `uid` | `string` | The sub-category uid. |
