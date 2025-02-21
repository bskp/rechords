import React, { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Transposer, { Transpose } from "./Transposer";
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
import { MdEdit } from "react-icons/md";
import { usePinch } from "@use-gesture/react";

interface ViewerProps {
  song: Song;
}

const Viewer: React.FC<ViewerProps> = ({ song }) => {
  const [transpose, setTranspose] = useState<Transpose>({
    semitones: getTransposeFromTag(),
    notation: "undetermined",
  });
  const [showChords, setShowChords] = useState<boolean>(true);
  const [showTransposer, setShowTransposer] = useState<boolean>(false);
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
    setTranspose({
      semitones: getTransposeFromTag(),
      notation: "undetermined",
    });
    stopAutoScroll();
    setIsVideoActive(false);
    const preventDefault = (e) => e.preventDefault();
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
      setShowTransposer(!showTransposer);
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", globalKeyHandler);
    return () => document.removeEventListener("keydown", globalKeyHandler);
  });

  function getTransposeFromTag(): number | undefined {
    const transposeTag = song
      .getTags()
      .find((tag) => tag.startsWith("transponierung:"));
    if (!transposeTag) return undefined;
    let dt = parseInt(transposeTag.split(":")[1], 10);
    return isNaN(dt) ? undefined : dt;
  }

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

  const chords = song
    .getChords()
    .map((chord) => Chord.from(chord))
    .filter((chord: Chord | undefined): chord is Chord => chord !== undefined);
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
        <Sheet song={song} transpose={transpose} hideChords={!showChords} />
      </div>
      <aside id="rightSettings">
        <Button onClick={() => setShowMenu(true)} phoneOnly>
          <ReactSVG src="/svg/menu.svg" />
        </Button>
        {!song.has_video ? null : isVideoActive ? (
          <Button onClick={() => setIsVideoActive(false)}>
            <ReactSVG src="/svg/yt-close.svg" />
          </Button>
        ) : (
          <Button onClick={() => setIsVideoActive(true)}>
            <ReactSVG src="/svg/yt.svg" />
          </Button>
        )}
        {showTransposer && (
          <Transposer
            transposeSetter={setTranspose}
            transpose={transpose.semitones}
            keyHint={Chord.from(keyTag)}
            close={() => setShowTransposer(false)}
            chords={chords}
          />
        )}
        <Button onClick={() => setShowTransposer(true)}>
          <ReactSVG src="/svg/transposer.svg" />
        </Button>
        {userMayWrite() && (
          <Button onClick={handleContextMenu} hideOnPhone>
            <MdEdit />
          </Button>
        )}
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
      </aside>
    </VideoContext.Provider>
  );
};

export default Viewer;
