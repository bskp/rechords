import * as React from "react";
import { useMemo } from "react";
import Kord from "./Kord";
import Chord from "/imports/api/libchr0d/chord";
import {
  authoredShapes,
  FretShape,
  lookupShape,
} from "/imports/api/fret-shapes";
import { Song } from "/imports/api/collections";
import { Transpose } from "/imports/ui/Transposer";

/**
 * A grip for every chord a song uses, drawn in the margin beside it: the song's
 * own where the author drew one, from the chord database otherwise. Held back
 * visually, so that the diagrams placed in the sheet itself keep the say.
 */
const ChordDiagrams = ({
  song,
  transpose,
}: {
  song: Song;
  transpose: Transpose;
}) => {
  const html = song.getHtml();
  const authored = useMemo(() => authoredShapes(html), [html]);

  const grips = useMemo(() => {
    const found = new Map<string, { chord: Chord; shape: FretShape }>();

    for (const name of song.getChords()) {
      const chord = Chord.from(name)?.transposed(
        transpose.semitones ?? 0,
        transpose.notation,
      );
      if (chord === undefined) continue;

      const label = chord.toString();
      if (found.has(label)) continue;

      // Transposing moves past what the author drew, so the database takes
      // over — its grips are the ones that then match the sheet.
      const shape = authored.get(label) ?? lookupShape(chord);
      if (shape !== undefined) found.set(label, { chord, shape });
    }

    return [...found.entries()];
  }, [song, authored, transpose.semitones, transpose.notation]);

  if (grips.length === 0) return null;

  return (
    // The rail spans the whole sheet so that the grips can stay in view while
    // it scrolls past underneath them.
    <div className="chord-diagrams">
      <div className="grips">
        {grips.map(([label, { chord, shape }]) => (
          <span key={label} className="chord-container">
            <strong>
              {chord.toStringKey()}
              <sup>{chord.toStringTensionsAndSlash()}</sup>
            </strong>
            <Kord shape={shape} lite />
          </span>
        ))}
      </div>
    </div>
  );
};

export default ChordDiagrams;
