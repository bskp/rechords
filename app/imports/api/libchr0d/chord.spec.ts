import { describe, it } from "node:test";
import assert from "assert";
import Note from "./note";
import Chord_ from "./chord";

describe("Chord", () => {
  it("should parse B7 correctly", () => {
    assert.deepEqual(
      Chord_.from("(B7)"),
      new Chord_(new Note(11, "undetermined"), true, "major", "7", undefined),
    );
  });
});

describe;
