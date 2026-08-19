import Chord from "./chord";

// Where the chord tones are placed. The chord is stacked upwards from its root
// in root position — folding single tones into a fixed octave would put the
// seventh right next to the root (D7 as C4-D4-F#4-A4), which just sounds muddy.
// Anchoring the root instead keeps successive chords in the same register.
const CHORD_ANCHOR = 55; // G3, so roots land between G3 and F#4
const BASS_ANCHOR = 40; // E2, the low string of a guitar

const mod12 = (v: number) => ((v % 12) + 12) % 12;

/** The lowest pitch at or above `anchor` that has the given pitch class. */
const place = (anchor: number, pitchClass: number) =>
  anchor + mod12(pitchClass - anchor);

/**
 * Semitone offsets above the root, in close position.
 *
 * The tension string is free text, so this reads it feature by feature
 * (fifth, third, seventh, extensions) instead of matching whole suffixes.
 * Anything unrecognised simply falls back to the plain triad.
 */
export function chordIntervals(chord: Chord): number[] {
  const t = chord.tensions.toLowerCase().replace(/[\s'*()]/g, "");

  const isDiminished = /^dim|^°/.test(t);
  const isAugmented = /^\+|^aug|#5/.test(t);

  let fifth = 7;
  if (isDiminished || /b5/.test(t)) fifth = 6;
  else if (isAugmented) fifth = 8;

  // undefined third = power chord
  let third: number | undefined = chord.quality === "minor" ? 3 : 4;
  if (isDiminished) third = 3;
  if (/sus2/.test(t)) third = 2;
  else if (/sus4/.test(t) || t === "sus" || t === "4") third = 5;
  else if (t === "5") third = undefined;

  let seventh: number | undefined;
  if (/maj\d|ma7|Δ/.test(t)) seventh = 11;
  else if (isDiminished && /7/.test(t))
    seventh = 9; // diminished seventh
  else if (/7|9|11|13/.test(t) && !/add|69/.test(t)) seventh = 10;

  const intervals = [0];
  if (third !== undefined) intervals.push(third);
  intervals.push(fifth);
  if (/6/.test(t) && !/13/.test(t)) intervals.push(9);
  if (seventh !== undefined) intervals.push(seventh);

  if (/b9/.test(t)) intervals.push(13);
  if (/#9/.test(t)) intervals.push(15);
  if (/(^|[^b#])9/.test(t)) intervals.push(14);
  if (/#11/.test(t)) intervals.push(18);
  else if (/11/.test(t)) intervals.push(17);
  if (/b13/.test(t)) intervals.push(20);
  else if (/13/.test(t)) intervals.push(21);

  return [...new Set(intervals)].sort((a, b) => a - b);
}

/** MIDI note numbers for one strike of this chord. */
export function chordToMidiPitches(chord: Chord): number[] {
  const root = place(CHORD_ANCHOR, chord.key.value);
  const pitches = chordIntervals(chord).map((interval) => root + interval);

  const bass = place(BASS_ANCHOR, chord.slash?.value ?? chord.key.value);

  return [...new Set([bass, ...pitches])].sort((a, b) => a - b);
}
