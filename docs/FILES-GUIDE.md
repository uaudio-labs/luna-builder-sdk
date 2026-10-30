# Working with files in an Add On: a guide

This guide explains how a LUNA Add On's HTML page works with the user's files: picking them,
dropping them, playing them, and putting them into the session. It explains the reasoning
behind the API. For the full method tables, error codes and LUNA version notes, see
[FILES.md](FILES.md).

## The one idea to understand first

An Add On is a web page running inside LUNA. Two different programs can work with a file:

1. **The page** (your HTML and JavaScript). Like any web page, it can only read a file the
   user handed it as a browser `File` object. It **cannot** open a path such as
   `/Users/me/Music/kick.wav`. `fetch()` and `XMLHttpRequest` refuse that path.
2. **LUNA** (the engine). It is a native app, so it reads paths from disk directly. It
   cannot accept a `File` object from the page by reference. The page has to send it the
   bytes.

So the SDK gives you two routes, and each feature picks one:

| | **File route** | **Path route** |
|---|---|---|
| What you get | a browser `File` (the bytes) | an absolute path (a string) |
| Who can read it | the page | LUNA |
| Choose a file with | `<input type="file">` | `luna.gui.chooseFiles()` |
| Accept a drop with | the HTML `drop` event | `Luna.onPathDrop()` |
| Put it in the session | `session.uploadFile({ bytes: file })` | `session.importPath(path)` or `session.importFile(path)` |
| Works in | LUNA, a plain browser, `MockEngine` tests | LUNA only |

The most common mistake is mixing the routes. For example, a developer gets a path from
`chooseFiles()` and calls `fetch(path)`, or gets a `File` from an input and looks for its
path. Neither works. There is one bridge between the routes, `luna.gui.serveMediaFile()`,
covered in [Recipe 3](#recipe-3-play-or-read-a-file-you-know-by-path).

## Which route should I use?

Answer one question: **does the page itself need the file's contents?**

- **Yes.** The page decodes, plays, slices, analyses or draws the audio, or parses a MIDI
  or text file. Use the **File route**.
- **No.** The file only has to reach the session, especially if it is large or there are
  many files. Use the **Path route**. LUNA reads the disk itself, so the bytes never pass
  through your page. On a large file that is much faster. Measured in LUNA, `uploadFile`
  sends about 10 MB a second, while `importPath` copies a 2.5-minute WAV in about 0.2 s.
- **Not sure, or the Add On must also work in a browser.** Use the File route, which works
  everywhere.
- **You need to remember a file and load it again when the session reopens** (a video, a
  reference track). Use the Path route, save the path, and play it back with
  `serveMediaFile` ([Recipe 3](#recipe-3-play-or-read-a-file-you-know-by-path)).

## Setup assumed by the examples

Every example below assumes the page has connected and has a session and a track:

```html
<script src="vendor/luna.global.js"></script>
<script type="module">
  const luna = await Luna.connect();
  const session = await luna.session();
  const track = session.tracks.items[0];
  // ... the recipes below go here
</script>
```

`npx ua-builder new my-add-on` scaffolds this for you; see [QUICKSTART.md](QUICKSTART.md).

---

## Recipe 1: the page needs the audio (File route)

The page gets a standard `File` from a file input or a drop, uses it in the browser, and
optionally uploads it into the session.

```html
<input type="file" id="picker" accept=".wav,.aif,.aiff">
<div id="zone">Drop an audio file here</div>
<progress id="bar" max="1" value="0"></progress>

<script type="module">
  const picker = document.getElementById('picker');
  const zone = document.getElementById('zone');
  const bar = document.getElementById('bar');

  picker.onchange = () => load(picker.files[0]);

  // Call preventDefault() on dragover, or the browser refuses the drop.
  zone.addEventListener('dragover', (e) => e.preventDefault());
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    load(e.dataTransfer.files[0]);
  });

  async function load(file) {
    if (!file || !/\.(wav|aiff?)$/i.test(file.name)) return;   // check the type yourself

    // 1. Use it in the page: decode, play, draw a waveform...
    const audio = await new AudioContext().decodeAudioData(await file.arrayBuffer());
    console.log(`${file.name}: ${audio.duration.toFixed(1)} s`);

    // 2. (Optional) Put it in the session and place a clip.
    const source = await session.uploadFile({
      bytes: file,
      onProgress: (sent, total) => (bar.value = sent / total),
    });
    await session.insertClip({
      trackUid: track.id,
      sourceUid: source.id,
      startTick: 0,
      stopTick: 4 * Luna.TICKS_PER_BEAT,
    });
  }
</script>
```

Notes:

- `uploadFile` accepts a `File`, `Blob`, `ArrayBuffer` or `Uint8Array` of an audio file. It
  makes an audio *source*, not a clip. `insertClip` places the source on the timeline.
- If the same audio is uploaded twice, LUNA stores it once and you get the existing source
  back.
- For a MIDI file on this route, parse the `File` in the page and write notes with
  `clip.addNotes()`. To let LUNA import a MIDI file, use `importFile(path)` on the Path
  route instead.
- `accept` on the input is only a hint. A drop carries whatever the user dragged. Always
  check the file type in your code.

## Recipe 2: get files into the session (Path route)

LUNA shows its own dialog, returns paths, and reads the files itself. The page never sees
the bytes.

```js
async function importFromDialog() {
  if (!(await luna.gui.available())) return;   // no /gui: a headless engine or a browser mock

  const paths = await luna.gui.chooseFiles({
    title: 'Choose audio',
    filters: ['*.wav', '*.aif;*.aiff'],
    allowMultiple: true,
  });                                          // [] if the user cancelled

  for (const path of paths) {
    const source = await session.importPath(path);   // a source, no clip
    await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
  }
}
```

You have two ways to import a path:

| | `session.importPath(path)` | `session.importFile(path, trackUid?)` |
|---|---|---|
| What it does | copies the file into the session as an audio source | runs LUNA's own **File > Import** |
| Makes a clip? | no, you call `insertClip` | yes, at the selection, on `trackUid` or a new track |
| File types | audio | audio, MIDI, video |
| Needs `/gui`? | no | yes |

Use `importPath` when you control the placement. Use `importFile` when "import it the way
LUNA would" is what you want.

### Accepting dropped files as paths

```js
if (Luna.canDropPaths()) {
  const stop = Luna.onPathDrop({
    dragOver:  () => zone.classList.add('hot'),
    dragLeave: () => zone.classList.remove('hot'),
    drop: async ({ paths, x, y }) => {
      zone.classList.remove('hot');
      for (const path of paths) await session.importPath(path);
    },
  });
  // Later: stop() returns file drops to normal HTML drop events.
}
```

Path drops behave differently from HTML drops:

- **They cover the whole page.** `onPathDrop` does not attach to an element. To know which
  zone the user dropped on, hit-test the coordinates:
  `document.elementFromPoint(x, y)?.closest('.zone')`.
- **They replace HTML file drops.** While a path-drop handler is registered, LUNA claims
  every file drag, so your HTML `drop` listeners receive no files. If you want both routes
  on one page, use `<input type="file">` for the File route and path drops for the session.
- **They exist only inside LUNA.** `onPathDrop` throws `Luna.Unsupported` elsewhere. Check
  `Luna.canDropPaths()` and fall back to an HTML drop zone.

### Working with a whole folder

The user can pick a folder, and the page can then list its contents:

```js
const [folder] = await luna.gui.chooseFolders({ title: 'Choose a sample folder' });
if (folder) {
  for (const entry of await luna.gui.listFiles(folder)) {
    if (!entry.isDirectory && /\.(wav|aiff?)$/i.test(entry.name)) {
      await session.importPath(entry.path);
    }
  }
}
```

`listFiles` has a permission model:

- It lists only folders the **user gave LUNA**: a folder picked with `chooseFolders()` or
  dropped on an Add On, plus any folder inside one. LUNA asks the user first ("Allow Add Ons to
  Read a Folder"); a folder they do not allow is still handed to the page as a path, but is not
  listed. Any other path rejects with error code
  `uasrv.not_permitted`, even if the path exists.
- These are the **blessed folders** (`luna.gui.blessedFolders`). LUNA remembers them across
  restarts, keeps at most 64, and lists them in Settings > Add Ons > **FOLDERS**, where the
  user adds and removes them. They are shared by all Add Ons. To ask for one yourself, call
  `luna.gui.addBlessedFolder(path)`: LUNA asks the user, and the folder shows up in
  `blessedFolders` if they allow it. LUNA will not ask for a disk's root, the home folder or
  `~/Library` (ask for `~/Music` or a project folder instead), nor again for a folder the
  user refused, until LUNA restarts: both reject with `uasrv.not_permitted`.
- Because the user can revoke them, a folder path you saved can stop working. Catch
  `uasrv.not_permitted` and ask again with `chooseFolders()`.
- `listFiles` lists one level only; `listAllFiles(path)` lists everything below the folder
  in one call, each entry with its `relativePath`. Hidden files are left out, and entries are
  in natural order (`take2` before `take10`).
- Any file in a blessed folder, of any type, can be loaded in the page: pass its path to
  `serveMediaFile` and use the URL (an `<img>`, a JSON `XMLHttpRequest`). Hidden files are
  never served.

`examples/browse.html` is a working folder browser built on `chooseFolders` and `listFiles`.

## Recipe 3: play or read a file you know by path

Sometimes the page needs to *play* a file it only knows by path. For example, a video
window remembers which video belongs to a session and reloads it when the session reopens.
`luna.gui.serveMediaFile()` asks LUNA for a URL your page can load:

```js
const ADD_ON_ID = 'com.example.my-add-on';     // your manifest.json "id"

async function show(path) {
  try {
    video.src = await luna.gui.serveMediaFile(ADD_ON_ID, path);
  } catch (e) {
    // uasrv.filesystem_error: the file moved or is missing (for example, a session from another computer)
    // uasrv.invalid_value:   not an audio, video or MIDI file
    status.textContent = `Cannot open ${path} (${e.code})`;
  }
}

pickButton.onclick = async () => {
  const [path] = await luna.gui.chooseFiles({ filters: ['*.mov;*.mp4;*.m4v;*.webm'] });
  if (path) await show(path);
};
```

To remember the file with the session, save the **path** with `session.storage`, not
the URL. LUNA forgets served URLs when it quits, so call `serveMediaFile` again every time
the page loads. [FILES.md](FILES.md#playing-a-file-you-know-by-path) has the full example,
including saving to session storage.

Limits:

- It serves audio, video and MIDI only (`wav`, `aif`, `mp3`, `m4a`, `flac`, `ogg`, `mp4`,
  `mov`, `webm`, `mid`, `midi` and similar), and LUNA checks the file's contents, not just
  the extension. A served MIDI file is for reading: fetch its bytes with `XMLHttpRequest`
  and parse them; a media element does not play MIDI.
- To read the bytes (to decode audio, for example), use `XMLHttpRequest` with
  `responseType = 'arraybuffer'`, **not `fetch()`**. On Windows the URL is `file:///`, which
  `fetch()` refuses.
- The URL works only in your Add On's own pages.

## Saving files

The page cannot write to disk by path. To produce a file:

- Ask the user where with `luna.gui.chooseSavePath({ extensions: ['wav'] })`. It returns a
  path, or `undefined` if they cancel.
- Give that path to an engine command that writes files, such as a render:
  `session.bounce({ ..., outputPaths: [path] })`.

To keep small settings or remembered paths, use `session.storage`, not files.

---

## Making one page work everywhere

A good Add On checks what is available and offers what works:

```js
const hasGui = await luna.gui.available();   // LUNA's dialogs and importFile
const canDrop = Luna.canDropPaths();         // inside LUNA's webview

pathButton.hidden = !hasGui;                 // "Import from disk..." -> chooseFiles + importPath
if (canDrop) Luna.onPathDrop(handlePaths);   // path drops in LUNA
else zone.addEventListener('drop', handleFileDrop);   // HTML drops in a browser
// An <input type="file"> works in both.
```

- Check `luna.gui.available()`, **not** `Luna.isEmbeddedInLuna()`. A page can be inside LUNA
  and still talk to an engine with no `/gui`. Every `luna.gui` command rejects with
  `Luna.Unsupported` there.
- An older LUNA rejects newer commands (`chooseFolders`, `listFiles`, `serveMediaFile`) with
  `Luna.Unsupported`. Catch it and hide the feature.
- On LUNA 3.1.0.4589 and earlier, `<input type="file">` opens nothing inside LUNA: it fires
  `cancel` immediately. If your users may run that version, also offer a drop zone or
  `chooseFiles()`. See the table in [FILES.md](FILES.md#inside-luna-today).

## Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| `fetch(path)` fails on a path from `chooseFiles` | The page cannot read paths | Use `importPath`, or `serveMediaFile` to play it |
| Dropping a file does nothing in a browser | No `preventDefault()` on `dragover` | Add `zone.addEventListener('dragover', e => e.preventDefault())` |
| HTML drop gets no files inside LUNA | A path-drop handler is registered and claims file drags | Handle the drop in `onPathDrop`, or call its `stop()` |
| `importPath` succeeds but nothing is on the timeline | It makes a source, not a clip | Call `session.insertClip({ sourceUid: source.id, ... })`, or use `importFile` |
| `Luna.Unsupported` from `chooseFiles` | No `/gui` (headless engine, mock with `gui: false`) or an older LUNA | Check `luna.gui.available()` first; fall back to the File route |
| `uasrv.not_permitted` from `listFiles` | The folder is not blessed, is hidden (`.git`) inside a blessed one, or the user removed it in Settings > Add Ons > FOLDERS | Ask with `chooseFolders()` or `addBlessedFolder()` |
| `uasrv.not_permitted` from `addBlessedFolder` | The folder is too broad (a disk's root, the home folder, `~/Library`), or the user refused it this session | Ask for a narrower folder; the user can add any folder in Settings > Add Ons > FOLDERS |
| A saved media URL stops working after a restart | Served URLs last only until LUNA quits | Save the path; call `serveMediaFile` again on load |
| File picker opens nothing inside LUNA | LUNA 3.1.0.4589 or earlier | Offer a drop zone or `chooseFiles()` as well |

## Testing

- **Unit tests (no LUNA):** `new Luna.MockEngine()` supports `uploadFile`.
  `new Luna.MockEngine({ gui: false })` models an engine without `/gui`, and
  `engine.nextDialogFiles` sets what `chooseFiles` returns.
- **In a browser with `ua-builder probe`:** `LunaProbe.dropFiles(files, selector)` and
  `LunaProbe.chooseFiles(selector, files)` deliver real `File` objects (`'name.wav'` is a
  short sine wave). With `--luna-bridge`, `LunaProbe.dropPaths(paths)` drops paths the way
  LUNA does.
- **In LUNA:** try every route you offer by hand: pick a WAV, drop a WAV, and check that it
  arrives. `examples/files.html` ("File routes (Builder)") tries all of them side by side and
  logs each event.

## Where to go next

- [FILES.md](FILES.md): the full reference, with every method, error code and LUNA version
  note
- `examples/files.html`: all file routes side by side, and a Finder-style Folders tab over
  the blessed folders that imports audio files
- `examples/browse.html`: a folder browser using `chooseFolders` and `listFiles`
- `examples/import.html`: importing into the session
- [QUICKSTART.md](QUICKSTART.md): connecting, sessions, tracks and clips
