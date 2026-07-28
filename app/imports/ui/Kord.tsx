// import * as db from '@tombatossals/chords-db';
import * as React from "react";
import Chord from "./Frets/Chord";
import { Instrument } from "./Frets/types";

interface ChordProps {
  frets: string;
  fingers?: string;
  barres?: string;
  capo?: number;
}

const instrument: Instrument = {
  strings: 6,
  fretsOnChord: 4,
  name: "Guitar",
  keys: [],
  tunings: {
    standard: [],
  },
};

// Defaults live in the signature rather than in Kord.defaultProps: React 19
// drops defaultProps for function components, and TypeScript never applied
// them when narrowing the optional props below.
export default function Kord({
  frets: fretSpec,
  fingers: fingerSpec = "",
  barres: barreSpec = "detect",
  capo: capoSpec = -1,
}: ChordProps) {
  const frets = fretSpec.split("", 6).map((n) => {
    const i = parseInt(n, 10);
    return isNaN(i) ? -1 : i;
  });
  if (frets.length != 6) return <span>'Chord with invalid frets.'</span>;

  const minFret = Math.min(...frets.filter((f) => f > -1));
  const maxFret = Math.max(...frets);

  // Higher basefret for high-fretted chords
  let baseFret = 1;
  if (maxFret > 4) baseFret = minFret;

  const fingers = fingerSpec.split("", 6).map((n) => parseInt(n, 10) || 0);

  let barres: number[] = [];
  if (barreSpec == "detect") {
    for (let b = baseFret; b < baseFret + 4; b++) {
      let barre_finger = -1;
      let barre_width = 0;
      for (let i = 0; i < 6; i++) {
        if (barre_width > 0 && frets[i] < b) {
          // The barre has to end here, because the fret on this string is lower than the barre.
          break;
        }

        if (frets[i] == b) {
          if (barre_finger == -1) {
            barre_finger = fingers[i]; // set finger for this barre.
            barre_width = 1;
          } else {
            // extend barre if finger matches.
            if (fingers[i] == barre_finger) barre_width += 1;
          }
        }
      }
      if (barre_width >= 2) barres.push(b);
    }
  } else {
    barres = barreSpec.split("").map((n) => parseInt(n, 10) || 0);
  }

  let capo: boolean;
  if (capoSpec == -1) {
    capo = Math.min(...barres) <= Math.min(...frets.filter((f) => f != -1));
  } else {
    capo = capoSpec == 0;
  }

  return (
    <div className="kord">
      <Chord
        chord={{
          frets: frets.map((f) => (f == -1 ? -1 : f + 1 - baseFret)),
          fingers: fingers,
          barres: barres.map((b) => b + 1 - baseFret),
          capo: capo,
          baseFret: baseFret,
        }}
        instrument={instrument}
      />
    </div>
  );
}
