// import * as db from '@tombatossals/chords-db';
import *  as React from 'react';
import Chord from './Chord/Chord';

interface ChordProps {
    frets: string,
    fingers?: string,
    barres?: string,
    capo?: number,
}

const instrument = {
  strings: 6,
  fretsOnChord: 4,
  name: 'Guitar',
  keys: [],
  tunings: {
    standard: [],
  }
};

export default function Kord(props: ChordProps) {
  const frets = props.frets.split('', 6).map(n => {
    const i = parseInt(n, 10);
    return isNaN(i) ? -1 : i;
  });
  if (frets.length != 6) return 'Chord with invalid frets.';

  const minFret = Math.min(...frets.filter(f => f > -1));
  const maxFret = Math.max(...frets);

  // Higher basefret for high-fretted chords
  let baseFret = 1;
  if (maxFret > 4) baseFret = minFret;

  const fingers = props.fingers.split('', 6).map(n => parseInt(n, 10) || 0);

  let barres = [];
  if (props.barres == 'detect') {
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
    barres = props.barres.split('').map(n => parseInt(n, 10) || 0);
  }

  let capo;
  if (props.capo == -1) {
    capo = Math.min(...barres) <= Math.min(...frets.filter(f => f != -1));
  } else {
    capo = props.capo == 0;
  }

  return <div className='kord'>
    <Chord
      chord={{
        frets: frets.map(f => f == -1 ? -1 : f + 1 - baseFret),
        fingers: fingers,
        barres: barres.map(b => b + 1 - baseFret),
        capo: capo,
        baseFret: baseFret
      }}
      instrument={instrument}
    />
  </div>;
}

Kord.defaultProps = {
  fingers: '',
  barres: 'detect',
  capo: -1,
}
