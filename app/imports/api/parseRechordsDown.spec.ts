import { describe, it } from "node:test";
import assert from "assert";
import { parse } from "node-html-parser";
import { parseRechordsDown } from "./parseRechordsDown";

const md = `Testlied
Niemand
========

Intro:
[C] [dm7]

1:
[C]eins, [Dm7]zwei drei
ab[C]cd[Dm7]ef
`;

const syllables = (html: string) =>
  parse(html)
    .querySelectorAll("i")
    .map((i) => ({
      chord: i.getAttribute("data-chord"),
      verse: i.getAttribute("data-verse"),
      lyric: i.getAttribute("data-lyric"),
      chords: i.getAttribute("data-chords"),
    }));

describe("parseRechordsDown stamps where a syllable sits", () => {
  it("counts lyric characters and chords per verse", () => {
    assert.deepEqual(syllables(parseRechordsDown(md)), [
      // A line of chords alone: no lyric characters to count.
      { chord: "C", verse: "0", lyric: "0", chords: "0" },
      { chord: "dm7", verse: "0", lyric: "0", chords: "1" },
      // "eins," is five characters, the comma counts, the space does not.
      { chord: "C", verse: "1", lyric: "0", chords: "0" },
      { chord: "Dm7", verse: "1", lyric: "5", chords: "1" },
      // The count carries on across the lines of a verse.
      { chord: null, verse: "1", lyric: "13", chords: "2" },
      { chord: "C", verse: "1", lyric: "15", chords: "2" },
      { chord: "Dm7", verse: "1", lyric: "17", chords: "3" },
    ]);
  });

  it("gives every line the counts as of its end", () => {
    const lines = parse(parseRechordsDown(md))
      .querySelectorAll("span.line")
      .map((l) => [
        l.getAttribute("data-verse"),
        l.getAttribute("data-lyric"),
        l.getAttribute("data-chords"),
      ]);

    assert.deepEqual(lines, [
      ["0", "0", "2"],
      ["1", "13", "2"],
      ["1", "19", "4"],
    ]);
  });

  it("lets an inline reference keep the numbers of the verse it mirrors", () => {
    const withRef = parseRechordsDown(`${md}\n2:\n-> 1\n`);
    const mirrored = parse(withRef).querySelectorAll(
      "section.inlineReference i",
    );

    assert.ok(mirrored.length > 0);
    assert.deepEqual(
      mirrored.map((i) => i.getAttribute("data-verse")),
      mirrored.map(() => "1"),
    );
  });
});
