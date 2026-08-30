import { Song } from "../api/collections";
import * as React from "react";
import { Abcjs } from "./Abcjs";
import Kord from "./Kord";

import parse from "html-react-parser";
import * as DH from "domhandler";
import { DataNode } from "domhandler";

import { verseRegex } from "../api/showdown-rechords";
import { Tablature } from "abcjs";
import { useEffect, useRef, useState } from "react";
import { appendTime, YtInter } from "./YtInter";
import classNames from "classnames";
import { useDocumentListener } from "./Songlist/Menu";
import { VideoContext } from "./App";
import { ReactSVG } from "react-svg";
import { Tooltip } from "react-tooltip";
import Chord from "../api/libchr0d/chord";
import { playableChordProps, playChord } from "./audio/chordPlayer";
import {
  chordIndexForAnchor,
  chordText,
  deleteChord,
  insertChord,
  moveChord,
  setChordText,
} from "../api/chord-source";

const nodeText = (node) => {
  return node.children.reduce(
    (out, child) =>
      (out += child.type == "text" ? child.data : nodeText(child)),
    "",
  );
};

interface P {
  md: string;
  song: Song;
  updateHandler?: (md: string) => void;
}

export default (props: P) => {
  const html = useRef<HTMLElement>(null);
  const [currentPlayTime, setCurrentPlayTime] = useState<number | undefined>(0);
  const [maxLine, setMaxLine] = useState(1);

  const [isVideoActive, setVideoActive] = useState<boolean>(false);

  // Editing a chord replaces its element: a nudged chord moves to another
  // syllable, a fresh one did not exist before. Either way the focus is gone
  // once React is done, so it is handed back here by the chord's place in the
  // verse — which nudging keeps, since a chord never passes a neighbour.
  const refocus = useRef<{
    verse: number;
    chord: number;
    select?: boolean;
  } | null>(null);
  // What the focused chord read on arrival, so that Escape can put it back.
  const editedFrom = useRef<string | null>(null);

  useEffect(() => {
    const wanted = refocus.current;
    refocus.current = null;
    if (wanted === null || html.current === null) return;

    const section = html.current.querySelectorAll('section[id^="sd-ref-"]')[
      wanted.verse
    ];
    const chord = section?.querySelectorAll(".before")[wanted.chord] as
      HTMLElement | undefined;
    if (chord === undefined) return;

    chord.focus();
    if (!wanted.select) return;

    // A fresh chord starts out selected, so typing replaces the guess.
    const range = document.createRange();
    range.selectNodeContents(chord);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });

  useEffect(() => {
    const current = html?.current;
    if (current) {
      const lines = current.querySelectorAll(".line");
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1] as HTMLElement;

        const maxLine = parseInt(lastLine.dataset.lineCnt ?? "", 10);
        setMaxLine(maxLine);
      }
    }
  }, [props.md]);

  const chordProgressions = (md: string) => {
    const chords: string[][] = [];
    const verseNames: string[] = [];
    md.replace(verseRegex, (_match: string, title: string, v: string) => {
      const progression: string[] = [];

      v.replace(/\[([^\]]*)]/g, (_match, chord) => {
        progression.push(chord);
        return "";
      });

      chords.push(progression);
      verseNames.push(title);
      return "";
    });
    return { verseNames, chords };
  };

  // using wrapped number triggers prop change on every set
  // otherwise same line can't be clicked twice
  const [selectLine, setSelectLine] = useState({ selectedLine: 0 });

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (
      isVideoActive &&
      (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
    ) {
      const line = (event.target as HTMLElement).closest(
        "span.line",
      ) as HTMLSpanElement;
      const selectedLine = Number.parseInt(line.dataset.lineCnt ?? "", 10);
      if (event.shiftKey) {
        setSelectLine({ selectedLine });
      } else {
        const md = props.md;
        const newMd = appendTime(md, currentPlayTime, selectedLine);
        if (newMd) {
          props.updateHandler ? props.updateHandler(newMd) : null;
        }
      }
      return;
    }
    const node: Element = event.target as Element;
    if (!(node instanceof HTMLElement) || node.tagName != "I") return;

    const isInlineRef = !!node.closest(".inlineReference");
    if (isInlineRef) {
      return;
    }

    const { verse, lyric, chord } = locate(node);

    // A syllable carries the chord in front of its first letter. The last "syllable"
    // of a line has no letter of its own, so there the chord goes behind the
    // preceding one — ahead of the line break rather than onto the next line.
    const isLineEnd = textLen(node.lastChild.textContent) == 0;
    const anchor =
      isLineEnd && lyric > 0
        ? { lyric: lyric - 1, behind: true }
        : { lyric: lyric };
    // Chords of its own line have no letters to order them, hence the tie-break.
    const afterChord = chord + (node.querySelector(".before") === null ? 0 : 1);

    const { verseNames, chords } = chordProgressions(props.md);
    const current_verse = verseNames[verse];

    let guessedChord;

    // Is there a previous verse with the same name? (e.g. "chorus")
    const first_index = verseNames.indexOf(current_verse);
    if (first_index < verse) {
      guessedChord = chords[first_index][chord];
    } else {
      // Is this verse numbered and we have a predecessor?
      const current_nr = parseInt(current_verse, 10);

      if (!isNaN(current_nr)) {
        const pred = (current_nr - 1).toString();
        const pred_idx = verseNames.indexOf(pred);
        if (pred_idx != -1) {
          guessedChord = chords[pred_idx][chord];
        }
      }
    }

    if (guessedChord === undefined) guessedChord = "";

    const where = { ...anchor, afterChord };
    refocus.current = {
      verse,
      chord: chordIndexForAnchor(props.md, verse, where),
      select: true,
    };
    props.updateHandler(insertChord(props.md, verse, where, guessedChord));
  };

  const handleChordBlur = (event: React.SyntheticEvent<HTMLElement>) => {
    const chord = event.currentTarget.innerText;

    const { verse, chord: nth } = locate(event.currentTarget.parentElement);

    // An unnamed chord is no chord — that is also how an insert nobody typed
    // into disappears again. Otherwise what the sheet shows is what the source
    // should say, and comparing the two keeps merely passing through a chord
    // from rewriting anything.
    if (textLen(chord) > 0) {
      if (chordText(props.md, verse, nth) === chord) return;
      props.updateHandler(setChordText(props.md, verse, nth, chord));
    } else {
      props.updateHandler(deleteChord(props.md, verse, nth));
    }

    // Remove any selections.
    if (window.getSelection) {
      console.log(window.getSelection);
      if (window.getSelection().empty) {
        // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        // Firefox
        window.getSelection().removeAllRanges();
      }
    }
  };

  const offsetChordPosition = (
    event: React.SyntheticEvent<HTMLElement>,
    offset: number,
  ) => {
    const chord = event.currentTarget.innerText;
    const { verse, chord: nth } = locate(event.currentTarget.parentElement);

    // Nudging never lets a chord pass a neighbour, so it keeps its ordinal and
    // can be picked up again once React has rebuilt the sheet around it.
    refocus.current = { verse, chord: nth };

    // Commit an edit that has not been blurred yet, so nudging never drops it.
    const md =
      textLen(chord) > 0 && chordText(props.md, verse, nth) !== chord
        ? setChordText(props.md, verse, nth, chord)
        : props.md;

    props.updateHandler(moveChord(md, verse, nth, offset));
  };

  const handleChordKey = (event: React.KeyboardEvent<HTMLElement>) => {
    const n = event.currentTarget;
    if (event.key == "Enter") {
      event.preventDefault();
      n.blur();
      return;
    }

    if (event.key == "Escape") {
      event.preventDefault();
      if (editedFrom.current !== null) n.innerText = editedFrom.current;
      n.blur();
      return;
    }

    if (event.shiftKey && event.key == "ArrowRight") {
      offsetChordPosition(event, 1);
      event.preventDefault();
    }

    if (event.shiftKey && event.key == "ArrowLeft") {
      offsetChordPosition(event, -1);
      event.preventDefault();
    }
  };

  /*  Return the string's length omitting all whitespace.
   *
   */
  function textLen(str: string) {
    if (str === undefined) return 0;
    return str.replace(/\s/g, "").length;
  }

  /**
   * Where a syllable sits in the source. parseRechordsDown wrote this down
   * while it still knew, so nothing here depends on the shape of the document.
   */
  const locate = (segment: Element) => {
    const { verse, lyric, chords } = (segment as HTMLElement).dataset;
    if (verse === undefined || lyric === undefined || chords === undefined) {
      throw "Illegal argument: invoke locate() with a syllable of the sheet";
    }
    // The chords before a syllable are also the ordinal of the one it carries.
    return {
      verse: Number(verse),
      lyric: Number(lyric),
      chord: Number(chords),
    };
  };

  props.song.parse(props.md);

  const vdom = parse(props.song.getHtml(), {
    replace: (domNode) => {
      if (DH.isTag(domNode)) {
        const node = domNode as DH.Element;
        if (node.name == "i") {
          const clazz = node.parent?.parent?.parent?.parent?.attribs?.class;
          // console.log(node)
          let editable = true;
          if (clazz && clazz.includes("inlineReference")) {
            editable = false;
          }
          let chord;
          if ("data-chord" in node.attribs) {
            const c = Chord.from(node.attribs["data-chord"]);
            if (editable) {
              chord = (
                <span
                  className="before"
                  contentEditable={true}
                  suppressContentEditableWarning
                  onBlur={handleChordBlur.bind(this)}
                  onKeyDown={handleChordKey.bind(this)}
                  onFocus={(e) => {
                    editedFrom.current = e.currentTarget.innerText;
                  }}
                  // While editing, focus follows typing and clicking around, so
                  // the chord only sounds when it is asked for. The editor saves
                  // on right-click, hence the stopped propagation.
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (c) playChord(c);
                  }}
                >
                  {node.attribs["data-chord"]}
                </span>
              );
            } else {
              chord = (
                <span
                  className="before playable"
                  {...(c === undefined ? {} : playableChordProps(c))}
                >
                  {node.attribs["data-chord"]}
                </span>
              );
            }
          }
          if (!("data" in node.children[0])) return node;
          const lyrics = nodeText(node);

          // A syllable is rendered as one element per word, so each word takes
          // its share of the lyric count the parser noted for the whole of it.
          let consumed = 0;

          return (
            <React.Fragment>
              {lyrics.split(" ").map((word, idx, array) => {
                if (word == "") return " ";

                const isLast = idx == array.length - 1;
                const nextNotEmpty = !isLast && array[idx + 1].length > 0;

                let classes = "";
                if (idx == 0) {
                  if ("data-chord" in node.attribs) {
                    classes += "hasChord ";
                  }
                  classes += node.attribs.class || "";
                }

                if (nextNotEmpty) {
                  word += " ";
                }
                const lyric = Number(node.attribs["data-lyric"]) + consumed;
                consumed += textLen(word);

                return (
                  <i
                    key={idx}
                    className={classes}
                    data-verse={node.attribs["data-verse"]}
                    data-lyric={lyric}
                    data-chords={node.attribs["data-chords"]}
                  >
                    {idx == 0 ? chord : undefined}
                    {word}
                  </i>
                );
              })}
            </React.Fragment>
          );
        } else if (
          node.name == "span" &&
          "attribs" in node &&
          "class" in node.attribs &&
          "line" == node.attribs.class &&
          !node.parent?.parent?.parent?.attribs?.class?.includes(
            "inlineReference",
          )
        ) {
          // Fakey syllable to allow appended chords
          // The line knows the counts as of its end, which is where such a
          // chord belongs.
          node.children.push(
            <i
              data-verse={node.attribs["data-verse"]}
              data-lyric={node.attribs["data-lyric"]}
              data-chords={node.attribs["data-chords"]}
            >
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </i>,
          );
        } else if (node.name == "pre") {
          if (node.children.length != 1) return node;
          const code = node.children[0] as DH.Element;
          if (!("class" in code.attribs)) return node;
          const classes = code.attribs["class"];

          if (classes.includes("language-yt")) {
            const data = (code.firstChild as DH.DataNode).data as string;
            return (
              <div
                className={classNames("song-video-preview", {
                  active: isVideoActive,
                })}
              >
                {isVideoActive ? (
                  <a
                    className="iconbutton"
                    data-tooltip-id="ts"
                    onClick={() => setVideoActive(false)}
                  >
                    <ReactSVG src="/svg/yt-close.svg" />
                  </a>
                ) : (
                  <a
                    className="iconbutton"
                    data-tooltip-id="ts"
                    data-tooltip-content="Loads video from youtube."
                    onClick={() => setVideoActive(true)}
                  >
                    <ReactSVG src="/svg/yt.svg" />
                  </a>
                )}
                <Tooltip
                  place="bottom-end"
                  closeEvents={{ mouseout: false }}
                  globalCloseEvents={{ clickOutsideAnchor: true }}
                  id="ts"
                >
                  <div>
                    <div>Click to a line in the song text</div>
                    <div>
                      <b>Ctrl + Click: </b>Add Time Anchor
                      <br />
                      <b>Shift + Click: </b>Play from here
                    </div>
                  </div>
                </Tooltip>
                <YtInter
                  data={data}
                  selectedLine={selectLine}
                  onTimeChange={setCurrentPlayTime}
                  maxLine={maxLine}
                />
              </div>
            );
          }
          if (!classes.includes("language-abc")) return node;
          if (code.children.length != 1) return node;
          let tablature: Tablature[] = [];
          if (classes.includes("tab")) {
            tablature.push({ instrument: "guitar" });
          }
          const abc = (code.children[0] as DH.DataNode).data;

          return (
            <Abcjs
              abcNotation={abc}
              params={{ responsive: "resize", tablature }}
            />
          );
        } else if (node.name == "abbr") {
          return (
            <span className="chord-container">
              <strong>{(node.firstChild as DataNode).data}</strong>
              <Kord
                frets={node.attribs.title}
                fingers={node.attribs["data-fingers"]}
              />
            </span>
          );
        }
      }
      return domNode;
    },
  });

  const [coords, setCoords] = useState({ x: 0, y: 0, h: 0 });
  const handleMouseMove = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    // next line

    const line = (event.target as HTMLElement).closest(
      "span.line",
    ) as HTMLSpanElement;

    if (line) {
      setCoords({
        x: line.offsetLeft,
        y: line.offsetTop,
        h: line.offsetHeight,
      });
      handleSpecialKey(event);
    }
  };
  const handleSpecialKey = (event: KeyboardEvent | MouseEvent) => {
    if (!isVideoActive) {
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      setSpecialKey("ctrl");
    } else if (event.shiftKey) {
      setSpecialKey("shift");
    } else {
      setSpecialKey("");
    }
  };
  const [specialKey, setSpecialKey] = useState("");

  useDocumentListener("keydown", handleSpecialKey);
  useDocumentListener("keyup", handleSpecialKey);

  // // changing window or going into iframe otherwise leaves last pressed key
  // useDocumentListener("blur", () => {
  //   setSpecialKey("");
  // });
  // needs a better / more general solution

  return (
    <VideoContext.Provider
      value={{
        isActive: isVideoActive,
        setActive: setVideoActive,
        hasVideo: true,
      }}
    >
      <div className="content" id="chordsheet">
        <section
          className={classNames({
            interactive: specialKey === "",
            addanchor: specialKey === "ctrl",
            playfromline: specialKey === "shift",
          })}
          id="chordsheetContent"
          onClick={(e) => handleClick(e)}
          onMouseMove={handleMouseMove}
          ref={html}
        >
          {vdom}
        </section>
        {specialKey === "ctrl" && (
          <div
            style={{
              position: "absolute",
              left: `${coords.x - 10}px`,
              top: `${coords.y}px`,
              height: `${coords.h}px`,
            }}
            className="time-insert-indicator"
          >
            <span>{currentPlayTime?.toFixed(1)}</span>
          </div>
        )}
      </div>
    </VideoContext.Provider>
  );
};
