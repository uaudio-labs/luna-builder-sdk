# Add On `manifest.json`

Every Add On folder holds a `manifest.json` at its root. It declares the Add Ons in that
folder, their identity, their page and how they open. `ua-builder new` writes one;
`ua-builder install` and `pack` validate it.

This page describes what LUNA does with the manifest. `ua-builder` is stricter: it refuses
to install or pack a manifest that LUNA would partly drop or silently correct (a missing
required field, an unknown `target`, a `targets` that is not a non-empty list of `"window"`, `"browser"` and `"editor"`, a `floating`, `show_with_session`, `fixed_size`, `run_hidden` or `unload_on_close` that is not a boolean, a
`min_width`, `min_height`, `max_width` or `max_height` that is not a whole number above 0 or a min above its max, a
`manufacturer` that is not a string, a `description` that is not a string or array of strings, a
`categories` name that is not on the list, an `html` file that does not exist), so you see the problem before LUNA does.
It also warns about an Add On with no `categories` and suggests some from its name and description.

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
    "categories": ["Utility"],
    "min_luna_version": "3.1.2",
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
    "categories": ["MIDI"],
    "add_ons": [
        { "id": "com.example.a", "title": "A", "html": "a/index.html", "local_content_offset": "..", "width": 800, "height": 500 },
        { "id": "com.example.b", "title": "B", "html": "b/index.html", "local_content_offset": "..", "target": "browser" }
    ]
}
```

The presence of `add_ons` picks the shape. If it is there and is an array, its elements are
the Add Ons and the top level is not one. If it is missing, the top-level object is the Add
On. An `add_ons` that is present but not an array yields no Add Ons at all. In this shape the
only top-level fields LUNA applies to the entries are `manufacturer`, `description` and
`categories`, as their defaults.

One bad entry in an array is dropped without affecting the others.

## Fields

### Required on every Add On

An entry missing any of these is dropped. One that can open as a `"window"` (the default
`target`, or `"window"` in `targets`) also needs a size; see `width`, `height` below.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique across everything installed. Reverse-DNS by convention. Compared without case: `com.Example.Foo` and `com.example.foo` are the same Add On, and LUNA reports the id in lowercase (in `/gui/add_ons/<id>` too), so write it in lowercase. On macOS it also names the page's storage (see [How LUNA loads the page](#how-luna-loads-the-page)), so keep it the same from one version to the next. |
| `title` | string | Display name: the menu item, and the panel header for `"browser"` and `"editor"`. Also unique; duplicates collapse into one. Newer LUNA releases also accept it as `name`, which wins when both are present, but releases that predate `name` read only `title` and drop an entry without it, so write `title`. `ua-builder` warns when an entry has both and they differ. LUNA reports it as the `name` property under `/gui/add_ons/<id>` (`name` on `luna.gui.addOns` items in the SDK). |
| `html` or `url` | string | Exactly one; an entry with neither or both is dropped. `html` is a page shipped with the Add On, relative to the manifest folder (preferred, so the Add On stays relocatable) or absolute. `url` is a hosted page used as-is; you are responsible for it being well formed. It must be `https`, unless it is on this computer (a dev server such as `http://localhost:5173/`): LUNA drops an `http` one, and does not load an `https` one until the user allows its server (see [Network](#network)). Either may carry its own query string (`index.html?page=a`). |

### Optional

| Field | Type | Default | Notes |
|---|---|---|---|
| `target` | string | `"window"` | Where the Add On opens. With `targets`, the default among them. See below. |
| `targets` | string[] | none | Every host the user can move the Add On between: any of `"window"`, `"browser"` and `"editor"` (`["browser", "window"]`). See below. |
| `width`, `height` | int | none | Initial window size in pixels (the size of the page, not counting the title bar); with `fixed_size`, the window's only size. **Required when it can open as a `"window"`** (its `target`, or one of its `targets`): one without them is dropped. Optional for `"browser"`, `"editor"` and `"app"`, which LUNA sizes itself and which ignore them; `ua-builder new` leaves them out. |
| `floating` | boolean | `true` | `"window"` only: whether the window floats with LUNA's plugin windows or is an ordinary window. See below. |
| `show_with_session` | boolean | `false` | `"window"` only: show the window, and enable its menu item, only while a session is open. See below. |
| `fixed_size` | boolean | `false` | `"window"` only: the window always opens at `width` x `height` and the user cannot resize, maximize or zoom it, or make it full screen. See below. |
| `min_width`, `min_height`, `max_width`, `max_height` | int | none | `"window"` only: the smallest and largest page size, in pixels, the user can resize the window to, and that a size the page asks for is clamped to. See below. |
| `run_hidden` | boolean | `false` | The page keeps running at full speed while it is hidden: timers are not slowed and the page is not suspended. For Add Ons that keep time, such as a sequencer. See below. |
| `unload_on_close` | boolean | `false` | `"window"`, `"browser"` and `"editor"`: closing the Add On unloads its page, and opening it again loads it fresh, instead of keeping it running hidden. For Add Ons that hold the microphone, play audio or should reopen on their first screen. See below. |
| `version` | string | none | The Add On's own semver. LUNA reads it; a non-string value is ignored and never drops the entry. |
| `manufacturer` | string | none | Who makes the Add On: your company or your own name. LUNA shows it in the **MANUFACTURER** column of **Settings > Add Ons**, where it also sorts and is matched by the search field; the column is blank without it. LUNA reports it as the `manufacturer` property under `/gui/add_ons/<id>` (`manufacturer` on `luna.gui.addOns` items in the SDK), `""` when there is none. A non-string value is ignored and never drops the entry. `ua-builder` rejects it. In the `add_ons` shape it can also go at the top level, where it is the default for every entry without one of its own; an entry's own value wins. A top-level value that is not a string is ignored. |
| `description` | string or string[] | none | What the Add On does. An array of strings is concatenated with no separator, so a long description can be split across lines of JSON; the text carries its own line breaks: write `\n` where a new line should start (`["First sentence. ", "Second sentence.\n", "A new line."]`). LUNA reports the concatenated text as the `description` property under `/gui/add_ons/<id>` (`description` on `luna.gui.addOns` items in the SDK), `""` when there is none. It is not yet shown in LUNA's UI. Any other value, including an array holding something that is not a string, is ignored and never drops the entry. `ua-builder` rejects it. In the `add_ons` shape it can also go at the top level, describing the Add Ons together, where it is the default for every entry without one of its own; an entry's own value wins. A top-level value LUNA cannot read is ignored. |
| `categories` | string[] | none | Where the Add On belongs in the showcase: one or more of the names in [Categories](#categories), written exactly as listed (`["MIDI", "Workflow"]`). LUNA reports them as the `categories` property under `/gui/add_ons/<id>` (`categories` on `luna.gui.addOns` items in the SDK), `[]` when there are none. LUNA does not check the names; anything other than an array of strings is ignored and never drops the entry. `ua-builder` rejects a name not on the list, a repeated one and an empty array, and warns when an Add On has none, suggesting some from its name and description. In the `add_ons` shape it can also go at the top level, where it is the default for every entry without its own; an entry's own value wins. |
| `network` | string[] | none | The servers the page may reach, once the user allows them: `"api.example.com"`, `"*.example.com"` (subdomains only) or `"api.example.com:8443"`, over `https` and `wss`. **Without it the page reaches no server but LUNA on this computer.** See [Network](#network). LUNA drops an entry it cannot read and keeps the rest; `ua-builder` rejects it. In the `add_ons` shape it can also go at the top level, where it is the default for every entry without its own; an entry's own value (even `[]`) wins. |
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
  running, hidden), unless it sets `unload_on_close`; it reloads only when another browser Add On takes the panel. Which browser
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
    editor Add On takes the panel. With `unload_on_close` it is unloaded instead.
  - Which editor Add On the panel holds is saved with the session: reopening the session
    shows it again (if it is still installed, and open if the panel was open), and a new
    session opens on the Clip Editor.
- **`"app"`**: a full LUNA page alongside Timeline and Mixer, check-marked while it is the
  current page. A session keeps its app Add On: closed while showing it, the session
  reopens on it (if it is still installed); closed on the Timeline, Mixer or Clip Editor after
  it, the session reopens there with the Add On a click away, on the toolbar and in the view
  toggle's Timeline, Mixer, Add On cycle. Going to another page of the session (LUNA Play, say)
  forgets it. `"page"` is an accepted synonym for backwards compatibility; write `"app"` in
  new manifests.

An unrecognized `target` silently becomes `"window"`, so in LUNA a typo shows up as an Add
On in the wrong menu rather than an error. `ua-builder` rejects it.

`targets`:

- Lists every host the Add On can be shown in, for an Add On that works as more than one: a
  panel beside the Timeline that the user can also pop out into a window, say
  (`"targets": ["browser", "window"]`). Only `"window"`, `"browser"` and `"editor"` can be
  listed together; an `"app"` is always on its own, and LUNA ignores `targets` on one.
- The default host is `target` when `targets` lists it, else the first entry of `targets`.
  The Add On opens there and sits in that host's **Add Ons** submenu until the user moves it.
- The user moves it with the host switch in its header: one glyph per host, the current one
  lit. LUNA closes it where it is, opens it in the new host, and remembers the choice across
  launches. The menu item moves to the new host's submenu.
- Each host keeps its own rules: as a `"window"` it uses `width`, `height`, `floating` and the
  rest; as a `"browser"` or `"editor"` it is sized by LUNA. Write a page that lays itself out
  for every host it lists, and read the host it is in with `Luna.addOnTarget()` (the page
  URL's `target`, before connecting) or [`luna.gui.thisInstance()`](#how-luna-loads-the-page)
  (`target`).
- LUNA drops a name it does not know, `"app"` and a repeat, and an entry whose `targets` holds
  nothing usable falls back to its single `target`. `ua-builder` rejects an unknown name or
  `"app"` in `targets`, and warns about a repeat or a `target` it does not list.
- LUNA reports the list, default first, as the `targets` property under `/gui/add_ons/<id>`
  (`targets` on `luna.gui.addOns` items in the SDK). An Add On without `targets` reports its
  single `target` as a one-entry list. There is no single `target` property; the host a page
  is in now is its instance's `target`.

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
  hidden.
- Each session keeps its own window: whether it is open, its size and position, and whether
  it is full screen are saved in the session, not in LUNA's preferences. Opening a session
  reopens the window if it was open when that session was last used, where it was, and a
  session that never had it open leaves it closed until the user chooses it from the menu.
  A window opened from an Add On (`show()`) while no session is open opens with the next
  session.
- Closing the session (or switching to another) closes the window and unloads its page; the
  page loads fresh when the session opens again. It comes back as the same instance (its
  `add_on_inst`, see [How LUNA loads the page](#how-luna-loads-the-page)), so a page can keep
  its own records in `session.storage` keyed by it. Save what must survive as it changes:
  LUNA removes the page as the session closes.
- A LUNA from before this kept one window state for all sessions, in its preferences; that
  state is not carried into sessions, so each session starts with the window closed.
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

`min_width`, `min_height`, `max_width`, `max_height`:

- The page sizes, in pixels, the user's resize stops at. Declare only the ones you need; an
  undeclared one does not limit the window. Use a minimum to keep the controls you need on
  screen.
- They also clamp the manifest `width` and `height`, a size LUNA saved before you declared
  them, and a size your page asks for with `resize()` (see [How LUNA loads the
  page](#how-luna-loads-the-page)).
- A value that is not a whole number above 0 is ignored, and so are both of a min above its
  max. `ua-builder` rejects them.
- A `fixed_size` window ignores them. They have no effect on `"app"`, `"browser"` or `"editor"`
  entries; `ua-builder` warns.
- LUNA reports them as the `min_width`, `min_height`, `max_width` and `max_height` properties
  under `/gui/add_ons/<id>`, `null` when not declared (`minWidth` and so on on
  `luna.gui.addOns` items in the SDK). A LUNA that predates them ignores them.

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

`unload_on_close`:

- By default LUNA keeps an Add On's page loaded when the user closes it, so it reopens at
  once, where the user left it. Until then the page keeps running hidden: a microphone it
  opened stays open, audio it plays keeps playing, its timers keep firing (slowed, unless
  `run_hidden`).
- `true`: closing the Add On unloads its page, as if the tab were closed, which releases
  everything the page held. Opening it again loads the page fresh, from its first screen.
  LUNA removes the page's web view as it hides it, so do not count on `pagehide`,
  `beforeunload` or `visibilitychange` running first: save what must survive as it changes
  (session storage, or LUNA itself).
- What counts as closing it:
  - `"window"`: its close button, Close Window, choosing its menu item while the window is in
    front, and, for a `show_with_session` window, the session closing.
  - `"browser"`: the secondary browser closing, or moving on to another browser Add On or to
    something else (Media, Markers, Lyrics).
  - `"editor"`: the editor panel closing, or going back to the Clip Editor or to another
    editor Add On.
- What does not: **Hide Floating Windows** (or LUNA hiding floating windows as its page
  changes), minimizing the window, another LUNA page in front, and LUNA's window being
  covered. The page stays loaded and is only hidden; `document.visibilityState` tells it so.
- It has no effect on `"app"` entries: closing one already unloads its page.
- It works with `run_hidden`: a page that sets both runs at full speed while hidden but open,
  and is unloaded when closed.
- A value that is not a boolean is ignored, so the page stays loaded. `ua-builder` rejects it.
- LUNA reports it as the `unload_on_close` property under `/gui/add_ons/<id>`
  (`unloadOnClose` on `luna.gui.addOns` items in the SDK). A LUNA that predates
  `unload_on_close` ignores it, and the page stays loaded when closed.

`icon`:

- LUNA does not check that the file exists or read it when the manifest loads; a bad path is
  not an error, and an empty string is the same as leaving it out.
- LUNA reports the resolved absolute path as the `icon` property under `/gui/add_ons/<id>`
  (next to `id`, `name`, `targets`, `floating`, `show_with_session`, `fixed_size`, `run_hidden`, `unload_on_close`, `manufacturer`, `description`, `categories`, `network` and `network_allowed`), or an empty string when there is none. It is not yet
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
| `requires_plugins` | object[] | The plugins the Add On needs, each with `plugin_id`, `name`, `min_version` and `optional`. Top-level or per entry; an entry's own list (even `[]`) replaces the top-level one. While one that is not `optional` is missing or too old, LUNA will not open the Add On, the same way as for `min_luna_version`, with the plugin it needs as the note ("My Add On (Requires Clingy Ex 0.4.3)"). See [Required plugins](#required-plugins). LUNA releases that predate it ignore it. |
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


## Required plugins

An Add On made to go with a plugin can say so, and LUNA tells the user when the plugin is
missing or too old instead of opening a page that cannot work:

```json
{
    "id": "com.eventfield.clingy_ex_panel",
    "title": "Clingy Ex Panel",
    "requires_plugins": [
        {
            "name": "Clingy Ex",
            "plugin_id": ["com.evfd.au.aufx_clex", "com.evfd.vst3.clex"],
            "min_version": "0.4.3"
        },
        { "name": "Emotional Baggage", "plugin_id": "com.evfd.vst3.ebag", "optional": true }
    ]
}
```

| Key | Type | Notes |
|---|---|---|
| `plugin_id` | string or string[] | The plugin's id as LUNA lists it (`luna.plugins`, `/plugins/<id>`). A plugin has a different id in each format (AU, VST3, UADx), so list every one you support; any of them meets the requirement. Required. |
| `name` | string | What LUNA shows the user. Without it LUNA shows the first id, since a plugin that is not installed has no name to look up. `ua-builder` warns when it is missing. |
| `min_version` | string | The lowest plugin version that works, e.g. `"0.4.3"`, compared part by part as numbers (`0.4.10` is after `0.4.3`). Leave it out for any version. |
| `optional` | boolean | `true` when the Add On still works without it: LUNA opens it and only adds the note. Default `false`. |

When a requirement that is not `optional` is unmet, LUNA:

- lists the Add On disabled in the Add Ons menu, the Add On header's switcher and the Add Ons
  browser, with what it needs: "Clingy Ex Panel (Requires Clingy Ex 0.4.3)";
- shows it dimmed with the same note in Settings > Add Ons;
- does not open it, reopen it at launch or with a session, or show it in the editor panel;
- says which plugin it needs when it is installed, instead of opening it.

It enables the Add On again by itself once the plugin is installed or updated. An unmet
`optional` requirement only adds the note. LUNA does not block anything until it has its
plugin list, a moment after launch.

A page can check the same thing to explain itself, or to turn off a feature an optional
plugin provides. `Luna.AddOn.requiresPlugins` reads the list back from LUNA, and
`luna.plugins.unmetRequirements()` applies LUNA's rule to the plugin catalog:

```js
await Promise.all([luna.plugins.load(), luna.gui.addOns.load()]);
const me = luna.gui.addOns.byId('com.eventfield.clingy_ex_panel');
const missing = luna.plugins.unmetRequirements(me?.requiresPlugins.value ?? []);
if (missing.length) console.warn(`Install ${missing.map((r) => r.name).join(', ')}`);
```

## Categories

Pick the one or two that describe what the Add On is mostly for; `Utility` is for what fits
nowhere else. `Luna.ADD_ON_CATEGORIES` holds this list in the SDK, and
`Luna.suggestAddOnCategories(text)` guesses from a description.

| Category | For |
|----------|-----|
| `AI Tools` | Add Ons that use an AI model or agent as the core feature: assistants that answer questions about your session, generate or transform material from a prompt, or carry out tasks on your behalf. |
| `Control` | Add Ons that control something (LUNA, plugins, other) from a custom interface: Add On UI, hardware controllers and surfaces, and control surface protocols. |
| `Create` | Add Ons for starting something new: idea generators, chord and melody helpers, beat and pattern makers, lyric and arrangement prompts, and other sketching tools. |
| `MIDI` | Add Ons that generate, process, route or edit MIDI data: arpeggiators, quantizers, humanizers and MIDI mapping tools. |
| `Recording` | Add Ons that support capturing audio and MIDI: take management, punch and comp helpers, input and monitoring setup, and count-in or click tools. |
| `Editing` | Add Ons that change existing material on the timeline: clip slicing, rearranging, fades, time and pitch adjustments, and batch edits across clips and tracks. |
| `Mixing & Mastering` | Add Ons that shape the sound of a mix or master: level and pan balancing, EQ and dynamics helpers, reference and loudness tools, and metering built for mix decisions. |
| `Workflow` | Add Ons that save steps: automation of repeated tasks, session setup and templates, track naming and organizing, shortcuts and macros, and other session tools. |
| `Session Management` | Add Ons that show what is in a session and help keep it in order: session stats, track and plugin summaries, version and project notes, and audits of what a session contains. |
| `Import & Export` | Add Ons that move material in and out of LUNA: file and stem export, format conversion, sample library and web source import, and exchange with other apps. |
| `Education` | Add Ons for learning and teaching music and LUNA: lessons and tutorials, ear training, theory and practice tools, and visual guides that show what is playing. |
| `Utility` | Small single-purpose Add Ons and everything that does not fit above: custom displays and panels, and other general helpers. |

## How LUNA loads the page

- LUNA appends `port=<engine port>` to the page URL for `html` and `url` alike;
  `Luna.connect()` reads it. If the manifest's `html` or `url` already has a query string,
  `port` joins it (`index.html?page=a&port=...`).
- LUNA also appends `target=<host>`, the host it loaded the page in (`window`, `browser`,
  `editor` or `app`); `Luna.addOnTarget()` reads it without connecting. Moving the Add On to
  another host reloads the page, so it never goes stale.
- LUNA also appends `add_on_inst=<id>`, which names this page among the Add On's open pages:
  `/gui/add_ons/<add on id>/instances/<add_on_inst>` reports its `target` and its `width` and
  `height` in points. `luna.gui.thisInstance()` finds it. A `"window"` page can resize its own
  window with `resize(width, height)`, clamped to `min_*`/`max_*` and saved like a user resize;
  another target's size is LUNA's and the user's, and `resize()` is refused. A window's
  instance lasts as long as the window, and a `show_with_session` window keeps it in its
  session; any other page gets a new one each time LUNA shows the Add On.
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

## Network

An Add On page can reach LUNA on this computer (`Luna.connect()`, `http`/`ws` to `localhost`
and `127.0.0.1` on any port), its own files, and `data:`/`blob:` URLs. To reach anything else,
list the server in `network` and the user must allow it:

```json
{ "id": "com.example.lyrics", "title": "Lyrics", "html": "index.html", "network": ["api.example.com"] }
```

- LUNA asks when the Add On is installed (the install prompt names the servers) or, for one
  installed another way (`ua-builder install`, a folder copied in), when it first opens. Until
  the user allows them, requests to them fail. DON'T ALLOW holds until LUNA restarts. The user
  can allow or remove each server in **Settings > Add Ons > SERVERS**; either reloads your page.
- It covers every way a page reaches out: `fetch`, XHR, `WebSocket`, `EventSource`, images,
  media, fonts, style sheets, frames, workers and scripts (a CDN must be listed too). Only
  `https` and `wss`, never plain `http` or `ws` off this computer. A blocked request fails and
  fires a `securitypolicyviolation` event in the page.
- The page's own frame cannot be navigated to an unlisted site either. To open a web page for
  the user, use `luna.gui.openUrl(url)`, which opens their browser.
- Read what LUNA allowed from `luna.gui.addOns`: `network` (what you asked for) and
  `networkAllowed`. Tell the user when a feature needs a server they have not allowed.
- An Add On whose `url` is a hosted page asks for that page's server the same way, and LUNA
  does not load the page until it is allowed. LUNA cannot confine what a hosted page loads.
- The prompt tells the user the server could receive anything the Add On sees in LUNA. Ask
  only for what you use.

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
   plus `width` and `height` for one that can be a `"window"`.
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
   editor and app entries. If the page works in more than one of window, browser and editor,
   list them in `targets` (default first) and lay the page out for each.
5. Fill `version`, `manufacturer`, `description`, `categories`, `sdk_version`, `min_luna_version`, `engines`,
   and `requires_plugins` if the Add On goes with a plugin.
6. Add `icon` with a relative path if the Add On ships one.
7. Add `package_name` if the folder name is not what the Add Ons folder should show.
8. `ua-builder install` and look in LUNA's **Add Ons** menu, under **Windows**, **Browsers**,
   **Editors** or **Apps** by target (`install` prints which; one with `targets` starts
   under its default).
