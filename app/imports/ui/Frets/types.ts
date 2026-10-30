/**
 * Shapes for the chord-diagram components, replacing the runtime prop-types
 * that used to live in propTypes.js.
 *
 * The grips themselves are worked out in api/fret-shapes, either from the way a
 * song writes them or from @tombatossals/chords-db, which ships no types of its
 * own; `FretShape` there is what these components are handed.
 */

/** Fingering positions are 0 (open) to 5, and -1 for a muted string. */
export type Fret = number;

/** Which finger stops a string: 0 means none, 1-4 the fingers, 5 the thumb. */
export type Finger = number;

export interface Instrument {
  strings: number;
  fretsOnChord: number;
  name: string;
  keys?: string[];
  tunings: {
    standard: string[];
  };
}

export interface ChordShape {
  /** One entry per string, low to high. -1 is muted, 0 is open. */
  frets: Fret[];
  fingers?: Finger[];
  /** Fret numbers that are barred. */
  barres?: number[];
  capo: boolean;
  baseFret: number;
}
