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
  const html = useRef<HTMLSelectElement>(null);
  const [currentPlayTime, setCurrentPlayTime] = useState<number | undefined>(0);

  const [isVideoActive, setVideoActive] = useState<boolean>(false);

  useEffect(() => {
    const traverse = (node: HTMLElement): void => {
      for (const child of node.children) {
        if (child.innerHTML.endsWith("|")) {
          child.innerHTML = child.innerHTML.replace("|", "");
          const range = document.createRange();
          range.selectNodeContents(child);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        } else {
          traverse(child as HTMLElement);
        }
      }
    };

    if (html?.current) traverse(html.current);
  });

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

    let offset = 0;
    for (const child of node.children) {
      offset += 2;
      offset += textLen((child as HTMLElement)?.innerText);
    }

    let skipWhitespace = true;
    if (textLen(node.lastChild.textContent) == 0) {
      // if a last-of-line, fake-syllable was clicked, attach chord _before_ whitespace (ie. newline)
      offset = 0;
      skipWhitespace = false;
    }

    const { verse, letter, chord } = locate(node);
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

    const md = prependChord(
      props.md,
      node,
      guessedChord + "|",
      offset,
      skipWhitespace,
    );
    props.updateHandler(md);
  };

  const handleChordBlur = (event: React.SyntheticEvent<HTMLElement>) => {
    event.currentTarget.removeAttribute("data-initial");
    const chord = event.currentTarget.innerText;

    const i = event.currentTarget.parentElement;

    let md_ = removeChord(props.md, i);

    if (textLen(chord) > 0) {
      const skipWhitespace =
        textLen(event.currentTarget.nextSibling.textContent) > 0; // ie. a fakey chord
      md_ = prependChord(md_, i, chord, 0, skipWhitespace);
    }
    props.updateHandler(md_);

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
    console.log("offsetchorspos");
    event.currentTarget.removeAttribute("data-initial");
    const chord = event.currentTarget.innerText;

    const i = event.currentTarget.parentElement;

    let md_ = removeChord(props.md, i);

    md_ = prependChord(md_, i, chord, offset, true);
    props.updateHandler(md_);
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
      n.innerText = n.getAttribute("data-initial");
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

    if (!n.hasAttribute("data-initial")) {
      n.setAttribute("data-initial", n.innerText);
    }
  };

  /*  Return the string's length omitting all whitespace.
   *
   */
  function textLen(str: string) {
    if (str === undefined) return 0;
    return str.replace(/\s/g, "").length;
  }

  const removeChord = (md: string, node: Element) => {
    const pos = locate(node);
    // "pos" specifies where the chord to remove _begins_, expressed as "nth verse and mth letter".

    // Iterate over verses
    let countedVerses = 0;
    md = md.replace(verseRegex, (match: string, title: string, v: string) => {
      if (countedVerses++ == pos.verse) {
        // Iterate over letters
        let countedLetters = 0;
        v = v.replace(/(\[[^\]]*])|([^[]*)/gm, (match, chord, lyrics) => {
          const adding = textLen(match);
          if (countedLetters == pos.letter) match = lyrics || ""; // retains line breaks.
          countedLetters += adding;
          return match;
        });
      }

      return title + ":\n" + v;
    });

    return md;
  };

  // pre in relation to syllable
  // but actually inserts the chord in markdown
  const prependChord = (
    md: string,
    segment: Element,
    chord: string,
    offset = 0,
    skipWhitespace = true,
  ) => {
    const pos = locate(segment);

    // Apply patch to markdown
    // Iterate over verses
    let countedVerses = 0;
    md = md.replace(verseRegex, (match: string, title: string, v: string) => {
      if (countedVerses++ == pos.verse) {
        // Iterate over letters in the appropriate verse
        let countedLetters: number = -offset;
        v = v.replace(/\S/g, (l: string) => {
          if (skipWhitespace) {
            if (countedLetters++ == pos.letter) {
              return "[" + chord + "]" + l;
            }
          } else {
            if (++countedLetters == pos.letter) {
              return l + "[" + chord + "]";
            }
          }

          return l;
        });
      }

      return title + ":\n" + v;
    });

    return md;
  };

  const locate = (segment: Element) => {
    if (segment.tagName != "I") {
      throw "Illegal argument: invoke locate() with a <i>-element";
    }

    // Count letters between clicked syllable and preceding h3 (ie. verse label)
    let letter = 0;
    let chord = 0;
    let section: HTMLElement;

    for (;;) {
      if (segment.previousElementSibling != null) {
        segment = segment.previousElementSibling;
      } else {
        // reached the start of the current line
        let line = segment.parentElement;

        if (line.previousElementSibling != null) {
          // go to preceding line
          line = line.previousElementSibling as HTMLElement;
        } else {
          // this was the last line of the paragraph.
          const wrapping_div = line.parentElement.parentElement as HTMLElement;
          if (wrapping_div.previousElementSibling == null) {
            section = wrapping_div.parentElement;
            break; // done with letter counting.
          } else {
            line = wrapping_div.previousElementSibling.lastElementChild
              .lastElementChild as HTMLElement;
          }
        }
        if (line.childElementCount == 0) {
          line = line.previousElementSibling as HTMLElement;
        }
        segment = line.lastElementChild;
      }

      // Count letters in this segment
      for (const node of segment.childNodes) {
        if (node.nodeName == "#text") {
          letter += node.textContent.replace(/\s/g, "").length;
          continue;
        }
        if (
          node.nodeName == "SPAN" &&
          (node as HTMLSpanElement).className == "before"
        ) {
          letter += 2;
          letter += textLen(node.textContent);
          chord += 1;
        }
      }
    }
    // Count sections up to the current paragraph
    let verse = 0;
    while (section.previousElementSibling != null) {
      section = section.previousElementSibling as HTMLElement;
      if (section.id.startsWith("sd-ref-")) {
        verse++;
      }
    }

    return {
      letter: letter,
      verse: verse,
      chord: chord,
    };
  };

  props.song.parse(props.md);

  const vdom = parse(props.song.getHtml(), {
    replace: (domNode) => {
      if (DH.isTag(domNode)) {
        const node = domNode as DH.Element;
        if (node.name == "i") {
          let chord;
          if ("data-chord" in node.attribs) {
            chord = (
              <span
                className="before"
                contentEditable={true}
                suppressContentEditableWarning
                onBlur={handleChordBlur.bind(this)}
                onKeyDown={handleChordKey.bind(this)}
              >
                {node.attribs["data-chord"]}
              </span>
            );
          }
          if (!("data" in node.children[0])) return node;
          const lyrics = nodeText(node);

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
                return (
                  <i key={idx} className={classes}>
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
          "line" == node.attribs.class
        ) {
          // Fakey syllable to allow appended chords
          node.children.push(<i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</i>);
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
