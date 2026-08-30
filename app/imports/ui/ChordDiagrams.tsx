import * as React from "react";
import { useMemo } from "react";
import Kord from "./Kord";
import { authoredShapes, collectGrips } from "/imports/api/fret-shapes";
import { Song } from "/imports/api/collections";
import { Transpose } from "/imports/ui/Transposer";
import { playableChordProps } from "/imports/ui/audio/chordPlayer";
import { useState } from "react";

/**
 * A grip for every chord a song uses, drawn in the margin beside it: the song's
 * own where the author drew one, from the chord database otherwise. Held back
 * visually, so that the diagrams placed in the sheet itself keep the say.
 */
const SHOWN = "rechords.grips";

/** Whether the margin shows its grips, remembered across visits. */
export function useShowGrips(): [boolean, () => void] {
  const [shown, setShown] = useState(
    () => globalThis.localStorage?.getItem(SHOWN) !== "off",
  );

  return [
    shown,
    () => {
      globalThis.localStorage?.setItem(SHOWN, shown ? "off" : "on");
      setShown(!shown);
    },
  ];
}

/**
 * The grip for every chord a song uses, by the chord as the sheet spells it.
 * Where the song draws one it is taken as it stands; transposing moves past
 * what the author drew, so from there the database supplies them.
 */
export const useGrips = (song: Song, transpose: Transpose) => {
  const html = song.getHtml();
  const authored = useMemo(() => authoredShapes(html), [html]);

  return useMemo(
    () =>
      collectGrips(song.getChords(), authored, (chord) =>
        chord.transposed(transpose.semitones ?? 0, transpose.notation),
      ),
    [song, authored, transpose.semitones, transpose.notation],
  );
};

const ChordDiagrams = ({ grips }: { grips: ReturnType<typeof useGrips> }) => {
  const shown = [...grips.entries()];
  if (shown.length === 0) return null;

  return (
    // The rail spans the whole sheet so that the grips can stay in view while
    // it scrolls past underneath them.
    <div className="chord-diagrams">
      <div className="grips">
        {shown.map(([label, { chord, shape }]) => (
          <span
            key={label}
            className="chord-container playable"
            {...playableChordProps(chord, shape)}
          >
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
