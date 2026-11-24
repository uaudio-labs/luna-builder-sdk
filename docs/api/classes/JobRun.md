# Class: JobRun

One launched job, followed from the command that started it to its end: what
`session.musical.chords.detect()` and `session.lyrics.transcribe()` return. Await it (or
[done](#done)) for the outcome; read [progress](#progress) and [snapshot](#snapshot) on the way.

It resolves when the job completes, and with `empty: true` when it worked and found nothing.
It rejects with a [UAError](Error.md) whose `code` is the job's error (`job.provider_unavailable`,
...), `canceled`, `removed` (LUNA dropped the job without an ending, e.g. its session closed),
`no_effect` (LUNA took the command but no job started), `timeout` (the job did not end in
time, the code `Luna.RequestTimeout` carries too), or the launch command's own error.

## Example

```ts
const run = session.lyrics.transcribe({ clip });
run.progress.onChange(() => console.log(Math.round((run.progress.value ?? 0) * 100), '%'));
try {
  const result = await run;
  console.log(result.empty ? 'nothing sung' : 'lyrics ready');
} catch (err) {
  console.warn((err as Luna.UAError).code);
}
```

## Implements

- `PromiseLike`\<[`JobResult`](../interfaces/JobResult.md)\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="progress"></a> `progress` | `readonly` | [`Prop`](../interfaces/Prop.md)\<`number`\> | 0..1 from the job's `percent_complete`, ready for a `<progress>` element. |
| <a id="snapshot"></a> `snapshot` | `readonly` | [`Prop`](../interfaces/Prop.md)\<[`JobSnapshot`](../interfaces/JobSnapshot.md)\> | The job's latest snapshot; `undefined` until LUNA starts it. |

## Accessors

### uid

#### Get Signature

```ts
get uid(): string | undefined;
```

The job's uid once LUNA has started it.

##### Returns

`string` \| `undefined`

## Methods

### cancel()

```ts
cancel(): Promise<void>;
```

Ask LUNA to cancel the job. LUNA refuses once the job is no longer cancellable; the run
then ends however the job does. A cancel accepted ends the run with code `canceled`.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
const run = session.lyrics.transcribe();
cancelButton.onclick = () => run.cancel().catch(() => undefined);
```

***

### done()

```ts
done(): Promise<JobResult>;
```

The outcome: resolves with the job's last snapshot, rejects as described on the class.
Calling it after the job ended answers at once.

#### Returns

`Promise`\<[`JobResult`](../interfaces/JobResult.md)\>

#### Example

```ts
const { empty } = await session.musical.chords.detect().done();
```

***

### then()

```ts
then<A, B>(onFulfilled?, onRejected?): Promise<A | B>;
```

Lets `await run` work: a `JobRun` is a `PromiseLike` of its [JobResult](../interfaces/JobResult.md).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `A` | [`JobResult`](../interfaces/JobResult.md) |
| `B` | `never` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `onFulfilled?` | (`value`) => `A` \| `PromiseLike`\<`A`\> \| `null` |
| `onRejected?` | (`reason`) => `B` \| `PromiseLike`\<`B`\> \| `null` |

#### Returns

`Promise`\<`A` \| `B`\>

#### Example

```ts
const result = await session.musical.chords.detect({ clip });
```

#### Implementation of

```ts
PromiseLike.then
```
