# Interface: MidiRowData

The wire shape of `midi/table/row_data`: a whole table, or one delta against it (fact 40).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="enabled"></a> `enabled?` | `boolean`[] | - |
| <a id="midi_data"></a> `midi_data?` | `number`[] | - |
| <a id="operation"></a> `operation` | `string` | `update` is a whole table; `added`, `changed` and `deleted` are deltas. |
| <a id="row_ids"></a> `row_ids` | `number`[] | - |
| <a id="sysex"></a> `sysex?` | (`number`[] \| `null`)[] | A SysEx row's bytes, `null` on other rows; absent before LUNA stored SysEx (fact 139). |
| <a id="tick"></a> `tick?` | `number`[] | - |
