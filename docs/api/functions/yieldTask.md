# Function: yieldTask()

```ts
function yieldTask(): Promise<void>;
```

One macrotask later, through a `MessageChannel` where there is one. A background browser
tab throttles timers to about one tick per second but never throttles messages, so a
timer-only loop lands on its own timeout in a hidden page even though LUNA finished in
milliseconds.

## Returns

`Promise`\<`void`\>
