#!/usr/bin/env node
/**
 * Read-only conformance probe for musical time: the SDK's tempo map against LUNA's own
 * answers. `--require-changes` fails unless the map actually has tempo or signature changes.
 *
 *   node examples/check-musical-time.mjs [--require-changes]
 *
 * Two independent oracles:
 *   1. `get_tempo` at every tempo row, just after it, midway to the next, and before the first.
 *   2. LUNA's own bar|beat and seconds annotations on the transport marks, read without
 *      writing anything. An annotation is computed when the mark is written, so it can
 *      predate a tempo change: reported, not failed.
 */
import assert from 'node:assert/strict';
import { Luna } from '../sdk/index.js';

const B = Luna.TICKS_PER_BEAT;
const luna = await Luna.connect();
try {
  await luna.sessions.ready();
  const session = luna.sessions.current();
  assert.ok(session, 'Open a session in LUNA');
  await session.ready();
  const musical = session.musical;
  await musical.ready();
  const t = musical.timeline;

  const status = await luna.raw.get('/status', { propfilter: 'version', children: false, flatvalue: true });
  const report = {
    version: status?.properties?.version,
    tempoRows: musical.tempoMap.items.length,
    signatureRows: musical.timeSignatures.items.length,
    markers: session.markers.items.length,
    tempoPercent: session.transport.tempoPercent.value,
    getTempoAgreements: 0,
    annotationAgreements: 0,
    staleAnnotations: [],
  };

  // Oracle 1: get_tempo.
  const rows = [...musical.tempoMap.items].sort((x, y) => (x.tick.value ?? 0) - (y.tick.value ?? 0));
  const ticks = new Set([0]);
  rows.forEach((row, i) => {
    const here = row.tick.value ?? 0;
    const next = rows[i + 1]?.tick.value;
    for (const k of [here, here + 1, next !== undefined ? Math.floor((here + next) / 2) : here + B * 16]) ticks.add(k);
  });
  for (const tick of ticks) {
    const reply = await luna.raw.post(`${session.path}/get_tempo`, { session_uid: session.uid, tick });
    const tempo = reply?.tempo;
    assert.ok(Math.abs(t.tempoAt(tick) - tempo) < 1e-6, `tempoAt(${tick}) = ${t.tempoAt(tick)}, get_tempo says ${tempo}`);
    report.getTempoAgreements++;
  }

  // Oracle 2: the transport marks carry LUNA's own annotation.
  const marks = await luna.raw.get(session.path, { children: false, commands: false, propfilter: 'play_start' });
  for (const [name, mark] of Object.entries(marks?.properties ?? {})) {
    if (typeof mark?.value !== 'number' || !mark.bar_beat || !mark.min_sec) continue;
    const seconds = mark.min_sec.minutes * 60 + mark.min_sec.seconds;
    const bb = t.barBeat(mark.value);
    const agrees =
      Math.abs(t.seconds(mark.value) - seconds) < 1e-6 &&
      bb.bar === mark.bar_beat.bar && bb.beat === mark.bar_beat.beat && bb.tick === mark.bar_beat.tick &&
      Math.abs(t.tempoAt(mark.value) - mark.tempo) < 1e-6;
    if (agrees) report.annotationAgreements++;
    else {
      report.staleAnnotations.push({
        mark: name,
        tick: mark.value,
        luna: { seconds, ...mark.bar_beat, tempo: mark.tempo },
        sdk: { seconds: t.seconds(mark.value), ...bb, tempo: t.tempoAt(mark.value) },
      });
    }
  }

  // Round trips over the whole content range.
  const maxTick = session.transport.maxTick.value ?? 0;
  for (let tick = 0; tick <= maxTick; tick += B * 7 + 12345) {
    assert.equal(t.tickAt(t.barBeat(tick)), tick, `bar|beat round trip failed at ${tick}`);
    assert.ok(Math.abs(t.tickAtSeconds(t.seconds(tick)) - tick) <= 1, `seconds round trip failed at ${tick}`);
  }

  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--require-changes')) {
    assert.ok(
      musical.tempoMap.items.length > 1 || musical.timeSignatures.items.length > 1,
      'Multi-tempo/signature qualification remains pending: use a session with tempo or signature changes',
    );
  }
} finally {
  await luna.close();
}
