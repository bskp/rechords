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
  },
};

export function parseRechordsDown(md: string) {
  const filter = new FilterXSS(options);
  const html = filter.process(converter.makeHtml(md));
  const dom = parse(html);

  const sections = dom.querySelectorAll("section[id^=sd-ref]");

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

  // todo: return metada from dom as well? now it is parsed twice... again in collection.ts
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
