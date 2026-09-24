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
import { Luna } from '@uaudio/ua-builder-sdk';
const luna = await Luna.connect();
const session = await luna.session();
await session.ready();
const track = session.visibleTracks[0];
const was = track.gain.real.value;
await track.gain.real.set(-6);            // the page's fader and readout must move
// ...look at the page, or poll its DOM from the browser tools...
await track.gain.real.set(was);           // put back what you touched
await luna.close();
```

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

## 4. Leave the session as you found it

Restore every value the checks changed and remove anything they created. Undo entries stay;
say so in your report. The `examples/check-*.mjs` scripts show the pattern: record, change,
assert against an independent read, restore in `finally`.

## Report

State the LUNA build (`get /status`), what was checked from the second client, the undo
entries seen, and anything restored. A check you could not run is a gap, not a pass.
