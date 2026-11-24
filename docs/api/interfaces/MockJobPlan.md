# Interface: MockJobPlan

How [MockEngine.startJob](../classes/MockEngine.md#startjob) ends the next job; see [MockEngine.planNextJob](../classes/MockEngine.md#plannextjob).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="error"></a> `error?` | `string` | The `job.*` error a `failed` job reports. Default `job.internal`. |
| <a id="hold"></a> `hold?` | `boolean` | Keep the job running until `engine.finishJob(uid)` or a cancel. |
| <a id="outcome"></a> `outcome?` | `"completed"` \| `"empty"` \| `"failed"` \| `"instant"` | - |
