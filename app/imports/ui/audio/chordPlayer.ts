import abcjs from "abcjs";
import type React from "react";
import Chord from "/imports/api/libchr0d/chord";
import { chordToMidiPitches } from "/imports/api/libchr0d/voicing";

// General MIDI program number. 0 = acoustic grand piano, which every soundfont
// ships. Left as a constant until there is a UI to pick an instrument.
const INSTRUMENT = 0;

// playEvent measures note lengths in measures, so one "measure" is one strike.
const RING_MS = 1800;

const VOLUME = 65;
const BASS_VOLUME = 100;

// Served from public/soundfonts, where abcjs fetches (and then caches) one small
// mp3 per note on demand — no third party involved, and it works offline. Only
// the notes chordToMidiPitches can produce are kept there; see its README.
const SOUNDFONT_URL = "/soundfonts/";

/** Sounds a chord in the browser. Silently does nothing where audio is unavailable. */
export function playChord(chord: Chord): void {
  if (!abcjs.synth.supportsAudio()) return;

  const pitches = chordToMidiPitches(chord);
  const lowest = Math.min(...pitches);

  const notes = pitches.map((pitch) => ({
    instrument: INSTRUMENT,
    pitch,
    duration: 1,
    volume: pitch === lowest ? BASS_VOLUME : VOLUME,
    start: 0,
    gap: 0,
  }));

  abcjs.synth
    .playEvent(notes, undefined, RING_MS, SOUNDFONT_URL)
    .catch((error: unknown) => {
      // One note missing from the soundfont should not silence the rest, so
      // this only reports. Audio being unavailable at all is caught above.
      console.warn("Could not sound the chord:", error);
    });
}

/**
 * Makes an element sound its chord — on click, and on keyboard focus so that
 * tabbing through a song plays it chord by chord.
 *
 * Pointer focus is deliberately left to the click handler: :focus-visible only
 * matches keyboard focus, which keeps a click from sounding the chord twice.
 */
export function playableChordProps(chord: Chord) {
  const play = () => playChord(chord);

  return {
    role: "button",
    tabIndex: 0,
    "aria-label": `Akkord ${chord.toString()} anhören`,
    onClick: (e: React.MouseEvent) => {
      // Don't let the click select the line for video sync as well.
      e.stopPropagation();
      play();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      // Coming back to the browser window refocuses the chord that was left
      // focused — without a previous element there was no move, so stay quiet.
      if (e.relatedTarget === null) return;
      if (e.currentTarget.matches(":focus-visible")) play();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault(); // Space would scroll the sheet away.
        play();
      }
    },
  };
}
