import React from "react";
import { Finger, Fret } from "./types";

const positions = {
  string: [50, 40, 30, 20, 10, 0],
  fret: [-6, 6, 18, 30, 42, 54],
};

/** Keyed by string count; only 4- and 6-string instruments are drawn. */
const offset: Record<number, number> = {
  4: 0,
  6: -1,
};

const getStringPosition = (string: number, strings: number) =>
  positions.string[string + offset[strings]];

const radius = {
  muted: 2.5,
  open: 2.5,
  fret: 5,
};

interface DotProps {
  string: number;
  fret?: Fret;
  finger?: Finger;
  strings: number;
  lite?: boolean;
}

const Dot: React.FC<DotProps> = ({
  string,
  fret = 0,
  finger,
  strings,
  lite = false,
}) => {
  const x = getStringPosition(string, strings);
  const y = positions.fret[fret < 0 ? 0 : fret];

  if (fret === -1)
    return (
      <g className="dot muted">
        <line
          x1={x - radius.muted}
          x2={x + radius.muted}
          y1={y - radius.muted}
          y2={y + radius.muted}
        />
        <line
          x1={x + radius.muted}
          x2={x - radius.muted}
          y1={y - radius.muted}
          y2={y + radius.muted}
        />
      </g>
    );

  return (
    <g className={"dot" + (fret === 0 ? " open" : "")}>
      <circle cx={x} cy={y} r={fret === 0 ? radius.open : radius.fret} />
      {!lite && finger !== undefined && finger > 0 && fret !== 0 && (
        <text x={x} y={y + radius.fret / 2}>
          {finger}
        </text>
      )}
    </g>
  );
};

export default Dot;
