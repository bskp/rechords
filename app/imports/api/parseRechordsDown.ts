// TODO: Include this step in Tests for parsedown md / or additional test

import { FilterXSS } from "xss";
import * as showdown from "showdown";
import { showdownRechords } from "./showdown-rechords";
import { parse, HTMLElement } from "node-html-parser";

export const options: XSS.IFilterXSSOptions = {
  whiteList: {
    a: ["href", "title"],
    span: ["class", "data-cnt"],
    div: ["class", "id"],
    i: ["class", "data-chord"],
    b: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    section: ["class", "id"],
    ul: ["class"],
    u: [],
    ol: [],
    li: [],
    p: ["class", "id"],
    br: [],
    strong: [],
    em: [],
    code: ["class"],
    s: [],
    pre: [],
    img: ["src", "alt"],
    abbr: ["class", "title", "data-fingers"],
    blockquote: [],
  },
};

export function parseRechordsDown(md: string) {
  const filter = new FilterXSS(options);
  const html = filter.process(converter.makeHtml(md));
  const dom = parse(html);

  const sections = dom.querySelectorAll("section[id^=sd-ref]");

  stampPositions(sections);

  const sectionReferences = dom.querySelectorAll("div.ref");

  const lup: Record<string, HTMLElement> = {};

  for (const l of sections) {
    lup[l.id.substring(7)] = l;
  }

  for (const [idx, v] of sectionReferences.entries()) {
    const key = v.firstChild?.innerText.trim();
    if (key) {
      const found = lup[key];
      if (!found) {
        continue;
      }
      const cloned = found.clone() as HTMLElement;
      v.setAttribute("id", `ref_${idx}`);
      cloned.removeAttribute("id");
      cloned.classList.add("inlineReference");
      v.after(cloned);
    }
  }

  for (const [idx, v] of dom.querySelectorAll("span.line").entries()) {
    v.setAttribute("data-line-cnt", (idx + 1).toString());
  }

  return dom.toString();
}

/** The characters of a string that are not whitespace. */
const textLen = (text: string) => text.replace(/\s/g, "").length;

/**
 * Writes down where every syllable sits in the source, while that is still
 * known: which verse it belongs to, how many lyric characters and how many
 * chords come before it. Editing reads this back instead of reconstructing it
 * from the shape of the rendered document, where a change to the markup would
 * not break loudly but silently miscount — and edits would land on the wrong
 * chord.
 *
 * Whitespace is deliberately not counted. The renderer rewrites it — a chord at
 * the end of a line gets a blank stem, a leading space becomes an indent —
 * while every other character survives rendering one to one.
 *
 * Lines carry the same three numbers as of their end, which is what a chord
 * appended behind the last syllable of a line needs.
 *
 * This runs before the references are cloned, so that a cloned verse keeps
 * pointing at the verse it mirrors.
 */
function stampPositions(sections: HTMLElement[]) {
  for (const [verse, section] of sections.entries()) {
    let lyric = 0;
    let chords = 0;

    for (const line of section.querySelectorAll("span.line")) {
      for (const syllable of line.querySelectorAll("i")) {
        syllable.setAttribute("data-verse", verse.toString());
        syllable.setAttribute("data-lyric", lyric.toString());
        syllable.setAttribute("data-chords", chords.toString());

        if (syllable.hasAttribute("data-chord")) chords += 1;
        lyric += textLen(syllable.textContent);
      }

      line.setAttribute("data-verse", verse.toString());
      line.setAttribute("data-lyric", lyric.toString());
      line.setAttribute("data-chords", chords.toString());
    }
  }
}
export const converter = new showdown.Converter({
  extensions: [showdownRechords],
  striketrough: true,
  ghCodeBlocks: true,
  smoothLivePreview: true,
});
showdown.setOption("simpleLineBreaks", true);
showdown.setOption("smoothLivePreview", true);
showdown.setOption("simplifiedAutoLink", true);
showdown.setOption("openLinksInNewWindow", true);
