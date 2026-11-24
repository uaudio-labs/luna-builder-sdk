# Interface: JobRunOptions

How long a [JobRun](../classes/JobRun.md) waits: for LUNA to start the job, and for it to finish.

## Extended by

- [`ExtractionOptions`](ExtractionOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="starttimeoutms"></a> `startTimeoutMs?` | `number` | How long to wait for LUNA to start the job. Default 30 s. |
| <a id="timeoutms"></a> `timeoutMs?` | `number` | How long to wait for it to finish. Default 30 min. |
