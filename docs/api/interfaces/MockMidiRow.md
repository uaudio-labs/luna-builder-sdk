# Interface: MockMidiRow

A row for [MockEngine.midiEdit](../classes/MockEngine.md#midiedit).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="data1"></a> `data1?` | `number` | - |
| <a id="data2"></a> `data2?` | `number` | - |
| <a id="enabled"></a> `enabled?` | `boolean` | - |
| <a id="rowid"></a> `rowid?` | `number` | - |
| <a id="status"></a> `status?` | `number` | - |
| <a id="sysex"></a> `sysex?` | `number`[] \| `null` | A SysEx row's whole message, `0xf0` through `0xf7`, with `status` `0xf0`; `null` on other rows (fact 139). |
| <a id="tick"></a> `tick?` | `number` | - |
