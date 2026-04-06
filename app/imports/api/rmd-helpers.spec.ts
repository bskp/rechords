import assert from "assert";
import { describe, it } from "node:test";
import { parse, HTMLElement } from "node-html-parser";

const DATACHORD = "data-chord";

class RmdHelpers {
  static collectTags(dom: HTMLElement) {
    return Array.from(dom.getElementsByTagName("ul"))
      .filter((ul) => ul.getAttribute("class") == "tags")
      .flatMap((ul) => Array.from(ul.getElementsByTagName("li")))
      .map((li) =>
        Array.from(li.childNodes)
          .map((child) => child.textContent)
          .join(":"),
      );
  }

  static collectChordsDom(dom: HTMLElement) {
    return Array.from(dom.getElementsByTagName("i"))
      .filter((chord_dom) => chord_dom.hasAttribute(DATACHORD))
      .map((chord_dom) => chord_dom.getAttribute(DATACHORD))
      .filter((c?: string): c is string => c !== null);
  }
}

describe("RmdHelpers.collectChordsDom()", () => {
  it("should collect chords from HTML", () => {
    const html = `<p><i data-chord="C">C</i> und <i data-chord="G">G</i></p>`;
    const dom = parse(html);
    const chords = RmdHelpers.collectChordsDom(dom);
    assert.deepEqual(chords, ["C", "G"]);
  });

  it("should return empty array for no chords", () => {
    const html = `<p>Nur Text</p>`;
    const dom = parse(html);
    const chords = RmdHelpers.collectChordsDom(dom);
    assert.deepEqual(chords, []);
  });

  it("should ignore elements without data-chord attribute", () => {
    const html = `<p><i data-chord="C">C</i> und <i>Am</i></p>`;
    const dom = parse(html);
    const chords = RmdHelpers.collectChordsDom(dom);
    assert.deepEqual(chords, ["C"]);
  });
});

describe("RmdHelpers.collectTags()", () => {
  it("should collect tags from tags ul", () => {
    const html = `<h1>Test</h1><ul class="tags"><li>lizenz:frei</li><li>genre:folk</li></ul>`;
    const dom = parse(html);
    const tags = RmdHelpers.collectTags(dom);
    assert.deepEqual(tags, ["lizenz:frei", "genre:folk"]);
  });

  it("should return empty for no tags", () => {
    const html = `<h1>Test</h1><ul class="other"><li>tag</li></ul>`;
    const dom = parse(html);
    const tags = RmdHelpers.collectTags(dom);
    assert.deepEqual(tags, []);
  });
});