# Add On `manifest.json`

Every Add On folder holds a `manifest.json` at its root. It declares the Add Ons in that
folder, their identity, their page and how they open. `ua-builder new` writes one;
`ua-builder install` and `pack` validate it.

This page describes what LUNA does with the manifest. `ua-builder` is stricter: it refuses
to install or pack a manifest that LUNA would partly drop or silently correct (a missing
field, an unknown `target`, an `html` file that does not exist), so you see the problem
before LUNA does.

## Where it lives

| Platform | Add Ons folder |
|---|---|
| macOS | `/Library/Application Support/Universal Audio/LUNA/Add Ons` |
| Windows | `%LOCALAPPDATA%\Universal Audio\LUNA\Add Ons` |

Each entry in that folder is the Add On folder or a symlink to one (`ua-builder install`
makes the symlink on macOS and copies on Windows). Only a file named exactly `manifest.json`
is read; other `.json` files are not. LUNA rescans the folder, so Add Ons appear and
disappear without a restart.

## Two shapes

Either the top-level object is one Add On, or it has an `add_ons` array of them:

```json
{
    "package_name": "My Add On",
    "id": "com.example.my_add_on",
    "title": "My Add On",
    "version": "0.1.0",
    "sdk_version": "0.1.0-alpha.3",
    "min_luna_version": "1.9.0",
    "engines": ["luna", "wasm"],
    "html": "index.html",
    "target": "window",
    "width": 900,
    "height": 600
}
```

```json
{
    "package_name": "My Add Ons",
    "add_ons": [
        { "id": "com.example.a", "title": "A", "html": "a/index.html", "local_content_offset": "..", "width": 800, "height": 500 },
        { "id": "com.example.b", "title": "B", "html": "b/index.html", "local_content_offset": "..", "width": 800, "height": 500 }
    ]
}
```

The presence of `add_ons` picks the shape. If it is there and is an array, its elements are
the Add Ons and the top level is not one. If it is missing, the top-level object is the Add
On. An `add_ons` that is present but not an array yields no Add Ons at all.

One bad entry in an array is dropped without affecting the others.

## Fields

### Required on every Add On

An entry missing any of these is dropped.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique across everything installed. Reverse-DNS by convention. |
| `title` | string | Menu name. Also unique; duplicates collapse into one. |
| `width`, `height` | int | Initial window size in pixels. |
| `html` or `url` | string | Exactly one; an entry with neither or both is dropped. `html` is a page shipped with the Add On, relative to the manifest folder (preferred, so the Add On stays relocatable) or absolute. `url` is a hosted page used as-is; you are responsible for it being well formed. Either may carry its own query string (`index.html?page=a`). |

### Optional

| Field | Type | Default | Notes |
|---|---|---|---|
| `target` | string | `"window"` | Where the Add On opens. See below. |
| `version` | string | none | The Add On's own semver. LUNA reads it; a non-string value is ignored and never drops the entry. |
| `icon` | string | none | Image path, resolved like `html`. Works for `url` entries too. See below. |
| `local_content_offset` | string | none | `html` only. Relative path from the manifest folder to the folder your page loads resources from. See below. |

`target` values:

- **`"window"`**: a floating window, listed in LUNA's **Window** menu.
- **`"app"`**: a full LUNA page alongside Timeline and Mixer, listed in the **View** menu and
  check-marked while it is the current page. `"page"` is an accepted synonym for backwards
  compatibility; write `"app"` in new manifests.
- **`"browser"`**: accepted but not reachable from any menu. Do not ship it.

An unrecognized `target` silently becomes `"window"`, so in LUNA a typo shows up as an Add
On in the wrong menu rather than an error. `ua-builder` rejects it.

`icon`:

- LUNA does not check that the file exists or read it when the manifest loads; a bad path is
  not an error, and an empty string is the same as leaving it out.
- LUNA reports the resolved absolute path as the `icon` property under `/gui/add_ons/<id>`
  (next to `id`, `title` and `target`), or an empty string when there is none. It is not yet
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
| `sdk_version` | string | The `@uaudio/ua-builder-sdk` version it was built against. Top-level or per entry. |
| `min_luna_version` | string | Lowest LUNA the Add On supports. |
| `engines` | string[] | `["luna"]`, `["wasm"]` or both. Declares which engines the page handles. |

### Tooling only

Read only by whatever installs the Add On: `ua-builder install`, or LUNA when it opens a
`.lunaaddon` bundle. It has no effect once the Add On is loaded.

| Field | Notes |
|---|---|
| `package_name` | Name of the Add Ons folder entry: the symlink (or copy) `ua-builder install` creates, or the `<name>.lunaaddon` folder LUNA installs a `.lunaaddon` bundle into. Without it the entry is named after the Add On folder (or the bundle). Surrounding whitespace is trimmed. Does not affect menu names, which come from `title`. |

`package_name` has to be a bare name, not a path. When LUNA installs a `.lunaaddon` bundle it
falls back to the bundle's name, with a warning, if the value is not a string, is blank, is
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
- On Windows the page is loaded from `file://`, where module scripts are blocked: use the
  script-tag bundle (`vendor/luna.global.js`).
- A `url` page is loaded from your server, so normal web rules apply (CORS, mixed content).

The native bridge is minimal: `window.lunaAPI.setAcceptsFileDrops(bool)` and the
`window.lunaHost.fileDrag*`/`filesDropped` callbacks for file drag and drop. Everything else
goes over the engine connection, including LUNA UI actions through `luna.gui`.

## Checklist

1. `manifest.json` at the Add On root, with `id`, `title`, `width`, `height` and exactly one
   of `html`/`url`.
2. Keep `id` and `title` unique across everything installed.
3. Relative `html`; set `local_content_offset` only if the page reaches above its folder.
4. `target: "app"` only for a full LUNA page; never `"browser"`.
5. Fill `version`, `sdk_version`, `min_luna_version`, `engines`.
6. Add `icon` with a relative path if the Add On ships one.
7. Add `package_name` if the folder name is not what the Add Ons folder should show.
8. `ua-builder install` and look in LUNA's Window (or View) menu.
