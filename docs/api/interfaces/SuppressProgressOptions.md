# Interface: SuppressProgressOptions

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="maxms"></a> `maxMs?` | `number` | Release on its own after this many milliseconds, whatever the page does. Default [PROGRESS\_SUPPRESSION\_MAX\_MS](../variables/PROGRESS_SUPPRESSION_MAX_MS.md). LUNA keeps an Add On's suppression until it is released (fact 224), so keep this near the longest operation it covers. |
