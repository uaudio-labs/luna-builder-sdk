# Interface: GetOptions

Query parameters accepted by `get`, in camelCase. Booleans become `1`/`0` on the wire.
See `hbsystem/networking/docs/operations.md`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `boolean` | Include children (default on). |
| <a id="cmdparams"></a> `cmdparams?` | `boolean` | Include command parameter schemas. |
| <a id="commands"></a> `commands?` | `boolean` | Include commands (default on). |
| <a id="excludedchildren"></a> `excludedChildren?` | `string` | - |
| <a id="flatvalue"></a> `flatvalue?` | `boolean` | Collapse `{ value: X }` to `X` for every property. |
| <a id="hidden"></a> `hidden?` | `boolean` | Include hidden objects. |
| <a id="ignoreresponse"></a> `ignoreResponse?` | `boolean` | Do not send a reply; the returned promise resolves to `undefined` immediately after send. |
| <a id="includedchildren"></a> `includedChildren?` | `string` | - |
| <a id="levels"></a> `levels?` | `number` | Subtree depth. |
| <a id="limit"></a> `limit?` | `number` | - |
| <a id="offset"></a> `offset?` | `number` | - |
| <a id="properties"></a> `properties?` | `boolean` | Include properties (default on). |
| <a id="propfilter"></a> `propfilter?` | `string` \| `string`[] | Only these property names; an array goes on the wire as a comma-separated list. |
| <a id="propinfo"></a> `propinfo?` | `boolean` | Include property metadata. |
| <a id="recursive"></a> `recursive?` | `boolean` | Whole subtree. |
