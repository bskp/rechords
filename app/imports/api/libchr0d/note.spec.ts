import { describe, it } from "node:test";
import assert from "assert";
import Note from "./note";

describe("Note", () => {
  it("should parse B correctly", () => {
    assert.deepEqual(Note.from("B"), new Note(11, "undetermined"));
  });
});
