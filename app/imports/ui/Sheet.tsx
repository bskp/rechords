import * as React from "react";
import parse, { DOMNode, domToReact } from "html-react-parser";
import ChrodLib from "../api/libchrod";
import { Song } from "../api/collections";
import { Abcjs } from "./Abcjs";
import Kord from "./Kord";
import { userMayWrite } from "../api/helpers";
import * as DH from "domhandler";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Tablature } from "abcjs";
import classNames from "classnames";
import { YtInter } from "./YtInter";

type DomOut = React.JSX.Element | object | void | undefined | null | false;

type SheetProps = {
  song: Song;
  transpose?: number;
  hideChords?: boolean;
  processVdom?: (vdom: any) => any;
  style?: CSSProperties;
  multicolumns?: boolean;
};
const Sheet = ({
  song,
  transpose,
  hideChords,
  processVdom,
  style,
}: SheetProps) => {
  const [inlineRefs, setInlineRefs] = useState(true);
  const toggleInlineRefs = () => setInlineRefs(!inlineRefs);

  const [selectLine, setSelectLine] = useState<{ time: number }>();

  const handleLineClick = (e: MouseEvent) => {
    const lineCnt = e?.currentTarget?.dataset.lineCnt;
    if (lineCnt) {
      setSelectLine({ time: lineCnt });
    }
  };
  const chordsheetContent = useRef<HTMLElement>(null);

  useEffect(() => {
    const elements = chordsheetContent.current?.querySelectorAll("div.ref");
    // alternatively: matches() on clicked target and click listener
    // on surrounding sheetcontent
    elements?.forEach((e) => e.addEventListener("click", toggleInlineRefs));
    return () =>
      elements?.forEach((e) =>
        e.removeEventListener("click", toggleInlineRefs),
      );
  });
  useEffect(() => {
    const elements = chordsheetContent.current?.querySelectorAll("span.line");
    // alternatively: matches() on clicked target and click listener
    // on surrounding sheetcontent
    elements?.forEach((e) => e.addEventListener("click", handleLineClick));
    return () =>
      elements?.forEach((e) => e.removeEventListener("click", handleLineClick));
  });

  const chords = song.getChords();

  const chrodlib = new ChrodLib();
  const rmd_html = song.getHtml();

  const key_tag = song.getTag("tonart");
  let key = key_tag && ChrodLib.parseTag(key_tag);
  if (key == null) {
    key = ChrodLib.guessKey(chords);
  }

  // Postprocessing on each node from the dom-to-react parser
  const populateReactNodes = (node: DOMNode): DomOut => {
    if (!(node instanceof DH.Element && node.attribs)) return node;

    // <i>
    if (node.name && node.name == "i") {
      if (hideChords) return; // swallow the chord

      let chord_ = null;
      if ("data-chord" in node.attribs) {
        const chord = node.attribs["data-chord"];
        const t = chrodlib.transpose(chord, key, transpose);
        if (t == null) {
          chord_ = <span className="before">{chord}</span>;
        } else {
          chord_ = (
            <span className={"before " + t.className}>
              {t.base}
              <sup>{t.suff}</sup>
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

    // Abcjs
    else if (node.name == "pre") {
      if (node.children.length != 1) return node;

      const code = node.firstChild as DH.Element;
      if (!("class" in code.attribs)) return node;

      const classes = code.attribs["class"];
      if (classes.includes("language-yt")) {
        const data = code.firstChild.data as string;
        return <YtInter data={data} lineAction={selectLine} />;
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
            params={{ visualTranspose: transpose, tablature }}
          />
        );
      }
    }

    // Fret diagrams
    else if (node.name == "abbr") {
      const chord = (node.firstChild as DH.DataNode).data;
      const c = chrodlib.transpose(chord, key, 0);

      return (
        <span className="chord-container">
          <strong>
            {c.base}
            <sup>{c.suff}</sup>
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
        if (
          (child as DH.Element)?.name == "li" &&
          hide.includes(
            ((child as DH.NodeWithChildren)?.firstChild as DH.DataNode)?.data,
          )
        )
          return false;
        return true;
      });
    }
  };

  let postprocess = (vdom: DOMNode) => populateReactNodes(vdom);

  if (processVdom !== undefined) {
    postprocess = (vdom) => processVdom(populateReactNodes(vdom));
  }

  let vdom = parse(rmd_html, { replace: postprocess }) as JSX.Element[];

  return (
    <section
      ref={chordsheetContent}
      id="chordsheetContent"
      style={style}
      className={classNames({ inlineRefs, hideRefs: !inlineRefs })}
    >
      {vdom}
    </section>
  );
};

export default Sheet;
