# LUNA Add On Builder — Claude Code and Codex plugin

Build, test and install LUNA Add Ons. Everything needed is in this folder: the
`@uaudio/luna-builder-sdk` builds, its CLI, six skills, the scaffold template, four worked
examples and the consumer docs. No npm install, no network, no MCP server. LUNA must be
running on the same machine — or not at all, if the Add On runs on the in-page WebAssembly
engine.

## Skills

| Skill | For |
|---|---|
| [create-add-on](skills/create-add-on/SKILL.md) | Scaffold, connect, first feature, tests passing. |
| [add-feature](skills/add-feature/SKILL.md) | Wrap an engine path the SDK does not type yet. |
| [test-add-on](skills/test-add-on/SKILL.md) | `Luna.MockEngine` fixtures, the live lane, `settled()`. |
| [debug-connection](skills/debug-connection/SKILL.md) | Nothing connects, no pushes, wrong port, reconnect. |
| [port-to-wasm](skills/port-to-wasm/SKILL.md) | Run the Add On with no LUNA, on the in-page engine. |
| [verify-add-on](skills/verify-add-on/SKILL.md) | Prove it against a running LUNA from a second client; check the undo queue. |

## What is in here

```
sdk/            the SDK: index.{js,cjs} + declarations, wire/, luna.global.js (script tag,
                defines the Luna global), cli.js (the ua-builder CLI)
skills/         the six skills above
templates/      add-on-basic — what `ua-builder new` copies
examples/       addon (master mute), mixer, inserts, ruler, sends, automation, jobs,
                import, pianoroll, arrangement, editor, tracks, and the check-*.mjs probes
docs/           QUICKSTART, FILES, RECIPES, MANIFEST, PROTOCOL, EVIDENCE, tree/ (a LUNA tree shape snapshot)
scripts/        vendor-sdk.mjs — copy the script-tag bundle into an Add On folder
```

## Running the CLI

This folder is a complete prebuilt copy of the package, so the CLI runs straight from it:

```bash
node <plugin-root>/sdk/cli.js new my-add-on --title "My Add On"
node <plugin-root>/sdk/cli.js doctor
```

Resolve `<plugin-root>` relative to the file you are reading — two directories above a
`SKILL.md`, one above this README. Nothing here depends on a provider's cache layout. In a
project that already depends on `@uaudio/luna-builder-sdk`, `npx ua-builder <command>` is the
same CLI with the same arguments.

To make a hand-written page self-contained before installing it:

```bash
node <plugin-root>/scripts/vendor-sdk.mjs <add-on-directory>   # copies sdk/luna.global.js in
```

## Examples

`examples/addon/` is the one to read first: a single file, one button bound to the master
bus mute, and the whole connection lifecycle an installed Add On has to survive. It is the
copy-out template, so it is deliberately not listed in `examples/manifest.json` — vendor
the bundle and repoint its script tag before installing it. The other three run in place
from `examples/manifest.json`; see [examples/README.md](examples/README.md).

## Versions

Both host manifests and the SDK build here track the package version. Claude reads
`.claude-plugin/plugin.json`; Codex reads `.codex-plugin/plugin.json` and the `skills/`
path it names. This folder is generated from the `luna-builder-sdk` package by its build;
`npm run check:plugin` fails if anything in it is stale. Edit the originals, never this
folder.

Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE).
