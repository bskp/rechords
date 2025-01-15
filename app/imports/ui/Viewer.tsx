import React, {useCallback, useContext, useEffect, useState} from "react";
import {NavLink, useHistory, useParams} from "react-router-dom";
import Transposer from "./Transposer";
import ChrodLib from "../api/libchrod";
import Chord_ from "../api/libchr0d/chord";
import {Song} from "../api/collections";
import Drawer from "./Drawer";
import {routePath, userMayWrite, View} from "../api/helpers";
import Sheet from "./Sheet";
import {Button} from "./Button";
import {ReactSVG} from "react-svg";
import {Meteor} from "meteor/meteor";
import {MenuContext} from "/imports/ui/App";

interface SongRouteParams {
  author?: string;
  title?: string;
}

interface ViewerProps {
  song: Song;
}

const Viewer: React.FC<ViewerProps> = ({song}) => {
  const [relTranspose, setRelTranspose] = useState<number>(getInitialTranspose());
  const [inlineReferences, setInlineReferences] = useState<boolean>(false);
  const [showChords, setShowChords] = useState<boolean>(true);
  const [showTransposer, setShowTransposer] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<number | undefined>(undefined);

  const history = useHistory();
  const {author, title} = useParams<SongRouteParams>();

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
    setRelTranspose(getInitialTranspose())
    stopAutoScroll();
    return () => stopAutoScroll();
  }, [song]);

  function getInitialTranspose(): number {
    const transposeTag = song.getTags().find(tag => tag.startsWith('transponierung:'));
    if (!transposeTag) return 0;
    let dt = parseInt(transposeTag.split(':')[1], 10);
    return isNaN(dt) ? 0 : dt;
  }

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (userMayWrite()) {
      history.push(`/edit/${author}/${title}`);
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
      const scrollDistance = scrollContainer.scrollHeight - scrollContainer.clientHeight;
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

  const chordFrequencies = new Map<string, number>();
  song.getChords()
    .map(chord => Chord_.from(chord)?.asCode())
    .filter((c: string | undefined): c is string => c !== undefined)
    .forEach(chord => {
      const current = chordFrequencies.get(chord) ?? 0;
      chordFrequencies.set(chord, current + 1);
    });

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

  const {setShowMenu} = useContext(MenuContext);

  return (
    <>
      <div
        className="content"
        id="chordsheet"
        onContextMenu={handleContextMenu}
      >
        <Sheet
          song={song}
          transpose={relTranspose}
          hideChords={!showChords}
        />
        {footer}
      </div>
      <aside id="rightSettings">
        <Button onClick={() => setShowMenu(true)} phoneOnly>
          <ReactSVG src="/svg/menu.svg"/>
        </Button>
        <Button onClick={() => setShowTransposer(true)}>
          <ReactSVG src="/svg/sharp.svg"/>
        </Button>
        <Transposer
          onDoubleClick={() => setShowChords((prev) => !prev)}
          transposeSetter={setRelTranspose}
          transpose={relTranspose}
          chords={song.getChords().map(chord => Chord_.from(chord)).filter((chord: Chord_ | undefined): chord is Chord_ => chord !== undefined)}
        />
        <Button onClick={toggleAutoScroll}>
          {autoScroll ? (
            <ReactSVG src="/svg/conveyor_active.svg"/>
          ) : (
            <ReactSVG src="/svg/conveyor.svg"/>
          )}
        </Button>
      </aside>
      {drawer}
    </>
  );
};

export default Viewer;
