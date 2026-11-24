# Getting a user's file into an Add On

New to this? Start with [FILES-GUIDE.md](FILES-GUIDE.md), a walkthrough with recipes; this page is the reference.

There are two routes, and an Add On picks one per feature. **Do not mix them**: a path from
LUNA's dialog cannot be read by the page, and a `File` cannot be handed to LUNA by path. The
one bridge is for audio, video and MIDI: `luna.gui.serveMediaFile()` turns a path into a URL the
page can play and fetch (see "Playing a file you know by path").

| | **File route** (default) | **Path route** (LUNA optimization) |
|---|---|---|
| Pick | `<input type="file">` | `luna.gui.chooseFiles()` |
| Drop | HTML `drop` event, `event.dataTransfer.files` | `Luna.onPathDrop(...)` |
| The page gets | `File` objects: decode, play, slice, analyse | absolute paths, which the page cannot `fetch` |
| Into the session | `session.uploadFile({ bytes: file })` | `session.importPath(path)`, or `session.importFile(path)` for LUNA's own import with a clip |
| Works in | LUNA, a browser, `MockEngine` | LUNA only: needs `/gui` for the dialog and drops, and a native engine that can see the file |

**Use the File route when the page needs the audio**: a sampler, slicer, analyzer or
reference-track player. Use it too when in doubt; it is the one that works everywhere.

**Use the path route when the file only has to reach the session**, and it is large or
there are many: the engine reads the disk itself, so nothing is base64-copied through the
page (fact 42). It is an optimization, not a way to read files.

## Add a file to the session without a clip

Both routes add a file to the session's package as an audio source **without putting a clip
on the timeline**. The source is listed in `session.sources`, as files imported in LUNA
are. Place it later, or never:

```js
const source = file
  ? await session.uploadFile({ bytes: file })   // File route: <input type="file"> or an HTML drop, in LUNA or a browser
  : await session.importPath(path);             // Path route: luna.gui.chooseFiles() or Luna.onPathDrop(), in LUNA

// Only if and when you want it on a track:
await session.insertClip({ trackUid: track.id, sourceUid: source.id, startTick: 0, stopTick: 4 * Luna.TICKS_PER_BEAT });
```

Each resolves once the session lists the new source. `session.importFile(path)` is
different: it runs LUNA's File > Import, which always makes a clip.

## What each one takes

| Method | Takes | Makes | Needs |
|---|---|---|---|
| `session.uploadFile({ bytes })` | a `File`, `Blob`, `ArrayBuffer` or `Uint8Array` of an audio file | an audio source, no clip | any engine |
| `session.importPath(path)` | an audio file path the engine can open | an audio source, no clip | a native engine that sees the file |
| `session.importFile(path, trackUid?)` | an audio, MIDI or video file path | LUNA's own import: a clip at the selection, on `trackUid` or a new track | `/gui` |
| `luna.gui.chooseFiles()` | LUNA's open dialog | absolute paths, or `[]` if cancelled | `/gui` |
| `luna.gui.chooseFolders()` | LUNA's folder dialog | absolute folder paths, or `[]` if cancelled | `/gui` |
| `luna.gui.listFiles(path)` | an absolute path in a folder the user gave LUNA | its entries `{ name, path, isDirectory }`, hidden ones left out, in natural order (`take2` before `take10`) | `/gui` |
| `Luna.onPathDrop(handler)` | files dragged onto the page in LUNA | absolute paths with the drop's page `x`, `y` | LUNA's webview |
| `luna.gui.listAllFiles(path)` | a blessed folder, or a folder in one | `{ files, truncated }`: everything below it, each with `relativePath` | `/gui` |
| `luna.gui.addBlessedFolder(path)` / `removeBlessedFolder(path)` | a folder | LUNA asks the user to let every Add On read it / stops letting them; watch `luna.gui.blessedFolders` | `/gui` |
| `luna.gui.serveMediaFile(addOnId, path)` | any file in a blessed folder, else an audio, video or MIDI file | a URL your page loads it from (`<video src>`, `<img src>`, XMLHttpRequest) | `/gui` |

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

// A whole folder: pick it, list it, import the audio in it.
const [folder] = await luna.gui.chooseFolders();
if (folder) {
  for (const entry of await luna.gui.listFiles(folder)) {
    if (!entry.isDirectory && /\.(wav|aiff?)$/i.test(entry.name)) await session.importPath(entry.path);
  }
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

- `chooseFiles`, `chooseFolders`, `listFiles`, `chooseSavePath`, `importFile` and every other `luna.gui` command reject
  with `Luna.Unsupported` when the engine has no `/gui` (a headless engine; fact 103).
  Check `luna.gui.available()`, not `Luna.isEmbeddedInLuna()`.
- `importPath` needs no `/gui`, but the engine must be able to open the path.
- `listFiles` lists only folders the user gave LUNA, and the folders inside them: one picked
  with `chooseFolders` or dropped on an Add On (`onPathDrop`) **and allowed** when LUNA asks
  "Allow Add Ons to Read a Folder". If the user says DON'T ALLOW, the dialog or drop still
  gives the paths (for `importPath`) but `listFiles` refuses them. Anything else, even a path
  where nothing exists, rejects with code `uasrv.not_permitted`; ask with `chooseFolders`.
  These are the **blessed folders** (`luna.gui.blessedFolders`); a page can also ask for one
  with `addBlessedFolder(path)`, which LUNA confirms with the user. LUNA keeps them across
  restarts, at most 64, the oldest forgotten first, until the user removes them in Settings >
  Add Ons > FOLDERS. They are LUNA-wide, not per Add On. A path
  is judged where it really is: `..` or a link out of a granted folder is refused, and so are
  a hidden folder inside one (`.git`) and a path spelled in a different case from the folder.
  LUNA never asks for a disk's root, the home folder, a folder holding it or `~/Library`
  (`addBlessedFolder` rejects with `uasrv.not_permitted`; a picked or dropped one is just not
  blessed), and once the user says DON'T ALLOW it does not ask for that folder again until it
  restarts. Ask for a folder inside the home folder (`~/Music`) instead. A path you saved can stop working, so
  handle `uasrv.not_permitted` by asking again.
- `listFiles` reads the disk as LUNA sees it, one level deep; `listAllFiles` returns
  everything below the folder in one call, each entry with its `relativePath` (links to
  folders are not followed, and `truncated` is true past 10,000 entries or 5 seconds of reading).
- `serveMediaFile` serves any file in a blessed folder, of any type (but hidden ones), so a
  page can show images or read JSON from one; outside them it serves media only. It rejects with code `uasrv.filesystem_error` when nothing is at the
  path or LUNA cannot read it, and `uasrv.invalid_value` for a relative path or a file. A
  LUNA older than `chooseFolders` and `listFiles` rejects them with `Luna.Unsupported`
  (fact 106). `examples/browse.html` is a folder browser built on the two, and the Folders tab
  of `examples/files.html` a Finder-style window over the blessed folders.
- While a path-drop handler is registered, LUNA claims every file drag, so HTML `drop`
  events carry no files (fact 102). One page can still offer both: an `<input type="file">`
  for the File route and path drops for the session.
- `Luna.onPathDrop` throws `Luna.Unsupported` outside LUNA; check `Luna.canDropPaths()` and
  fall back to an HTML `drop` listener.
- Path drops are page-wide, not per element. To route a drop to a zone, hit-test its `x`, `y`
  (page pixels): `document.elementFromPoint(x, y)?.closest('.zone')`.
- Check the file type yourself on both routes: a picker's `accept` and `chooseFiles`'
  `filters` are hints, and a drop carries whatever the user dragged.

## Playing a file you know by path

A page cannot load a path, but LUNA can serve an audio or video file to your Add On's page
and hand back a URL for it (fact 114) that `<video>`, `<audio>` and XMLHttpRequest load. That lets an Add On remember a file by path, for
example a video kept in `session.storage`, and load it again when the session reopens,
with no `File` and no dialog.

```js
const ADD_ON_ID = 'com.example.my-add-on';   // your manifest's id
const store = session.storage.context(ADD_ON_ID);
await store.load();
await store.add('video', 'path', null);

async function show(path) {
  try {
    video.src = await luna.gui.serveMediaFile(ADD_ON_ID, path);
    await store.set('video', 'path', path);
  } catch (e) {
    // uasrv.filesystem_error: the file is gone or moved (a session from another computer).
    // uasrv.invalid_value: not an audio or video file.
    hint.textContent = `Cannot open ${path}: ${e.code}`;
  }
}

// Pick or drop: both give paths inside LUNA.
pickButton.onclick = async () => {
  const [path] = await luna.gui.chooseFiles({ filters: ['*.mov;*.mp4;*.m4v;*.webm'] });
  if (path) await show(path);
};
Luna.onPathDrop(({ paths }) => paths[0] && show(paths[0]));

// The session reopened: load what it remembers.
const saved = prefs.value('video', 'path').value;
if (saved) await show(saved);

// The bytes, when the page needs them (decode audio, read a header). XMLHttpRequest works
// on every LUNA version; before 3.1.2 the Windows URL is file:///, which fetch() refuses.
function readBytes(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => (xhr.response ? resolve(xhr.response) : reject(new Error(`cannot read ${url}`)));
    xhr.onerror = () => reject(new Error(`cannot read ${url}`));
    xhr.send();
  });
}
const bytes = await readBytes(video.src);
```

- Only real media is served: LUNA follows links and checks the file they lead to, which needs
  an audio, video or MIDI extension (`mp4`, `m4v`, `mov`, `webm`, `ogv`, `wav`, `aif`, `aiff`,
  `mp3`, `m4a`, `flac`, `ogg`, `oga`, `opus`, `mid`, `midi`) and that format's signature in
  its first bytes (`MThd` for a Standard MIDI File).
- The file is served to the Add On you name, and only to its pages. Ask again after every
  reload: LUNA forgets the files it served when it quits, so keep the path, not the URL.
- The URL is `ua-content://` on macOS and Windows and answers byte ranges, so a long video
  seeks without being read whole. On Windows a file on a network share (a `\\server\share`
  path) is not served. In LUNA before 3.1.2 the Windows URL is `file:///`: media elements and
  XMLHttpRequest load it, `fetch()` does not.
- Outside LUNA there are no paths: keep the File route (`<input type="file">`, HTML drop)
  there, and check `luna.gui.available()` before offering paths.

## The session's own files

A session's audio files are `session.sources`, one `Luna.AudioSource` each.

```js
const sources = await session.loadSources();      // loaded, with every file's properties
const label = (s) => s.displayName.value ?? `Untitled ${s.id.slice(0, 6)}`;
sources.onAnyChange(() => render(sources.items), { props: ['name', 'length'] });
```

- **Names.** LUNA names some files with their own uid (fact 238). `displayName` is
  `undefined` for those, so show your own label.
- **Where a file is.** `session.sourcePath(source)` is the file's path on disk, read from
  the session with no request. `await source.filePath()` gives the same path outside a
  session. Recordings, imports and bounces are in `<package>/audio/<uid>.wav`. A clip
  rendering (`source.isRender`) is in `<package>/renders/clips/<uid>.wav`, and LUNA remakes it
  as needed (fact 239). `source.reveal()` shows the file in Finder or Explorer.
- **Who uses a file.** `await session.sourceUsage()` lists the tracks and clips that use each
  file, on every playlist, and updates as clips change. `usage.byId(source.id)?.trackUids`
  gives the tracks; `isUsed()` says whether any clip uses the file.
- **Dragging a file onto LUNA's timeline.** Call `Luna.startSourceDrag(event, { session,
  source })` in a `dragstart` listener. LUNA places a clip from that file where it is dropped
  and reuses the session's file rather than importing a copy (fact 241). Drag a clip's
  `sourceUid`, not its rendering.
- **Unused files.** `luna.workspace.unusedMedia(packageUid)` lists the files LUNA's Delete
  Unused Media would remove, and why it keeps each of the others (`session`, `undo`,
  `version`, `backup`). `deleteUnusedMedia(packageUid, { toTrash: true })` removes them
  (fact 240). A LUNA from before the lists existed returns only the counts.
- **The package.** `await session.package()` is the session's own `SessionPackage`: its
  name, folder, favourite flag and comments.

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
