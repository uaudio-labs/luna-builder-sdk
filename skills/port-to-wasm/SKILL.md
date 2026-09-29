---
name: port-to-wasm
description: Run a LUNA Add On in a plain browser page on the in-page WebAssembly LUNA engine instead of a native LUNA, using @uaudio/ua-builder-sdk. Use when asked to make an Add On work without LUNA installed, on the wasm engine, or as a standalone web page.
---

# Port an Add On to the wasm engine

Nothing in the Add On's model code changes: `Luna.connect({ engine: 'wasm' })` returns the same
`Luna.Client`, and every `Luna.Session`, `Luna.Track`, `Luna.Control` works the same (the engine lane
in the SDK proves it against a real engine). The work is in hosting and in engine limits.

## 1. Choose the engine at connect time

```js
const luna = await Luna.connect();                       // ?engine=wasm on the page URL selects wasm
const luna = await Luna.connect({ engine: 'wasm' });     // or force it
const luna = await Luna.connect({ engine: 'wasm', engineUrl: '/__engine/', wasm: { persist: true } });
```

`luna.engine === 'wasm'` and `luna.wasm` (a `Luna.WasmEngine`) give audio and persistence
controls. The scaffolded Add On already does this: open it with `?engine=wasm`.

## 2. Host the engine on the page's origin

`devicedwasm.js` spawns pthread workers from its own URL, so it must be same-origin with the
page, and the page needs `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp`. `ua-builder serve` does both:

```sh
npx ua-builder serve --engine <path to wasm_engine/dist/Release>     # mounts it at /__engine/
open "http://localhost:8790/?engine=wasm"
```

Without `--engine`, serve auto-detects `hbsystem/wasm_engine/dist/Release` in a tree checkout
or reads `UA_WASM_ENGINE`. For production, serve the engine files from the same host as the
page (or reverse-proxy them) and set `engineUrl`.

## 3. Handle what the engine cannot do

- **No session at boot.** `luna.session()` throws `Luna.NoSessionOpen`; create one with
  `await luna.sessions.create({ name })`. With `persist: true` (default) the workspace is
  restored from OPFS on the next load.
- **Audio needs a gesture.** Browsers block audio until the user clicks; call
  `await luna.wasm.resumeAudio()` from a click handler. `luna.wasm.audio()` reports
  `contextState` (1 = running), `callbacks`, `underruns`, `peak`.
- **Microphone** is `luna.wasm.requestAudioInput()`; needs https or localhost.
- **Absent services**: licensing/auth, ARA, analysis providers, assistant, video, and the
  whole `luna.gui` host surface (no LUNA). Guard with `luna.engine === 'wasm'`.
- **Boot once per page**: shutdown is terminal; reload to boot again.
- **Engine differences** (see EVIDENCE facts 6, 10, 13, 35-38): a missing path is an error
  (`uasrv.invalid_object`) rather than `{}`; the writer's own `set` is echoed; adds carry the
  node's properties. The SDK normalises all of these.
- **Size**: the unstripped Release build is about 290 MB; serve a stripped build in production
  (`strip: true` asks the engine's own serve script for `?strip=1`).

## 4. Verify

- `npm run test:engine` in the builder package runs the SDK's engine lane in headless Chrome
  against the engine build (needs Chrome and an engine dir).
- Load the Add On with `?engine=wasm`, click something to resume audio, create a session,
  and check `luna.wasm.audio().callbacks` is climbing.

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`UA BUILDER SDK FEEDBACK:` followed by a prompt that can be used to update the SDK to
support the improved workflow: what you were doing, what was awkward, and the API you
wished for.
