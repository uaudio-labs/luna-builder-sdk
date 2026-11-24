# Interface: JobResult

How a job that did what it was asked ended.

## Extends

- [`JobSnapshot`](JobSnapshot.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| <a id="cancellable"></a> `cancellable` | `readonly` | `boolean` | - | [`JobSnapshot`](JobSnapshot.md).[`cancellable`](JobSnapshot.md#cancellable) |
| <a id="empty"></a> `empty` | `readonly` | `boolean` | True when the job worked and found nothing (no chords, no lyrics). LUNA reports that as `failed` with the error `job.no_result` and calls it "not a failure" (fact 200), so the SDK resolves it rather than rejecting. | - |
| <a id="error"></a> `error` | `readonly` | `string` | A `job.*` code such as `job.provider_unavailable`; `''` when none. | [`JobSnapshot`](JobSnapshot.md).[`error`](JobSnapshot.md#error) |
| <a id="jobtype"></a> `jobType` | `readonly` | `string` | `lyric_transcription` or `chord_extraction`. | [`JobSnapshot`](JobSnapshot.md).[`jobType`](JobSnapshot.md#jobtype) |
| <a id="percentcomplete"></a> `percentComplete` | `readonly` | `number` | 0..100, as LUNA reports it. | [`JobSnapshot`](JobSnapshot.md).[`percentComplete`](JobSnapshot.md#percentcomplete) |
| <a id="sessionuid"></a> `sessionUid` | `readonly` | `string` | Nil uuid (32 zeros) when the job belongs to no session. | [`JobSnapshot`](JobSnapshot.md).[`sessionUid`](JobSnapshot.md#sessionuid) |
| <a id="stage"></a> `stage` | `readonly` | `string` | Machine key such as `processing` or `downloading`; `''` when none. | [`JobSnapshot`](JobSnapshot.md).[`stage`](JobSnapshot.md#stage) |
| <a id="status"></a> `status` | `readonly` | `string` | `queued | running | canceling | completed | failed | canceled`. | [`JobSnapshot`](JobSnapshot.md).[`status`](JobSnapshot.md#status) |
| <a id="targetuid"></a> `targetUid` | `readonly` | `string` \| `undefined` | The track the job works on, when LUNA names one. | [`JobSnapshot`](JobSnapshot.md).[`targetUid`](JobSnapshot.md#targetuid) |
| <a id="uid"></a> `uid` | `readonly` | `string` | - | [`JobSnapshot`](JobSnapshot.md).[`uid`](JobSnapshot.md#uid) |
| <a id="warning"></a> `warning` | `readonly` | `string` | A `job.warning.*` code; `''` when none. | [`JobSnapshot`](JobSnapshot.md).[`warning`](JobSnapshot.md#warning) |
