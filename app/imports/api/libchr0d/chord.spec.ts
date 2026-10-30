import { describe, it } from "node:test";
import assert from "assert";
import Note from "./note";
import Chord from "./chord";

describe("Chord", () => {
  it("should parse B7 correctly", () => {
    assert.deepEqual(
      Chord.from("(B7)"),
      new Chord(new Note(11, "undetermined"), "major", "7", true, undefined),
    );
  });

  it("should parse C/B correctly", () => {
    assert.deepEqual(
      Chord.from("C/B"),
      new Chord(
        new Note(0, "undetermined"),
        "major",
        "",
        false,
        new Note(11, "undetermined"),
      ),
    );
  });

  it("knows a chord again however it is spelled", () => {
    assert.equal(
      Chord.from("C#m7")?.identity(),
      Chord.from("Dbm7")?.identity(),
    );
    assert.equal(Chord.from("H")?.identity(), Chord.from("B")?.identity());
    assert.notEqual(Chord.from("C")?.identity(), Chord.from("Cm")?.identity());
  });

  it("knows a chord again after transposing there and back", () => {
    const chord = Chord.from("F#m7/C#")!;
    assert.equal(
      chord.transposed(5).transposed(-5).identity(),
      chord.identity(),
    );
  });

  it("should render slash chords properly", () => {
    assert.equal(Chord.from("C/B")?.toStringTensionsAndSlash(), "/B");
  });
});

describe;
