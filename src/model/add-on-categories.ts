/**
 * The categories an Add On's manifest `categories` names (HBH-36068): one or more of these, by
 * `name`. LUNA reports them as {@link AddOn.categories}; `ua-builder` checks each against this
 * list and suggests some with {@link suggestAddOnCategories} when a manifest has none.
 */

/** One Add On category: its `name`, as a manifest writes it, and what belongs in it. */
export interface AddOnCategoryInfo {
  readonly name: AddOnCategory;
  readonly description: string;
}

/** A category name a manifest's `categories` can hold. */
export type AddOnCategory =
  | 'AI Tools'
  | 'Control'
  | 'Create'
  | 'MIDI'
  | 'Recording'
  | 'Editing'
  | 'Mixing & Mastering'
  | 'Workflow'
  | 'Session Management'
  | 'Import & Export'
  | 'Utility';

/** Every Add On category, in the order the showcase lists them. */
export const ADD_ON_CATEGORIES: readonly AddOnCategoryInfo[] = [
  { name: 'AI Tools', description: 'Add Ons that use an AI model or agent as the core feature: assistants that answer questions about your session, generate or transform material from a prompt, or carry out tasks on your behalf.' },
  { name: 'Control', description: 'Add Ons that control something (LUNA, plugins, other) from a custom interface: Add On UI, hardware controllers and surfaces, and control surface protocols.' },
  { name: 'Create', description: 'Add Ons for starting something new: idea generators, chord and melody helpers, beat and pattern makers, lyric and arrangement prompts, and other sketching tools.' },
  { name: 'MIDI', description: 'Add Ons that generate, process, route or edit MIDI data: arpeggiators, quantizers, humanizers and MIDI mapping tools.' },
  { name: 'Recording', description: 'Add Ons that support capturing audio and MIDI: take management, punch and comp helpers, input and monitoring setup, and count-in or click tools.' },
  { name: 'Editing', description: 'Add Ons that change existing material on the timeline: clip slicing, rearranging, fades, time and pitch adjustments, and batch edits across clips and tracks.' },
  { name: 'Mixing & Mastering', description: 'Add Ons that shape the sound of a mix or master: level and pan balancing, EQ and dynamics helpers, reference and loudness tools, and metering built for mix decisions.' },
  { name: 'Workflow', description: 'Add Ons that save steps: automation of repeated tasks, session setup and templates, track naming and organizing, shortcuts and macros, and other session tools.' },
  { name: 'Session Management', description: 'Add Ons that show what is in a session and help keep it in order: session stats, track and plugin summaries, version and project notes, and audits of what a session contains.' },
  { name: 'Import & Export', description: 'Add Ons that move material in and out of LUNA: file and stem export, format conversion, sample library and web source import, and exchange with other apps.' },
  { name: 'Utility', description: 'Small single-purpose Add Ons and everything that does not fit above: custom displays and panels, and other general helpers.' },
];

/** True when `name` is one of {@link ADD_ON_CATEGORIES}, written exactly (case included). */
export function isAddOnCategory(name: unknown): name is AddOnCategory {
  return typeof name === 'string' && ADD_ON_CATEGORIES.some((c) => c.name === name);
}

// Words that point at a category, matched in lower case as whole words with a common ending
// ("record" matches "records", "recording"); one ending in `*` is a stem matched at the start of
// a word ("quantiz*" matches "quantize", "quantizer"). Weighted 2 when the word all but decides it.
const KEYWORDS: Record<AddOnCategory, [string, number][]> = {
  'AI Tools': [['ai', 2], ['agent', 2], ['assistant', 2], ['llm', 2], ['gpt', 2], ['claude', 2], ['chatbot', 2], ['prompt', 1], ['generative', 1], ['machine learning', 2], ['model', 1], ['natural language', 2]],
  Control: [['control surface', 2], ['controller', 2], ['hardware', 1], ['fader', 1], ['knob', 1], ['remote', 1], ['osc', 2], ['mackie', 2], ['hui', 2], ['console', 1], ['channel strip', 1], ['phone', 1], ['tablet', 1], ['plugin parameter', 1], ['control', 1]],
  Create: [['idea', 1], ['chord', 2], ['melody', 2], ['beat', 1], ['drum pattern', 2], ['pattern', 1], ['lyric', 2], ['songwriting', 2], ['sketch', 1], ['progression', 2], ['compos*', 1], ['generator', 1], ['inspiration', 2]],
  MIDI: [['midi', 2], ['arpeggiat*', 2], ['quantiz*', 2], ['humaniz*', 2], ['velocity', 1], ['note', 1], ['sysex', 2], ['cc', 1], ['piano roll', 1], ['notation', 1]],
  Recording: [['record', 2], ['take', 1], ['punch', 2], ['comp', 1], ['input', 1], ['monitor', 1], ['count-in', 2], ['count in', 2], ['click', 1], ['metronome', 2], ['arm', 1], ['capture', 1]],
  Editing: [['edit', 1], ['clip', 1], ['slice', 2], ['split', 1], ['trim', 1], ['fade', 2], ['crossfade', 2], ['rearrang*', 1], ['timeline', 1], ['time stretch', 2], ['pitch', 1], ['nudge', 1], ['batch', 1]],
  'Mixing & Mastering': [['mix', 2], ['master', 2], ['eq', 2], ['compressor', 1], ['dynamics', 1], ['loudness', 2], ['lufs', 2], ['meter', 1], ['metering', 2], ['pan', 1], ['level', 1], ['gain', 1], ['reference', 1], ['send', 1], ['bus', 1], ['reverb', 1]],
  Workflow: [['workflow', 2], ['automat*', 1], ['macro', 2], ['shortcut', 2], ['template', 2], ['rename', 1], ['naming', 1], ['organiz*', 1], ['color', 1], ['setup', 1], ['batch', 1], ['repeat', 1], ['hotkey', 2]],
  'Session Management': [['session', 1], ['stats', 2], ['statistic*', 2], ['summary', 1], ['audit', 2], ['inventory', 2], ['version', 1], ['notes', 1], ['project', 1], ['overview', 1], ['report', 1]],
  'Import & Export': [['import', 2], ['export', 2], ['stem', 2], ['bounce', 2], ['render', 1], ['convert', 2], ['format', 1], ['sample', 1], ['library', 1], ['download', 1], ['upload', 1], ['file', 1], ['share', 1]],
  Utility: [['utility', 2], ['display', 1], ['panel', 1], ['clock', 1], ['timer', 1], ['helper', 1], ['viewer', 1], ['video', 1], ['notepad', 1], ['calculator', 2], ['tuner', 1]],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Categories that suit an Add On, best first, guessed from what it says about itself (its
 * name, description, a prompt that asked for it). At most `max` (default 3); when nothing in
 * the text points anywhere, `['Utility']`. A guess to confirm with the author, never to write
 * into a manifest unasked.
 *
 * @example
 * Luna.suggestAddOnCategories('Quantize and humanize MIDI notes'); // ['MIDI', ...]
 */
export function suggestAddOnCategories(text: string, max = 3): AddOnCategory[] {
  const lower = text.toLowerCase();
  const scored: { name: AddOnCategory; score: number; order: number }[] = [];
  ADD_ON_CATEGORIES.forEach(({ name }, order) => {
    let score = 0;
    for (const [word, weight] of KEYWORDS[name]) {
      const pattern = word.endsWith('*') ? escapeRegExp(word.slice(0, -1)) : `${escapeRegExp(word)}(?:s|es|d|ed|ing|r|er|ers|rs)?(?![a-z0-9])`;
      const matches = lower.match(new RegExp(`(?<![a-z0-9])${pattern}`, 'g'));
      if (matches) score += weight * matches.length;
    }
    if (score > 0) scored.push({ name, score, order });
  });
  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  const best = scored.slice(0, Math.max(1, max)).map((s) => s.name);
  return best.length ? best : ['Utility'];
}
