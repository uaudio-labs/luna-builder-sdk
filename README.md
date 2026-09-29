# @uaudio/ua-builder-sdk

SDK for building LUNA Add Ons that run inside LUNA or, unchanged, in a browser
page driving the WebAssembly LUNA engine. TypeScript, zero runtime dependencies,
everything under one `Luna` namespace.

Status: alpha. Sessions, transport, tracks, controls, buses, playlists, clips, MIDI,
automation, renders and recording are implemented and tested against a live LUNA, and the
same Add On runs inside LUNA or, with `?engine=wasm`, on the in-page engine. See
[CHANGELOG.md](CHANGELOG.md).

## Get set up

This repo holds the SDK source; the builds (`dist/`, the agent plugin) are generated.
With Node.js 22 or newer:

```sh
git clone git@github.com:uaudio/ua-builder-sdk.git
cd ua-builder-sdk
npm ci        # the prepare script builds dist/ (the SDK and its CLI) and the agent plugin
```

That makes `npx ua-builder` work from this folder and from any Add On it scaffolds.
Distributed SDK packages arrive already built and skip this step.

## Build an Add On

Read `docs/QUICKSTART.md` first, then `docs/RECIPES.md` for eleven Add Ons worth asking an
agent for. `docs/api/` is the generated reference, `docs/llms.txt`
the index for coding agents, and `skills/` holds shared Claude Code and Codex skills for creating, extending,
testing and debugging Add Ons. From this folder:

```sh
npx ua-builder new my-add-on --title "My Add On"   # scaffold: manifest, page, logic, tests, vendored SDK
cd my-add-on && npm install && npm test             # tests run against Luna.MockEngine, no LUNA
npx ua-builder serve                                # http://localhost:8790/
npx ua-builder install                              # link into LUNA's Add Ons folder -> Window menu
npx ua-builder pack                                 # zip for distribution
npx ua-builder doctor                               # what is reachable from here
```

## Install for an agent

The same six skills ship as an agent plugin, [ua-luna-builder](plugin/README.md),
which also carries the SDK builds, its CLI, the scaffold template, the examples and the
consumer docs. An agent holding only the plugin can build, test and install an Add On with
no checkout, no npm install and no network.

### Claude Code

```bash
claude plugin marketplace add <path to this folder>
claude plugin install ua-luna-builder@ua-builder-sdk
```

`.claude-plugin/marketplace.json` points at `./plugins/ua-luna-builder` in this repo, so a
marketplace added from a clone resolves the plugin without a release tag. To try the
plugin without a marketplace:

```bash
claude --plugin-dir ./plugins/ua-luna-builder
```

### Codex

From this SDK folder, register the marketplace and install the plugin:

```bash
codex plugin marketplace add .
codex plugin add ua-luna-builder@ua-builder-sdk
```

Alternatively, after registering the marketplace, open the Plugins Directory, choose
the registered source, and install **LUNA Add On Builder**. Start a fresh task so it
loads the skills. Try: "Use the create-add-on skill to build a LUNA Add On with a
bar/beat counter." The catalog is
`.agents/plugins/marketplace.json`; its source path resolves from the repository root.

The marketplace needs the generated `plugins/ua-luna-builder/` folder: the `npm ci`
from "Get set up" creates it, as does `npm run build`; distributed SDK packages
already include it.

The plugin carries both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`.
Installing from a clone is not a release: the package is not published to npm, and nothing
here is listed in either host's public directory.

## Use

```ts
import { Luna } from '@uaudio/ua-builder-sdk';

const luna = await Luna.connect();               // inside LUNA (?port= on the URL) or LUNA on localhost
const session = await luna.session();          // focused session, subscribed and loaded
Luna.bindShortcuts(luna);                        // LUNA's undo/redo/play/record keys, behind the page's own

session.transport.location.onChange(() => {
  counter.textContent = Luna.formatBarBeat(session.transport.location.value?.bar_beat);
});
await session.transport.play();

for (const track of session.tracksInOrder) {
  console.log(track.name.value, track.gain.display.value, track.mute.on);
}
const vocal = session.tracks.items[0];
await vocal.mute.toggle();                     // click: touch, write, release, done for you
Luna.bindGesture(fader, vocal.gain);             // drag: touch on pointer down, release on up
fader.oninput = () => vocal.gain.normalized.set(Number(fader.value));

await session.transaction('Rename all', async () => {
  for (const t of session.tracks.items) await t.name.set(`${t.name.value} (mix)`);
});
await session.undo();

const reply = await luna.raw.get('/sessions', { properties: false, commands: false }); // escape hatch
await luna.close();
```

Every control a user edits must be touched, or LUNA cannot undo it as one step or record
it as automation: see "Touch" in `docs/QUICKSTART.md` section 6.

Every observable value is a `Prop`: read `.value`, subscribe with `.onChange(fn)`,
write with `.set(v)` where allowed. Collections (`session.tracks`, `playlist.clips`)
expose `.items`, `.byId(id)` and `.onChange(fn)`.

From a script tag (required on Windows, where Add Ons load from `file://`):

```html
<script src="luna.global.js"></script>
<script>
  Luna.connect().then((luna) => console.log(luna.engine));
</script>
```

In tests, no engine required:

```ts
const engine = new Luna.MockEngine();
engine.addSession('abc', { tracks: ['Vocal', 'Bass'] });
const luna = await Luna.connect({ port_: engine.port() });
```

## Layout

```
src/          the SDK source; everything public is exported from src/luna.ts as Luna.<Name>
cli/          ua-builder new/serve/install/pack/doctor, built to dist/cli.js
tests/        vitest: unit (Luna.MockEngine), live (a running LUNA), engine (wasm in Chrome)
docs/         QUICKSTART.md, RECIPES.md, MANIFEST.md, PROTOCOL.md, EVIDENCE.md, llms.txt, api/
skills/       create-add-on, add-feature, test-add-on, debug-connection, port-to-wasm, verify-add-on
templates/    add-on-basic scaffold
examples/     addon (master mute), mixer, inserts, ruler, sends, tracks (raw wire), plus
              check-*.mjs probes
plugin/       the hand-written shell of the agent plugin
dist/         generated: index.{js,cjs} + declarations, wire/, luna.global.js (script tag),
              cli.js (ua-builder)
plugins/      generated: ua-luna-builder, the skills, SDK builds, CLI, template, examples and
              docs as an agent plugin; catalogs in .claude-plugin/ and .agents/plugins/
```

What ships -- an `npm pack` of this repo -- is the package.json `files` list: the docs,
skills, templates, examples and the generated `dist/` and `plugins/`. See `DEVELOPING.md`
to work on the SDK itself.

Behaviour the SDK relies on that the protocol docs do not state is recorded, numbered, in
`docs/EVIDENCE.md`.

Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE).
