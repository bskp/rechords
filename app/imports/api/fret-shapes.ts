import guitar from "@tombatossals/chords-db/lib/guitar.json";
import { parse } from "node-html-parser";
import Chord from "./libchr0d/chord";

/** A grip, as the diagram components draw it. */
export interface FretShape {
  /** One entry per string, low to high; -1 is muted, 0 is open. */
  frets: number[];
  fingers?: number[];
  barres?: number[];
  baseFret: number;
  capo: boolean;
}

// The database spells its keys by pitch class, so they are addressed by number
// rather than by name — our G# is its Ab.
const KEYS = [
  "C",
  "Csharp",
  "D",
  "Eb",
  "E",
  "F",
  "Fsharp",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const mod12 = (v: number) => ((v % 12) + 12) % 12;

/** What the database offers per chord; it ships no types of its own. */
interface DbEntry {
  suffix: string;
  positions: {
    frets: number[];
    fingers: number[];
    barres: number[];
    baseFret: number;
    capo?: boolean;
    midi: number[];
  }[];
}

const database: Record<string, DbEntry[]> = guitar.chords;

/**
 * The suffixes to try for a chord, best first. The database names them the way
 * the sheets do — "m7", "sus4", "maj7" — with a few exceptions, and a plain
 * triad closes the list so that an unknown tension still yields a grip.
 */
function suffixes(chord: Chord): string[] {
  const minor = chord.quality === "minor";
  const triad = minor ? "minor" : "major";
  const tensions = chord.tensions
    .toLowerCase()
    .replace(/[\s'*()]/g, "")
    .replace(/^\+$/, "aug");

  if (tensions === "") return [triad];

  const named = minor ? `m${tensions}` : tensions;
  // "madd9" and friends are spelled without the m in our sheets.
  return [named, tensions, triad];
}

/** The grip a guitar database offers for a chord, if it knows one. */
export function lookupShape(chord: Chord): FretShape | undefined {
  const entries = database[KEYS[mod12(chord.key.value)]];
  if (entries === undefined) return undefined;

  for (const suffix of suffixes(chord)) {
    const positions = entries.find((e) => e.suffix === suffix)?.positions;
    if (positions === undefined || positions.length === 0) continue;

    // An open grip is the friendlier one to read and to play.
    const position =
      positions.find((p) => p.baseFret === 1 && p.frets.includes(0)) ??
      positions[0];

    return {
      frets: position.frets,
      fingers: position.fingers,
      barres: position.barres,
      baseFret: position.baseFret,
      capo: position.capo ?? false,
    };
  }

  return undefined;
}

/**
 * Reads a grip written the way a song does it: one character per string, low to
 * high, "x" or "-" for a muted one. Frets beyond the ninth are written as
 * letters, so "a" is the tenth.
 */
export function shapeFromSpec(
  spec: string,
  fingerSpec = "",
): FretShape | undefined {
  const frets = spec
    .split("")
    .slice(0, 6)
    .map((c) => {
      const fret = parseInt(c, 14);
      return isNaN(fret) ? -1 : fret;
    });
  if (frets.length !== 6) return undefined;

  const stopped = frets.filter((f) => f > -1);
  const lowest = Math.min(...stopped);
  // Grips that reach beyond the fourth fret are drawn further up the neck.
  const baseFret = Math.max(...frets) > 4 ? lowest : 1;

  const fingers = fingerSpec
    .split("")
    .slice(0, 6)
    .map((c) => parseInt(c, 10) || 0);

  const barres = detectBarres(frets, fingers, baseFret);
  const capo = Math.min(...barres, Infinity) <= lowest;

  return {
    frets: frets.map((f) => (f === -1 ? -1 : f + 1 - baseFret)),
    fingers,
    barres: barres.map((b) => b + 1 - baseFret),
    baseFret,
    capo,
  };
}

/** Frets held down by one finger across at least two strings. */
function detectBarres(
  frets: number[],
  fingers: number[],
  baseFret: number,
): number[] {
  const barres: number[] = [];

  for (let fret = baseFret; fret < baseFret + 4; fret++) {
    let finger = -1;
    let width = 0;

    for (let string = 0; string < 6; string++) {
      // A lower fret on a later string ends the barre.
      if (width > 0 && frets[string] < fret) break;
      if (frets[string] !== fret) continue;

      if (finger === -1) {
        finger = fingers[string];
        width = 1;
      } else if (fingers[string] === finger) {
        width += 1;
      }
    }

    if (width >= 2) barres.push(fret);
  }

  return barres;
}

/** The grips a song draws itself, by the chord they belong to. */
export function authoredShapes(html: string): Map<string, FretShape> {
  const shapes = new Map<string, FretShape>();

  for (const abbr of parse(html).querySelectorAll("abbr.chord")) {
    const shape = shapeFromSpec(
      abbr.getAttribute("title") ?? "",
      abbr.getAttribute("data-fingers") ?? "",
    );
    const label = abbr.textContent.trim();
    if (shape !== undefined && label !== "") {
      shapes.set(Chord.from(label)?.toString() ?? label, shape);
    }
  }

  return shapes;
}
