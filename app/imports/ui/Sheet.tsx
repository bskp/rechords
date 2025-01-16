import * as React from "react";
import parse, { DOMNode, domToReact } from "html-react-parser";
import { Song } from "../api/collections";
import { Abcjs } from "./Abcjs";
import Kord from "./Kord";
import { userMayWrite } from "../api/helpers";
import * as DH from "domhandler";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Tablature } from "abcjs";
import Chord_ from "/imports/api/libchr0d/chord";
import classNames from "classnames";

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

  const key_tag = song.getTag("tonart");

  // Postprocessing on each node from the dom-to-react parser
  const populateReactNodes = (node: DOMNode): DomOut => {
    if (!(node instanceof DH.Element && node.attribs)) return node;

    // <i>
    if (node.name && node.name == "i") {
      if (hideChords) return; // swallow the chord

      let chord_ = null;
      if ("data-chord" in node.attribs) {
        const chord = node.attribs["data-chord"];
        const t = Chord_.from(chord)?.transposed(transpose ?? 0);
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

    // Abcjs
    else if (node.name == "pre") {
      if (node.children.length != 1) return node;

      const code = node.firstChild as DH.Element;
      if (!("class" in code.attribs)) return node;

      const classes = code.attribs["class"];
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
      const c = Chord_.from(chord);

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
