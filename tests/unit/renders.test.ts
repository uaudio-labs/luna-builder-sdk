/**
 * Bounce, export and the render lifecycle (fact 44).
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { tracks: ['Vocal', 'Bass'], name: 'Demo', packageUid: 'pkg_abc' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  await luna.renders.watch().ready;   // /renders is outside the session watch (fact 34)
  return { engine, luna, session };
}

describe('Luna.Session.bounce', () => {
  it('creates a render, starts it, and reports it running', async () => {
    const { engine, session } = await connected();
    const { render, fileUids } = await session.bounce({ channelUids: ['Vocal'], name: 'Stem' });
    expect(fileUids).toHaveLength(1);
    expect(render.state.value).toBe('running');
    expect(render.name.value).toBe('Stem');
    expect(render.isOffline.value).toBe(true);     // offline unless realTime
    expect(engine.value(render.path, 'type')).toBe('bounce');
  });

  it('reports progress as 0..1 and resolves done() on completion', async () => {
    const { engine, luna, session } = await connected();
    const { render } = await session.bounce({ channelUids: ['Vocal', 'Bass'] });
    const settled = render.done();

    engine.finishRender(render.id, { percent: 50 });
    await engine.settled();
    await luna.settled();
    expect(render.progress.value).toBe(0.5);
    expect(render.isTerminal).toBe(false);

    engine.finishRender(render.id, { state: 'completed' });
    await expect(settled).resolves.toBeUndefined();
    expect(render.progress.value).toBe(1);
    expect(render.isTerminal).toBe(true);
  });

  it('rejects done() when the render is aborted or fails', async () => {
    const { engine, session } = await connected();
    const aborted = await session.bounce({ channelUids: ['Vocal'] });
    const abortedDone = aborted.render.done();
    await aborted.render.abort();
    await expect(abortedDone).rejects.toMatchObject({ code: 'aborted' });

    const failed = await session.bounce({ channelUids: ['Bass'] });
    const failedDone = failed.render.done();
    engine.finishRender(failed.render.id, { state: 'failed', error: 'disk full' });
    await expect(failedDone).rejects.toMatchObject({ code: 'failed' });
  });

  it('rejects done() when the engine drops the render before it is seen to finish', async () => {
    const { engine, session } = await connected();
    const { render } = await session.bounce({ channelUids: ['Vocal'] });
    const settled = render.done();
    engine.finishRender(render.id, { remove: true });
    await expect(settled).rejects.toMatchObject({ code: 'removed' });
  });

  it('writes to paths instead of the session when outputPaths are given', async () => {
    const { engine, session } = await connected();
    const { render } = await session.bounce({ channelUids: ['Vocal'], outputPaths: ['/tmp/vocal.wav'] });
    expect(engine.value(render.path, 'state')).toBe('running');
    await expect(session.bounce({ channelUids: ['Vocal', 'Bass'], outputPaths: ['/tmp/only-one.wav'] })).rejects.toMatchObject({ code: 'out_of_range' });
  });

  it('applies a tick range as the selection and puts the old one back', async () => {
    const { engine, session } = await connected();
    await session.contexts.load();
    await session.context.select({ startTick: 100, stopTick: 200 });
    await engine.settled();

    await session.bounce({ channelUids: ['Vocal'], range: { startTick: 0, stopTick: 8 * Luna.TICKS_PER_BEAT } });
    await engine.settled();
    expect(session.context.selectionStart.value).toBe(100);   // restored
    expect(session.context.selectionStop.value).toBe(200);
  });

  it('refuses an empty channel list, an unknown channel and a bad range', async () => {
    const { session } = await connected();
    await expect(session.bounce({ channelUids: [] })).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.bounce({ channelUids: ['nope'] })).rejects.toMatchObject({ code: 'not_found' });
    await expect(session.bounce({ channelUids: ['Vocal'], range: { startTick: 200, stopTick: 100 } })).rejects.toMatchObject({ code: 'out_of_range' });
  });
});

describe('Luna.Session.exportMain', () => {
  it('starts LUNA\'s own export and hands back the path it wrote', async () => {
    const { session } = await connected();
    const { render, file } = await session.exportMain({ name: 'Rough mix' });
    expect(file).toBe('/exports/Rough mix - MAIN.wav');
    expect(render.renderType.value).toBe('export');
    expect(render.state.value).toBe('running');
  });
});

describe('Luna.Renders', () => {
  it('lists every render, from any client', async () => {
    const { engine, luna, session } = await connected();
    const { render } = await session.bounce({ channelUids: ['Vocal'] });
    await engine.settled();
    expect(luna.renders.refresh().map((r) => r.id)).toContain(render.id);
    await render.delete();
    await engine.settled();
    expect(luna.renders.refresh().map((r) => r.id)).not.toContain(render.id);
  });
});
