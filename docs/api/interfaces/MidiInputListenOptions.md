# Interface: MidiInputListenOptions

Options for [MidiInput.listen](../classes/MidiInput.md#listen).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="ongap"></a> `onGap?` | (`info`) => `void` | Called when batches went missing between two that arrived (`missed` batches), or when LUNA reports messages it could not queue (`dropped`, LUNA's running total). Held notes may be stuck after either; consider releasing them. |
