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
  const testDom = parse(html);

  const lookup = testDom.querySelectorAll("section[id^=sd-ref]");

  const toLookup = testDom.querySelectorAll("div.ref");

  const lup: Record<string, HTMLElement> = {};

  for (const l of lookup) {
    lup[l.id.substring(7)] = l;
  }

  for (const [idx, v] of toLookup.entries()) {
    const key = v.firstChild?.innerText.trim();
    if (key) {
      const found = lup[key];
      if (found) {
        const cloned = found.clone() as HTMLElement;
        v.setAttribute('id', `ref_${idx}`);
        cloned.removeAttribute('id')
        cloned.classList.add('inlineReference')
        v.after(cloned);
      }
    }
  }

  for(const [idx,v] of testDom.querySelectorAll('span.line').entries()) {
    v.setAttribute('data-line-cnt', (idx+1).toString())
  }

  return testDom.toString();

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
