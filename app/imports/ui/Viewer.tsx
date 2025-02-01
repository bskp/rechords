import React, { useCallback, useContext, useEffect, useState } from "react";
import { NavLink, useHistory } from "react-router-dom";
import Transposer from "./Transposer";
import Chord_ from "../api/libchr0d/chord";
import { Song } from "../api/collections";
import Drawer from "./Drawer";
import {
  currentFocusOnInput,
  navigateTo,
  routePath,
  userMayWrite,
  View,
} from "../api/helpers";
import Sheet from "./Sheet";
import { Button } from "./Button";
import { ReactSVG } from "react-svg";
import { Meteor } from "meteor/meteor";
import { MenuContext, VideoContext } from "/imports/ui/App";

interface ViewerProps {
  song: Song;
}

const Viewer: React.FC<ViewerProps> = ({ song }) => {
  const [relTranspose, setRelTranspose] = useState<number | undefined>(
    getTransposeFromTag(),
  );
  const [showChords, setShowChords] = useState<boolean>(true);
  const [showTransposer, setShowTransposer] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<number | undefined>(undefined);
  const [isVideoActive, setIsVideoActive] = useState<boolean>(false);

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
    setRelTranspose(getTransposeFromTag());
    stopAutoScroll();
    setIsVideoActive(false);
    return () => stopAutoScroll();
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

  const drawer = userMayWrite() ? (
    <Drawer className="source-colors" onClick={handleContextMenu}>
      <h1>bearbeiten</h1>
      <p>Schneller:&nbsp;Rechtsklick!</p>
    </Drawer>
  ) : null;

  const footer = userMayWrite() ? (
    <div className="mobile-footer">
      <NavLink to={routePath(View.edit, song)} id="edit">
        Bearbeiten…
      </NavLink>
    </div>
  ) : null;

  const { setShowMenu } = useContext(MenuContext);

  return (
    <VideoContext.Provider
      value={{
        isActive: isVideoActive,
        setActive: setIsVideoActive,
        hasVideo: song.has_video,
      }}
    >
      <div
        className="content"
        id="chordsheet"
        onContextMenu={handleContextMenu}
      >
        <Sheet song={song} transpose={relTranspose} hideChords={!showChords} />
        {footer}
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
        {showTransposer ? (
          <Transposer
            onDoubleClick={() => setShowChords((prev) => !prev)}
            transposeSetter={setRelTranspose}
            transpose={relTranspose}
            keyHint={Chord_.from(keyTag)}
            close={() => setShowTransposer(false)}
            chords={song
              .getChords()
              .map((chord) => Chord_.from(chord))
              .filter(
                (chord: Chord_ | undefined): chord is Chord_ =>
                  chord !== undefined,
              )}
          />
        ) : null}
        <Button onClick={() => setShowTransposer(true)}>
          <ReactSVG src="/svg/transposer_.svg" />
        </Button>
        <Button onClick={toggleAutoScroll}>
          {autoScroll ? (
            <ReactSVG src="/svg/conveyor_active.svg" />
          ) : (
            <ReactSVG src="/svg/conveyor.svg" />
          )}
        </Button>
      </aside>
      {drawer}
    </VideoContext.Provider>
  );
};

export default Viewer;
