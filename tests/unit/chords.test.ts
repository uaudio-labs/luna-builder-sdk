/**
 * LUNA's Chord ruler as `session.musical.chords` (fact 100): a name at a tick, one per tick,
 * written with `set_chord` and removed with `delete_chord`.
 */
import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

const BAR = Luna.WHOLE_NOTE;

async function connected() {
  const engine = new Luna.MockEngine();
  engine.addSession('abc', { name: 'Demo' });
  await engine.settled();
  const luna = await Luna.connect({ port_: engine.port() });
  const session = await luna.session();
  await session.ready();
  return { engine, luna, session };
}

const posted = (engine: Luna.MockEngine, command: string) => engine.requests.filter((r) => r.verb === 'post' && r.path.endsWith(`/${command}`));
const names = (session: Luna.Session) => session.musical.chords.sorted.map((c) => [c.location.value, c.name.value]);

describe('parseChord', () => {
  it('splits root, type and slash bass the way LUNA spells chords', () => {
    expect(Luna.parseChord('C')).toEqual({ root: 'C', type: '', bass: null });
    expect(Luna.parseChord('Am7/G')).toEqual({ root: 'A', type: 'm7', bass: 'G' });
    expect(Luna.parseChord('F#m7b5')).toEqual({ root: 'F#', type: 'm7b5', bass: null });
    expect(Luna.parseChord('B♭maj7/D')).toEqual({ root: 'Bb', type: 'maj7', bass: 'D' });
    expect(Luna.parseChord('N.C.')).toBeUndefined();
  });

  it('reads a lowercase root or bass as the note, upper-cased', () => {
    expect(Luna.parseChord('am7')).toEqual({ root: 'A', type: 'm7', bass: null });
    expect(Luna.parseChord('bb')).toEqual({ root: 'Bb', type: '', bass: null });
    expect(Luna.parseChord('f#m/c#')).toEqual({ root: 'F#', type: 'm', bass: 'C#' });
    expect(Luna.parseChord('e')).toEqual({ root: 'E', type: '', bass: null });
    expect(Luna.parseChord('cmaj7')).toEqual({ root: 'C', type: 'maj7', bass: null });
  });

  it('leaves ordinary words starting with a note letter as text', () => {
    for (const word of ['bridge', 'chorus', 'end', 'fill', 'drop', 'break', 'add', 'fade']) expect(Luna.parseChord(word)).toBeUndefined();
  });

  it('ignores spaces around the slash', () => {
    expect(Luna.parseChord('C / E')).toEqual({ root: 'C', type: '', bass: 'E' });
    expect(Luna.parseChord('Am7/ G')).toEqual({ root: 'A', type: 'm7', bass: 'G' });
    expect(Luna.parseChord('Dsus4 /A')).toEqual({ root: 'D', type: 'sus4', bass: 'A' });
  });
});

describe('session.musical.chords', () => {
  it('writes a progression in one undo entry and lists it in order', async () => {
    const { engine, session } = await connected();
    await session.musical.setChords(
      ['C', 'Am', 'F', 'G'].map((name, i) => ({ tick: i * BAR, name })),
      { replaceRange: [0, 4 * BAR] },
    );
    expect(names(session)).toEqual([[0, 'C'], [BAR, 'Am'], [2 * BAR, 'F'], [3 * BAR, 'G']]);
    expect(engine.transactions).toEqual(['begin', 'commit']);
    expect(posted(engine, 'set_chord')).toHaveLength(4);
  });

  it('replaces only the span it is given, and rewrites nothing already right', async () => {
    const { engine, session } = await connected();
    engine.addChord('abc', 0, 'C');
    engine.addChord('abc', BAR, 'Dm');
    engine.addChord('abc', 2 * BAR, 'E');
    engine.addChord('abc', 8 * BAR, 'G');
    await engine.settled();
    await session.musical.chords.reload();
    const kept = session.musical.chords.at(0)!;

    await session.musical.setChords([{ tick: 0, name: 'C' }, { tick: BAR, name: 'Am' }], { replaceRange: [0, 4 * BAR] });
    expect(names(session)).toEqual([[0, 'C'], [BAR, 'Am'], [8 * BAR, 'G']]);
    expect(session.musical.chords.at(0)).toBe(kept);
    expect(posted(engine, 'set_chord').map((r) => (r.data as { name: string }).name)).toEqual(['Am']);
    expect(posted(engine, 'delete_chord')).toHaveLength(1);
  });

  it('makes no undo entry when the ruler already holds the progression', async () => {
    const { engine, session } = await connected();
    await session.musical.setChords([{ tick: 0, name: 'C' }]);
    engine.transactions.length = 0;
    await session.musical.setChords([{ tick: 0, name: 'C' }]);
    expect(engine.transactions).toEqual([]);
  });

  it('follows a chord the user adds in LUNA', async () => {
    const { engine, luna, session } = await connected();
    let notified = 0;
    session.musical.chords.onChange(() => notified++);
    engine.addChord('abc', 2 * BAR, 'C/E');
    await engine.settled();
    await luna.settled();
    const chord = session.musical.chords.at(2 * BAR)!;
    expect(notified).toBeGreaterThan(0);
    expect([chord.location.value, chord.name.value]).toEqual([2 * BAR, 'C/E']);
    expect(chord.parsed).toEqual({ root: 'C', type: '', bass: 'E' });
  });

  it('adds, renames, moves and deletes a chord, each resolving with the change visible', async () => {
    const { engine, session } = await connected();
    const chord = await session.musical.addChord(0, 'C');
    await chord.rename('C/E');
    expect(chord.name.value).toBe('C/E');
    expect(chord.parsed?.bass).toBe('E');
    await chord.moveTo(BAR);
    expect(chord.location.value).toBe(BAR);
    await chord.moveTo(BAR);
    expect(posted(engine, 'set_chord')).toHaveLength(3);
    await chord.delete();
    expect(session.musical.chords.items).toEqual([]);
    expect(posted(engine, 'delete_chord')).toHaveLength(1);
  });

  it('replaces the chord already at a tick, as LUNA does', async () => {
    const { session } = await connected();
    await session.musical.addChord(0, 'C');
    await session.musical.addChord(0, 'Cmaj7');
    expect(names(session)).toEqual([[0, 'Cmaj7']]);
  });

  it('matches names LUNA stores with ASCII accidentals', async () => {
    const { session } = await connected();
    const chord = await session.musical.addChord(0, 'B♭');
    expect(chord.name.value).toBe('Bb');
    await session.musical.setChords([{ tick: BAR, name: 'F♯' }]);
    expect(names(session)).toEqual([[0, 'Bb'], [BAR, 'F#']]);
  });

  it('clears the ruler', async () => {
    const { session } = await connected();
    await session.musical.setChords([{ tick: 0, name: 'C' }, { tick: BAR, name: 'G' }]);
    await session.musical.clearChords();
    expect(session.musical.chords.items).toEqual([]);
  });

  it('refuses bad input before the wire', async () => {
    const { engine, session } = await connected();
    await expect(session.musical.addChord(1.5, 'C')).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.addChord(0, ' ')).rejects.toMatchObject({ code: 'out_of_range' });
    await expect(session.musical.setChords([{ tick: 0, name: 'C' }, { tick: 0, name: 'G' }])).rejects.toMatchObject({ code: 'out_of_range' });
    expect(posted(engine, 'set_chord')).toHaveLength(0);
  });
});
