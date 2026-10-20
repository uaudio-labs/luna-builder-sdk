# Interface: TransactionOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="continuous"></a> `continuous?` | `boolean` | A live gesture (a drag, a slider, a preview being regenerated) instead of a batch. Each command first undoes the one before it, so only the last command's effect is kept and recorded; write every step relative to where things were when the transaction began, never as a change from the previous step. Pushes arrive per command (fact 115). |
