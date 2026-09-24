#!/usr/bin/env node
/**
 * Read-only conformance probe for the arrangement: every clip the model reports is
 * compared with an independent wire read of the same node, and every source's waveform
 * overview is compared with the raw analysis data.
 *
 *   node examples/check-arrangement.mjs [--require-data]
 *
 * `--require-data` fails unless the session actually has clips and a readable waveform, so
 * a pass on an empty session cannot be mistaken for a qualified one.
 */
import assert from 'node:assert/strict';
import { Luna } from '../sdk/index.js';

const luna = await Luna.connect();
try {
  await luna.sessions.ready();
  const session = luna.sessions.current();
  assert.ok(session, 'Open a session in LUNA');
  await session.ready();
  await Promise.all(session.playlists.items.map((p) => p.clips.load()));
  await session.sources?.load();

  const status = await luna.raw.get('/status', { propfilter: 'version', children: false, flatvalue: true });
  const report = {
    version: status?.properties?.version,
    playlists: session.playlists.items.length,
    clips: session.playlists.items.reduce((n, p) => n + p.clips.items.length, 0),
    sources: session.sources?.items.length ?? 0,
    clipsVerified: 0,
    waveformsVerified: 0,
    unavailableOverviews: 0,
  };

  // Each clip against an independent read of its own node.
  for (const playlist of session.playlists.items) {
    for (const clip of playlist.clips.items) {
      const node = await luna.raw.get(clip.path, {
        children: false,
        commands: false,
        flatvalue: true,
      });
      const wire = node?.properties ?? {};
      for (const [prop, wireName] of [
        [clip.start, 'start'],
        [clip.stop, 'stop'],
        [clip.sourceStart, 'source_start'],
        [clip.sourceStop, 'source_stop'],
        [clip.sourceUid, 'source_uid'],
      ]) {
        assert.equal(prop.value, wire[wireName], `Clip ${clip.id}: ${wireName} differs from an independent read`);
      }
      report.clipsVerified++;
    }
  }

  // Each source's overview against the raw analysis rows, including the signed scaling.
  const pkg = session.sessionPackageUid.value;
  for (const source of session.sources?.items ?? []) {
    const overview = await source.overview(0);
    if (!overview) { report.unavailableOverviews++; continue; }
    const raw = await luna.raw.get(`/workspace/sessions/${pkg}/audio/${source.id}/analysis/overview/file/data`, { children: false, commands: false });
    const channels = raw?.properties?.data?.value?.data ?? raw?.value?.data;
    if (!Array.isArray(channels)) { report.unavailableOverviews++; continue; }
    assert.equal(overview.channels.length, channels.length, `Source ${source.id}: channel count differs`);
    for (let c = 0; c < channels.length; c++) {
      for (const key of ['min', 'max']) {
        const mine = Array.from(overview.channels[c][key]).slice(0, 8);
        const theirs = channels[c][key].slice(0, 8).map((v) => v / 32768);
        for (let i = 0; i < mine.length; i++) {
          assert.ok(Math.abs(mine[i] - theirs[i]) < 1e-6, `Source ${source.id}: ${key}[${i}] differs (${mine[i]} vs ${theirs[i]})`);
        }
      }
    }
    if (overview.count > 0) report.waveformsVerified++;
  }

  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--require-data')) {
    assert.ok(report.clips > 0 && report.waveformsVerified > 0, 'Populated clip/waveform validation remains pending: use a suitable session');
  }
} finally {
  await luna.close();
}
