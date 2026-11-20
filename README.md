# @uaudio/luna-builder-sdk

SDK for building LUNA Add Ons that run inside LUNA or, unchanged, in a browser
page talking to LUNA on the same machine. TypeScript, zero runtime dependencies,
everything under one `Luna` namespace.

**License and terms.** Your use of the LUNA Builder SDK is governed by two documents: the
[Apache License, Version 2.0](LICENSE) and the
[Supplemental Terms for LUNA Builder SDK](SUPPLEMENTAL-TERMS.md). By downloading or using the
LUNA Builder SDK, you agree to these terms.

Status: beta. Sessions, transport, tracks, controls, buses, playlists, clips, MIDI,
automation, renders and recording are implemented and tested against a live LUNA. See
[CHANGELOG.md](CHANGELOG.md).

Not supported: streaming audio. The SDK controls and edits a session (clips, notes,
parameters, transport). It carries live MIDI messages, not audio: `Luna.SendMidi` plays them on
a track or out of a MIDI device, and `Luna.MidiInput` receives what the MIDI devices LUNA sees
are sending. Use `Luna.MidiInput` for live MIDI input, not Web MIDI
(`navigator.requestMIDIAccess()`): LUNA's macOS web view has no Web MIDI, and `Luna.MidiInput` hears the devices LUNA's MIDI settings list, the same way inside LUNA and in a browser.

## Get set up

This repo holds the SDK source; the builds (`dist/`, the agent plugin) are generated.
With Node.js 22 or newer:

```sh
npm ci        # in the SDK folder; the prepare script builds dist/ (the SDK and its CLI) and the agent plugin
```

That makes `npx ua-builder` work from this folder and from any Add On it scaffolds.
Distributed SDK packages arrive already built and skip this step: do not run `npm install`
in one, only in the Add Ons you scaffold from it. A scaffold's `.npmrc` sets
`legacy-peer-deps=true`, without which npm 10 (Node 22's) cannot install its test tools.

## Build an Add On

Read `docs/QUICKSTART.md` first, then `docs/RECIPES.md` for thirteen Add Ons worth asking an
agent for. An Add On that loads the user's files should read `docs/FILES.md`: a `File` for the
page and a path for LUNA are two separate routes, and LUNA 3.1.0.4589 has no working file
picker. An Add On that draws or edits clips and fades should read `docs/CLIPS.md` first:
draw LUNA's compiled clips, not the overlapping raw ones, and edit them the way LUNA does.
A preset picker should start from `examples/presets.html` and `luna.presets.selection()`.
`docs/api/` is the generated reference, `docs/llms.txt`
the index for coding agents, and `skills/` holds shared Claude Code and Codex skills for creating, extending,
testing and debugging Add Ons. From this folder:

```sh
npx ua-builder new my-add-on --name "My Add On"   # scaffold: manifest, page, logic, tests, vendored SDK
                                                    # --template add-on-typescript: TypeScript, built by Vite
cd my-add-on && npm install && npm test             # tests run against Luna.MockEngine, no LUNA
npx ua-builder serve                                # http://localhost:8790/
npx ua-builder probe http://localhost:8790/         # read the served page's live DOM as JSON
npx ua-builder install                              # link into LUNA's Add Ons folder -> Add Ons menu
npx ua-builder pack                                 # .lunaaddon file (a zip) for distribution
npx ua-builder doctor                               # what is reachable from here
```

## Install for an agent

The same six skills ship as an agent plugin, [ua-luna-builder](plugin/README.md),
which also carries the SDK builds, its CLI, the scaffold template, the examples and the
consumer docs. An agent holding only the plugin can build, test and install an Add On with
no checkout, no npm install and no network.

The GitHub repo carries the built plugin, so it is a marketplace on its own: no clone and
no `npm ci` needed.

### Claude Code

```bash
claude plugin marketplace add uaudio-labs/luna-builder-sdk
claude plugin install ua-luna-builder@luna-builder-sdk
```

From an SDK folder instead, use `claude plugin marketplace add <path to this folder>`.
`.claude-plugin/marketplace.json` points at `./plugins/ua-luna-builder` in this folder, so a
marketplace added from this folder resolves the plugin without a release tag. To try the
plugin without a marketplace:

```bash
claude --plugin-dir ./plugins/ua-luna-builder
```

### Codex

Register the marketplace and install the plugin:

```bash
codex plugin marketplace add uaudio-labs/luna-builder-sdk
codex plugin add ua-luna-builder@luna-builder-sdk
```

From an SDK folder instead, use `codex plugin marketplace add .`.

Alternatively, after registering the marketplace, open the Plugins Directory, choose
the registered source, and install **LUNA Add On Builder**. Start a fresh task so it
loads the skills. Try: "Use the create-add-on skill to build a LUNA Add On with a
bar/beat counter." The catalog is
`.agents/plugins/marketplace.json`; its source path resolves from the repository root.

A marketplace added from a folder needs the generated `plugins/ua-luna-builder/` folder: the
`npm ci` from "Get set up" creates it, as does `npm run build`; the GitHub repo and
distributed SDK packages already include it.

The plugin carries both `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`.
Installing from this folder is not a release: the package is not published to npm, and nothing
here is listed in either host's public directory.

## Use

```ts
import { Luna } from '@uaudio/luna-builder-sdk';

const luna = await Luna.connect();               // inside LUNA (?port= on the URL) or LUNA on localhost
const session = await luna.session();          // focused session, subscribed and loaded
Luna.bindShortcuts(luna);                        // undo/redo/play/record keys outside LUNA (LUNA has its own)

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
tests/        vitest: unit (Luna.MockEngine), live (a running LUNA)
docs/         QUICKSTART.md, FILES.md, FILES-GUIDE.md, CLIPS.md, RECIPES.md, MANIFEST.md, PROTOCOL.md, EVIDENCE.md, llms.txt, api/
skills/       create-add-on, add-feature, test-add-on, debug-connection, verify-add-on, edit-clips
templates/    add-on-basic scaffold
examples/     addon (master mute), mixer, inserts, ruler, sends, tracks (raw wire), plus
              check-*.mjs probes
plugin/       the hand-written shell of the agent plugin
dist/         generated: index.{js,cjs} + declarations, wire/, luna.global.js (script tag),
              cli.js (ua-builder)
plugins/      generated: ua-luna-builder, the skills, SDK builds, CLI, template, examples and
              docs as an agent plugin; catalogs in .claude-plugin/ and .agents/plugins/
```

What ships -- an `npm pack` of this folder -- is the package.json `files` list: the docs,
skills, templates, examples and the generated `dist/` and `plugins/`. See `DEVELOPING.md`
to work on the SDK itself.

Behaviour the SDK relies on that the protocol docs do not state is recorded, numbered, in
`docs/EVIDENCE.md`.

Licensed under the [Apache License, Version 2.0](LICENSE) and the
[Supplemental Terms for LUNA Builder SDK](SUPPLEMENTAL-TERMS.md). See [NOTICE](NOTICE).
