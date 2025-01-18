import React, { useCallback, useContext, useEffect, useState } from "react";
import { NavLink, useHistory, useParams } from "react-router-dom";
import TransposeSetter from "./TransposeSetter";
import ChrodLib from "../api/libchrod";
import { Song } from "../api/collections";
import Drawer from "./Drawer";
import { navigateTo, routePath, userMayWrite, View } from "../api/helpers";
import Sheet from "./Sheet";
import { Button } from "./Button";
import { ReactSVG } from "react-svg";
import { Meteor } from "meteor/meteor";
import { MenuContext } from "/imports/ui/App";

interface SongRouteParams {
  author?: string;
  title?: string;
}

interface ViewerProps {
  song: Song;
}

const Viewer: React.FC<ViewerProps> = ({ song }) => {
  const [relTranspose, setRelTranspose] = useState<number>(
    getInitialTranspose(),
  );
  const [inlineReferences, setInlineReferences] = useState<boolean>(false);
  const [showChords, setShowChords] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<number | undefined>(undefined);

  const history = useHistory();
  const { author, title } = useParams<SongRouteParams>();

  let duration_s: number | undefined;

  const updateDuration = useCallback(() => {
    const duration = song.getTag("dauer");
    if (duration) {
      const chunks = duration.split(":");
      duration_s = 60 * Number(chunks[0]) + Number(chunks[1]);
    } else {
      duration_s = undefined;
    }
  }, [song]);

  useEffect(() => {
    updateDuration();
    document.scrollingElement?.scrollTo(0, 0);
    setRelTranspose(getInitialTranspose());
    stopAutoScroll();
    return () => stopAutoScroll();
  }, [song]);

  const globalKeyHandler = (e: KeyboardEvent) => {
    const tagName = (e.target as Element)?.tagName;
    // Do not steal focus if already on <input>
    if (["INPUT", "TEXTAREA"].includes(tagName)) return;
    if(e.target.getAttribute('contenteditable')) return;


    // Ignore special keys
    if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) return;

    if (e.key === "e") {
      e.preventDefault();
      navigateTo(history, View.edit, song)
    }
 };

  React.useEffect(() => {
    document.addEventListener("keydown", globalKeyHandler);
    return () => document.removeEventListener("keydown", globalKeyHandler);
  });


  function getInitialTranspose(): number {
    const transposeTag = song
      .getTags()
      .find((tag) => tag.startsWith("transponierung:"));
    if (!transposeTag) return 0;
    let dt = parseInt(transposeTag.split(":")[1], 10);
    return isNaN(dt) ? 0 : dt;
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (userMayWrite()) {
      navigateTo(history, View.edit, song)
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
  let key = keyTag && ChrodLib.parseTag(keyTag);
  if (!key) {
    key = ChrodLib.guessKey(song.getChords());
  }

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
    <>
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
        <TransposeSetter
          onDoubleClick={() => setShowChords((prev) => !prev)}
          transposeSetter={setRelTranspose}
          transpose={relTranspose}
          keym={key}
        />
        <Button onClick={toggleAutoScroll}>
          {autoScroll ? (
            <ReactSVG src="/svg/conveyor_active.svg" />
          ) : (
            <ReactSVG src="/svg/conveyor.svg" />
          )}
        </Button>
      </aside>
      {drawer}
    </>
  );
};

export default Viewer;
