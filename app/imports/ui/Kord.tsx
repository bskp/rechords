import * as React from "react";
import Chord from "./Frets/Chord";
import { Instrument } from "./Frets/types";
import { FretShape, shapeFromSpec } from "/imports/api/fret-shapes";

const guitar: Instrument = {
  strings: 6,
  fretsOnChord: 4,
  name: "Guitar",
  keys: [],
  tunings: {
    standard: [],
  },
};

interface KordProps {
  /** A grip as a song writes it: one character per string, low to high. */
  frets?: string;
  fingers?: string;
  /** Or one that has been worked out already, say from the chord database. */
  shape?: FretShape;
  /** Leaves out the finger numbers, for diagrams that only need to be read. */
  lite?: boolean;
}

export default function Kord({ frets, fingers = "", shape, lite }: KordProps) {
  const grip =
    shape ?? (frets === undefined ? undefined : shapeFromSpec(frets, fingers));

  if (grip === undefined) return <span>'Chord with invalid frets.'</span>;

  return (
    <div className="kord">
      <Chord chord={grip} instrument={guitar} lite={lite} />
    </div>
  );
}
