# Class: Scheduler

Coalesces change notifications. In a browser it flushes on the next animation frame with a
timer fallback (hidden tabs suspend rAF); elsewhere on a macrotask. Tests call `flush()`.

## Constructors

### Constructor

```ts
new Scheduler(): Scheduler;
```

#### Returns

`Scheduler`

## Methods

### enqueue()

```ts
enqueue(notify): void;
```

Queue `notify` to run once at the next flush.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `notify` | () => `void` |

#### Returns

`void`

***

### flush()

```ts
flush(): void;
```

Run every queued notification now.

#### Returns

`void`

***

### settled()

```ts
settled(): Promise<void>;
```

Resolves after the next flush (or immediately if nothing is queued).

#### Returns

`Promise`\<`void`\>
