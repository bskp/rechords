import * as React from "react";
import { CSSProperties, useContext, useEffect, useRef, useState } from "react";
import parse, { DOMNode, domToReact } from "html-react-parser";
import { Song } from "../api/collections";
import { Abcjs } from "./Abcjs";
import Kord from "./Kord";
import { userMayWrite } from "../api/helpers";
import * as DH from "domhandler";
import { Tablature } from "abcjs";
import Chord from "/imports/api/libchr0d/chord";
import classNames from "classnames";
import { YtInter } from "./YtInter";
import { VideoContext } from "/imports/ui/App";
import { Transpose } from "/imports/ui/Transposer";

type DomOut = React.JSX.Element | object | void | undefined | null | false;

type SheetProps = {
  song: Song;
  transpose: Transpose;
  hideChords?: boolean;
  processVdom?: (vdom: any) => any;
  style?: CSSProperties;
  classes?: any;
  inlineRefState: [boolean, (inlineRef: boolean) => void];
};
const Sheet = ({
  song,
  transpose,
  hideChords,
  processVdom,
  style,
  classes = [],
  inlineRefState = useState(true),
}: SheetProps) => {
  const [inlineRefs, setInlineRefs] = inlineRefState;
  const toggleInlineRefs = () => setInlineRefs(!inlineRefs);

  // from UI
  const [selectedLine, setSelectedLine] = useState({ selectedLine: 0 });
  // from time change in video
  const [playedLine, setPlayedLine] = useState<number>();

  const { hasVideo, isActive } = useContext(VideoContext);

  const handleLineClick = (e: MouseEvent) => {
    const span = e?.currentTarget as HTMLSpanElement;
    if (!(span instanceof HTMLSpanElement)) return;
    const selectedLine = Number.parseInt(span.dataset.lineCnt ?? "", 10);
    if (selectedLine) {
      setSelectedLine({ selectedLine });
    }
  };
  const chordsheetContent = useRef<HTMLElement>(null);

  useEffect(() => {
    const elements = chordsheetContent.current?.querySelectorAll("div.ref");
    elements?.forEach((e) => e.addEventListener("click", toggleInlineRefs));
    return () =>
      elements?.forEach((e) =>
        e.removeEventListener("click", toggleInlineRefs),
      );
  });

  const rmd_html = song.getHtml();

  // Postprocessing on each node from the dom-to-react parser
  const populateReactNodes = (node: DOMNode): DomOut => {
    if (!(node instanceof DH.Element && node.attribs)) return node;

    // <i>
    if (node.name && node.name == "i") {
      let chord_ = null;
      if (!hideChords && "data-chord" in node.attribs) {
        const chord = node.attribs["data-chord"];
        const t = Chord.from(chord)?.transposed(
          transpose.semitones ?? 0,
          transpose.notation,
        );
        if (t === undefined) {
          chord_ = <span className="before">{chord}</span>;
        } else {
          chord_ = (
            <span className={"before " + t.toStringClasses()}>
              {t.toStringKey()}
              <sup>{t.toStringTensionsAndSlash()}</sup>
            </span>
          );
        }
      }
      return (
        <i>
          {chord_}
          <span>{domToReact(node.children)}</span>
        </i>
      );
    }

    // Abcjs or youtube block
    else if (node.name == "pre") {
      if (node.children.length != 1) return node;

      const code = node.firstChild as DH.Element;
      if (!("class" in code.attribs)) return node;

      const classes = code.attribs["class"];
      if (classes.includes("language-yt")) {
        const data = (code.firstChild as DH.DataNode).data as string;
        return (
          <div className="song-video">
            <YtInter
              data={data}
              selectedLine={selectedLine}
              onLineChange={setPlayedLine}
            />
          </div>
        );
      }

      if (!classes.includes("language-abc")) return node;

      if (code.children.length != 1) return node;

      if (hideChords) {
        return <></>;
      } else {
        const tablature: Tablature[] = [];
        if (classes.includes("tab")) {
          tablature.push({ instrument: "guitar" });
        }
        const abc = (code.firstChild as DH.DataNode)?.data;
        return (
          <Abcjs
            abcNotation={abc}
            params={{ visualTranspose: transpose.semitones, tablature }}
          />
        );
      }
    }

    // Fret diagrams
    else if (node.name == "abbr") {
      const chord = (node.firstChild as DH.DataNode).data;
      const c = Chord.from(chord);

      return (
        <span className="chord-container">
          <strong>
            {c?.toStringKey()}
            <sup>{c?.toStringTensionsAndSlash()}</sup>
          </strong>
          <Kord
            frets={node.attribs.title}
            fingers={node.attribs["data-fingers"]}
          />
        </span>
      );
    }

    // Remove process tags for read-only-users
    else if (
      node.name == "ul" &&
      node.attribs?.["class"] == "tags" &&
      !userMayWrite()
    ) {
      const hide: string[] = ["fini", "+", "check", "wip"];
      node.children = node.children.filter((child) => {
        return !(
          (child as DH.Element)?.name == "li" &&
          hide.includes(
            ((child as DH.NodeWithChildren)?.firstChild as DH.DataNode)?.data,
          )
        );
      });
    }
  };

  let postprocess = (vdom: DOMNode) => populateReactNodes(vdom);

  if (processVdom !== undefined) {
    postprocess = (vdom) => processVdom(populateReactNodes(vdom));
  }

  let vdom = parse(rmd_html, { replace: postprocess }) as JSX.Element[];

  useEffect(() => {
    if (hasVideo) {
      const elements = chordsheetContent.current?.querySelectorAll("span.line");
      elements?.forEach((e) => e.addEventListener("click", handleLineClick));
      return () =>
        elements?.forEach((e) =>
          e.removeEventListener("click", handleLineClick),
        );
    }
  });

  useEffect(() => {
    const lines = chordsheetContent.current?.querySelectorAll("span.line");
    if (lines == null || playedLine == null) {
      return;
    }
    for (const maybeLine of lines) {
      const line = maybeLine as HTMLSpanElement;
      if (!(line instanceof HTMLSpanElement)) return;
      const lineCnt = parseInt(line.dataset.lineCnt ?? "", 10);
      const ratio = clamp(0, playedLine - lineCnt, 0.65);

      const style = `--ratio: ${1 - ratio}`;
      // @ts-ignore
      line.style = style;
    }
  }, [playedLine]);

  return (
    <section
      ref={chordsheetContent}
      id="chordsheetContent"
      style={style}
      className={classNames({
        inlineRefs,
        hideRefs: !inlineRefs,
        hasVideo: isActive,
        ...classes,
      })}
    >
      {vdom}
    </section>
  );
};

export default Sheet;

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
