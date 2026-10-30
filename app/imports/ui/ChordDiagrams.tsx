import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdClose, MdOutlinePushPin, MdPushPin } from "react-icons/md";
import Kord from "./Kord";
import Chord from "/imports/api/libchr0d/chord";
import { authoredShapes, collectGrips, Grip } from "/imports/api/fret-shapes";
import { Song } from "/imports/api/collections";
import { Transpose } from "/imports/ui/Transposer";
import { playableChordProps } from "/imports/ui/audio/chordPlayer";

/**
 * The grip for every chord a song uses, by the chord as the sheet spells it.
 * Where the song draws one it is taken as it stands; transposing moves past
 * what the author drew, so from there the database supplies them.
 */
export const useGrips = (song: Song, transpose: Transpose) => {
  const html = song.getHtml();
  const authored = useMemo(() => authoredShapes(html), [html]);

  return useMemo(
    () =>
      collectGrips(song.getChords(), authored, (chord) =>
        chord.transposed(transpose.semitones ?? 0, transpose.notation),
      ),
    [song, authored, transpose.semitones, transpose.notation],
  );
};

const PINNED = "rechords.pinned";

const readPins = (songId: string): string[] => {
  try {
    return (
      JSON.parse(globalThis.localStorage?.getItem(PINNED) ?? "{}")[songId] ?? []
    );
  } catch {
    return [];
  }
};

const writePins = (songId: string, pins: string[]) => {
  try {
    const all = JSON.parse(globalThis.localStorage?.getItem(PINNED) ?? "{}");
    if (pins.length === 0) delete all[songId];
    else all[songId] = pins;
    globalThis.localStorage?.setItem(PINNED, JSON.stringify(all));
  } catch {
    // Without storage a pin lasts as long as the page; nothing to rescue.
  }
};

/**
 * The chords pinned in a song. They are kept per song, and as the song writes
 * them rather than as they sound right now — so a pinned C follows along and
 * becomes the D it is transposed to, instead of dropping out.
 */
export function usePinnedChords(song: Song, transpose: Transpose) {
  const songId = song._id ?? "";
  const [pins, setPins] = useState(() => readPins(songId));
  useEffect(() => setPins(readPins(songId)), [songId]);

  const asWritten = (chord: Chord) =>
    chord.transposed(-(transpose.semitones ?? 0)).identity();

  return {
    isPinned: (chord: Chord) => pins.includes(asWritten(chord)),
    togglePin: (chord: Chord) => {
      const id = asWritten(chord);
      // From the current pins, not the ones this render saw: two pins in quick
      // succession would otherwise forget the first.
      setPins((current) => {
        const next = current.includes(id)
          ? current.filter((p) => p !== id)
          : [...current, id];
        writePins(songId, next);
        return next;
      });
    },
  };
}

const Diagram = ({ grip, lite }: { grip: Grip; lite?: boolean }) => (
  <span
    className="chord-container playable"
    {...playableChordProps(grip.chord, grip.shape)}
  >
    <strong>
      {grip.chord.toStringKey()}
      <sup>{grip.chord.toStringTensionsAndSlash()}</sup>
    </strong>
    <Kord shape={grip.shape} lite={lite} />
  </span>
);

/** The pinned chords of a song, kept in view beside the buttons. */
export const PinnedChords = ({
  grips,
  isPinned,
}: {
  grips: Map<string, Grip>;
  isPinned: (chord: Chord) => boolean;
}) => {
  const pinned = [...grips.values()].filter((grip) => isPinned(grip.chord));
  if (pinned.length === 0) return null;

  return (
    <div className="pinned-chords">
      {pinned.map((grip) => (
        <Diagram key={grip.chord.toString()} grip={grip} lite />
      ))}
    </div>
  );
};

/** Every chord of a song, with a pin to keep it beside the sheet. */
export const ChordDialog = ({
  grips,
  open,
  onClose,
  isPinned,
  togglePin,
}: {
  grips: Map<string, Grip>;
  open: boolean;
  onClose: () => void;
  isPinned: (chord: Chord) => boolean;
  togglePin: (chord: Chord) => void;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element === null) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="chord-dialog"
      onClose={onClose}
      // The body fills the dialog, so a click that lands on the dialog itself
      // came from the backdrop around it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="body">
        <header>
          <h3>Akkorde</h3>
          {/* First in line, so that opening the dialog focuses it rather
              than a chord, which would sound. */}
          <button
            type="button"
            className="iconbutton"
            onClick={onClose}
            aria-label="Schliessen"
          >
            <MdClose />
          </button>
        </header>
        <div className="chord-grid">
          {[...grips.values()].map((grip) => {
            const pinned = isPinned(grip.chord);
            return (
              <div key={grip.chord.toString()} className="chord-cell">
                <Diagram grip={grip} />
                <button
                  type="button"
                  className={pinned ? "iconbutton active" : "iconbutton"}
                  onClick={() => togglePin(grip.chord)}
                  aria-pressed={pinned}
                  aria-label={`${grip.chord.toString()} anpinnen`}
                >
                  {pinned ? <MdPushPin /> : <MdOutlinePushPin />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
};
