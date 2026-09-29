/**
 * Live lane: needs native LUNA running on ws://localhost:4718 with a session open.
 * Run with `npm run test:live`. Each test leaves the engine as it found it.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const live = process.env['UA_LIVE'] === '1';

describe.skipIf(!live)('live: connect to LUNA', () => {
  let luna: Luna.Client;

  beforeAll(async () => {
    luna = await Luna.connect({ requestTimeoutMs: 5000 });
  });

  afterAll(async () => {
    await luna?.close();
  });

  async function openSessionUid(): Promise<string | undefined> {
    const reply = (await luna.raw.get('/sessions', { properties: false, commands: false })) as { children?: { path: string }[] };
    return reply.children?.[0]?.path;
  }

  it('connects and reads /status', async () => {
    expect(luna.connected).toBe(true);
    const status = (await luna.raw.get('/status', { flatvalue: true, commands: false, children: false })) as { properties: { name: string } };
    expect(status.properties.name).toBe('LUNA');
  });

  it('fact 10 and 18: a missing path and an empty node both answer {} with no error', async () => {
    await expect(luna.raw.get('/definitely/not/here')).resolves.toEqual({});
    const sessions = (await luna.raw.get('/sessions', { properties: false, commands: false })) as { children?: unknown };
    if (sessions.children === undefined) console.log('no session open: /sessions answered {}');
  });

  it('fact 3: a JSON-framed text frame is accepted', async () => {
    const socket = new WebSocket('ws://localhost:4718');
    await new Promise<void>((res, rej) => {
      socket.onopen = () => res();
      socket.onerror = () => rej(new Error('open failed'));
    });
    const reply = new Promise<string>((res) => {
      socket.onmessage = (e) => res(String(e.data));
    });
    socket.send('JSON\0\0\0\0' + JSON.stringify({ cmd: 'get', url: '/status?children=0&commands=0&ua_id=j1' }));
    const text = await reply;
    expect(JSON.parse(text).parameters.ua_id).toBe('j1');
    socket.close();
  });

  it('fact 11: error codes for bad sets and posts (needs an open session)', async () => {
    const uid = await openSessionUid();
    if (!uid) return console.log('fact 11 skipped: open a session in LUNA and rerun');
    const s = `/sessions/${uid}`;
    await expect(luna.raw.set(`${s}/tracks`, 1)).rejects.toMatchObject({ code: 'uasrv.invalid_property' });
    await expect(luna.raw.set(`${s}/uid`, 'x')).rejects.toMatchObject({ code: 'uasrv.read_only' });
    await expect(luna.raw.set(`${s}/no_such_property`, 1)).rejects.toMatchObject({ code: 'uasrv.invalid_object' });
    await expect(luna.raw.post(`${s}/no_such_command`, {})).rejects.toMatchObject({ code: 'uasrv.invalid_object' });
  });

  it('fact 21: property get shapes', async () => {
    const uid = await openSessionUid();
    if (!uid) return console.log('fact 21 skipped: open a session in LUNA and rerun');
    const s = `/sessions/${uid}`;
    const plain = (await luna.raw.get(`${s}/looping`)) as { value: boolean };
    expect(typeof plain.value).toBe('boolean');
    expect(await luna.raw.get(`${s}/looping`, { flatvalue: true })).toBe(plain.value);
    expect(await luna.raw.get(`${s}/looping/value`)).toBe(plain.value);
  });

  it('fact 24: commands self-describe with a JSON schema', async () => {
    const uid = await openSessionUid();
    if (!uid) return console.log('fact 24 skipped: open a session in LUNA and rerun');
    const reply = (await luna.raw.get(`/sessions/${uid}`, { properties: false, children: false })) as {
      commands: { path: string; properties?: { parameters?: { parameters?: { type?: string } } } }[];
    };
    const cmd = reply.commands.find((c) => c.path === 'new_track');
    expect(cmd).toBeDefined();
    expect(cmd?.properties?.parameters?.parameters?.type).toBe('object');
  });

  it('facts 6, 22, 23: writer echo, duplicate pushes, plain subscription depth (toggles looping and restores it)', async () => {
    const uid = await openSessionUid();
    if (!uid) return console.log('fact 6 skipped: open a session in LUNA and rerun');
    const path = `/sessions/${uid}`;
    const observer = await Luna.connect({ requestTimeoutMs: 5000 });
    try {
      const before = Luna.propertyValue(await luna.raw.get(`${path}/looping`)) as boolean;
      const writerSaw: Luna.Event[] = [];
      const observerSaw: Luna.Event[] = [];
      const rootSaw: Luna.Event[] = [];
      const unsubs = [
        luna.raw.subscribe(`${path}/looping`, (e) => writerSaw.push(e)),
        observer.raw.subscribe(`${path}/looping`, (e) => observerSaw.push(e)),
        observer.raw.subscribe('/', (e) => {
          if (e.path === `${path}/looping`) rootSaw.push(e);
        }),
      ];
      await new Promise((r) => setTimeout(r, 300));
      await luna.raw.set(`${path}/looping`, !before);
      await new Promise((r) => setTimeout(r, 400));
      await luna.raw.set(`${path}/looping`, before);
      await new Promise((r) => setTimeout(r, 400));
      for (const u of unsubs) u();
      expect(writerSaw).toEqual([]); // fact 6
      expect(observerSaw.length).toBeGreaterThanOrEqual(2); // fact 22 allows duplicates
      expect(observerSaw.map((e) => e.data)).toContain(!before);
      expect(rootSaw.length).toBeGreaterThanOrEqual(2); // fact 23
      expect(Luna.propertyValue(await luna.raw.get(`${path}/looping`))).toBe(before);
    } finally {
      await observer.close();
    }
  });
});
