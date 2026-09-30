# Add On `manifest.json`

Every Add On folder holds a `manifest.json` at its root. It declares the Add Ons in that
folder, their identity, their page and how they open. `ua-builder new` writes one;
`ua-builder install` and `pack` validate it.

## Where it lives

| Platform | Add Ons folder |
|---|---|
| macOS | `/Library/Application Support/Universal Audio/LUNA/Add Ons` |
| Windows | `%LOCALAPPDATA%\Universal Audio\LUNA\Add Ons` |

Each entry in that folder is the Add On folder or a symlink to one (`ua-builder install`
makes the symlink on macOS and copies on Windows). Only a file named exactly `manifest.json`
is read. LUNA rescans the folder, so Add Ons appear without a restart.

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

One bad entry in an array is dropped without affecting the others.

## Fields

### Required on every Add On

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique across everything installed. Reverse-DNS by convention. |
| `title` | string | Menu name. Also unique; duplicates collapse into one. |
| `width`, `height` | int | Initial window size in pixels. |
| `html` or `url` | string | Exactly one. `html` is relative to the manifest folder (preferred). `url` is a hosted page used as-is. |

### Optional

| Field | Type | Default | Notes |
|---|---|---|---|
| `target` | string | `"window"` | `"window"`: floating window in the Window menu. `"app"`: a full LUNA page in the View menu (`"page"` is an accepted synonym). `"browser"`: accepted but unreachable; do not ship it. Unknown values silently become `"window"`. |
| `icon` | string | none | Image path, resolved like `html`. Exposed as the `icon` property under `/gui/add_ons/<id>`; not yet drawn in menus. |
| `local_content_offset` | string | none | `html` only. Relative path from the manifest folder up to the folder your page loads resources from (`".."` when the page uses `../../shared/x.js`). The `html` file must be inside that folder. Ignored on Windows and for `url` entries. |

### Added by the builder SDK

LUNA ignores fields it does not know, so these are safe today and let tooling reason about
compatibility.

| Field | Type | Notes |
|---|---|---|
| `version` | string | The Add On's own semver. |
| `sdk_version` | string | The `@uaudio/ua-builder-sdk` version it was built against. Top-level or per entry. |
| `min_luna_version` | string | Lowest LUNA the Add On supports. |
| `engines` | string[] | `["luna"]`, `["wasm"]` or both. Declares which engines the page handles. |

### Tooling only

| Field | Notes |
|---|---|
| `package_name` | Name of the Add Ons folder entry: the symlink `ua-builder install` creates, or the `<name>.lunaaddon` folder LUNA installs a `.lunaaddon` bundle into. Must be a bare name. Falls back to the folder name. Does not affect menu names, which come from `title`. |

## How LUNA loads the page

LUNA appends `?port=<engine port>` to the page URL for `html` and `url` alike;
`Luna.connect()` reads it. On macOS local pages are served from a custom scheme (not
`file://`) so `fetch()` of local resources works, but only inside the manifest folder or the
`local_content_offset` folder. On Windows the page is loaded from `file://`, where module
scripts are blocked: use the script-tag bundle (`vendor/luna.global.js`). A `url` page follows
normal web rules (CORS, mixed content).

The native bridge is minimal: `window.lunaAPI.setAcceptsFileDrops(bool)` and the
`window.lunaHost.fileDrag*`/`filesDropped` callbacks for file drag and drop. Everything else
goes over the engine connection, including LUNA UI actions through `luna.gui`.

## Checklist

1. `manifest.json` at the Add On root, with `id`, `title`, `width`, `height` and one of `html`/`url`.
2. Keep `id` and `title` unique.
3. Relative `html`; set `local_content_offset` only if the page reaches above its folder.
4. Fill `version`, `sdk_version`, `min_luna_version`, `engines`.
5. `ua-builder install` and look in LUNA's Window (or View) menu.
