import React from "react";
import { Fret } from "./types";

/** Keyed by string count; only 4- and 6-string instruments are drawn. */
const offsets: Record<number, { x: number; y: number; length: number }> = {
  4: {
    x: 10,
    y: 10,
    length: 40,
  },
  6: {
    x: 0,
    y: 0,
    length: 50,
  },
};

const getNeckHorizonalLine = (pos: number, strings: number) =>
  `M ${offsets[strings].x} ${12 * pos} H ${offsets[strings].length}`;

const getNeckVerticalLine = (pos: number, strings: number) =>
  `M ${offsets[strings].y + pos * 10} 0 V 48`;

const getNeckPath = (strings: number, fretsOnChord: number) =>
  Array.from({ length: fretsOnChord + 1 })
    .map((_, pos) => getNeckHorizonalLine(pos, strings))
    .join(" ")
    .concat(
      Array.from({ length: strings })
        .map((_, pos) => getNeckVerticalLine(pos, strings))
        .join(" "),
    );

/** Shifts the base-fret label left when a capo or first-fret stop is drawn. */
const getBarreOffset = (frets: Fret[], capo?: boolean) => {
  let offset = -6;
  if (capo || frets[0] == 1) offset += -3;
  return offset;
};

interface NeckProps {
  tuning: string[];
  frets: Fret[];
  capo?: boolean;
  strings: number;
  baseFret?: number;
  fretsOnChord: number;
  lite?: boolean;
}

const Neck: React.FC<NeckProps> = ({
  tuning,
  frets,
  strings,
  fretsOnChord,
  baseFret = 1,
  capo,
  lite = false,
}) => {
  return (
    <g className="fret">
      <path d={getNeckPath(strings, fretsOnChord)} />
      {baseFret === 1 ? (
        <rect
          width={offsets[strings].length}
          x={offsets[strings].x}
          y="-2"
          height="2"
        />
      ) : (
        <text
          className="basefret"
          textAnchor="end"
          x={getBarreOffset(frets, capo)}
          y="10"
        >
          {baseFret}.
        </text>
      )}
      {!lite && (
        <g>
          {tuning.slice().map((note, index) => (
            <text
              key={index}
              fontSize="0.3rem"
              fill="#444"
              fontFamily="Verdana"
              textAnchor="middle"
              x={offsets[strings].x + index * 10}
              y="53"
            >
              {note}
            </text>
          ))}
        </g>
      )}
    </g>
  );
};

export default Neck;
