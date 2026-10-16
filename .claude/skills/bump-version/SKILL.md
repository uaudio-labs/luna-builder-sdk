---
name: bump-version
description: Bump the luna-builder-sdk major.minor.patch version and write release notes. Use whenever the user asks to "bump luna-builder-sdk version", "bump the SDK version", "cut a release", "release a new version", or otherwise wants the @uaudio/luna-builder-sdk package version incremented — the version itself is one `npm version` command, but the bump also writes two notes files, verifies, commits and tags.
---

# Bump luna-builder-sdk version

Bump the SDK/plugin version, consolidate the changes since the last bump into
`RELEASE_NOTES.md` and `CHANGELOG.md`, verify, then commit and tag.

## How versions work

The source carries only `major.minor.patch` (e.g. `0.1.0`), with no prerelease tag. Every
shipped SDK is `major.minor.patch.<build>`: the installer build
(`builder/installer/pkg_scripts/build-and-test.py`) stamps the Bamboo build number into a
copy of the source before building it, so each Bamboo build is already a distinct version
(`0.1.0.1234`) that matches what UA Connect publishes, and a local build is `0.1.0.0`.
Day-to-day builds therefore need no bump. Bump only when the marketing version changes.

`package.json` is the only place the version is set. `Luna.VERSION` is compiled in from it
(`tsup.config.ts`), `scripts/sync-plugin.mjs` writes it into the generated plugin's
manifests, the catalogs carry none, and Bamboo names its releases from it too (the plan's
`UA_VERSION_FILE` in uapkgspec). A bump changes no other file and no other repo;
`npm run check:plugin` asserts the built output carries one version everywhere.

## 1. Choose the new version

Read the current version from `package.json`. If the user named a version or an increment
(major/minor/patch), use it. Otherwise increment the patch number (`0.1.0` → `0.1.1`): the
build appends the Bamboo build number as the fourth part, so the patch is the smallest
increment there is. Never add a prerelease tag (`-alpha.N`) or a fourth part yourself.

## 2. Find the last bump and collect the changes

This folder lives inside the `sdk-luna` repo alongside other packages, so scope every
`git log` to it (`-- .`). The last bump is, in order of preference:
1. the most recent `v*` git tag (`git describe --tags --abbrev=0 --match 'v*'`), or
2. the most recent commit touching `package.json` whose subject is "Version <version>"
   (`git log --oneline -G'"version"' -- package.json`), or
3. if neither exists, the start of this folder's history.

History up to 0.1.0-alpha.8 (including its "Version" and older "Bump to" commits) stays in
the old `uaudio-labs/luna-builder-sdk` GitHub repo; the source was copied into `sdk-luna` at
that version, and `v0.1.0-alpha.9` is the first tag here. `0.1.0` switched to versions that
follow the Bamboo builds.

Collect what changed since then:

```bash
git log <last-bump>..HEAD --no-merges --pretty='%h %s' -- .
```

Read the diffs of commits whose one-line subject is not self-explanatory. The goal is a
consolidated, reader-facing list of changes — what a consumer of the SDK or the plugin
would notice — not a transcript of commit subjects. Fold multiple commits on one topic
into one bullet; leave out pure churn (formatting, CI, internal refactors with no visible
effect).

## 3. Write the notes

Two files, two audiences:

Notes are per `major.minor.patch`, not per build.

- **`RELEASE_NOTES.md`** (repo root) — concise. One section per version, newest first,
  each bullet a single sentence. Create the file with a short intro line if it does not
  exist yet. Section format:

  ```markdown
  ## <version> — <YYYY-MM-DD>

  - <one-sentence change>
  ```

- **`CHANGELOG.md`** — detailed, in the file's existing voice. Add a new `## <version>`
  section at the top (below the intro paragraph), grouping bullets under `Changed
  (breaking)` / `Changed` / `Added` / `Fixed` as the existing sections do, with the same
  level of explanatory detail (what changed, why, and what a consumer must do about it).
  Commits sometimes write their changelog bullets into the previous version's section as
  they land; diff `CHANGELOG.md` against the last bump and move any post-bump bullets into
  the new section — a version's section must describe only that version.
  Mirror the existing "Measured against LUNA <version>" line when the changes were
  verified against a live LUNA; ask the user for the LUNA build if unclear.

Show the drafted notes to the user for review before moving on — they know which changes
matter to consumers better than the git log does.

## 4. Set the version

```bash
npm version <new-version> --no-git-tag-version   # package.json + package-lock.json
```

Nothing else is edited by hand. If the old version still turns up outside
`CHANGELOG.md`, `RELEASE_NOTES.md` and `docs/api/` (regenerated in the next step), a new
place has started hard-coding it; derive it from `package.json` instead:

```bash
grep -rln '<old-version>' --exclude-dir=node_modules --exclude-dir=dist \
  --exclude-dir=plugins --exclude-dir=.git .
```

Example Add On manifests and the Add On template have a `"version"` of their own, which may
happen to equal the SDK's; leave those.

## 5. Verify

```bash
npm run check
```

This typechecks, runs the tests, rebuilds `dist/` and the generated plugin, regenerates
`docs/api/` (which picks up the new `VERSION`), and runs `check:plugin`, which asserts
the version is consistent everywhere. Fix anything it flags before committing; a red
check here means the bump is incomplete, not that the checker is wrong.

Then run `pac build sdk/luna/builder/installer` to confirm the installer builds the stamped
`<new-version>.0`.

## 6. Commit and tag

The commit message is exactly `Version <new-version>` (e.g. `Version 0.2.0`),
with no Jira prefix. That is a deliberate exception to the tree's Jira-prefix rule for
commits; don't ask for a Jira ID. The tag is a bare `v<new-version>` even though `sdk-luna`
holds other packages; the `v*` tags belong to this SDK. Stage only this folder, since the
repo may have unrelated changes:

```bash
git add -A .
git commit -m "Version <new-version>"
git tag v<new-version>
```

Include the regenerated `docs/api/` files — they are tracked. Do not push (or push the
tag) unless the user asks; show them the commit and tag so they can review first.
