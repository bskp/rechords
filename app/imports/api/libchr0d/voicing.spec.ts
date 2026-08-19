import { describe, it } from "node:test";
import assert from "assert";
import Chord from "./chord";
import { chordIntervals, chordToMidiPitches } from "./voicing";

const intervals = (chord: string) => chordIntervals(Chord.from(chord)!);

describe("chordIntervals", () => {
  it("builds plain triads", () => {
    assert.deepEqual(intervals("C"), [0, 4, 7]);
    assert.deepEqual(intervals("Am"), [0, 3, 7]);
  });

  it("builds sevenths", () => {
    assert.deepEqual(intervals("G7"), [0, 4, 7, 10]);
    assert.deepEqual(intervals("Dm7"), [0, 3, 7, 10]);
    assert.deepEqual(intervals("Cmaj7"), [0, 4, 7, 11]);
  });

  it("builds suspended chords without a third", () => {
    assert.deepEqual(intervals("Dsus4"), [0, 5, 7]);
    assert.deepEqual(intervals("Asus2"), [0, 2, 7]);
    assert.deepEqual(intervals("E7sus4"), [0, 5, 7, 10]);
  });

  it("builds altered fifths", () => {
    assert.deepEqual(intervals("Cdim"), [0, 3, 6]);
    assert.deepEqual(intervals("Cdim7"), [0, 3, 6, 9]);
    assert.deepEqual(intervals("Bm7b5"), [0, 3, 6, 10]);
    assert.deepEqual(intervals("C+"), [0, 4, 8]);
  });

  it("builds extensions", () => {
    assert.deepEqual(intervals("C6"), [0, 4, 7, 9]);
    assert.deepEqual(intervals("C9"), [0, 4, 7, 10, 14]);
    assert.deepEqual(intervals("Cadd9"), [0, 4, 7, 14]);
    assert.deepEqual(intervals("C7b9"), [0, 4, 7, 10, 13]);
    assert.deepEqual(intervals("C13"), [0, 4, 7, 10, 21]);
    assert.deepEqual(intervals("Cm9"), [0, 3, 7, 10, 14]);
  });

  it("falls back to the triad for unknown tensions", () => {
    assert.deepEqual(intervals("Cfoo"), [0, 4, 7]);
    assert.deepEqual(intervals("Amblah"), [0, 3, 7]);
  });
});

// MIDI 60 is C4, so a note name makes a wrong pitch class visible at a glance.
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notes = (chord: string) =>
  chordToMidiPitches(Chord.from(chord)!).map(
    (p) => NAMES[p % 12] + (Math.floor(p / 12) - 1),
  );

describe("chordToMidiPitches", () => {
  it("puts the root of the chord in the bass", () => {
    assert.deepEqual(notes("C"), ["C3", "C4", "E4", "G4"]);
    assert.deepEqual(notes("Am"), ["A2", "A3", "C4", "E4"]);
    assert.deepEqual(notes("G"), ["G2", "G3", "B3", "D4"]);
  });

  it("stacks sevenths above the chord instead of next to the root", () => {
    assert.deepEqual(notes("D7"), ["D3", "D4", "F#4", "A4", "C5"]);
    assert.deepEqual(notes("Gmaj7"), ["G2", "G3", "B3", "D4", "F#4"]);
  });

  it("puts extensions on top", () => {
    assert.deepEqual(notes("C9"), ["C3", "C4", "E4", "G4", "A#4", "D5"]);
  });

  it("plays the slash note in the bass", () => {
    assert.deepEqual(notes("C/B"), ["B2", "C4", "E4", "G4"]);
  });

  it("keeps successive chords within an octave of each other", () => {
    const roots = ["C", "F", "G", "Am", "Eb", "B"].map(
      (c) => chordToMidiPitches(Chord.from(c)!)[1],
    );
    assert.ok(Math.max(...roots) - Math.min(...roots) < 12);
  });
});
