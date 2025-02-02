import { describe, it } from "node:test";
import assert from "assert";
import Note from "./note";
import Chord_ from "./chord";

describe("Chord", () => {
  it("should parse B7 correctly", () => {
    assert.deepEqual(
      Chord_.from("(B7)"),
      new Chord_(new Note(11, "undetermined"), "major", "7", true, undefined),
    );
  });

  it("should parse C/B correctly", () => {
    assert.deepEqual(
      Chord_.from("C/B"),
      new Chord_(
        new Note(0, "undetermined"),
        "major",
        "",
        false,
        new Note(11, "undetermined"),
      ),
    );
  });

  it("should render slash chords properly", () => {
    assert.equal(Chord_.from("C/B")?.toStringTensionsAndSlash(), "/B");
  });
});

describe;
