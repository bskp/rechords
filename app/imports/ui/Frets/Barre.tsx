import React from "react";
import { Finger, Fret } from "./types";

/** Keyed by string count; only 4- and 6-string instruments are drawn. */
const fretXPosition: Record<number, number[]> = {
  4: [10, 20, 30, 40, 50],
  6: [0, 10, 20, 30, 40, 50],
};

const fretYPosition = [2, 13.9, 26, 38];
const offset: Record<number, number> = {
  4: 0,
  6: -1,
};

const positions = {
  string: [50, 40, 30, 20, 10, 0],
  fret: [-4, 6, 18, 30, 42, 54],
  finger: [-3, 8, 19.5, 31.5, 43.5],
};

const getStringPosition = (string: number, strings: number) =>
  positions.string[string + offset[strings]];

const onlyBarres = (frets: Fret[], barre: number) =>
  frets
    .map((f, index) => ({ position: index, value: f }))
    .filter((f) => f.value === barre);

interface BarreProps {
  frets: Fret[];
  barre: number;
  capo?: boolean;
  lite?: boolean;
  finger?: Finger;
}

const Barre: React.FC<BarreProps> = ({
  barre,
  frets,
  capo,
  finger,
  lite = false,
}) => {
  const strings = frets.length;
  const barreFrets = onlyBarres(frets, barre);

  const string1 = barreFrets[0].position;
  const string2 = barreFrets[barreFrets.length - 1].position;
  const width = (string2 - string1) * 10;
  const y = fretYPosition[barre - 1];

  return (
    <g className="barre">
      {capo && (
        <g className="capo">
          <g
            transform={`translate(${getStringPosition(strings, strings)}, ${positions.fret[barreFrets[0].value]})`}
          >
            <path
              d={`
            M 0, 0
            m -4, 0
            a 4,4 0 1,1 8,0
          `}
              transform="rotate(-90)"
            />
          </g>
          <rect
            x={fretXPosition[strings][0]}
            y={fretYPosition[barre - 1]}
            width={(strings - 1) * 10}
            height={8.25}
          />
          <g
            transform={`translate(${getStringPosition(1, strings)}, ${positions.fret[barreFrets[0].value]})`}
          >
            <path
              d={`
            M 0, 0
            m -4, 0
            a 4,4 0 1,1 8,0
          `}
              transform="rotate(90)"
            />
          </g>
        </g>
      )}
      {barreFrets.map((fret) => (
        <circle
          key={fret.position}
          cx={getStringPosition(strings - fret.position, strings)}
          cy={positions.fret[fret.value]}
          r={4}
        />
      ))}
      <rect
        x={fretXPosition[strings][string1]}
        y={y}
        width={width}
        height={8.25}
      />
      {!lite &&
        finger &&
        barreFrets.map((fret) => (
          <text
            key={fret.position}
            x={getStringPosition(strings - fret.position, strings)}
            y={positions.finger[fret.value] + 1.2}
          >
            {finger}
          </text>
        ))}
    </g>
  );
};

export default Barre;
