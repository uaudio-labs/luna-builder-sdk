# Function: canDropPaths()

```ts
function canDropPaths(): boolean;
```

True when native path drops can be used: the page is in LUNA's webview, which publishes
`window.lunaAPI.setAcceptsFileDrops`. False in a browser and in tests.

## Returns

`boolean`
