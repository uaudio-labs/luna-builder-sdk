---
name: verify-add-on
description: Prove a LUNA Add On works against a running LUNA, not just that it renders — drive it from a second client, check the page follows, and check LUNA recorded each edit once. Use before calling an Add On done, or when it passes its unit tests but misbehaves in LUNA.
---

# Verify an Add On against LUNA

A page that renders is not a page that works. The unit tests run on `Luna.MockEngine`; this
checks the real engine from outside the page, the way a user would notice a problem.

## 1. Serve it and open it

```sh
npx ua-builder doctor            # LUNA reachable on 4718, a session open
npx ua-builder serve             # http://localhost:8790/
```

Open the page in a browser (or `npx ua-builder install` and open it from LUNA's Window
menu). It must show connected and the session's name. If it does not, use the
`debug-connection` skill.

## 2. Change LUNA from a second client; the page must follow

Write a short Node script next to the Add On. It is an independent client, so what the
page shows afterwards proves the page is live rather than drawing what it wrote itself.

```js
import { Luna } from '@uaudio/luna-builder-sdk';
const luna = await Luna.connect();
const session = await luna.session();
await session.ready();
const track = session.visibleTracks[0];
const was = track.gain.real.value;
await track.gain.real.set(-6);            // the page's fader and readout must move
// ...read the page's DOM (below)...
await track.gain.real.set(was);           // put back what you touched
await luna.close();
```

Read what the page renders with `ua-builder probe`: it opens the url in headless Chrome,
waits until a `Luna` client on the page is connected **and its focused session is ready**
(the `Luna.clients()` hook; `--wait <js>` overrides), then until the DOM holds still for one
quiet period (`--settle <ms>`, default 250), evaluates `--expr` against the live DOM and
prints JSON on stdout — no CDP boilerplate, no `--dump-dom` race against the connect, and no
placeholder "connecting..." reads from a scaffold still binding its session.

```sh
npx ua-builder probe http://localhost:8790/ --expr "document.querySelector('.gain').textContent"
npx ua-builder probe http://localhost:8790/   # default: document.body.innerText
npx ua-builder probe http://localhost:8790/ --screenshot page.png   # also save what it drew
```

`--mock [fixture.js]` probes the page on `?engine=mock` instead of LUNA, which is useful for
checking layout offline. It is not proof that the page works with LUNA.

An Add On that loads files: drive it with `LunaProbe.dropFiles` / `LunaProbe.chooseFiles`
(and `--luna-bridge` with `LunaProbe.dropPaths` for path drops), then confirm the new source
from the second client. Inside LUNA, also pick and drop a real file by hand once.

Probe before and after each change from the second client; the two readouts are the proof.
A page still in its `Luna.connect()` retry loop counts as not ready — the probe keeps waiting
within `--timeout` (default 20 s) and on timeout prints `timed out ... waiting for:` with what
the page shows. If it warns that the page's vendored SDK predates `Luna.clients()`, refresh
the vendored bundle (`ua-builder pack`, or re-vendor) — until then the probe cannot see the
page's connection state.

Do the same for every value the page shows: a mute, a send's destination, a clip, a marker.
`examples/check-sync.mjs` is a complete two-client check.

## 3. Use the page; LUNA must record each edit once

For each control on the page, operate it, then read the session's undo queue from the
script:

```js
const q = await luna.raw.get(`${session.path}/undo_queues`, { children: true, levels: 2, commands: false, flatvalue: true, propfilter: ['rowid', 'name'] });
```

- A click is one entry; a whole drag is one entry, not one per move (see "Touch" in
  `docs/QUICKSTART.md`). A control write outside a touch makes no entry at all (fact 85).
- An edit whose entry is missing did not happen, whatever the reply said (fact 71).
- Undo from LUNA (Cmd+Z) and check the page shows the value going back.
- Open the page in LUNA on a large session and play it. Meters and the playhead should move
  smoothly, and the `com.apple.WebKit.GPU` process should stay well below 100% CPU
  (`ps -Ao pid,%cpu,comm | grep WebKit.GPU`). If it is pinned, something repaints at playback
  rate: docs/DRAWING.md, "Measuring inside LUNA".

## Secrets

Search the Add On for `localStorage`, `sessionStorage`, `indexedDB` and `document.cookie`;
any API key, token or password stored there, or written into the manifest or a shipped file,
fails the check: move it to `luna.secrets` (docs/MANIFEST.md, "Secrets"). Inside LUNA, save a
key, close and reopen the Add On, and confirm it is still there.

## 4. Leave the session as you found it

Restore every value the checks changed and remove anything they created. Undo entries stay;
say so in your report. The `examples/check-*.mjs` scripts show the pattern: record, change,
assert against an independent read, restore in `finally`.

- Ask before editing the user's open session. Prefer a throwaway session; otherwise a
  temporary track, with clips placed past the end of the session, never the user's clips.
- Before changing anything, record the ids of tracks and `session.sources`; afterwards remove
  only ids that were not there before. Never delete something you cannot prove your checks
  made, even if it looks like theirs.
- Clip edits make LUNA render (time-stretch, clip effects, another sample rate), and each
  rendering is announced seconds later. Wait until `session.sources` stops growing before
  deleting the files your checks created (`post /workspace/delete_audio_files
  { session_package_uid, files, move_to_trash: true }`), or some are left behind.
- Put the cleanup in `finally`, so a check that throws still cleans up, and check the track
  and source counts at the end.

## Report

State the LUNA build (`get /status`), what was checked from the second client, the undo
entries seen, and anything restored. A check you could not run is a gap, not a pass.
If `manifest.json` has no `categories` (`ua-builder install` warns), suggest one or two from
what the Add On now does (docs/MANIFEST.md, "Categories") and ask the user to confirm them.

## SDK feedback

If part of this workflow was harder than the SDK should make it — a missing API, an
awkward idiom, boilerplate the SDK could absorb — end your reply with the line
`LUNA BUILDER SDK IMPROVEMENT: <version>`, where `<version>` is the `ua-builder` row of
`ua-builder doctor` (for example `LUNA BUILDER SDK IMPROVEMENT: 0.1.0.1234`), followed by a
prompt that can be used to update the SDK to support the improved workflow: what you were
doing, what was awkward, and the API you wished for.

Then ask the user whether to send the improvement to Universal Audio, and say that sending
it needs a GitHub account. If they agree, run
`ua-builder feedback improvement --title "<one-line summary>" --body-file -` with the prompt on
stdin (add `--luna-version <x.y.z>` when you know it). It opens a prefilled issue in their
browser for them to check and submit. A bug or feature request the user wants to report goes
the same way, as `ua-builder feedback bug` or `ua-builder feedback feature`.
