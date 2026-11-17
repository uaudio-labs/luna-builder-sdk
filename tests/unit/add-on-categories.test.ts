import { describe, expect, it } from 'vitest';
import { Luna } from '../../src/index';

describe('Add On categories', () => {
  it('lists the eleven showcase categories, each with a description', () => {
    expect(Luna.ADD_ON_CATEGORIES.map((c) => c.name)).toEqual([
      'AI Tools', 'Control', 'Create', 'MIDI', 'Recording', 'Editing', 'Mixing & Mastering', 'Workflow', 'Session Management', 'Import & Export', 'Utility',
    ]);
    for (const c of Luna.ADD_ON_CATEGORIES) expect(c.description.length).toBeGreaterThan(20);
  });

  it('checks names exactly', () => {
    expect(Luna.isAddOnCategory('MIDI')).toBe(true);
    expect(Luna.isAddOnCategory('midi')).toBe(false);
    expect(Luna.isAddOnCategory(3)).toBe(false);
  });

  it.each([
    ['Quantize and humanize MIDI notes', 'MIDI'],
    ['An AI assistant that answers questions about your session', 'AI Tools'],
    ['Export stems and bounce mixes to WAV files', 'Import & Export'],
    ['Loudness and LUFS metering for the master bus', 'Mixing & Mastering'],
    ['Chord progression and melody idea generator', 'Create'],
    ['Punch in and comp takes while recording', 'Recording'],
    ['Slice clips and add fades on the timeline', 'Editing'],
    ['Macros and keyboard shortcuts that rename tracks', 'Workflow'],
    ['Session stats and an audit of plugins in use', 'Session Management'],
    ['Drive LUNA from a hardware control surface over OSC', 'Control'],
  ])('suggests %j as %s first', (text, best) => {
    expect(Luna.suggestAddOnCategories(text)[0]).toBe(best);
  });

  it('suggests at most max categories, and Utility when nothing points anywhere', () => {
    expect(Luna.suggestAddOnCategories('MIDI mix export record edit', 2)).toHaveLength(2);
    expect(Luna.suggestAddOnCategories('Zzz')).toEqual(['Utility']);
    expect(Luna.suggestAddOnCategories('')).toEqual(['Utility']);
  });

  it('does not match a word inside another one', () => {
    // "said" holds "ai", "pancake" holds "pan": neither is a word of its own.
    expect(Luna.suggestAddOnCategories('He said pancake')).toEqual(['Utility']);
  });
});
