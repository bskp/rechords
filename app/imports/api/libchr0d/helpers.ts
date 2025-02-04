import Chord from "/imports/api/libchr0d/chord";
import { rotToTranspose, transposeToRotation } from "/imports/ui/Transposer";
import { Notation } from "/imports/api/libchr0d/note";

export const guessKeyFromChordCounts = (chordCounts: [string, number][]) => {
  const votes: { [key: string]: number } = {};
  const bump = (key: string, increment: number) => {
    votes[key] = (votes[key] ?? 0) + Math.sqrt(increment);
  };
  chordCounts.forEach(([chord, count]) => {
    const quality = chord[0];
    const valuestr = chord.slice(1);
    const value = parseInt(valuestr, 10);
    const rot = transposeToRotation(value);
    const left = quality + (((rotToTranspose(rot - 1) % 12) + 12) % 12);
    const right = quality + (((rotToTranspose(rot + 1) % 12) + 12) % 12);
    const parallel = quality === "m" ? "M" : "m" + value;
    bump(left, count);
    bump(right, count);
    bump(parallel, count);
    bump(chord, 2 * count);
  });
  return Object.entries(votes)
    .sort(([_, a], [__, b]) => b - a)
    .map(([chord, votes]) => {
      const c = Chord.fromCode(chord);
      //console.log(`${c}: ${votes}`);
      const isMinor = c?.quality == "minor";
      const value = ((c?.key.value ?? 0) + (isMinor ? 3 : 0)) % 12;
      return { keyValue: value, isMinor };
    })[0];
};

const majorKeyValueToNotation: Notation[] = [
  "bee", // C
  "sharp", // C#
  "sharp", // D
  "bee", // Eb
  "sharp", // E
  "bee", // F
  "sharp", // F#
  "sharp", // G
  "sharp", // G#
  "sharp", // A
  "bee", // Bb
  "sharp", // B
];
const minorKeyValueToNotation: Notation[] = [
  "bee", // Cm
  "sharp", // C#m
  "bee", // Dm
  "bee", // Ebm
  "sharp", // Em
  "bee", // Fm
  "sharp", // F#m
  "bee", // Gm
  "sharp", // G#m
  "sharp", // Am
  "bee", // Bbm
  "sharp", // Bm
];
export const notationPreferenceFor = (keyValue: number, isMinor: boolean) => {
  return isMinor
    ? minorKeyValueToNotation[keyValue]
    : majorKeyValueToNotation[keyValue];
};
