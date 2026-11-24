---
name: bump-version
description: Bump the luna-builder-sdk version to match LUNA and tag a Dev, Beta, Final or Update release of it. Use whenever the user asks to "bump luna-builder-sdk dev", "bump luna-builder-sdk beta", "bump luna-builder-sdk final", "bump luna-builder-sdk update", "bump luna-builder-sdk to <version> <stage>", "bump luna-builder-sdk version", "bump the SDK version", "cut a release", or otherwise wants a new @uaudio/luna-builder-sdk version or release tag. A Beta or Update bump also writes the release notes; every bump verifies, commits and tags.
---

# Bump luna-builder-sdk version

The SDK's version follows LUNA's: SDK `3.1.1` is the SDK released alongside LUNA `3.1.1`.
Each version goes through numbered Dev and Beta releases and a Final one, all marked by git
tags. SDK changes that still work with that LUNA can ship after its Final as numbered
Updates of the same version. A bump picks the stage, writes the release notes (Beta and
Update only), verifies, commits and tags.

## How versions work

`package.json` carries only `major.minor.patch` (e.g. `3.1.1`), never a stage or
prerelease tag. The stage lives only in the git tag and the commit message:

| Stage | Tag | Commit message | Release notes |
|---|---|---|---|
| Dev N | `v3.1.1-dN` | `Version 3.1.1 Dev N` | untouched |
| Beta N | `v3.1.1-bN` | `Version 3.1.1 Beta N` | written |
| Final | `v3.1.1` | `Version 3.1.1 Final` | untouched |
| Update N | `v3.1.1-uN` | `Version 3.1.1 Update N` | written |

Dev and Beta counters are independent and count up within one `major.minor.patch`: a Dev
after `v3.1.1-b2` is the next Dev number, not 1. Both reset only with a new version (after
its Final, or when the user starts a new version). The Update counter starts at 1 after the
Final. Read the counters from the tags, never from memory:

```bash
git tag --list 'v3.1.1-d*' --sort=-v:refname | head -1   # last Dev
git tag --list 'v3.1.1-b*' --sort=-v:refname | head -1   # last Beta
git tag --list 'v3.1.1'                                  # Final exists?
git tag --list 'v3.1.1-u*' --sort=-v:refname | head -1   # last Update
```

An Update keeps the version: `package.json`, `min_luna_version` and the LUNA it targets
stay the same, and the installer's build number makes each Update a newer
`3.1.1.<build>` for UA Connect. Use one when the changes still work with that LUNA; when
they need a newer LUNA, start the next version instead. Semver reads `-uN` as a
prerelease (below `v3.1.1`), but only the tag carries it, and the GitHub sync publishes
it as a full release.

Every shipped SDK is `major.minor.patch.<build>`: the installer build
(`builder/installer/pkg_scripts/build-and-test.py`) stamps the Bamboo build number into a
copy of the source, so each Bamboo build is a distinct version (`3.1.1.1234`) matching what
UA Connect publishes, and a local build is `3.1.1.0`. `Luna.VERSION` is that number; it
does not show the stage.

`package.json` is the only place the version is set. `Luna.VERSION` is compiled in from it
(`tsup.config.ts`), `scripts/sync-plugin.mjs` writes it into the generated plugin's
manifests, the catalogs carry none, and Bamboo names its releases from it too (the plan's
`UA_VERSION_FILE` in uapkgspec). A version change touches no other file and no other repo;
`npm run check:plugin` asserts the built output carries one version everywhere.

## 1. Choose the stage and version

The user names a stage: `dev`, `beta`, `final` or `update`. If they did not ("bump luna-builder-sdk
version"), show the next tag for each stage and ask.

The version is the one in `package.json`, unless:
- the user named one ("bump luna-builder-sdk to 3.2.0 beta") — set it (step 4) and start
  both counters at 1;
- `package.json`'s version already has a Final tag and the stage is not `update` — that
  version is done, so ask the user which LUNA version comes next, or whether they meant
  an Update. Do not guess an increment.

Refuse, and say why, a Dev or Beta of a version that already has a Final tag, a second
Final, and an Update of a version with no Final tag. Never write a stage into `package.json` (`3.1.1-beta.1`): the installer, Bamboo and
UA Connect compare plain numbers.

## 2. Beta and Update only: find the previous release and collect the changes

Dev and Final skip to step 4 (or step 5 when the version is unchanged).

This folder lives inside the `sdk-luna` repo alongside other packages, so scope every
`git log` to it (`-- .`). A Beta's notes cover the changes since:
1. the previous Beta of this version (`v3.1.1-b<N-1>`), or, for Beta 1,
2. the previous Final: the highest plain `vX.Y.Z` tag
   (`git tag --list 'v[0-9]*' --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1`).
   If Updates of that Final exist, the last of them (`v3.1.1-u<N>`) instead.

An Update's notes cover the changes since the previous Update of this version
(`v3.1.1-u<N-1>`), or, for Update 1, its Final (`v3.1.1`).

Dev tags are not a boundary; their changes belong to the next Beta. History before
`v0.1.0-alpha.9` is in the old `uaudio-labs/luna-builder-sdk` GitHub repo; versions up to
`0.2.1` predate the LUNA-matched numbering.

```bash
git log <previous>..HEAD --no-merges --pretty='%h %s' -- .
```

Read the diffs of commits whose one-line subject is not self-explanatory. The goal is a
consolidated, reader-facing list of changes — what a consumer of the SDK or the plugin
would notice — not a transcript of commit subjects. Fold multiple commits on one topic
into one bullet; leave out pure churn (formatting, CI, internal refactors with no visible
effect).

## 3. Beta and Update only: write the notes

Two notes files, two audiences, one section per Beta or Update, and the features list.
The steps below say "Beta"; an Update is the same with `Update N` in the headings
(`## 3.1.1 Update 1 — <YYYY-MM-DD>`, `## 3.1.1 Update 1`). Commits leave bullets under
`## Unreleased` as they land; that section becomes the Beta's section — keep every bullet
it has, add the rest from the log, and leave no `Unreleased` section behind (a later change
adds a fresh one).

- **`RELEASE_NOTES.md`** — concise, newest first, each bullet a single sentence:

  ```markdown
  ## 3.1.1 Beta 2 — <YYYY-MM-DD>

  - <one-sentence change>
  ```

  **Breaking changes come first and are never folded away.** Every `Changed (breaking)` item
  in the changelog gets its own bullet at the top of the section, starting with
  `**Breaking:**`, naming the old and new API and what an Add On must do, and pointing at
  `CHANGELOG.md` for the detail. When showing the draft to the user, list the breaking
  bullets separately so they can confirm none is missing.

- **`CHANGELOG.md`** — detailed, in the file's existing voice. The section is
  `## 3.1.1 Beta 2` at the top (below the intro paragraph), grouping bullets under
  `Changed (breaking)` / `Changed` / `Added` / `Fixed` as the existing sections do, with the
  same level of explanatory detail (what changed, why, and what a consumer must do about
  it). Diff `CHANGELOG.md` against the previous release and move any bullets written into an
  older section since then into the new one — a section must describe only its Beta.
  Mirror the existing "Measured against LUNA <version>" line when the changes were verified
  against a live LUNA; ask the user for the LUNA build if unclear.

- **`FEATURES_LIST.md`** — the current feature set by area, with no versions. Check it
  against every feature bullet in the new section: add a bullet for a new feature (in its
  area, or a new section), reword one whose API changed, delete one that was removed. Fixes,
  docs and other changes that add no feature stay out. Usually the changes already did this
  as they landed; the Beta is where gaps get caught.

Show the drafted notes to the user for review before moving on — they know which changes
matter to consumers better than the git log does.

A Final adds no section: its notes are its Betas'. An Update's section is its own; the
Final's release on GitHub is not changed by it. If `Unreleased` has bullets at a Final,
tell the user those changes have shipped in no Beta and ask whether to cut a Beta first.

## 4. Set the version (only when it changes)

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
check here means the release is incomplete, not that the checker is wrong.

When the version changed, also run `pac build sdk/luna/builder/installer` to confirm the
installer builds the stamped `<version>.0`.

## 6. Commit and tag

The commit message is exactly the one in the table (`Version 3.1.1 Beta 2`), with no Jira
prefix. That is a deliberate exception to the tree's Jira-prefix rule for commits; don't
ask for a Jira ID. The tag is `v<version>`, `v<version>-dN`, `v<version>-bN` or `v<version>-uN`; the `v*`
tags belong to this SDK even though `sdk-luna` holds other packages. Stage only this
folder, since the repo may have unrelated changes. A Dev or Final that changes no file is
still its own commit, so the tag marks a commit of its own:

```bash
git add -A .
git commit --allow-empty -m "Version 3.1.1 Beta 2"
git tag v3.1.1-b2
```

Include the regenerated `docs/api/` files — they are tracked. Do not push (or push the
tag) unless the user asks; show them the commit and tag so they can review first. When
they do, push both: `git push origin HEAD v3.1.1-b2`. `builder/github-sync/sync-to-github.sh`
carries a `v*` tag on the published commit over to GitHub and drafts its release (Dev and
Beta as pre-releases, Final and Update as full releases).
