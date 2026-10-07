# Getting a user's file into an Add On

There are two routes, and an Add On picks one per feature. **Do not mix them**: a path from
LUNA's dialog cannot be read by the page, and a `File` cannot be handed to LUNA by path.

| | **File route** (default) | **Path route** (LUNA optimization) |
|---|---|---|
| Pick | `<input type="file">` | `luna.gui.chooseFiles()` |
| Drop | HTML `drop` event, `event.dataTransfer.files` | `Luna.onPathDrop(...)` |
| The page gets | `File` objects: decode, play, slice, analyse | absolute paths, which the page cannot `fetch` |
| Into the session | `session.uploadFile({ bytes: file })` | `session.importPath(path)`, or `session.importFile(path)` for LUNA's own import with a clip |
| Works in | LUNA, a browser, the wasm engine, `MockEngine` | LUNA only: needs `/gui` for the dialog and drops, and a native engine that can see the file |

**Use the File route when the page needs the audio**: a sampler, slicer, analyzer or
reference-track player. Use it too when in doubt; it is the one that works everywhere.

**Use the path route when the file only has to reach the session**, and it is large or
there are many: the engine reads the disk itself, so nothing is base64-copied through the
page (fact 42). It is an optimization, not a way to read files.

## What each one takes

| Method | Takes | Makes | Needs |
|---|---|---|---|
| `session.uploadFile({ bytes })` | a `File`, `Blob`, `ArrayBuffer` or `Uint8Array` of an audio file | an audio source, no clip | any engine |
| `session.importPath(path)` | an audio file path the engine can open | an audio source, no clip | a native engine that sees the file |
| `session.importFile(path, trackUid?)` | an audio, MIDI or video file path | LUNA's own import: a clip at the selection, on `trackUid` or a new track | `/gui` |
| `luna.gui.chooseFiles()` | LUNA's open dialog | absolute paths, or `[]` if cancelled | `/gui` |
| `Luna.onPathDrop(handler)` | files dragged onto the page in LUNA | absolute paths with the drop's page `x`, `y` | LUNA's webview |

- Place a source with `session.insertClip({ sourceUid: source.id, ... })`.
- A MIDI file: `importFile(path)` from a path, or parse a `File` in the page and write notes
  with `clip.addNotes()`.
- `uploadFile` of bytes already in the session resolves to the existing source: LUNA stores
  identical audio once (fact 42).
- Rough speeds measured in LUNA: `uploadFile` about 10 MB a second (base64 over the
  connection); `importPath` copies a 2.5-minute WAV in about 0.2 s.

## File route

```js
// Pick
fileInput.onchange = () => load(fileInput.files[0]);
// Drop: without preventDefault() on dragover the browser refuses the drop.
zone.addEventListener('dragover', (e) => e.preventDefault());
zone.addEventListener('drop', (e) => { e.preventDefault(); load(e.dataTransfer.files[0]); });

async function load(file) {
  const audio = await new AudioContext().decodeAudioData(await file.arrayBuffer()); // in the page
  const source = await session.uploadFile({ bytes: file, onProgress: (sent, total) => (bar.value = sent / total) });
  await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
}
```

## Path route

```js
if (await luna.gui.available()) {
  const paths = await luna.gui.chooseFiles({ filters: ['*.wav', '*.aif;*.aiff'], allowMultiple: true });
  for (const path of paths) await session.importPath(path);   // a source, no clip
}

if (Luna.canDropPaths()) {
  const stop = Luna.onPathDrop({
    dragOver: () => zone.classList.add('hot'),
    dragLeave: () => zone.classList.remove('hot'),
    drop: async ({ paths }) => { zone.classList.remove('hot'); for (const p of paths) await session.importPath(p); },
  });
  // stop() hands file drags back to the page's HTML drop events.
}
```

- `chooseFiles`, `chooseSavePath`, `importFile` and every other `luna.gui` command reject
  with `Luna.Unsupported` when the engine has no `/gui` (a headless or wasm engine; fact 103).
  Check `luna.gui.available()`, not `Luna.isEmbeddedInLuna()`.
- `importPath` needs no `/gui`, but the engine must be able to open the path.
- While a path-drop handler is registered, LUNA claims every file drag, so HTML `drop`
  events carry no files (fact 102). One page can still offer both: an `<input type="file">`
  for the File route and path drops for the session.
- `Luna.onPathDrop` throws `Luna.Unsupported` outside LUNA; check `Luna.canDropPaths()` and
  fall back to an HTML `drop` listener.
- Path drops are page-wide, not per element. To route a drop to a zone, hit-test its `x`, `y`
  (page pixels): `document.elementFromPoint(x, y)?.closest('.zone')`.
- Check the file type yourself on both routes: a picker's `accept` and `chooseFiles`'
  `filters` are hints, and a drop carries whatever the user dragged.

## Inside LUNA today

Measured on macOS. Check for these when an Add On must work on the LUNA your users have:

| | LUNA 3.1.0.4589 and earlier | LUNA with the webview fixes |
|---|---|---|
| `<input type="file">` | **opens nothing**: the input fires `cancel` at once (fact 104) | LUNA's open panel |
| HTML `drop` with `File`s | works | works |
| `Luna.onPathDrop` | works until the Add On window is closed and reopened; after that drops arrive as HTML drops instead (fact 105) | works |
| `chooseFiles` + `importPath` | works | works |

So an Add On that must load files on 3.1.0.4589 should offer a drop zone (HTML drop, File
route) and, for the path route, `luna.gui.chooseFiles()`. Do not rely on a file picker
alone. A picker whose `cancel` fires within a few milliseconds of the click is this case;
say so to the user rather than doing nothing.

## Testing

- `new Luna.MockEngine({ gui: false })` models an engine without `/gui`; `engine.nextDialogFiles`
  sets what `chooseFiles` returns on one with it.
- `ua-builder probe` gives every page `LunaProbe.dropFiles(files, selector)` and
  `LunaProbe.chooseFiles(selector, files)`, which deliver real `File`s (`'name.wav'` is a
  short sine that decodes). With `--luna-bridge` it also fakes LUNA's bridge, and
  `LunaProbe.dropPaths(paths)` drops paths as LUNA does.
- Inside LUNA, check every route you offer by hand: pick and drop a WAV, and see it arrive.
  `examples/files.html` ("File routes (Builder)") tries all four side by side and logs each
  event, including closing and reopening its window for the path-drop case.
