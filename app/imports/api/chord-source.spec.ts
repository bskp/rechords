import { describe, it } from "node:test";
import assert from "assert";
import {
  chordIndexForAnchor,
  chordLyricIndex,
  chordSpans,
  chordText,
  deleteChord,
  insertChord,
  moveChord,
  setChordText,
  verseBodies,
} from "./chord-source";

// The shapes that used to break: a chord-only line, chords with no letter
// between them, a chord behind the last letter of a line, and a space between
// a chord and the word it belongs to.
const md = `Testlied
Niemand
========

Intro:
[C] [dm7] [Cmaj7/E] [F]

1:
[C]eins, [Dm7]zwei drei
[Fsus4] vier fuenf sechs [G]sieben acht
[C][Dm7]ne u[Cmaj7/E]n u a u zehn el[Fadd9]
ab[C]cd[Dm7]ef

2:
[F][G7]a bcde fghi[Gsus4]
[C] [dm7] [F]
`;

describe("verses and chords", () => {
  it("finds the verses in source order", () => {
    const bodies = verseBodies(md);
    assert.equal(bodies.length, 3);
    assert.equal(
      md.slice(bodies[0].start, bodies[0].end).trim(),
      "[C] [dm7] [Cmaj7/E] [F]",
    );
  });

  it("finds the chords of a verse in source order", () => {
    assert.deepEqual(
      chordSpans(md, 1).map((_, i) => chordText(md, 1, i)),
      ["C", "Dm7", "Fsus4", "G", "C", "Dm7", "Cmaj7/E", "Fadd9", "C", "Dm7"],
    );
  });

  it("counts the lyric characters before a chord", () => {
    assert.equal(chordLyricIndex(md, 1, 0), 0);
    // "eins," + "zwei" + "drei" — whitespace does not count
    assert.equal(chordLyricIndex(md, 1, 2), 13);
  });
});

describe("setChordText", () => {
  it("renames a chord in a chord-only line without moving anything", () => {
    assert.equal(
      setChordText(md, 0, 1, "Dm7"),
      md.replace("[C] [dm7]", "[C] [Dm7]"),
    );
  });

  it("renames one of two stacked chords", () => {
    assert.equal(
      setChordText(md, 1, 5, "D7"),
      md.replace("[C][Dm7]ne", "[C][D7]ne"),
    );
  });

  it("renames a chord sitting behind the last letter of a line", () => {
    assert.equal(
      setChordText(md, 2, 2, "G"),
      md.replace("fghi[Gsus4]", "fghi[G]"),
    );
  });

  it("keeps the space between a chord and its word", () => {
    assert.equal(
      setChordText(md, 1, 2, "F"),
      md.replace("[Fsus4] vier", "[F] vier"),
    );
  });
});

describe("deleteChord", () => {
  it("removes only the chord", () => {
    assert.equal(deleteChord(md, 0, 0), md.replace("[C] [dm7]", " [dm7]"));
    assert.equal(deleteChord(md, 1, 4), md.replace("[C][Dm7]ne", "[Dm7]ne"));
  });
});

describe("insertChord", () => {
  it("puts a chord in front of a lyric character", () => {
    // Verse 2 reads "a bcde fghi": a=0, b=1, c=2 …
    assert.equal(
      insertChord(md, 2, { lyric: 2 }, "C"),
      md.replace("a bcde", "a b[C]cde"),
    );
  });

  it("puts a chord behind a lyric character, ahead of the line break", () => {
    // Character 12 is the last one of the first line of verse 1.
    assert.equal(
      insertChord(md, 1, { lyric: 12, behind: true }, "G"),
      md.replace("zwei drei", "zwei drei[G]"),
    );
  });

  it("appends behind the last lyric character when the anchor is past the end", () => {
    assert.equal(
      insertChord(md, 2, { lyric: 999 }, "C"),
      md.replace("fghi[Gsus4]", "fghi[C][Gsus4]"),
    );
  });

  it("lands after chords that already sit on the same character", () => {
    assert.equal(
      insertChord(md, 1, { lyric: 37 }, "Am"),
      md.replace("[C][Dm7]ne", "[C][Dm7][Am]ne"),
    );
  });
});

describe("chordIndexForAnchor", () => {
  it("reports the place a new chord takes in the verse", () => {
    // In front of "ne", behind the two chords already sitting there.
    assert.equal(chordIndexForAnchor(md, 1, { lyric: 37 }), 6);
    // On a line of chords alone the tie-break decides.
    assert.equal(chordIndexForAnchor(md, 0, { lyric: 0, afterChord: 2 }), 2);
    assert.equal(chordIndexForAnchor(md, 0, { lyric: 0, afterChord: 0 }), 0);
  });

  it("agrees with where insertChord actually puts the chord", () => {
    for (const anchor of [
      { lyric: 0 },
      { lyric: 12, behind: true },
      { lyric: 37 },
      { lyric: 999 },
    ]) {
      const index = chordIndexForAnchor(md, 1, anchor);
      assert.equal(chordText(insertChord(md, 1, anchor, "X"), 1, index), "X");
    }
  });
});

describe("insertChord into a chord-only line", () => {
  it("keeps the order of the chords it was clicked behind", () => {
    assert.equal(
      insertChord(md, 0, { lyric: 0, afterChord: 2 }, "G"),
      md.replace("[C] [dm7] [Cmaj7/E]", "[C] [dm7][G] [Cmaj7/E]"),
    );
  });

  it("puts the very first chord at the top of the verse", () => {
    assert.equal(
      insertChord(md, 0, { lyric: 0, afterChord: 0 }, "G"),
      md.replace("[C] [dm7]", "[G][C] [dm7]"),
    );
  });
});

describe("moveChord", () => {
  it("shifts a chord one lyric character to the right", () => {
    // The chord attaches to the next character; the space stays where it is.
    assert.equal(
      moveChord(md, 1, 6, 1),
      md.replace("u[Cmaj7/E]n u", "un [Cmaj7/E]u"),
    );
  });

  it("shifts a chord one lyric character to the left", () => {
    assert.equal(
      moveChord(md, 1, 6, -1),
      md.replace("ne u[Cmaj7/E]n", "ne [Cmaj7/E]un"),
    );
  });

  it("leaves a chord-only line alone, it has no lyrics to move along", () => {
    assert.equal(moveChord(md, 0, 0, -1), md);
    assert.equal(moveChord(md, 0, 1, 1), md);
  });

  it("leaves a chord-only line at the end of a verse with lyrics alone", () => {
    // Chords 3 to 5 of verse 2 make up its last line.
    for (const chord of [3, 4, 5]) {
      assert.equal(moveChord(md, 2, chord, -1), md);
      assert.equal(moveChord(md, 2, chord, 1), md);
    }
  });

  it("comes to rest next to a neighbouring chord instead of passing it", () => {
    // "ab[C]cd[Dm7]ef" — the line starts with lyrics, so the chords are free
    // to move and nothing but the neighbour stops them.
    const beside = moveChord(md, 1, 9, -2);
    assert.equal(beside, md.replace("ab[C]cd[Dm7]ef", "ab[C][Dm7]cdef"));
    assert.equal(moveChord(beside, 1, 9, -1), beside);
  });

  it("stops behind the last letter of its line rather than joining the next", () => {
    const atEnd = moveChord(md, 1, 3, 10);
    assert.equal(atEnd, md.replace(" [G]sieben acht", " sieben acht[G]"));
    assert.equal(moveChord(atEnd, 1, 3, 1), atEnd);
  });
});

describe("moveChord at the head of a line", () => {
  it("makes room by pushing the lyrics right", () => {
    const once = moveChord(md, 1, 0, -1);
    assert.equal(once, md.replace("[C]eins", "[C] eins"));
    assert.equal(moveChord(once, 1, 0, -1), md.replace("[C]eins", "[C]  eins"));
  });

  it("takes that room back before moving on", () => {
    const once = moveChord(md, 1, 0, -1);
    assert.equal(moveChord(once, 1, 0, 1), md);
  });

  it("moves onto the next letter once there is no room to take back", () => {
    assert.equal(moveChord(md, 1, 0, 1), md.replace("[C]eins", "e[C]ins"));
  });

  it("makes room for a chord stacked at the head of a line, too", () => {
    // Nothing to its left within the line, so it pushes the lyrics right
    // rather than trying to pass the chord it sits behind.
    assert.equal(
      moveChord(md, 1, 5, -1),
      md.replace("[C][Dm7]ne", "[C][Dm7] ne"),
    );
  });
});
