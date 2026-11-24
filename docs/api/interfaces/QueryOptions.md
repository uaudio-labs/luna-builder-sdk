# Interface: QueryOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="anytag"></a> `anyTag?` | `boolean` | Match any tag rather than all. |
| <a id="factory"></a> `factory?` | `boolean` | - |
| <a id="favorite"></a> `favorite?` | `boolean` | - |
| <a id="lastopenedmin"></a> `lastOpenedMin?` | `number` | - |
| <a id="limit"></a> `limit?` | `number` | - |
| <a id="orderas"></a> `orderAs?` | `"desc"` \| `"asc"` | - |
| <a id="orderby"></a> `orderBy?` | `"name"` \| `"created"` \| `"modified"` \| `"last_opened"` \| `string` & `object` | - |
| <a id="search"></a> `search?` | `string` | - |
| <a id="sessionpackageuid"></a> `sessionPackageUid?` | `string` | The package whose versions or tutorials to list. LUNA ignores it for the `'sessions'` table, which always answers every package: find one there by its row's `uid` (fact 237). |
| <a id="table"></a> `table?` | `"sessions"` \| `"versions"` \| `"tutorials"` | - |
| <a id="tags"></a> `tags?` | `string`[] | - |
