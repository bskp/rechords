import abcjs from "abcjs";
import type React from "react";
import { useState } from "react";
import Chord from "/imports/api/libchr0d/chord";
import { chordToMidiPitches } from "/imports/api/libchr0d/voicing";
import {
  FretShape,
  lookupShape,
  shapeToMidiPitches,
} from "/imports/api/fret-shapes";

export type SoundInstrument = "piano" | "guitar";

/** How far apart the notes of a chord are set going. */
export type Spread = "strum" | "arpeggio";

// General MIDI program numbers; abcjs derives the soundfont folder from them.
// 24 is the nylon-strung guitar, 25 the steel-strung one.
const PROGRAM: Record<SoundInstrument, number> = { piano: 0, guitar: 25 };

// Note lengths are measured in measures, so one "measure" is one strike.
const RING_MS = 1800;

// A guitar is struck string by string, not stamped down at once.
const STRUM_MS = 20;

// Holding on to a chord picks it apart instead, note by note.
const ARPEGGIO_MS = 220;
const HOLD_MS = 350;

const VOLUME = 65;
const BASS_VOLUME = 100;

const STORED = "rechords.instrument";

let instrument: SoundInstrument =
  (globalThis.localStorage?.getItem(STORED) as SoundInstrument) ?? "piano";

export const soundInstrument = () => instrument;

export function setSoundInstrument(next: SoundInstrument) {
  instrument = next;
  globalThis.localStorage?.setItem(STORED, next);
}

/** The instrument chords are sounded with, remembered across visits. */
export function useSoundInstrument(): [SoundInstrument, () => void] {
  const [current, setCurrent] = useState(soundInstrument);

  return [
    current,
    () => {
      const next = current === "piano" ? "guitar" : "piano";
      setSoundInstrument(next);
      setCurrent(next);
    },
  ];
}

// Served from public/soundfonts, where abcjs fetches (and then caches) one small
// mp3 per note on demand — no third party involved, and it works offline. Only
// the notes chordToMidiPitches can produce are kept there; see its README.
const SOUNDFONT_URL = "/soundfonts/";

/**
 * Sounds a chord in the browser. Silently does nothing where audio is
 * unavailable.
 *
 * On a guitar it plays what a grip actually holds down — the one the song
 * draws, if it is handed one — and strikes the strings one after the other. On
 * a piano it plays the chord stacked in close position, all at once.
 */
export function playChord(
  chord: Chord,
  shape?: FretShape,
  spread: Spread = "strum",
): void {
  if (!abcjs.synth.supportsAudio()) return;

  const grip =
    instrument === "guitar" ? (shape ?? lookupShape(chord)) : undefined;
  const pitches = grip ? shapeToMidiPitches(grip) : chordToMidiPitches(chord);

  // A piano chord is struck as one; a grip is strummed across its strings.
  const spacing =
    spread === "arpeggio" ? ARPEGGIO_MS : grip === undefined ? 0 : STRUM_MS;

  sound(pitches, spacing);
}

function sound(pitches: number[], spacingMs: number) {
  const program = PROGRAM[instrument];
  const lowest = Math.min(...pitches);
  const strumming = spacingMs / RING_MS;

  // One track per string, in the order they are struck.
  const sequence = new abcjs.synth.SynthSequence();
  pitches.forEach((pitch, string) => {
    sequence.addTrack();
    sequence.setInstrument(string, program);
    sequence.appendNote(
      string,
      pitch,
      1,
      pitch === lowest ? BASS_VOLUME : VOLUME,
      0,
    );
  });

  // abcjs can only append notes back to back, so the spacing is set afterwards.
  // Its typings describe a sequence as a plain array while the synth reads the
  // object the builder produces, hence the cast.
  const built = sequence as unknown as {
    tracks: { cmd: string; start: number }[][];
    totalDuration: number;
  };
  built.tracks.forEach((track, string) => {
    for (const event of track) {
      if (event.cmd === "note") event.start = string * strumming;
    }
  });
  built.totalDuration = 1 + pitches.length * strumming;

  const buffer = new abcjs.synth.CreateSynth();
  buffer
    .init({
      sequence: built as never,
      millisecondsPerMeasure: RING_MS,
      options: { soundFontUrl: SOUNDFONT_URL },
    })
    .then(() => buffer.prime())
    .then(() => buffer.start())
    .catch((error: unknown) => {
      // One note missing from the soundfont should not silence the rest, so
      // this only reports. Audio being unavailable at all is caught above.
      console.warn("Could not sound the chord:", error);
    });
}

let holdTimer: ReturnType<typeof setTimeout> | undefined;
let held = false;

/**
 * Makes an element sound its chord — on click, and on keyboard focus so that
 * tabbing through a song plays it chord by chord.
 *
 * Pointer focus is deliberately left to the click handler: :focus-visible only
 * matches keyboard focus, which keeps a click from sounding the chord twice.
 */
export function playableChordProps(chord: Chord, shape?: FretShape) {
  const play = (spread: Spread) => playChord(chord, shape, spread);

  return {
    role: "button",
    tabIndex: 0,
    "aria-label": `Akkord ${chord.toString()} anhören`,
    // Pressing and holding picks the chord apart; a plain click strikes it, on
    // release, so that the two cannot both happen.
    onPointerDown: () => {
      held = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        held = true;
        play("arpeggio");
      }, HOLD_MS);
    },
    onPointerUp: () => clearTimeout(holdTimer),
    onPointerLeave: () => clearTimeout(holdTimer),
    onClick: (e: React.MouseEvent) => {
      // Don't let the click select the line for video sync as well.
      e.stopPropagation();
      if (held) {
        held = false;
        return;
      }
      play("strum");
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      // Coming back to the browser window refocuses the chord that was left
      // focused — without a previous element there was no move, so stay quiet.
      if (e.relatedTarget === null) return;
      if (e.currentTarget.matches(":focus-visible")) play("strum");
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Space would scroll the sheet away.
        play("strum");
      }
    },
  };
}
