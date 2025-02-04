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

  it("should render slash chords properly", () => {
    assert.equal(Chord.from("C/B")?.toStringTensionsAndSlash(), "/B");
  });
});

describe;
