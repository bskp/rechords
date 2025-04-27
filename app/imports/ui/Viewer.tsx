import React, { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Transposer, { useTranspose } from "./Transposer";
import Chord from "../api/libchr0d/chord";
import { Song } from "../api/collections";
import {
  currentFocusOnInput,
  navigateTo,
  userMayWrite,
  View,
} from "../api/helpers";
import Sheet from "./Sheet";
import { Button } from "./Button";
import { ReactSVG } from "react-svg";
import { Meteor } from "meteor/meteor";
import { MenuContext, VideoContext } from "/imports/ui/App";
import { MdEdit, MdPictureAsPdf, MdPrint } from "react-icons/md";
import { usePinch } from "@use-gesture/react";

export interface ViewerProps {
  song: Song;
}

const Viewer: React.FC<ViewerProps> = ({ song }) => {
  const transposeState = useTranspose(getTransposeFromTag(song.getTags()));

  const [showChords] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<number | undefined>(undefined);
  const [isVideoActive, setIsVideoActive] = useState<boolean>(false);
  const [textZoom, setTextZoom] = useState<number>(1);

  const bind = usePinch((state) => {
    const { offset, memo } = state;
    const initialZoom = memo ?? 1.0;
    const [scale] = offset;
    const currentZoom = initialZoom * scale ** 0.1;
    setTextZoom(currentZoom);
    return initialZoom;
  }, {});

  const history = useHistory();

  let duration_s: number | undefined;

  const updateDuration = useCallback(() => {
    const duration = song.getTag("dauer");
    if (duration) {
      const [minutes, seconds] = duration.split(":");
      duration_s = 60 * Number(minutes) + Number(seconds);
    } else {
      duration_s = undefined;
    }
  }, [song]);

  useEffect(() => {
    updateDuration();
    document.scrollingElement?.scrollTo(0, 0);
    transposeState.setTranspose({
      semitones: getTransposeFromTag(song.getTags()),
      notation: "undetermined",
    });
    stopAutoScroll();
    setIsVideoActive(false);
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", preventDefault);
    document.addEventListener("gesturechange", preventDefault);
    return () => {
      stopAutoScroll();
      document.removeEventListener("gesturestart", preventDefault);
      document.removeEventListener("gesturechange", preventDefault);
    };
  }, [song]);

  const globalKeyHandler = (e: KeyboardEvent) => {
    if (currentFocusOnInput(e)) return;
    if (e.key === "e") {
      e.preventDefault();
      navigateTo(history, View.edit, song);
    }
    if (e.key === "t") {
      e.preventDefault();
      transposeState.setShowTransposer(!transposeState.showTransposer);
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", globalKeyHandler);
    const navigateToPrint: EventListener = (event: Event) => {
      navigateTo(history, View.print, song);
      event.preventDefault();
      return false;
    };
    window.addEventListener("beforeprint", navigateToPrint);
    return () => {
      document.removeEventListener("keydown", globalKeyHandler);
      window.removeEventListener("beforeprint", navigateToPrint);
    };
  });

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (userMayWrite()) {
      navigateTo(history, View.edit, song);
    }
    event.preventDefault();
  };

  const toggleAutoScroll = () => {
    autoScroll ? stopAutoScroll() : startAutoScroll();
  };

  const startAutoScroll = () => {
    const scrollContainer = document.scrollingElement!;

    let delay_ms = 133;
    let step_pixels = 1;

    if (duration_s) {
      const scrollDistance =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;
      delay_ms = (duration_s * 1000) / scrollDistance;
    }

    if (delay_ms < 50) {
      step_pixels = Math.ceil(50 / delay_ms);
      delay_ms = delay_ms * step_pixels;
    }

    const intervalId = Meteor.setInterval(() => {
      scrollContainer.scrollBy(0, step_pixels);
    }, delay_ms);

    setAutoScroll(intervalId);
  };

  const stopAutoScroll = () => {
    if (autoScroll) {
      Meteor.clearInterval(autoScroll);
      setAutoScroll(undefined);
    }
  };

  const keyTag = song.getTag("tonart");

  const { setShowMenu } = useContext(MenuContext);

  const chords = parseChords(song.getChords());
  return (
    <VideoContext.Provider
      value={{
        isActive: isVideoActive,
        setActive: setIsVideoActive,
        hasVideo: song.has_video,
      }}
    >
      <div
        {...bind()}
        className="content"
        id="chordsheet"
        style={{ fontSize: textZoom + "em" }}
        onContextMenu={handleContextMenu}
      >
        <Sheet
          song={song}
          transpose={transposeState.transpose}
          hideChords={!showChords}
          classes={{ view: true }}
        />
        <h1 id="howToPrint">
          Bitte schliess das Druckfenster prüfe deine Druckeinstellungen. Dann
          geht's los!
        </h1>
      </div>
      <aside id="rightSettings">
        <Button onClick={() => setShowMenu(true)} phoneOnly>
          <ReactSVG src="/svg/menu.svg" />
        </Button>
        <div className="actions-navigate hideOnMobile">
          {userMayWrite() && (
            <Button onClick={handleContextMenu} hideOnPhone>
              <MdEdit />
            </Button>
          )}
          <Button onClick={() => navigateTo(history, View.print, song)}>
            <MdPrint className="iconbutton" />
          </Button>
          <Button onClick={() => navigateTo(history, View.pdf, song)}>
            <MdPictureAsPdf />
          </Button>
        </div>
        <div className="actions-do">
          {!song.has_video ? null : isVideoActive ? (
            <Button onClick={() => setIsVideoActive(false)}>
              <ReactSVG src="/svg/yt-close.svg" />
            </Button>
          ) : (
            <Button onClick={() => setIsVideoActive(true)}>
              <ReactSVG src="/svg/yt.svg" />
            </Button>
          )}
          {transposeState.showTransposer && (
            <Transposer
              transposeSetter={transposeState.setTranspose}
              transpose={transposeState.transpose.semitones}
              keyHint={Chord.from(keyTag)}
              close={() => transposeState.setShowTransposer(false)}
              chords={chords}
            />
          )}
          <Button onClick={() => transposeState.setShowTransposer(true)}>
            <ReactSVG src="/svg/transposer.svg" />
          </Button>
          <Button onClick={toggleAutoScroll}>
            {autoScroll ? (
              <ReactSVG src="/svg/conveyor_active.svg" />
            ) : (
              <ReactSVG
                src="/svg/conveyor.svg"
                data-tooltip-content="Auto-Scroll"
                data-tooltip-id="tt"
              />
            )}
          </Button>
        </div>
      </aside>
    </VideoContext.Provider>
  );
};

export default Viewer;

export function parseChords(chords: string[]) {
  return chords
    .map((chord) => Chord.from(chord))
    .filter((chord: Chord | undefined): chord is Chord => chord !== undefined);
}

export function getTransposeFromTag(tags: string[]): number | undefined {
  const transposeTag = tags.find((tag) => tag.startsWith("transponierung:"));
  if (!transposeTag) return undefined;
  let dt = parseInt(transposeTag.split(":")[1], 10);
  return isNaN(dt) ? undefined : dt;
}
