# Add On `manifest.json`

Every Add On folder holds a `manifest.json` at its root. It declares the Add Ons in that
folder, their identity, their page and how they open. `ua-builder new` writes one;
`ua-builder install` and `pack` validate it.

This page describes what LUNA does with the manifest. `ua-builder` is stricter: it refuses
to install or pack a manifest that LUNA would partly drop or silently correct (a missing
required field, an unknown `target`, a `floating`, `show_with_session`, `fixed_size` or `run_hidden` that is not a boolean, a
`manufacturer` that is not a string, a `description` that is not a string or array of strings, an `html` file that does not exist), so you see the problem before LUNA does.

## Where it lives

| Platform | Add Ons folder |
|---|---|
| macOS | `/Library/Application Support/Universal Audio/LUNA/Add Ons` |
| Windows | `%ProgramData%\Universal Audio\LUNA\Add Ons` |

The folder is shared by every account on the computer, so any user can install, replace and
remove Add Ons in it. LUNA's Windows installer sets it up; otherwise the first install sets it
up, from LUNA or `ua-builder install`, asking once for administrator approval (macOS: an
administrator password). Add Ons installed by an older release in
`%LOCALAPPDATA%\Universal Audio\LUNA\Add Ons` are not moved; reinstall them.

Each entry in that folder is the Add On folder or a symlink to one (`ua-builder install`
makes the symlink on macOS and copies on Windows). Only a file named exactly `manifest.json`
is read; other `.json` files are not. LUNA rescans the folder, so Add Ons appear and
disappear without a restart. `UA_ADDONS_FOLDER` points `ua-builder` at another folder.

## Two shapes

Either the top-level object is one Add On, or it has an `add_ons` array of them:

```json
{
    "package_name": "My Add On",
    "id": "com.example.my_add_on",
    "title": "My Add On",
    "version": "0.1.0",
    "manufacturer": "Example Audio",
    "description": ["Does one thing well. ", "Opens in its own window."],
    "min_luna_version": "3.1.1",
    "engines": ["luna"],
    "html": "index.html",
    "target": "window",
    "floating": true,
    "show_with_session": false,
    "width": 900,
    "height": 600
}
```

```json
{
    "package_name": "My Add Ons",
    "manufacturer": "Example Audio",
    "add_ons": [
        { "id": "com.example.a", "title": "A", "html": "a/index.html", "local_content_offset": "..", "width": 800, "height": 500 },
        { "id": "com.example.b", "title": "B", "html": "b/index.html", "local_content_offset": "..", "target": "browser" }
    ]
}
```

The presence of `add_ons` picks the shape. If it is there and is an array, its elements are
the Add Ons and the top level is not one. If it is missing, the top-level object is the Add
On. An `add_ons` that is present but not an array yields no Add Ons at all. In this shape the
only top-level fields LUNA applies to the entries are `manufacturer` and `description`, as
their defaults.

One bad entry in an array is dropped without affecting the others.

## Fields

### Required on every Add On

An entry missing any of these is dropped. A `"window"` (the default `target`) also needs a
size; see `width`, `height` below.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique across everything installed. Reverse-DNS by convention. Compared without case: `com.Example.Foo` and `com.example.foo` are the same Add On, and LUNA reports the id in lowercase (in `/gui/add_ons/<id>` too), so write it in lowercase. On macOS it also names the page's storage (see [How LUNA loads the page](#how-luna-loads-the-page)), so keep it the same from one version to the next. |
| `title` | string | Display name: the menu item, and the panel header for `"browser"` and `"editor"`. Also unique; duplicates collapse into one. Newer LUNA releases also accept it as `name`, which wins when both are present, but releases that predate `name` read only `title` and drop an entry without it, so write `title`. `ua-builder` warns when an entry has both and they differ. LUNA reports it as the `name` property under `/gui/add_ons/<id>` (`name` on `luna.gui.addOns` items in the SDK). |
| `html` or `url` | string | Exactly one; an entry with neither or both is dropped. `html` is a page shipped with the Add On, relative to the manifest folder (preferred, so the Add On stays relocatable) or absolute. `url` is a hosted page used as-is; you are responsible for it being well formed. Either may carry its own query string (`index.html?page=a`). |

### Optional

| Field | Type | Default | Notes |
|---|---|---|---|
| `target` | string | `"window"` | Where the Add On opens. See below. |
| `width`, `height` | int | none | Initial window size in pixels (the size of the page, not counting the title bar); with `fixed_size`, the window's only size. **Required for a `"window"`**: one without them is dropped. Optional for `"browser"`, `"editor"` and `"app"`, which LUNA sizes itself and which ignore them; `ua-builder new` leaves them out. |
| `floating` | boolean | `true` | `"window"` only: whether the window floats with LUNA's plugin windows or is an ordinary window. See below. |
| `show_with_session` | boolean | `false` | `"window"` only: show the window, and enable its menu item, only while a session is open. See below. |
| `fixed_size` | boolean | `false` | `"window"` only: the window always opens at `width` x `height` and the user cannot resize, maximize or zoom it, or make it full screen. See below. |
| `run_hidden` | boolean | `false` | The page keeps running at full speed while it is hidden: timers are not slowed and the page is not suspended. For Add Ons that keep time, such as a sequencer. See below. |
| `version` | string | none | The Add On's own semver. LUNA reads it; a non-string value is ignored and never drops the entry. |
| `manufacturer` | string | none | Who makes the Add On: your company or your own name. LUNA shows it in the **MANUFACTURER** column of **Settings > Add Ons**, where it also sorts and is matched by the search field; the column is blank without it. LUNA reports it as the `manufacturer` property under `/gui/add_ons/<id>` (`manufacturer` on `luna.gui.addOns` items in the SDK), `""` when there is none. A non-string value is ignored and never drops the entry. `ua-builder` rejects it. In the `add_ons` shape it can also go at the top level, where it is the default for every entry without one of its own; an entry's own value wins. A top-level value that is not a string is ignored. |
| `description` | string or string[] | none | What the Add On does. An array of strings is concatenated with no separator, so a long description can be split across lines of JSON; the text carries its own line breaks: write `\n` where a new line should start (`["First sentence. ", "Second sentence.\n", "A new line."]`). LUNA reports the concatenated text as the `description` property under `/gui/add_ons/<id>` (`description` on `luna.gui.addOns` items in the SDK), `""` when there is none. It is not yet shown in LUNA's UI. Any other value, including an array holding something that is not a string, is ignored and never drops the entry. `ua-builder` rejects it. In the `add_ons` shape it can also go at the top level, describing the Add Ons together, where it is the default for every entry without one of its own; an entry's own value wins. A top-level value LUNA cannot read is ignored. |
| `icon` | string | none | Image path, resolved like `html`. Works for `url` entries too. See below. |
| `local_content_offset` | string | none | `html` only. Relative path from the manifest folder to the folder your page loads resources from. See below. |

`target` values:

LUNA lists every Add On in its **Add Ons** menu, in one submenu per target: **Apps**,
**Browsers**, **Editors** and **Windows**. A submenu with nothing in it is left out. **Windows** lists the
`show_with_session` Add Ons first, then a separator, then the rest.

- **`"window"`**: its own window. Choosing the menu item opens the window, brings it to the
  front if it is behind, and closes it if it is already in front. The item is check-marked
  while the window is open. See `floating` for how it layers.
- **`"browser"`**: a panel in LUNA's secondary browser, the right-hand side panel that also
  shows Media, Markers and Lyrics, with the Add On's `title` as its header. Its menu item is
  enabled only on the Timeline and Mixer pages, where that panel lives, and disabled
  everywhere else, including while no session is open. Choosing the menu item shows the Add On,
  replacing whatever the panel showed (another browser Add On included); choosing it while it
  is showing closes the panel. The item is check-marked while it is showing. The panel's width
  is LUNA's and the user's to set; `width` and `height` are not needed and not used. Only one browser Add On
  shows at a time. When the panel moves on to something else, your page stays loaded (it keeps
  running, hidden); it reloads only when another browser Add On takes the panel. Which browser
  Add On is showing is saved with the session: reopening the session shows it again (if it is
  still installed), and a session that was not showing one opens without it.
- **`"editor"`**: the editor panel docked at the bottom of the Timeline, in place of LUNA's
  Clip Editor, with the Add On's `title` in the panel's header. Its menu item is enabled only
  on the Timeline page, where that panel lives, and disabled everywhere else. Choosing the menu
  item opens the panel on the Add On, replacing the Clip Editor or another editor Add On;
  choosing it while it is showing closes the panel, and the panel shows the Clip Editor the
  next time it opens. The item is check-marked while it is showing. The panel keeps the Clip
  Editor's position and size: it spans the Timeline's width, and its height is the one the
  user set for the Clip Editor, resized from its top edge and shared with it. `width` and
  `height` are not needed and not used; lay the page out for a wide, short panel whose height
  the user changes. Only one editor Add On shows at a time.
  - Closing the panel any other way (its close button, or the Timeline's editor toggle)
    keeps the Add On in it: the panel reopens on it.
  - Opening a clip for editing (double-clicking a MIDI clip, for instance) switches the panel
    back to the Clip Editor.
  - The panel does not follow the Timeline's selection: selecting clips, tracks or a range
    never changes, reloads or hides your Add On. If it should react to the selection, read
    the selection through the SDK.
  - Your page loads the first time the panel shows it. It stays loaded (it keeps running,
    hidden) while the panel is closed or shows the Clip Editor, and reloads only when another
    editor Add On takes the panel.
  - Which editor Add On the panel holds is saved with the session: reopening the session
    shows it again (if it is still installed, and open if the panel was open), and a new
    session opens on the Clip Editor.
- **`"app"`**: a full LUNA page alongside Timeline and Mixer, check-marked while it is the
  current page. `"page"` is an accepted synonym for backwards compatibility; write `"app"` in
  new manifests.

An unrecognized `target` silently becomes `"window"`, so in LUNA a typo shows up as an Add
On in the wrong menu rather than an error. `ua-builder` rejects it.

`floating`:

- `true` (the default): the window floats like a plugin window. It stays above LUNA's own
  windows while LUNA is the active app and drops behind other apps when LUNA is not. **Hide
  Floating Windows** hides it along with the plugin windows and **Show Floating Windows**
  brings it back; LUNA may also hide and restore floating windows itself as its main window
  changes page. A window hidden that way still counts as open: it comes back when floating
  windows are shown and when LUNA relaunches.
- `false`: an ordinary window. Other LUNA windows can cover it, and it ignores **Show/Hide
  Floating Windows**.
- A value that is not a boolean (such as the string `"false"`) is ignored, so the window
  floats. `ua-builder` rejects it.
- It has no effect on `"app"`, `"browser"` or `"editor"` entries.
- If you change it while LUNA is running and the window has already been opened, the change
  applies after LUNA restarts.
- LUNA reports it as the `floating` property under `/gui/add_ons/<id>`
  (`luna.gui.addOns` in the SDK).

`show_with_session`:

- `true`: the Add On belongs to a session. While no session is open it is still listed in
  LUNA's menus (the **Add Ons** menu in current LUNA builds) but disabled, and its window is
  hidden. When a session opens, the window comes back if
  the user had it open; if they had closed it, it stays closed until they choose it from the
  menu again.
- Whether the user had it open is remembered across sessions and across LUNA launches. A
  window open when LUNA quit reopens when the next session opens, not at launch.
- Hiding the window because the session closed does not close it: its page stays loaded,
  so its scripts keep running and should cope with there being no session.
- `false` (the default): the window and its menu item do not depend on a session.
- A value that is not a boolean is ignored, so the default applies. `ua-builder` rejects it.
- It has no effect on `"app"`, `"browser"` or `"editor"` entries.
- LUNA reports it as the `show_with_session` property under `/gui/add_ons/<id>`
  (`showWithSession` on `luna.gui.addOns` items in the SDK).

`fixed_size`:

- `true`: the window has no resize controls. Its edges and corners do not resize it, and it has no
  maximize button (Windows) or working zoom and full-screen button (macOS, where the green
  button is greyed out). It keeps its close and minimize buttons.
- It always opens at the manifest's `width` and `height`. LUNA still remembers where the user
  put the window and reopens it there, but not a size the user gave it before the Add On set
  `fixed_size`, and not full screen. Changing `width` and `height` changes the window's size
  the next time LUNA creates it.
- Lay the page out for exactly that size: the user cannot make the window bigger to show
  content that does not fit.
- `false` (the default): the window opens at `width` and `height` the first time, and the user
  can resize it; LUNA reopens it at the size the user left it.
- A value that is not a boolean is ignored, so the window is resizable. `ua-builder` rejects it.
- It has no effect on `"app"`, `"browser"` or `"editor"` entries.
- If you change it while LUNA is running and the window has already been opened, the change
  applies after LUNA restarts (or after the Add On is uninstalled and installed again).
- LUNA reports it as the `fixed_size` property under `/gui/add_ons/<id>`
  (`fixedSize` on `luna.gui.addOns` items in the SDK). A LUNA that predates `fixed_size`
  ignores it and the window is resizable.

`run_hidden`:

- A hidden page normally sleeps: when another LUNA page is in front of an `"app"` Add On, a
  window Add On is closed (LUNA keeps its page loaded), or LUNA's window is covered, the web
  view slows the page's timers to about once a second and may suspend it. That suits most Add
  Ons and saves power.
- `true`: the page keeps running at full speed while hidden. Use it only for an Add On that
  must keep time with nobody looking, such as a sequencer that sends MIDI from a timer.
  `requestAnimationFrame` still stops while the page is not shown, so drive timing from
  `setInterval` or `setTimeout`, not from animation frames.
- It applies to every target.
- LUNA reports it as the `run_hidden` property under `/gui/add_ons/<id>` (`runHidden` on
  `luna.gui.addOns` items in the SDK). A LUNA that predates `run_hidden` ignores it, and the
  page sleeps when hidden.

`icon`:

- LUNA does not check that the file exists or read it when the manifest loads; a bad path is
  not an error, and an empty string is the same as leaving it out.
- LUNA reports the resolved absolute path as the `icon` property under `/gui/add_ons/<id>`
  (next to `id`, `name`, `target`, `floating`, `show_with_session`, `fixed_size`, `run_hidden`, `manufacturer` and `description`), or an empty string when there is none. It is not yet
  drawn in LUNA's menus.

`local_content_offset`:

By default a local page can only load resources from inside the folder holding
`manifest.json`. If your page references files above that folder (shared scripts in a
sibling folder, say), set `local_content_offset` to the relative path from the manifest
folder up to the folder that contains everything the page needs. With `".."`, a page at
`my-add-on/index.html` can load `../../shared/lib.js`.

- The `html` file has to be inside the resulting folder. If it is not, the offset is
  silently ignored and the page is served from its own folder instead.
- It is ignored for `url` entries, and an empty string is the same as leaving it out.
- It only affects how local resources are served on macOS (see below). On Windows it has no
  effect, but it is harmless to set.

### Added by the builder SDK

LUNA ignores fields it does not know, so these are safe today and let tooling reason about
compatibility.

| Field | Type | Notes |
|---|---|---|
| `sdk_version` | string | The `@uaudio/luna-builder-sdk` version it was built against. Top-level or per entry. |
| `min_luna_version` | string | Lowest LUNA the Add On supports, e.g. `"3.1.1"`. Top-level or per entry. When the running LUNA is older, the Add On stays installed but LUNA will not open it: the Add Ons menu lists it disabled with the version it needs ("My Add On (Requires LUNA 3.2.0)"), Settings > Add Ons shows it dimmed with the same note, it is not reopened at launch, and installing it says which LUNA it needs instead of opening it. LUNA releases before 3.1.1 do not check it. |
| `engines` | string[] | `["luna"]`. Declares which engines the page handles. |

### Tooling only

Read only by whatever installs the Add On: `ua-builder install`, or LUNA when it opens a
`.lunaaddon` file. It has no effect once the Add On is loaded.

`ua-builder pack` zips the Add On folder, leaving out what the page never loads: dotfiles
(`.env`, `.git`), `node_modules/`, `tests/`, TypeScript and JSX sources, source maps
(`--source-maps` keeps them), `tsconfig.json` and bundler configs, and, when one of those
configs is present, the top-level `src/`. It refuses to pack when an `html` page loads a
local script or stylesheet that is missing or left out, and warns about a module script.

| Field | Notes |
|---|---|
| `package_name` | Name of the Add Ons folder entry: the symlink (or copy) `ua-builder install` creates, or the folder LUNA unzips a `.lunaaddon` file into. Without it the entry is named after the Add On folder (for a `.lunaaddon`, the folder at the top of the zip, else the file's name). Surrounding whitespace is trimmed. Does not affect menu names, which come from `title`. |

`package_name` has to be a bare name, not a path. When LUNA installs a `.lunaaddon` file it
falls back to that default name, with a warning, if the value is not a string, is blank, is
`.` or `..`, or contains a path separator, or if the manifest cannot be read. `ua-builder
install` uses the folder name when `package_name` is missing or blank and refuses a value
that is `.`, `..` or contains a path separator; `--name` overrides it.

Because it is what appears in the Add Ons folder, `package_name` is the knob to use when your
source folder has a working name you would not want shown there (`add-ons` → `Add Ons SDK`).

## How LUNA loads the page

- LUNA appends `port=<engine port>` to the page URL for `html` and `url` alike;
  `Luna.connect()` reads it. If the manifest's `html` or `url` already has a query string,
  `port` joins it (`index.html?page=a&port=...`).
- Spaces in an `html` path are percent-encoded, so folder and file names with spaces work. A
  `url` is otherwise used exactly as written; encode it yourself.
- On macOS local pages are served from a custom scheme (not `file://`) so `fetch()` of local
  resources works, but only inside the manifest folder or the `local_content_offset` folder;
  a reference outside it fails to load. Keep resource references relative to the `html` file
  so they resolve either way.
- On macOS each local page is its own origin, named by its `id`: its `localStorage`,
  IndexedDB, cookies and cache are its own, and no other Add On can read or change them. They
  last across launches and updates while the `id` stays the same; change the `id` and the
  Add On starts with empty storage. Web storage is still not a place for secrets such as API
  keys; use `luna.secrets` (see "Secrets" below).
- On Windows the page is loaded from `file://`, where module scripts are blocked: use the
  script-tag bundle (`vendor/luna.global.js`), and bundle your own code to a classic script.
  The `add-on-typescript` template (`ua-builder new --template add-on-typescript`) builds
  TypeScript, and React or any other bundled library, into one (`dist/main.js`).
- A `url` page is loaded from your server, so normal web rules apply (CORS, mixed content).

The native bridge is minimal: native file drops, which deliver absolute **paths** rather
than `File`s, and secrets. Use them through `Luna.onPathDrop()` and `luna.secrets`, not
directly; without the bridge, file drops reach the page as ordinary HTML `drop` events with
`File`s (see [FILES.md](FILES.md) for which to use) and secrets stay in page memory.
Everything else goes over the engine connection, including LUNA UI actions through `luna.gui`.

## Secrets

Keep API keys, tokens and passwords in `luna.secrets`, never in `localStorage`, IndexedDB,
cookies, the manifest or the Add On's files. Anything in the Add On folder ships with it when
you share the `.lunaaddon`, and web storage is readable by any script the page loads.

```js
let key = await luna.secrets.get('openai.api_key'); // null if never stored
if (!key) {
  key = await askTheUser(); // your own settings form
  await luna.secrets.set('openai.api_key', key);
}
await luna.secrets.delete('openai.api_key'); // a "Disconnect" button
```

- Inside LUNA, values go to the OS credential store: the login keychain on macOS, Credential
  Manager on Windows. LUNA scopes them by the manifest's `id`, so another Add On cannot read
  them, and it answers only the Add On's own page: not an iframe in it, and not a page it
  navigated to. Keep the `id` stable; a new `id` starts with no secrets.
- Elsewhere (a browser, `ua-builder serve`, a LUNA that predates secrets) values live in page
  memory and are gone on reload; the first `set` warns on the console. `luna.secrets.storage`
  is `'keychain'` or `'memory'`; tell the user when keys will not be remembered.
- Names are 1 to 128 characters from `A-Z a-z 0-9 . _ -`; namespace them by service, for
  example `openai.api_key`. A value is a string of at most 2560 UTF-8 bytes.
- Errors carry a `code`: `invalid_name`, `too_large`, `store_error` (the OS store refused, for
  example the user denied keychain access), `timeout` (no answer).
- Uninstalling the Add On does not remove its secrets. Offer a way to delete them.
- On macOS, LUNA may ask the user once to allow keychain access, for example after an update.

## Checklist

1. `manifest.json` at the Add On root, with `id`, `title` and exactly one of `html`/`url`,
   plus `width` and `height` for a `"window"`.
2. Keep `id` and `title` unique across everything installed, ignoring case, and write `id` in
   lowercase. `ua-builder new` and `install` check both against the Add Ons folder and
   refuse a clash.
3. Relative `html`; set `local_content_offset` only if the page reaches above its folder.
4. `target: "app"` only for a full LUNA page; `"browser"` for a panel beside the Timeline
   or Mixer, which should lay out for a narrow, user-resizable width; `"editor"` for the
   panel under the Timeline, which should lay out for a wide, short, user-resizable height.
   For a `"window"`, set `floating: false` if it should be an ordinary window rather than
   float with the plugin windows, `show_with_session: true` if it only makes sense with
   a session open, and `fixed_size: true` if its page is laid out for one size only. Leave
   `floating`, `show_with_session`, `fixed_size`, `width` and `height` out of browser,
   editor and app entries.
5. Fill `version`, `manufacturer`, `description`, `sdk_version`, `min_luna_version`, `engines`.
6. Add `icon` with a relative path if the Add On ships one.
7. Add `package_name` if the folder name is not what the Add Ons folder should show.
8. `ua-builder install` and look in LUNA's **Add Ons** menu, under **Windows**, **Browsers**,
   **Editors** or **Apps** by target (`install` prints which).
