import React from "react";
import Neck from "./Neck";
import Dot from "./Dot";
import Barre from "./Barre";
import { ChordShape, Instrument } from "./types";

/** Every stopped string that is not already covered by a barre. */
const onlyDots = (chord: ChordShape) =>
  chord.frets
    .map((f, index) => ({ position: index, value: f }))
    .filter((f) => !chord.barres || chord.barres.indexOf(f.value) === -1);

interface ChordProps {
  chord?: ChordShape;
  instrument: Instrument;
  lite?: boolean;
}

const Chord: React.FC<ChordProps> = ({ chord, instrument, lite = false }) =>
  chord ? (
    <svg
      className="chord-diag"
      width="100px"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMin meet"
      viewBox="-15 -12 72 65"
    >
      <Neck
        tuning={instrument.tunings.standard}
        strings={instrument.strings}
        frets={chord.frets}
        capo={chord.capo}
        fretsOnChord={instrument.fretsOnChord}
        baseFret={chord.baseFret}
        lite={lite}
      />

      {chord.barres &&
        chord.barres.map((barre, index) => (
          <Barre
            key={index}
            capo={index === 0 && chord.capo}
            barre={barre}
            finger={chord.fingers && chord.fingers[chord.frets.indexOf(barre)]}
            frets={chord.frets}
            lite={lite}
          />
        ))}

      {onlyDots(chord).map((fret) => (
        <Dot
          key={fret.position}
          string={instrument.strings - fret.position}
          fret={fret.value}
          strings={instrument.strings}
          finger={chord.fingers && chord.fingers[fret.position]}
          lite={lite}
        />
      ))}
    </svg>
  ) : null;

export default Chord;
