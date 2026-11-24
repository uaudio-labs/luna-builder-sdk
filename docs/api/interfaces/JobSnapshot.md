# Interface: JobSnapshot

A job as LUNA last reported it. Frozen; safe to keep.

## Extended by

- [`JobResult`](JobResult.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cancellable"></a> `cancellable` | `readonly` | `boolean` | - |
| <a id="error"></a> `error` | `readonly` | `string` | A `job.*` code such as `job.provider_unavailable`; `''` when none. |
| <a id="jobtype"></a> `jobType` | `readonly` | `string` | `lyric_transcription` or `chord_extraction`. |
| <a id="percentcomplete"></a> `percentComplete` | `readonly` | `number` | 0..100, as LUNA reports it. |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | Nil uuid (32 zeros) when the job belongs to no session. |
| <a id="stage"></a> `stage` | `readonly` | `string` | Machine key such as `processing` or `downloading`; `''` when none. |
| <a id="status"></a> `status` | `readonly` | `string` | `queued | running | canceling | completed | failed | canceled`. |
| <a id="targetuid"></a> `targetUid` | `readonly` | `string` \| `undefined` | The track the job works on, when LUNA names one. |
| <a id="uid"></a> `uid` | `readonly` | `string` | - |
| <a id="warning"></a> `warning` | `readonly` | `string` | A `job.warning.*` code; `''` when none. |
