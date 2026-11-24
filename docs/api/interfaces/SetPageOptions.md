# Interface: SetPageOptions

Options for [Gui.setPage](../classes/Gui.md#setpage).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contexttype"></a> `contextType?` | `string` | The window's context: `main` (the default), `alt_0`, `alt_1`, ... |
| <a id="route"></a> `route?` | `string` | A view inside the page for its document to open: the dashboard's `free_with_luna`, the catalog's `filter:free`, or for `universe` a path on the site (`index/showcase?kind=addon`: printable ASCII, no spaces, `\` or `#`). Only those three pages take a route; LUNA refuses one for another page, or an empty one, with `uasrv.invalid_value` before anything changes (fact 243). |
