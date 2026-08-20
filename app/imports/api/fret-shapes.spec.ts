import { describe, it } from "node:test";
import assert from "assert";
import Chord from "./libchr0d/chord";
import guitar from "@tombatossals/chords-db/lib/guitar.json";
import {
  authoredShapes,
  lookupShape,
  shapeFromSpec,
  shapeToMidiPitches,
} from "./fret-shapes";

describe("shapeFromSpec", () => {
  it("reads a grip the way a song writes it", () => {
    assert.deepEqual(shapeFromSpec("x32010", "032010"), {
      frets: [-1, 3, 2, 0, 1, 0],
      fingers: [0, 3, 2, 0, 1, 0],
      barres: [],
      baseFret: 1,
      capo: false,
    });
  });

  it("finds the barre of an F and marks it as a capo", () => {
    const f = shapeFromSpec("133211", "134211");
    assert.deepEqual(f?.barres, [1]);
    assert.equal(f?.capo, true);
  });

  it("moves the diagram up the neck for a high grip", () => {
    // Frets 7 to 9 are drawn from the seventh.
    const shape = shapeFromSpec("x79987", "x13341");
    assert.equal(shape?.baseFret, 7);
    assert.deepEqual(shape?.frets, [-1, 1, 3, 3, 2, 1]);
  });

  it("reads frets beyond the ninth, which are written as letters", () => {
    // "a" is the tenth fret, not a muted string.
    assert.equal(shapeFromSpec("xacca-")?.baseFret, 10);
  });

  it("returns nothing for a grip that is not six characters", () => {
    assert.equal(shapeFromSpec("x320"), undefined);
  });
});

describe("lookupShape", () => {
  const frets = (chord: string) => lookupShape(Chord.from(chord)!)?.frets;

  it("knows the open chords", () => {
    assert.deepEqual(frets("C"), [-1, 3, 2, 0, 1, 0]);
    assert.deepEqual(frets("Am"), [-1, 0, 2, 2, 1, 0]);
    assert.deepEqual(frets("G7"), [3, 2, 0, 0, 0, 1]);
  });

  it("addresses its keys by pitch, not by spelling", () => {
    // The database says Ab where a sheet may say G#, and B where it says H.
    assert.deepEqual(frets("G#"), frets("Ab"));
    assert.deepEqual(frets("H"), frets("B"));
  });

  it("finds the tensions the sheets use", () => {
    for (const chord of ["Dsus4", "F#m7", "Cmaj7", "Eadd9", "Bm7b5", "C+"]) {
      assert.ok(frets(chord), `no grip for ${chord}`);
    }
  });

  it("falls back to the plain triad for an unknown tension", () => {
    assert.deepEqual(frets("Cfoo"), frets("C"));
    assert.deepEqual(frets("Amblah"), frets("Am"));
  });
});

describe("authoredShapes", () => {
  it("collects the grips a song draws itself", () => {
    const shapes = authoredShapes(
      `<p><abbr class="chord" title="x32010" data-fingers="032010">C</abbr>
       <abbr class="chord" title="x02210" data-fingers="002310">Am</abbr></p>`,
    );

    assert.deepEqual([...shapes.keys()], ["C", "Am"]);
    assert.deepEqual(shapes.get("Am")?.frets, [-1, 0, 2, 2, 1, 0]);
  });

  it("keys them by chord, so that H and B meet", () => {
    const shapes = authoredShapes(
      `<abbr class="chord" title="x2444x" data-fingers="013331">H</abbr>`,
    );
    assert.ok(shapes.has("B"));
  });
});

describe("shapeToMidiPitches", () => {
  it("sounds the strings a grip holds down", () => {
    // C major: A string muted, then C3 E3 G3 C4 E4.
    assert.deepEqual(
      shapeToMidiPitches(shapeFromSpec("x32010")!),
      [48, 52, 55, 60, 64],
    );
    // E major, all six strings.
    assert.deepEqual(
      shapeToMidiPitches(shapeFromSpec("022100")!),
      [40, 47, 52, 56, 59, 64],
    );
  });

  it("counts from the fret the diagram starts at", () => {
    // Bb barre at the first fret against the same shape at the sixth.
    const low = shapeToMidiPitches(shapeFromSpec("113331")!);
    const high = shapeToMidiPitches(shapeFromSpec("668886")!);
    assert.deepEqual(
      high,
      low.map((p) => p + 5),
    );
  });

  it("agrees with every grip the database ships", () => {
    // The database carries the notes of each position, so the conversion can be
    // held against all of them at once.
    let checked = 0;
    for (const entries of Object.values(guitar.chords)) {
      for (const entry of entries) {
        for (const position of entry.positions) {
          assert.deepEqual(
            shapeToMidiPitches({
              frets: position.frets,
              baseFret: position.baseFret,
              capo: false,
            }),
            position.midi,
            `${entry.key}${entry.suffix} at fret ${position.baseFret}`,
          );
          checked++;
        }
      }
    }
    assert.ok(checked > 2000, `only ${checked} grips checked`);
  });
});
